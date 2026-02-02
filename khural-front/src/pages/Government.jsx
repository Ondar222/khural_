import React from "react";
import { useData, enrichDeputyFromPersonInfo } from "../context/DataContext.jsx";
import { Select } from "antd";
import PersonDetail from "../components/PersonDetail.jsx";
import SideNav from "../components/SideNav.jsx";
import { useI18n } from "../context/I18nContext.jsx";
import { normalizeFilesUrl } from "../utils/filesUrl.js";
import { formatConvocationLabelWithYears } from "../utils/convocationLabels.js";
import { PersonsApi } from "../api/client.js";
import { useHashRoute } from "../Router.jsx";

function nonBlank(x) {
  return x != null && String(x).trim() !== "";
}

function pickFirstLink(v) {
  if (!v) return "";
  if (typeof v === "string") return v.trim();
  if (Array.isArray(v)) {
    for (const item of v) {
      const got = pickFirstLink(item);
      if (got) return got;
    }
    return "";
  }
  if (typeof v === "object") {
    const direct =
      v.link ||
      v.url ||
      v.src ||
      v.path ||
      v.file?.link ||
      v.file?.url ||
      v.image?.link ||
      v.image?.url ||
      "";
    if (direct) return String(direct).trim();
    const id = v.id || v.file?.id || v.imageId || v.image_id || v.photoId || v.photo_id || v.avatarId || v.avatar_id;
    if (id) return `/files/v2/${String(id).trim()}`;
  }
  return "";
}

function normalizeApiDeputyForDetail(p) {
  if (!p || typeof p !== "object") return null;
  const id = String(p.id ?? p._id ?? p.personId ?? "");
  if (!id) return null;
  const name = String(p.fullName || p.full_name || p.name || "").trim();
  const district =
    String(p.electoralDistrict || p.electoral_district || p.district || "").trim() ||
    (Array.isArray(p.districts) && p.districts[0]?.name ? String(p.districts[0].name).trim() : "");
  const faction =
    String(p.faction || "").trim() ||
    (Array.isArray(p.factions) && p.factions[0]?.name ? String(p.factions[0].name).trim() : "");
  const convocation =
    String(p.convocationNumber || p.convocation || p.convocation_number || "").trim() ||
    (Array.isArray(p.convocations) && p.convocations[0]?.name ? String(p.convocations[0].name).trim() : "");
  // Множественные созывы
  const convocations = Array.isArray(p.convocations) && p.convocations.length
    ? p.convocations.map((c) => (typeof c === "string" ? c : c?.name || c?.title || String(c || "")))
    : (convocation ? [convocation] : []);
  // Комитеты - обрабатываем разные форматы из API
  const committeeIds = (() => {
    // Если есть массив ID
    if (Array.isArray(p.committeeIds)) {
      return p.committeeIds.map(String).filter(Boolean);
    }
    // Если есть массив объектов комитетов
    if (Array.isArray(p.committees)) {
      return p.committees
        .map((c) => {
          if (typeof c === "string") return c;
          if (c && typeof c === "object") return c?.id || c?.name || "";
          return "";
        })
        .map(String)
        .filter(Boolean);
    }
    // Если комитеты приходят как связанные сущности
    if (p.committees && typeof p.committees === "object" && !Array.isArray(p.committees)) {
      const ids = p.committees.id || p.committees.ids;
      if (Array.isArray(ids)) return ids.map(String).filter(Boolean);
      if (ids) return [String(ids)];
    }
    return [];
  })();
  const photo = normalizeFilesUrl(
    pickFirstLink(p.image) ||
      pickFirstLink(p.photo) ||
      pickFirstLink(p.avatar) ||
      pickFirstLink(p.media) ||
      pickFirstLink(p.files) ||
      pickFirstLink(p.attachments) ||
      String(p.photoUrl || p.photo_url || "").trim()
  );

  return {
    ...p,
    id,
    name: name || p.name || "",
    fullName: name,
    district,
    electoralDistrict: district,
    faction,
    convocation,
    convocationNumber: convocation,
    convocations,
    committeeIds,
    photo,
    contacts: {
      phone: String(p.phoneNumber || p.phone_number || p.phone || p.contacts?.phone || "").trim(),
      email: String(p.email || p.contacts?.email || "").trim(),
    },
    biography: p.biography || p.bio || p.description || "",
    bio: p.bio || (p.biography || p.description || ""),
    description: p.description || (p.biography || p.bio || ""),
    position: String(p.position || p.role || "").trim(),
  };
}

export default function Government() {
  const { government, deputies, committees } = useData();
  const { t } = useI18n();
  const { route } = useHashRoute();

  const [section, setSection] = React.useState(() => {
    const sp = new URLSearchParams(window.location.search || "");
    const t = sp.get("type");
    if (t === "dep") return "Депутаты";
    if (t === "org") return "Структура";
    return "Парламент";
  });
  const [focus, setFocus] = React.useState(() => {
    const sp = new URLSearchParams(window.location.search || "");
    return sp.get("focus");
  });

  const [agency, setAgency] = React.useState("Все");
  const [role, setRole] = React.useState("Все");
  const [district, setDistrict] = React.useState("Все");
  const [convocation, setConvocation] = React.useState("Все");
  const [faction, setFaction] = React.useState("Все");

  const [selected, setSelected] = React.useState(() => {
    const sp = new URLSearchParams(window.location.search || "");
    const id = sp.get("id");
    return id || null;
  });
  const [selectedDeputy, setSelectedDeputy] = React.useState(null);

  // When user opens a deputy detail page, fetch fresh data by id to avoid stale DataContext cache
  // (important after uploading a new photo in admin).
  // Stabilize deputies through ref to prevent infinite loops
  const deputiesRef = React.useRef(deputies);
  React.useEffect(() => {
    deputiesRef.current = deputies;
  }, [deputies]);
  
  React.useEffect(() => {
    let alive = true;
    (async () => {
      if (!selected || section !== "Депутаты") {
        if (alive) setSelectedDeputy(null);
        return;
      }
      const selectedId = String(selected).trim();
      if (!selectedId || selectedId === "undefined" || selectedId === "null") {
        if (alive) setSelectedDeputy(null);
        return;
      }
      try {
        const res = await PersonsApi.getById(selectedId);
        if (!alive) return;
        let normalized = normalizeApiDeputyForDetail(res);
        // Обогащаем данные из JSON файлов (фото, биография, контакты и т.д.)
        normalized = await enrichDeputyFromPersonInfo(normalized);
        if (alive) setSelectedDeputy(normalized);
      } catch (error) {
        console.error("Failed to fetch deputy:", error);
        // Fallback: try to find in local deputies array
        if (alive) {
          const localDeputy = (deputiesRef.current || []).find((d) => String(d?.id) === selectedId);
          if (localDeputy) {
            // Локальные данные уже обогащены из JSON в DataContext, но обогатим еще раз на всякий случай
            let normalized = normalizeApiDeputyForDetail(localDeputy);
            normalized = await enrichDeputyFromPersonInfo(normalized);
            setSelectedDeputy(normalized);
          } else {
            setSelectedDeputy(null);
          }
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [selected, section]); // Removed deputies from deps to prevent infinite loops
  // Синхронизация выбора депутата и раздела с URL при навигации (назад, обновление и т.д.)
  React.useEffect(() => {
    const sp = new URLSearchParams(window.location.search || "");
    const id = sp.get("id");
    const type = sp.get("type");
    const f = sp.get("focus");
    if (type === "dep") setSection("Депутаты");
    else if (type === "org") setSection("Структура");
    else setSection("Парламент");
    setFocus(f || null);
    setSelected(id || null);
  }, [route]);

  React.useEffect(() => {
    const onNav = () => {
      const sp = new URLSearchParams(window.location.search || "");
      const id = sp.get("id");
      const type = sp.get("type");
      const f = sp.get("focus");
      if (type === "dep") setSection("Депутаты");
      else if (type === "org") setSection("Структура");
      else setSection("Парламент");
      setFocus(f || null);
      setSelected(id || null);
    };
    window.addEventListener("popstate", onNav);
    window.addEventListener("app:navigate", onNav);
    return () => {
      window.removeEventListener("popstate", onNav);
      window.removeEventListener("app:navigate", onNav);
    };
  }, []);

  // Scroll to a requested block on the structure page (e.g., /government?type=org&focus=committees)
  React.useEffect(() => {
    if (section !== "Структура") return;
    if (!focus) return;
    const id = `focus-${String(focus)}`;
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [section, focus]);

  const agencies = React.useMemo(
    () => ["Все", ...Array.from(new Set(government.map((p) => p.agency)))],
    [government]
  );
  const roles = React.useMemo(
    () => ["Все", ...Array.from(new Set(government.map((p) => p.role)))],
    [government]
  );

  const filtered = React.useMemo(() => {
    const list = government.filter(
      (p) => (agency === "Все" || p.agency === agency) && (role === "Все" || p.role === role)
    );
    // Один человек — одна карточка: убираем дубликаты по id (Даваа и др. не повторяются)
    const byId = new Map();
    for (const p of list) {
      const id = p?.id != null ? String(p.id) : "";
      if (id && !byId.has(id)) byId.set(id, p);
      else if (!id) byId.set(`noid-${byId.size}`, p);
    }
    return Array.from(byId.values());
  }, [government, agency, role]);

  // Deputies filters (exclude empty/blank values so dropdowns have no unnamed options)
  const districts = React.useMemo(
    () => ["Все", ...Array.from(new Set(deputies.map((d) => d.district).filter(nonBlank)))],
    [deputies]
  );
  const convocations = React.useMemo(
    () => ["Все", ...Array.from(new Set(deputies.map((d) => d.convocation).filter(nonBlank)))],
    [deputies]
  );
  const factions = React.useMemo(
    () => ["Все", ...Array.from(new Set(deputies.map((d) => d.faction).filter(nonBlank)))],
    [deputies]
  );
  const filteredDeps = React.useMemo(() => {
    const list = deputies.filter(
      (d) =>
        (district === "Все" || d.district === district) &&
        (convocation === "Все" || d.convocation === convocation) &&
        (faction === "Все" || d.faction === faction)
    );
    // Один депутат — одна карточка: убираем дубликаты по id
    const byId = new Map();
    for (const d of list) {
      const id = d?.id != null ? String(d.id) : "";
      if (id && !byId.has(id)) byId.set(id, d);
      else if (!id) byId.set(`noid-${byId.size}`, d);
    }
    return Array.from(byId.values());
  }, [deputies, district, convocation, faction]);

  // Committees expand/collapse (Структура)
  const [openCommittee, setOpenCommittee] = React.useState(null);
  const renderCommittee = (id) => {
    const committee = (committees || []).find((c) => c.id === id) || null;
    const leader = committee?.members?.[0] || null;
    if (!leader) return null;
    const leaderPhoto = normalizeFilesUrl(leader.photo);
    return (
      <div className="orgv2__committee">
        <div className="person-card person-card--committee">
          {leaderPhoto ? (
            <img className="person-card__photo" src={leaderPhoto} alt="" loading="lazy" />
          ) : (
            <div className="person-card__photo" aria-hidden="true" />
          )}
          <div className="person-card__body">
            <div className="person-card__name">{leader.name}</div>
            <div className="person-card__role">{leader.role || t("Комитеты")}</div>
            <ul className="person-card__meta">
              {leader.phone && <li>+ {leader.phone}</li>}
              {leader.email && <li>{leader.email}</li>}
              {leader.address && <li>{leader.address}</li>}
            </ul>
            <a className="btn btn--primary btn--compact" href={`/committee?id=${id}`}>
              {t("Подробнее")}
            </a>
          </div>
        </div>
        <div className="orgv2__actions">
          <a href={`/committee?id=${id}`} className="btn btn--primary">
            {t("Подробнее")} {t("Комитеты")}
          </a>
        </div>
      </div>
    );
  };

  if (selected) {
    const dataset = section === "Депутаты" ? deputies : government;
    const item =
      (section === "Депутаты" && selectedDeputy) ||
      dataset.find((p) => String(p?.id) === String(selected));
    if (!item) {
      // Если депутат не найден, показываем загрузку или ошибку
      if (section === "Депутаты" && !selectedDeputy) {
        return (
          <section className="section">
            <div className="container">
              <div style={{ padding: 40, textAlign: "center" }}>
                <div style={{ fontSize: 18, marginBottom: 16 }}>Загрузка информации о депутате...</div>
              </div>
            </div>
          </section>
        );
      }
      return (
        <section className="section">
          <div className="container">
            <div style={{ padding: 40, textAlign: "center" }}>
              <div style={{ fontSize: 18, marginBottom: 16 }}>Депутат не найден</div>
              <a href="/deputies" className="btn btn--primary">
                Вернуться к списку депутатов
              </a>
            </div>
          </div>
        </section>
      );
    }
    const sp = new URLSearchParams(window.location.search || "");
    const backParam = sp.get("back");
    // If caller provided an explicit "back" target, honor it.
    // Otherwise: for deputies go to /deputies, for others go back to government section.
    const backHref = backParam
      ? decodeURIComponent(backParam)
      : section === "Депутаты"
        ? "/deputies"
        : `/government?type=${section === "Парламент" ? "gov" : "org"}`;
    return (
      <PersonDetail item={item} type={section === "Депутаты" ? "dep" : "gov"} backHref={backHref} committees={committees} />
    );
  }

  return (
    <section className="section">
      <div className="container">
        <div className={`page-grid ${section === "Структура" ? "page-grid--structure" : ""}`}>
          <div className="page-grid__main">
            <div className="gov-toolbar">
              <h1 className="gov-toolbar__title">{t("Парламент")}</h1>
              {section !== "Структура" ? (
                <div className="gov-toolbar__controls">
                  <Select
                    value={section}
                    onChange={setSection}
                    dropdownMatchSelectWidth={false}
                    options={[
                      { value: "Парламент", label: t("Парламент") },
                      { value: "Депутаты", label: t("Депутаты") },
                    ]}
                    style={{ minWidth: 220 }}
                  />

                  {section === "Депутаты" ? (
                    <>
                      <Select
                        value={district}
                        onChange={setDistrict}
                        dropdownMatchSelectWidth={false}
                        options={districts.map((x) => ({ value: x, label: t(x) }))}
                        style={{ minWidth: 220 }}
                      />
                      <Select
                        value={convocation}
                        onChange={setConvocation}
                        dropdownMatchSelectWidth={false}
                        options={convocations.map((x) => ({ value: x, label: formatConvocationLabelWithYears(x) }))}
                        style={{ minWidth: 220 }}
                      />
                      <Select
                        value={faction}
                        onChange={setFaction}
                        dropdownMatchSelectWidth={false}
                        options={factions.map((x) => ({ value: x, label: t(x) }))}
                        style={{ minWidth: 220 }}
                      />
                    </>
                  ) : null}

                  {section !== "Структура" && section !== "Депутаты" ? (
                    <Select
                      value={role}
                      onChange={setRole}
                      dropdownMatchSelectWidth={false}
                      options={roles.map((x) => ({ value: x, label: t(x) }))}
                      style={{ minWidth: 240 }}
                    />
                  ) : null}
                </div>
              ) : null}
            </div>

            {section === "Структура" ? (
              <>
                <h3 id="focus-overview">{t("О Верховном Хурале Республики Тыва")}</h3>
                <div className="tabs" style={{ marginBottom: 10 }}>
                  <a className="pill" href="/about">
                    {t("Общие сведения")}
                  </a>
                  <span className="pill pill--solid" aria-current="page">
                    {t("Структура органов управления")}
                  </span>
                </div>
                {/* Blue diagram per provided reference (Image 2) */}
                <div className="org org--khural">
                  <div className="org__row org__row--center">
                    <div className="org__item org__item--blue org__item--xl">
                      {t("Председатель Верховного Хурала (парламента) Республики Тыва")}
                    </div>
                  </div>
                  <div className="org__row org__row--factions" id="focus-factions">
                    {["Единая Россия", "КПРФ", "ЛДПР", "Новые люди"].map((f) => (
                      <a
                        key={f}
                        className="org__item org__item--blue"
                        href={`/deputies?faction=${encodeURIComponent(f)}`}
                      >
                        Фракция
                        <br />
                        {f}
                      </a>
                    ))}
                  </div>
                  <div className="org__row org__row--cols4">
                    <div className="org__col" id="focus-committees">
                      <a
                        className="org__item org__item--blue"
                        href={"/section?title=" + encodeURIComponent("Комитеты")}
                      >
                        {t("Комитеты Верховного Хурала (парламента) Республики Тыва")}
                      </a>
                      {(committees || []).map((c) => (
                        <a
                          key={c.id}
                          className="org__item org__item--green"
                          href={`/committee?id=${encodeURIComponent(c.id)}`}
                        >
                          {c.title}
                        </a>
                      ))}
                    </div>
                    <div className="org__col">
                      <a
                        className="org__item org__item--blue"
                        href={
                          "/section?title=" +
                          encodeURIComponent(
                            "Комитет Верховного Хурала (парламента) Республики Тыва по межрегиональным связям"
                          )
                        }
                      >
                        {t("Комитет Верховного Хурала (парламента) Республики Тыва по межрегиональным связям")}
                      </a>
                      <a
                        className="org__item org__item--blue"
                        href={
                          "/section?title=" +
                          encodeURIComponent(
                            "Комитет Верховного Хурала (парламента) Республики Тыва по взаимодействию со средствами массовой информации и общественными организациями"
                          )
                        }
                      >
                        {t("Комитет Верховного Хурала (парламента) Республики Тыва по взаимодействию со средствами массовой информации и общественными организациями")}
                      </a>
                    </div>
                    <div className="org__col org__col--span2" id="focus-commissions">
                      {[
                        "Комиссия Верховного Хурала (парламента) Республики Тыва по Регламенту Верховного Хурала (парламента) Республики Тыва и депутатской этике",
                        "Комиссия Верховного Хурала (парламента) Республики Тыва контрольно за достоверностью сведений о доходах, об имуществе и обязательствах имущественного характера, представляемых депутатами Верховного Хурала (парламента) Республики Тыва",
                        "Наградная комиссия Верховного Хурала (парламента) Республики Тыва",
                        "Комиссия Верховного Хурала (парламента) Республики Тыва по поддержке участников специальной военной операции и их семей",
                        "Счетная комиссия Верховного Хурала (парламента) Республики Тыва",
                      ].map((title, i) => (
                        <a
                          key={`wide-${i}`}
                          className="org__item org__item--blue"
                          href={`/section?title=${encodeURIComponent(title)}`}
                        >
                          {t(title)}
                        </a>
                      ))}
                    </div>
                  </div>
                  <div id="focus-councils" style={{ height: 1 }} />
                  <div className="org__row org__row--center">
                    <a className="org__item org__item--xl org__item--blue" href="/apparatus">
                      {t("Аппарат Верховного Хурала (парламента) Республики Тыва")}
                    </a>
                  </div>
                </div>
                <h2 style={{ marginTop: 0 }}>
                  {t("Структура органов управления")}
                </h2>
                <div className="orgv2">
                  <div className="orgv2__chain">
                    <div className="orgv2__line" />
                    {[government[0], government[1]].filter(Boolean).map((p) => (
                      <div key={p.id} className="person-card person-card--round-xl">
                        {normalizeFilesUrl(p.photo) ? (
                          <img className="person-card__photo" src={normalizeFilesUrl(p.photo)} alt="" loading="lazy" />
                        ) : (
                          <div className="person-card__photo" aria-hidden="true" />
                        )}
                        <div className="person-card__body">
                          <div className="person-card__name">{p.name}</div>
                          <div className="person-card__role">{p.role}</div>
                          <ul className="person-card__meta">
                            {p.phone && <li>+ {p.phone}</li>}
                            {p.email && <li>{p.email}</li>}
                            {p.address && <li>{p.address}</li>}
                          </ul>
                          <a
                            className="btn btn--primary btn--compact"
                            href={`/government?type=gov&id=${p.id}`}
                          >
                            {t("Подробнее")}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="orgv2__strip">
                    <span className="pill pill--solid">{t("Фракция Единая Россия")}</span>
                    <span className="pill pill--solid">{t("Фракция ЛДПР")}</span>
                    <span className="pill pill--solid">{t("Фракция КПРФ")}</span>
                    <span className="pill pill--solid">{t("Фракция Новые люди")}</span>
                    <a href="/committee?id=agro" className="btn btn--primary orgv2__strip_btn">
                      {t("Подробнее")} {t("Комитеты")}
                    </a>
                  </div>
                  <div className="orgv2__list">
                    <div
                      className={`orgv2__pill orgv2__pill--outline orgv2__pill--button ${
                        openCommittee === "agro" ? "orgv2__pill--open" : ""
                      }`}
                      onClick={() => setOpenCommittee(openCommittee === "agro" ? null : "agro")}
                    >
                      {t(
                        "Комитет по аграрной политике, земельным отношениям, природопользованию, экологии и делам коренных малочисленных народов"
                      )}
                    </div>
                    {openCommittee === "agro" ? renderCommittee("agro") : null}
                    <div
                      className={`orgv2__pill orgv2__pill--outline orgv2__pill--button ${
                        openCommittee === "infra" ? "orgv2__pill--open" : ""
                      }`}
                      onClick={() => setOpenCommittee(openCommittee === "infra" ? null : "infra")}
                    >
                      {t("Комитет по развитию инфраструктуры и промышленной политике")}
                    </div>
                    {openCommittee === "infra" ? renderCommittee("infra") : null}
                    <div
                      className={`orgv2__pill orgv2__pill--outline orgv2__pill--button ${
                        openCommittee === "youth" ? "orgv2__pill--open" : ""
                      }`}
                      onClick={() => setOpenCommittee(openCommittee === "youth" ? null : "youth")}
                    >
                      {t(
                        "Комитет по молодежной, информационной политике, физической культуре и спорту, развитию институтов гражданского общества"
                      )}
                    </div>
                    {openCommittee === "youth" ? renderCommittee("youth") : null}
                    <div
                      className={`orgv2__pill orgv2__pill--outline orgv2__pill--button ${
                        openCommittee === "security" ? "orgv2__pill--open" : ""
                      }`}
                      onClick={() =>
                        setOpenCommittee(openCommittee === "security" ? null : "security")
                      }
                    >
                      {t("Комитет по безопасности и правопорядку")}
                    </div>
                    {openCommittee === "security" ? renderCommittee("security") : null}
                    <div
                      className={`orgv2__pill orgv2__pill--outline orgv2__pill--button ${
                        openCommittee === "health" ? "orgv2__pill--open" : ""
                      }`}
                      onClick={() => setOpenCommittee(openCommittee === "health" ? null : "health")}
                    >
                      {t("Комитет по охране здоровья, занятости населения и социальной политике")}
                    </div>
                    {openCommittee === "health" ? renderCommittee("health") : null}
                    <div
                      className={`orgv2__pill orgv2__pill--outline orgv2__pill--button ${
                        openCommittee === "const" ? "orgv2__pill--open" : ""
                      }`}
                      onClick={() => setOpenCommittee(openCommittee === "const" ? null : "const")}
                    >
                      {t("Комитет по конституционно‑правовой политике и местному самоуправлению")}
                    </div>
                    {openCommittee === "const" ? renderCommittee("const") : null}
                    <div
                      className={`orgv2__pill orgv2__pill--outline orgv2__pill--button ${
                        openCommittee === "econ" ? "orgv2__pill--open" : ""
                      }`}
                      onClick={() => setOpenCommittee(openCommittee === "econ" ? null : "econ")}
                    >
                      {t(
                        "Комитет по экономической, финансово‑бюджетной и налоговой политике, предпринимательству, туризму и государственной собственности"
                      )}
                    </div>
                    {openCommittee === "econ" ? renderCommittee("econ") : null}
                    <div
                      className={`orgv2__pill orgv2__pill--outline orgv2__pill--button ${
                        openCommittee === "edu" ? "orgv2__pill--open" : ""
                      }`}
                      onClick={() => setOpenCommittee(openCommittee === "edu" ? null : "edu")}
                    >
                      {t("Комитет по образованию, культуре, науке и национальной политике")}
                    </div>
                    {openCommittee === "edu" ? renderCommittee("edu") : null}
                  </div>
                </div>
              </>
            ) : section === "Депутаты" ? (
              <>
                <div className="grid cols-2">
                  {filteredDeps.map((d) => (
                    <div key={d.id} className="gov-card">
                      <div className="gov-card__top">
                        {normalizeFilesUrl(d.photo || (d.image && d.image.link)) ? (
                          <img
                            className="gov-card__avatar"
                            src={normalizeFilesUrl(d.photo || (d.image && d.image.link))}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              const img = e.target;
                              const currentSrc = img.src;
                              
                              if (currentSrc.includes("khural.rtyva.ru") && !img.dataset.proxyTried) {
                                img.dataset.proxyTried = "true";
                                img.src = currentSrc.replace("https://khural.rtyva.ru", "/img-proxy");
                              } else {
                                img.style.display = "";
                                img.removeAttribute("src");
                                img.classList.remove("gov-card__avatar");
                                img.classList.add("gov-card__avatar-placeholder");
                              }
                            }}
                          />
                        ) : (
                          <div className="gov-card__avatar" aria-hidden="true" />
                        )}
                      </div>
                      <div className="gov-card__body">
                        <div className="gov-card__name">{d.name}</div>
                        <div className="gov-card__role">{t("Депутат")}</div>
                        <ul className="gov-meta">
                          {d.contacts?.phone && (
                            <li>
                              <span>📞</span>
                              <span>{d.contacts.phone}</span>
                            </li>
                          )}
                          {d.contacts?.email && (
                            <li>
                              <span>✉️</span>
                              <span>{d.contacts.email}</span>
                            </li>
                          )}
                        </ul>
                      </div>
                      <div className="gov-card__actions">
                        <a className="gov-card__btn" href={`/government?type=dep&id=${d.id}`}>
                          {t("Подробнее")}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="grid cols-2">
                  {filtered.map((p) => (
                    <div key={p.id} className="gov-card">
                      <div className="gov-card__top">
                        {normalizeFilesUrl(p.photo) ? (
                          <img
                            className="gov-card__avatar"
                            src={normalizeFilesUrl(p.photo)}
                            alt=""
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="gov-card__avatar" aria-hidden="true" />
                        )}
                      </div>
                      <div className="gov-card__body">
                        <div className="gov-card__name">{p.name}</div>
                        {p.role && <div className="gov-card__role">{p.role}</div>}
                        <ul className="gov-meta">
                          {p.agency && (
                            <li>
                              <span>🏛️</span>
                              <span>{p.agency}</span>
                            </li>
                          )}
                          {p.reception && (
                            <li>
                              <span>⏰</span>
                              <span>
                                {t("Приём:")} {p.reception}
                              </span>
                            </li>
                          )}
                          {p.phone && (
                            <li>
                              <span>📞</span>
                              <span>{p.phone}</span>
                            </li>
                          )}
                          {p.email && (
                            <li>
                              <span>✉️</span>
                              <span>{p.email}</span>
                            </li>
                          )}
                        </ul>
                      </div>
                      <div className="gov-card__actions">
                        <a className="gov-card__btn" href={`/government?type=gov&id=${p.id}`}>
                          {t("Подробнее")}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <SideNav title="Разделы" />
        </div>
      </div>
    </section>
  );
}
