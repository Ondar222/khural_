import React from "react";
import { Button, Input, Space, Table, Popconfirm, Tag } from "antd";
import { AboutApi, apiFetch } from "../../api/client.js";
import { useData } from "../../context/DataContext.jsx";

function normalizeList(res) {
  if (Array.isArray(res)) return res;
  if (res && typeof res === "object" && Array.isArray(res.items)) return res.items;
  return [];
}

function slugify(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9\-а-яё]+/gi, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Pages that already exist on the public site (used in /section via title→slug mapping).
// If backend /pages is empty, we still can seed these so they appear in admin.
const SITE_SEED_PAGES = [
  // System route pages (editable CMS snippets on corresponding routes)
  { slug: "home", title: "Главная" },
  { slug: "news", title: "Новости" },
  { slug: "deputies", title: "Депутаты" },
  { slug: "documents", title: "Документы" },
  { slug: "contacts", title: "Контакты" },
  { slug: "about", title: "О Хурале" },
  { slug: "government", title: "Руководство" },
  { slug: "section", title: "Разделы" },

  { slug: "code-of-honor", title: "Кодекс чести мужчины Тувы" },
  { slug: "mothers-commandments", title: "Свод заповедей матерей Тувы" },
  { slug: "news-subscription", title: "Подписка на новости" },
  { slug: "for-media", title: "Для СМИ" },
  { slug: "photos", title: "Фотографии" },
  { slug: "videos", title: "Видеозаписи" },
  { slug: "pd-policy", title: "Политика обработки персональных данных" },
  { slug: "license", title: "Лицензия" },
  { slug: slugify("Комиссии"), title: "Комиссии" },
  { slug: slugify("Депутатские фракции"), title: "Депутатские фракции" },
  { slug: slugify("Молодежный Хурал"), title: "Молодежный Хурал" },
  // content sections used in SideNav/header via /section?title=...
  { slug: slugify("Представительство в Совете Федерации"), title: "Представительство в Совете Федерации" },
  {
    slug: slugify("Совет по взаимодействию с представительными органами муниципальных образований"),
    title: "Совет по взаимодействию с представительными органами муниципальных образований",
  },
];

const SYSTEM_ROUTE_DEFS = [
  { route: "/", cmsSlug: "home", title: "Главная" },
  { route: "/news", cmsSlug: "news", title: "Новости" },
  { route: "/deputies", cmsSlug: "deputies", title: "Депутаты" },
  { route: "/documents", cmsSlug: "documents", title: "Документы" },
  { route: "/contacts", cmsSlug: "contacts", title: "Контакты" },
  { route: "/about", cmsSlug: "about", title: "О Хурале" },
  { route: "/government", cmsSlug: "government", title: "Руководство" },
  { route: "/section", cmsSlug: "section", title: "Разделы" },
];

async function listPagesWithFallback({ locale, authPreferred } = {}) {
  try {
    // Пробуем с авторизацией сначала (админский список всех страниц)
    const res = await apiFetch(`/pages`, { method: "GET", auth: true });
    return normalizeList(res);
  } catch (e) {
    // Если не получилось с авторизацией, пробуем без неё
    if (authPreferred) {
      throw e;
    }
    try {
      const res = await AboutApi.listPages({ locale });
      return normalizeList(res);
    } catch {
      throw e; // Возвращаем первую ошибку
    }
  }
}

export default function AdminPagesV2List({
  canWrite,
  onCreate,
  onEdit,
  onPreview,
  onMessage,
}) {
  const { reload: reloadData } = useData();
  const [q, setQ] = React.useState("");
  const [localeMode, setLocaleMode] = React.useState("all"); // all | ru | tyv
  const [busy, setBusy] = React.useState(false);
  const [items, setItems] = React.useState([]);
  const [importing, setImporting] = React.useState(false);
  const [windowWidth, setWindowWidth] = React.useState(typeof window !== "undefined" ? window.innerWidth : 1200);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isMobile = windowWidth <= 768;
  const isTablet = windowWidth > 768 && windowWidth <= 1024;

  const load = React.useCallback(async () => {
    setBusy(true);
    try {
      // В админке пробуем auth сначала, но разрешаем fallback на публичный список,
      // чтобы страница не была пустой, если токен/права не настроены.
      const res = await listPagesWithFallback({ locale: localeMode === "all" ? undefined : localeMode, authPreferred: false });
      const arr = Array.isArray(res) ? res : [];
      // dedupe by slug
      const bySlug = new Map();
      for (const p of arr) {
        const slug = String(p?.slug || "");
        if (!slug) continue;
        if (!bySlug.has(slug)) bySlug.set(slug, p);
      }
      setItems(Array.from(bySlug.values()));
    } catch (e) {
      onMessage?.("error", e?.message || "Не удалось загрузить страницы");
      setItems([]);
    } finally {
      setBusy(false);
    }
  }, [localeMode, onMessage]);

  const cmsBySlug = React.useMemo(() => {
    const map = new Map();
    for (const p of Array.isArray(items) ? items : []) {
      const slug = String(p?.slug || "").trim();
      if (!slug) continue;
      map.set(slug.toLowerCase(), p);
    }
    return map;
  }, [items]);

  React.useEffect(() => {
    // Загружаем страницы при монтировании и при изменении режима языка
    load();
  }, [localeMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = React.useMemo(() => {
    const qq = q.trim().toLowerCase();

    const systemRows = SYSTEM_ROUTE_DEFS.map((d) => {
      const cms = cmsBySlug.get(String(d.cmsSlug).toLowerCase()) || null;
      return {
        id: `system:${d.route}`,
        title: d.title,
        slug: d.route,
        __isSystem: true,
        __href: d.route,
        __cmsSlug: d.cmsSlug,
        __cmsPage: cms,
      };
    });

    const base = (Array.isArray(items) ? items : []).concat(systemRows);

    const byLocale =
      localeMode === "all"
        ? base
        : base.filter((p) => {
            if (p?.__isSystem) {
              const cms = p?.__cmsPage;
              if (!cms) return true;
              const c = cms?.content;
              if (Array.isArray(c)) return c.some((x) => String(x?.locale || "").toLowerCase() === localeMode);
              return localeMode === "ru";
            }
            const c = p?.content;
            if (Array.isArray(c)) return c.some((x) => String(x?.locale || "").toLowerCase() === localeMode);
            // legacy single-content: treat as RU
            return localeMode === "ru";
          });

    const list = !qq
      ? byLocale
      : byLocale.filter((p) => {
          const title = String(
            (p?.__isSystem ? p?.__cmsPage?.title : p?.title) || p?.name || ""
          ).toLowerCase();
          const slug = String(p.slug || "").toLowerCase();
          const cmsSlug = p?.__isSystem ? String(p?.__cmsSlug || "").toLowerCase() : "";
          return title.includes(qq) || slug.includes(qq) || (cmsSlug && cmsSlug.includes(qq));
        });

    return list
      .map((p) => {
        const slug = String(p.slug || "");
        const parts = slug.split("/").filter(Boolean);
        const depth = Math.max(0, parts.length - 1);
        const parentSlug = parts.slice(0, -1).join("/");
        return { ...p, __depth: depth, __parentSlug: parentSlug };
      })
      .sort((a, b) => {
        const as = Boolean(a?.__isSystem);
        const bs = Boolean(b?.__isSystem);
        if (as !== bs) return as ? 1 : -1; // CMS first, system routes last
        return String(a.slug || "").localeCompare(String(b.slug || ""));
      });
  }, [items, q, localeMode, cmsBySlug]);

  const deletePage = React.useCallback(
    async (id) => {
      if (!canWrite) return;
      setBusy(true);
      try {
        await AboutApi.deletePage(id);
        onMessage?.("success", "Страница удалена");
        reloadData();
        await load();
      } catch (e) {
        onMessage?.("error", e?.message || "Не удалось удалить страницу");
      } finally {
        setBusy(false);
      }
    },
    [canWrite, load, onMessage, reloadData]
  );

  const ensureSystemCms = React.useCallback(
    async (row) => {
      if (!canWrite) return;
      const cmsSlug = String(row?.__cmsSlug || "").trim();
      const title = String(row?.title || "").trim();
      if (!cmsSlug || !title) return;

      setBusy(true);
      try {
        const localesToCreate = localeMode === "all" ? ["ru", "tyv"] : [localeMode];
        await AboutApi.createPage({
          slug: cmsSlug,
          title,
          isPublished: true,
          content: localesToCreate.map((loc) => ({
            locale: loc,
            title,
            content: `<p>${title}</p>`,
          })),
        });
        onMessage?.("success", `CMS-страница создана: ${cmsSlug}`);
        reloadData();
        await load();
      } catch (e) {
        onMessage?.("error", e?.message || "Не удалось создать страницу");
      } finally {
        setBusy(false);
      }
    },
    [canWrite, load, localeMode, onMessage, reloadData]
  );

  const importFromPublicSite = React.useCallback(async () => {
    if (!canWrite) return;
    setImporting(true);
    let created = 0;
    let skipped = 0;
    let failed = 0;
    let usedSeed = 0;
    let firstError = "";

    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    const toSlug = (p) => String(p?.slug || p?.path || "").trim().replace(/^\/+/, "");
    const toTitle = (p) => String(p?.title || p?.name || p?.menuTitle || p?.menu_title || "").trim();
    const toContent = (p, title) => {
      const c = p?.content ?? p?.html ?? p?.body ?? p?.text ?? "";
      if (typeof c === "string" && c.trim()) return c;
      return `<p>${String(title || "").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
    };

    try {
      // На всякий случай подтянем текущий список страниц в админке
      await load();
      // 1) Публичный список (то, что есть на сайте). Если API пустой — используем seed.
      const publicList = await AboutApi.listPages({ locale: "ru", publishedOnly: false }).catch(() => []);
      const publicItems = normalizeList(publicList);
      const sourceItems = publicItems.length ? publicItems : SITE_SEED_PAGES;
      if (!publicItems.length) usedSeed += SITE_SEED_PAGES.length;

      // 2) Текущий список в админке (все страницы)
      const adminList = normalizeList(await apiFetch(`/pages`, { method: "GET", auth: true }).catch(() => []));
      const existingSlugs = new Set(adminList.map((p) => toSlug(p).toLowerCase()).filter(Boolean));

      const localesToCreate = localeMode === "all" ? ["ru", "tyv"] : [localeMode];

      for (const p of sourceItems) {
        const slug = toSlug(p);
        const title = toTitle(p);
        if (!slug || !title) {
          skipped += 1;
          continue;
        }
        if (existingSlugs.has(slug.toLowerCase())) {
          skipped += 1;
          continue;
        }

        const content = localesToCreate.map((loc) => ({
          locale: loc,
          title,
          content: toContent(p, title),
        }));

        try {
          await AboutApi.createPage({
            slug,
            title,
            isPublished: true,
            content,
          });
          created += 1;
          existingSlugs.add(slug.toLowerCase());
          await delay(350);
        } catch (e) {
          failed += 1;
          if (!firstError) firstError = e?.message || "Ошибка создания страницы";
        }
      }

      onMessage?.(
        failed > 0 ? "warning" : "success",
        `Импорт завершён: создано ${created}, пропущено ${skipped}${
          failed ? `, ошибок ${failed}` : ""
        }${usedSeed ? ` (seed: ${usedSeed})` : ""}${firstError ? ` • пример: ${firstError}` : ""}`
      );
      reloadData();
      await load();
    } finally {
      setImporting(false);
    }
  }, [canWrite, load, localeMode, onMessage, reloadData]);

  const columns = [
    {
      title: "Название",
      dataIndex: "title",
      render: (_, row) => (
        <div className="admin-pages-list__titlecell">
          <div className="admin-pages-list__titleline">
            {row.__depth ? <span className="admin-pages-list__indent">{"— ".repeat(row.__depth)}</span> : null}
            <span className="admin-pages-list__title">{row.title || row.name || "—"}</span>
          </div>
          <div className="admin-pages-list__metarow">
            <Tag className="admin-pages-list__tag">{row.slug || "—"}</Tag>
            {row?.__isSystem ? (
              <>
                <Tag className="admin-pages-list__tag" color="gold">
                  ROUTE
                </Tag>
                <Tag className="admin-pages-list__tag" color="cyan">
                  CMS: {row.__cmsSlug}
                </Tag>
                <Tag className="admin-pages-list__tag" color={row.__cmsPage ? "blue" : "default"}>
                  {(() => {
                    const c = row?.__cmsPage?.content;
                    const locales = Array.isArray(c)
                      ? Array.from(new Set(c.map((x) => String(x?.locale || "").toLowerCase()).filter(Boolean)))
                      : row.__cmsPage
                        ? ["ru"]
                        : [];
                    return locales.length ? locales.join(" + ").toUpperCase() : "—";
                  })()}
                </Tag>
              </>
            ) : (
              <Tag className="admin-pages-list__tag" color="blue">
                {(() => {
                  const c = row?.content;
                  const locales = Array.isArray(c)
                    ? Array.from(new Set(c.map((x) => String(x?.locale || "").toLowerCase()).filter(Boolean)))
                    : ["ru"];
                  return locales.length ? locales.join(" + ").toUpperCase() : "—";
                })()}
              </Tag>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Действия",
      key: "actions",
      width: isTablet ? 380 : 460,
      render: (_, row) => (
        <Space wrap className="admin-pages-list__actions">
          {row?.__isSystem ? (
            <>
              <Button
                size={isTablet ? "small" : "middle"}
                onClick={() => window.open(row.__href || row.slug || "/", "_blank")}
              >
                Открыть
              </Button>
              {row.__cmsPage ? (
                <>
                  <Button
                    size={isTablet ? "small" : "middle"}
                    onClick={() => onCreate?.(row.__cmsSlug)}
                    disabled={!canWrite}
                  >
                    + Подстраница
                  </Button>
                  <Button
                    size={isTablet ? "small" : "middle"}
                    onClick={() => onEdit?.(row.__cmsPage?.id)}
                    disabled={!canWrite}
                  >
                    Редактировать
                  </Button>
                  <Popconfirm
                    title="Удалить CMS-страницу?"
                    description="Это действие нельзя отменить."
                    okText="Удалить"
                    cancelText="Отмена"
                    onConfirm={() => deletePage(row.__cmsPage?.id)}
                    disabled={!canWrite}
                  >
                    <Button size={isTablet ? "small" : "middle"} danger disabled={!canWrite}>
                      Удалить
                    </Button>
                  </Popconfirm>
                </>
              ) : (
                <Button
                  size={isTablet ? "small" : "middle"}
                  onClick={() => ensureSystemCms(row)}
                  disabled={!canWrite}
                >
                  Создать CMS
                </Button>
              )}
            </>
          ) : (
            <>
              <Button size={isTablet ? "small" : "middle"} onClick={() => onPreview?.(row.slug)} disabled={!row.slug}>
                Открыть
              </Button>
              <Button
                size={isTablet ? "small" : "middle"}
                onClick={() => onCreate?.(row.slug)}
                disabled={!canWrite || !row.slug}
              >
                + Подстраница
              </Button>
              <Button size={isTablet ? "small" : "middle"} onClick={() => onEdit?.(row.id)} disabled={!canWrite}>
                Редактировать
              </Button>
              <Popconfirm
                title="Удалить страницу?"
                description="Это действие нельзя отменить."
                okText="Удалить"
                cancelText="Отмена"
                onConfirm={() => deletePage(row.id)}
                disabled={!canWrite}
              >
                <Button size={isTablet ? "small" : "middle"} danger disabled={!canWrite}>
                  Удалить
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  const renderToolbar = () => (
    <div className="admin-card admin-toolbar admin-pages-list__toolbar">
      <div className="admin-pages-list__toolbar-left">
        <Input
          placeholder="Поиск по названию или slug..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="admin-input"
          size={isMobile ? "large" : "middle"}
        />
      </div>
      <div className="admin-pages-list__toolbar-right">
        <Button
          onClick={importFromPublicSite}
          disabled={!canWrite}
          loading={Boolean(importing)}
          size={isMobile ? "large" : "middle"}
        >
          Импортировать с сайта
        </Button>
        <Button
          onClick={() => setLocaleMode((x) => (x === "all" ? "ru" : x === "ru" ? "tyv" : "all"))}
          size={isMobile ? "large" : "middle"}
        >
          Язык: {localeMode === "all" ? "Все" : localeMode === "tyv" ? "Тыва" : "Русский"}
        </Button>
        <Button onClick={load} loading={busy} size={isMobile ? "large" : "middle"}>
          Обновить
        </Button>
        <Button
          type="primary"
          onClick={() => onCreate?.()}
          disabled={!canWrite}
          size={isMobile ? "large" : "middle"}
        >
          + Создать страницу
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="admin-grid admin-pages-list">
        {renderToolbar()}

        {filtered.length === 0 ? (
          <div className="admin-card admin-pages-list__empty">Нет данных</div>
        ) : (
          <div className="admin-cards admin-pages-list__cards">
            {filtered.map((row) => (
              <div
                key={String(row.id || row.slug)}
                className={[
                  "admin-card",
                  "admin-pages-list__card",
                  row?.__isSystem ? "admin-pages-list__card--system" : "",
                  row?.__isSystem && !row?.__cmsPage ? "admin-pages-list__card--system-missing" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className="admin-pages-list__card-head">
                  <div className="admin-pages-list__card-title">
                    {row.title || row.name || "—"}
                  </div>
                  <div className="admin-pages-list__metarow">
                    <Tag className="admin-pages-list__tag">{row.slug || "—"}</Tag>
                    {row?.__isSystem ? (
                      <>
                        <Tag className="admin-pages-list__tag" color="gold">
                          ROUTE
                        </Tag>
                        <Tag className="admin-pages-list__tag" color="cyan">
                          CMS: {row.__cmsSlug}
                        </Tag>
                        <Tag className="admin-pages-list__tag" color={row.__cmsPage ? "blue" : "default"}>
                          {(() => {
                            const c = row?.__cmsPage?.content;
                            const locales = Array.isArray(c)
                              ? Array.from(new Set(c.map((x) => String(x?.locale || "").toLowerCase()).filter(Boolean)))
                              : row.__cmsPage
                                ? ["ru"]
                                : [];
                            return locales.length ? locales.join(" + ").toUpperCase() : "—";
                          })()}
                        </Tag>
                      </>
                    ) : (
                      <Tag className="admin-pages-list__tag" color="blue">
                        {(() => {
                          const c = row?.content;
                          const locales = Array.isArray(c)
                            ? Array.from(new Set(c.map((x) => String(x?.locale || "").toLowerCase()).filter(Boolean)))
                            : ["ru"];
                          return locales.length ? locales.join(" + ").toUpperCase() : "—";
                        })()}
                      </Tag>
                    )}
                  </div>
                </div>

                <div className="admin-pages-list__card-actions">
                  {row?.__isSystem ? (
                    <>
                      <Button onClick={() => window.open(row.__href || row.slug || "/", "_blank")} block>
                        Открыть
                      </Button>
                      {row.__cmsPage ? (
                        <>
                          <Button onClick={() => onEdit?.(row.__cmsPage?.id)} disabled={!canWrite} block>
                            Редактировать
                          </Button>
                          <Button onClick={() => onCreate?.(row.__cmsSlug)} disabled={!canWrite} block>
                            + Подстраница
                          </Button>
                          <Popconfirm
                            title="Удалить CMS-страницу?"
                            description="Это действие нельзя отменить."
                            okText="Удалить"
                            cancelText="Отмена"
                            onConfirm={() => deletePage(row.__cmsPage?.id)}
                            disabled={!canWrite}
                          >
                            <Button danger disabled={!canWrite} block>
                              Удалить
                            </Button>
                          </Popconfirm>
                        </>
                      ) : (
                        <Button onClick={() => ensureSystemCms(row)} disabled={!canWrite} block>
                          Создать CMS
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Button onClick={() => onPreview?.(row.slug)} disabled={!row.slug} block>
                        Открыть
                      </Button>
                      <Button onClick={() => onEdit?.(row.id)} disabled={!canWrite} block>
                        Редактировать
                      </Button>
                      <Button onClick={() => onCreate?.(row.slug)} disabled={!canWrite || !row.slug} block>
                        + Подстраница
                      </Button>
                      <Popconfirm
                        title="Удалить страницу?"
                        description="Это действие нельзя отменить."
                        okText="Удалить"
                        cancelText="Отмена"
                        onConfirm={() => deletePage(row.id)}
                        disabled={!canWrite}
                      >
                        <Button danger disabled={!canWrite} block>
                          Удалить
                        </Button>
                      </Popconfirm>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="admin-grid admin-pages-list">
      {renderToolbar()}

      <div className="admin-card admin-table">
        <Table
          rowKey={(r) => String(r.id || r.slug || Math.random())}
          rowClassName={(r) =>
            r?.__isSystem
              ? ["admin-pages-list__row--system", !r?.__cmsPage ? "admin-pages-list__row--system-missing" : ""]
                  .filter(Boolean)
                  .join(" ")
              : ""
          }
          columns={columns}
          dataSource={filtered}
          loading={busy}
          pagination={{
            pageSize: 10,
            showSizeChanger: !isTablet,
            showQuickJumper: !isTablet,
            size: isTablet ? "small" : "default",
          }}
          scroll={isTablet ? { x: "max-content" } : undefined}
        />
      </div>
    </div>
  );
}



