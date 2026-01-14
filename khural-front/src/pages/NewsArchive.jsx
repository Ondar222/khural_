import React from "react";
import { Input, Select, Space } from "antd";
import { useData } from "../context/DataContext.jsx";
import { useI18n } from "../context/I18nContext.jsx";
import SideNav from "../components/SideNav.jsx";
import DataState from "../components/DataState.jsx";

function looksLikeHtml(s) {
  return /<\/?[a-z][\s\S]*>/i.test(String(s || ""));
}

export default function NewsArchive() {
  const { news, loading, errors, reload } = useData();
  const { t } = useI18n();

  const getInitialCategory = () => {
    const categoryParam = new URLSearchParams(window.location.search || "").get("category");
    return categoryParam || "Все";
  };
  const [category, setCategory] = React.useState(getInitialCategory);

  const getInitialDate = () => {
    const dateParam = new URLSearchParams(window.location.search || "").get("date");
    return dateParam || "";
  };
  const [date, setDate] = React.useState(getInitialDate);

  const [selected, setSelected] = React.useState(() => {
    const id = new URLSearchParams(window.location.search || "").get("id");
    return id || null;
  });

  React.useEffect(() => {
    const onNav = () => {
      const params = new URLSearchParams(window.location.search || "");
      const id = params.get("id");
      const categoryParam = params.get("category");
      const dateParam = params.get("date");
      setSelected(id || null);
      if (categoryParam && !id) {
        setCategory(categoryParam);
      } else if (!categoryParam && !id) {
        setCategory("Все");
      }
      if (dateParam && !id) setDate(dateParam);
      if (!dateParam && !id) setDate("");
    };
    window.addEventListener("popstate", onNav);
    window.addEventListener("app:navigate", onNav);
    return () => {
      window.removeEventListener("popstate", onNav);
      window.removeEventListener("app:navigate", onNav);
    };
  }, []);

  const categories = React.useMemo(
    () => ["Все", ...Array.from(new Set((news || []).map((n) => n.category).filter(Boolean)))],
    [news]
  );

  const filtered = React.useMemo(
    () =>
      (news || []).filter(
        (n) =>
          (category === "Все" || n.category === category) &&
          (!date || String(n.date || "").slice(0, 10) === date)
      ),
    [news, category, date]
  );

  if (selected) {
    const idx = (news || []).findIndex((n) => n.id === selected);
    const item = idx >= 0 ? (news || [])[idx] : null;
    if (!item) {
      return (
        <section className="section">
          <div className="container">
            <a
              className="btn btn-back"
              href="/news"
              style={{ marginBottom: 16, display: "inline-block" }}
            >
              {t("back")}
            </a>
            <DataState
              loading={Boolean(loading?.news) && (!news || news.length === 0)}
              error={errors?.news}
              onRetry={reload}
              empty={!loading?.news}
              emptyDescription="Новость не найдена"
            />
          </div>
        </section>
      );
    }

    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/news?id=${encodeURIComponent(item.id)}`
        : `/news?id=${encodeURIComponent(item.id)}`;
    const shareTitle = String(item.title || "").trim();

    return (
      <section className="section">
        <div className="container">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: "1 1 auto", minWidth: 0, width: "100%" }}>
              <a
                className="btn btn-back"
                href="/news"
                style={{ marginBottom: 16, display: "inline-block" }}
              >
                {t("back")}
              </a>
              <div>
                <h1 style={{ marginBottom: 8, display: "block" }}>{item.title}</h1>
                <div style={{ color: "#6b7280", marginBottom: 16 }}>
                  {new Date(item.date).toLocaleDateString("ru-RU")} · {item.category}
                </div>
              </div>
            </div>
          </div>

          <div className="news-detail">
            <article className="card" style={{ padding: 16 }}>
              {/* Images must come from backend/admin only */}
              {item?.image ? (
                <div style={{ height: 340, overflow: "hidden", borderRadius: 12 }}>
                  <img
                    src={item.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
              ) : null}

              <div className="prose" style={{ marginTop: 16 }}>
                {item.excerpt ? (
                  looksLikeHtml(item.excerpt) ? (
                    <div dangerouslySetInnerHTML={{ __html: String(item.excerpt) }} />
                  ) : (
                    <p>{item.excerpt}</p>
                  )
                ) : null}

                {item.contentHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: String(item.contentHtml) }} />
                ) : Array.isArray(item.content) && item.content.length > 0 ? (
                  item.content.map((p, i) =>
                    looksLikeHtml(p) ? (
                      <div key={i} dangerouslySetInnerHTML={{ __html: String(p) }} />
                    ) : (
                      <p key={i}>{p}</p>
                    )
                  )
                ) : null}
              </div>

              <div
                className="tile"
                style={{
                  marginTop: 14,
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                }}
              >
                <div className="share-title">Поделиться</div>
                <div className="share-icons" aria-label="Поделиться">
                  <a
                    className="share-sbtn share-sbtn--vk"
                    href={`https://vk.com/share.php?url=${encodeURIComponent(
                      shareUrl
                    )}&title=${encodeURIComponent(shareTitle)}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Поделиться во ВКонтакте"
                    title="ВКонтакте"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      x="0px"
                      y="0px"
                      width="100"
                      height="100"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path
                        fill="#1976d2"
                        d="M24 4A20 20 0 1 0 24 44A20 20 0 1 0 24 4Z"
                      ></path>
                      <path
                        fill="#fff"
                        d="M35.937,18.041c0.046-0.151,0.068-0.291,0.062-0.416C35.984,17.263,35.735,17,35.149,17h-2.618 c-0.661,0-0.966,0.4-1.144,0.801c0,0-1.632,3.359-3.513,5.574c-0.61,0.641-0.92,0.625-1.25,0.625C26.447,24,26,23.786,26,23.199 v-5.185C26,17.32,25.827,17,25.268,17h-4.649C20.212,17,20,17.32,20,17.641c0,0.667,0.898,0.827,1,2.696v3.623 C21,24.84,20.847,25,20.517,25c-0.89,0-2.642-3-3.815-6.932C16.448,17.294,16.194,17,15.533,17h-2.643 C12.127,17,12,17.374,12,17.774c0,0.721,0.6,4.619,3.875,9.101C18.25,30.125,21.379,32,24.149,32c1.678,0,1.85-0.427,1.85-1.094 v-2.972C26,27.133,26.183,27,26.717,27c0.381,0,1.158,0.25,2.658,2c1.73,2.018,2.044,3,3.036,3h2.618 c0.608,0,0.957-0.255,0.971-0.75c0.003-0.126-0.015-0.267-0.056-0.424c-0.194-0.576-1.084-1.984-2.194-3.326 c-0.615-0.743-1.222-1.479-1.501-1.879C32.062,25.36,31.991,25.176,32,25c0.009-0.185,0.105-0.361,0.249-0.607 C32.223,24.393,35.607,19.642,35.937,18.041z"
                      ></path>
                    </svg>
                  </a>

                  <a
                    className="share-sbtn share-sbtn--ok"
                    href="https://ok.ru"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Одноклассники"
                    title="Одноклассники"
                  >
                    <img src="/img/ok.png" alt="" aria-hidden="true" />
                  </a>

                  <a
                    className="share-sbtn share-sbtn--tg"
                    href={`https://t.me/share/url?url=${encodeURIComponent(
                      shareUrl
                    )}&text=${encodeURIComponent(shareTitle)}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Поделиться в Telegram"
                    title="Telegram"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      x="0px"
                      y="0px"
                      width="100"
                      height="100"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path
                        fill="#29b6f6"
                        d="M24 4A20 20 0 1 0 24 44A20 20 0 1 0 24 4Z"
                      ></path>
                      <path
                        fill="#fff"
                        d="M33.95,15l-3.746,19.126c0,0-0.161,0.874-1.245,0.874c-0.576,0-0.873-0.274-0.873-0.274l-8.114-6.733 l-3.97-2.001l-5.095-1.355c0,0-0.907-0.262-0.907-1.012c0-0.625,0.933-0.923,0.933-0.923l21.316-8.468 c-0.001-0.001,0.651-0.235,1.126-0.234C33.667,14,34,14.125,34,14.5C34,14.75,33.95,15,33.95,15z"
                      ></path>
                      <path
                        fill="#b0bec5"
                        d="M23,30.505l-3.426,3.374c0,0-0.149,0.115-0.348,0.12c-0.069,0.002-0.143-0.009-0.219-0.043 l0.964-5.965L23,30.505z"
                      ></path>
                      <path
                        fill="#cfd8dc"
                        d="M29.897,18.196c-0.169-0.22-0.481-0.26-0.701-0.093L16,26c0,0,2.106,5.892,2.427,6.912 c0.322,1.021,0.58,1.045,0.58,1.045l0.964-5.965l9.832-9.096C30.023,18.729,30.064,18.416,29.897,18.196z"
                      ></path>
                    </svg>
                  </a>

                  <button
                    type="button"
                    className="share-sbtn share-sbtn--copy"
                    aria-label="Скопировать ссылку"
                    title="Скопировать ссылку"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(shareUrl);
                      } catch {
                        // ignore
                      }
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path
                        d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </article>

            <aside>
              <h3 style={{ marginBottom: 8 }}>{t("otherNews")}</h3>
              <div className="grid">
                {(news || [])
                  .filter((n) => n.id !== item.id)
                  .slice(0, 6)
                  .map((n) => (
                    <a
                      key={n.id}
                      className="tile link"
                      href={`/news?id=${n.id}`}
                      style={{ display: "block", padding: 12 }}
                    >
                      <div style={{ fontSize: 14, color: "#6b7280" }}>
                        {new Date(n.date).toLocaleDateString("ru-RU")}
                      </div>
                      <div style={{ fontWeight: 700 }}>{n.title}</div>
                    </a>
                  ))}
              </div>
            </aside>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container">
        <div className="page-grid">
          <div>
            <h1>{t("news")}</h1>
            <DataState
              loading={Boolean(loading?.news) && (!news || news.length === 0)}
              error={errors?.news}
              onRetry={reload}
              empty={!loading?.news && (!news || news.length === 0)}
              emptyDescription="Новостей пока нет"
            >
              <div className="filters">
                <Space
                  size={8}
                  style={{ margin: "12px 0 20px", width: "100%", display: "flex" }}
                  wrap={false}
                >
                  <Select
                    value={category}
                    onChange={(newCategory) => {
                      setCategory(newCategory);
                      const h = window.location.pathname;
                      const params = new URLSearchParams(window.location.search || "");
                      if (newCategory === "Все") {
                        params.delete("category");
                      } else {
                        params.set("category", newCategory);
                      }
                      if (date) params.set("date", date);
                      const newHash = params.toString() ? `${h}?${params.toString()}` : h;
                      window.history.pushState({}, "", newHash);
                      window.dispatchEvent(new Event("app:navigate"));
                    }}
                    popupMatchSelectWidth={false}
                    options={categories.map((c) => ({ value: c, label: c }))}
                  />
                  <Input
                    type="date"
                    value={date || ""}
                    onChange={(e) => {
                      const newDate = e.target.value || "";
                      setDate(newDate);
                      const h = window.location.pathname;
                      const params = new URLSearchParams(window.location.search || "");
                      if (category && category !== "Все") params.set("category", category);
                      if (newDate) params.set("date", newDate);
                      else params.delete("date");
                      const next = params.toString() ? `${h}?${params.toString()}` : h;
                      window.history.pushState({}, "", next);
                      window.dispatchEvent(new Event("app:navigate"));
                    }}
                    style={{ minWidth: 220 }}
                    placeholder="Дата"
                    aria-label="Фильтр новостей по дате"
                  />
                </Space>
              </div>

              <DataState
                loading={false}
                error={null}
                empty={filtered.length === 0}
                emptyDescription="По выбранным фильтрам ничего не найдено"
              >
                <div className="grid cols-3">
                  {filtered.map((n) => (
                    <a
                      key={n.id}
                      className="tile"
                      href={`/news?id=${n.id}`}
                      style={{ overflow: "hidden", padding: 0 }}
                    >
                      {/* Images must come from backend/admin only */}
                      {n?.image ? (
                        <div style={{ height: 180, overflow: "hidden" }}>
                          <img
                            src={n.image}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        </div>
                      ) : null}

                      <div style={{ padding: 16 }}>
                        <div
                          style={{
                            display: "inline-block",
                            background: "#eef2ff",
                            color: "#3730a3",
                            borderRadius: 8,
                            padding: "4px 10px",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {n.category}
                        </div>
                        <div style={{ marginTop: 10, fontSize: 18, fontWeight: 700 }}>
                          {n.title}
                        </div>
                        <div style={{ color: "#6b7280", marginTop: 6 }}>
                          {new Date(n.date).toLocaleDateString("ru-RU")}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </DataState>
            </DataState>
          </div>

          <SideNav
            title="Новости"
            links={[
              { label: "Актуальные новости", href: "/news" },
              { label: "Все новости", href: "/news" },
              { label: "Медиа", href: "/news" },
            ]}
          />
        </div>
      </div>
    </section>
  );
}


