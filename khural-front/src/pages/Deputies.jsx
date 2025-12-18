import React from "react";
import { useData } from "../context/DataContext.jsx";
import { useI18n } from "../context/I18nContext.jsx";
import { Select, Button, Dropdown } from "antd";
import SideNav from "../components/SideNav.jsx";

export default function Deputies() {
  const {
    deputies,
    committees,
    factions: structureFactions,
    districts: structureDistricts,
    convocations: structureConvocations,
  } = useData();
  const { t } = useI18n();
  // Filters per structure
  const [convocation, setConvocation] = React.useState("Все");
  const [committeeId, setCommitteeId] = React.useState("Все");
  const [faction, setFaction] = React.useState("Все");
  const [district, setDistrict] = React.useState("Все");
  const [openConv, setOpenConv] = React.useState(false);

  // If URL/structure links set a convocation that doesn't exist in data yet,
  // don't show an empty page — fallback to "Все".
  React.useEffect(() => {
    if (convocation === "Все") return;
    if (!Array.isArray(deputies) || deputies.length === 0) return;
    const hasAny = deputies.some((d) => d?.convocation === convocation);
    if (!hasAny) setConvocation("Все");
  }, [convocation, deputies]);

  const districts = React.useMemo(
    () => ["Все", ...(structureDistricts || [])],
    [structureDistricts]
  );
  const convocations = React.useMemo(
    () => ["Все", ...(structureConvocations || [])],
    [structureConvocations]
  );
  const factions = React.useMemo(
    () => ["Все", ...(structureFactions || [])],
    [structureFactions]
  );
  const convOrder = ["VIII", "VII", "VI", "V", "IV", "III", "II", "I", "Все"];
  const convMenuItems = React.useMemo(() => {
    const av = Array.from(new Set(convocations));
    const ordered = convOrder.filter((x) => av.includes(x));
    return ordered.map((c) => ({
      key: c,
      label: c === "Все" ? "Все созывы" : `${c} созыв`,
      onClick: () => {
        setConvocation(c);
        setOpenConv(false);
      },
    }));
  }, [convocations]);

  const committeeOptions = React.useMemo(() => {
    return ["Все", ...(committees || []).map((c) => c.id)];
  }, [committees]);

  const committeeMatcher = React.useMemo(() => {
    if (committeeId === "Все") return null;
    const c = (committees || []).find((x) => x.id === committeeId);
    if (!c) return null;
    const ids = new Set();
    const names = new Set();
    (c.members || []).forEach((m) => {
      if (!m) return;
      if (m.id) ids.add(m.id);
      if (m.name) names.add(m.name);
    });
    return { ids, names };
  }, [committeeId, committees]);

  const filtered = React.useMemo(() => {
    return deputies.filter((d) => {
      if (convocation !== "Все" && d.convocation !== convocation) return false;
      if (faction !== "Все" && d.faction !== faction) return false;
      if (district !== "Все" && d.district !== district) return false;
      if (committeeMatcher) {
        if (committeeMatcher.ids.has(d.id)) return true;
        if (committeeMatcher.names.has(d.name)) return true;
        return false;
      }
      return true;
    });
  }, [deputies, convocation, faction, district, committeeMatcher]);

  // Accept initial filters from URL, keep in sync on hash changes
  React.useEffect(() => {
    const applyFromHash = () => {
      const h = window.location.hash;
      const sp = new URLSearchParams(h.split("?")[1]);
      const f = sp.get("faction");
      const d = sp.get("district");
      const cv = sp.get("convocation");
      const cm = sp.get("committee");
      if (f) setFaction(decodeURIComponent(f));
      if (d) setDistrict(decodeURIComponent(d));
      if (cv) setConvocation(decodeURIComponent(cv));
      if (cm) setCommitteeId(decodeURIComponent(cm));
    };
    applyFromHash();
    window.addEventListener("hashchange", applyFromHash);
    return () => window.removeEventListener("hashchange", applyFromHash);
  }, []);

  return (
    <section className="section">
      <div className="container">
        <div className="page-grid">
          <div className="page-grid__main">
            <h1>{t("deputies")}</h1>
            {/* Single-row filters from Structure */}
            <div
              className="filters"
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
                margin: "12px 0 18px",
              }}
            >
              <Dropdown
                open={openConv}
                onOpenChange={setOpenConv}
                menu={{ items: convMenuItems }}
              >
                <Button size="large">
                  {convocation === "Все" ? "Все созывы" : `${convocation} созыв`}{" "}
                  <span style={{ marginLeft: 8 }}>▾</span>
                </Button>
              </Dropdown>
              <Select
                value={committeeId}
                onChange={setCommitteeId}
                dropdownMatchSelectWidth={false}
                options={committeeOptions.map((id) =>
                  id === "Все"
                    ? { value: "Все", label: "По комитетам: Все" }
                    : {
                        value: id,
                        label:
                          `По комитетам: ` +
                          ((committees || []).find((c) => c.id === id)?.title ||
                            id),
                      }
                )}
                style={{ minWidth: 280 }}
              />
              <Select
                value={faction}
                onChange={setFaction}
                dropdownMatchSelectWidth={false}
                options={factions.map((x) => ({
                  value: x,
                  label: x === "Все" ? "По фракциям: Все" : `По фракциям: ${x}`,
                }))}
                style={{ minWidth: 220 }}
                placeholder="Фракция"
              />
              <Select
                value={district}
                onChange={setDistrict}
                dropdownMatchSelectWidth={false}
                options={districts.map((x) => ({
                  value: x,
                  label: x === "Все" ? "По округам: Все" : `По округам: ${x}`,
                }))}
                style={{ minWidth: 220 }}
                placeholder="Округ"
              />
            </div>

            <div className="grid cols-3">
              {filtered.map((d) => (
                <div key={d.id} className="gov-card">
                  <div className="gov-card__top">
                    <img
                      className="gov-card__avatar"
                      src={
                        d.photo ||
                        (d.image && d.image.link) ||
                        "https://www.shutterstock.com/image-vector/default-avatar-profile-icon-vector-600nw-2027875490.jpg"
                      }
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="gov-card__body">
                    <div className="gov-card__name">{d.name}</div>
                    {d.position ? (
                      <div className="gov-card__role">{d.position}</div>
                    ) : (
                      <div className="gov-card__role">Депутат</div>
                    )}
                    <ul className="gov-meta">
                      {d.reception && (
                        <li>
                          <span>⏰</span>
                          <span>Приём: {d.reception}</span>
                        </li>
                      )}
                      {d.district && (
                        <li>
                          <span>🏛️</span>
                          <span>{d.district}</span>
                        </li>
                      )}
                      {d.faction && (
                        <li>
                          <span>👥</span>
                          <span>{d.faction}</span>
                        </li>
                      )}
                      {d.convocation && (
                        <li>
                          <span>🎖️</span>
                          <span>Созыв: {d.convocation}</span>
                        </li>
                      )}
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
                    <a
                      className="gov-card__btn"
                      href={`#/government?type=dep&id=${d.id}`}
                    >
                      Подробнее
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <SideNav />
        </div>
      </div>
    </section>
  );
}
