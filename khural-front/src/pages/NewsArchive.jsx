import React from "react";
import { useData } from "../context/DataContext.jsx";
import { useI18n } from "../context/I18nContext.jsx";
import { Select, Space } from "antd";
import SideNav from "../components/SideNav.jsx";
import CommentsBlock from "../components/CommentsBlock.jsx";
import DataState from "../components/DataState.jsx";

export default function NewsArchive() {
  const { news, loading, errors, reload } = useData();
  const { t } = useI18n();
  const getInitialCategory = () => {
    const categoryParam = new URLSearchParams(window.location.search || "").get("category");
    return categoryParam || "Все";
  };
  const [category, setCategory] = React.useState(getInitialCategory);
  const [month, setMonth] = React.useState("Все");
  const [selected, setSelected] = React.useState(() => {
    const id = new URLSearchParams(window.location.search || "").get("id");
    return id || null;
  });
  React.useEffect(() => {
    const onNav = () => {
      const params = new URLSearchParams(window.location.search || "");
      const id = params.get("id");
      const categoryParam = params.get("category");
      setSelected(id || null);
      if (categoryParam && !id) {
        setCategory(categoryParam);
      } else if (!categoryParam && !id) {
        setCategory("Все");
      }
    };
    window.addEventListener("popstate", onNav);
    window.addEventListener("app:navigate", onNav);
    return () => {
      window.removeEventListener("popstate", onNav);
      window.removeEventListener("app:navigate", onNav);
    };
  }, []);

  const categories = React.useMemo(
    () => ["Все", ...Array.from(new Set(news.map((n) => n.category)))],
    [news]
  );
  const months = React.useMemo(
    () => ["Все", ...Array.from(new Set(news.map((n) => n.date.slice(0, 7))))],
    [news]
  );

  const filtered = React.useMemo(
    () =>
      news.filter(
        (n) =>
          (category === "Все" || n.category === category) &&
          (month === "Все" || n.date.startsWith(month))
      ),
    [news, category, month]
  );

  const getImage = (i) => {
    const imgs = [
      "/img/news1.jpeg",
      "/img/news2.jpeg",
      "/img/news3.jpeg",
      "/img/news4.jpeg",
      "/img/news5.jpeg",
    ];
    return imgs[i % imgs.length];
  };

  if (selected) {
    const idx = news.findIndex((n) => n.id === selected);
    const item = idx >= 0 ? news[idx] : null;
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
              <div style={{ height: 340, overflow: "hidden", borderRadius: 12 }}>
                <img
                  src={item?.image || getImage(Math.max(0, idx))}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div className="prose" style={{ marginTop: 16 }}>
                <p>{item.excerpt}</p>
                {Array.isArray(item.content) && item.content.length > 0 ? (
                  item.content.map((p, i) => <p key={i}>{p}</p>)
                ) : (
                  <>
                    <p>
                      Полный текст новости будет дополнен. Сейчас отображается расширенное описание
                      на основе краткой выжимки.
                    </p>
                    <p>
                      При необходимости вы можете добавить поле
                      <strong> content</strong> и <strong> image</strong> в файле данных, чтобы
                      вывести официальный текст и фотографию события.
                    </p>
                  </>
                )}
              </div>

              <CommentsBlock entityType="news" entityId={Number(item.id)} />
            </article>
            <aside>
              <h3 style={{ marginBottom: 8 }}>{t("otherNews")}</h3>
              <div className="grid">
                {news
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
                      const newHash = params.toString() ? `${h}?${params.toString()}` : h;
                      window.history.pushState({}, "", newHash);
                      window.dispatchEvent(new Event("app:navigate"));
                    }}
                    popupMatchSelectWidth={false}
                    options={categories.map((c) => ({ value: c, label: c }))}
                  />
                  <Select
                    value={month}
                    onChange={setMonth}
                    popupMatchSelectWidth={false}
                    options={months.map((m) => ({ value: m, label: m }))}
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
                  {filtered.map((n, i) => (
                    <a
                      key={n.id}
                      className="tile"
                      href={`/news?id=${n.id}`}
                      style={{ overflow: "hidden", padding: 0 }}
                    >
                      <div style={{ height: 180, overflow: "hidden" }}>
                        <img
                          src={n.image || getImage(i)}
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
