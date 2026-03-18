import React from "react";
import { Button, Input, Space, Table, Popconfirm, Tag } from "antd";
import { AboutApi, apiFetch } from "../../api/client.js";
import { useData } from "../../context/DataContext.jsx";
import {
  getPageOverrideById,
  PAGES_OVERRIDES_EVENT_NAME,
  PAGES_OVERRIDES_STORAGE_KEY,
} from "../../utils/pagesOverrides.js";

function normalizeList(res) {
  if (Array.isArray(res)) return res;
  if (res && typeof res === "object" && Array.isArray(res.items)) return res.items;
  return [];
}

// Real site routes. These are NOT CMS pages.
// Editing is done via corresponding admin modules (news/deputies/documents/slider/etc).
const SYSTEM_ROUTE_DEFS = [
  {
    route: "/",
    title: "Главная",
    adminLinks: [
      { label: "Слайдер", href: "/admin/slider" },
      { label: "Новости", href: "/admin/news" },
      { label: "События", href: "/admin/events" },
    ],
  },
  { route: "/news", title: "Новости", adminLinks: [{ label: "Новости", href: "/admin/news" }] },
  { route: "/deputies", title: "Депутаты", adminLinks: [{ label: "Депутаты", href: "/admin/deputies" }] },
  { route: "/documents", title: "Документы", adminLinks: [{ label: "Документы", href: "/admin/documents" }] },
  { route: "/contacts", title: "Контакты", adminLinks: [] },
  { route: "/about", title: "О Хурале", adminLinks: [{ label: "Структура", href: "/admin/committees" }] },
];

// Static sections that can have subpages
const STATIC_SECTIONS = [
  { slug: "news", title: "Новости" },
  { slug: "deputies", title: "Депутаты" },
  { slug: "documents", title: "Документы" },
  { slug: "about", title: "О Хурале" },
  { slug: "committees", title: "Комитеты" },
  { slug: "commissions", title: "Комиссии" },
  { slug: "activity", title: "Деятельность" },
  { slug: "contacts", title: "Контакты" },
  { slug: "appeals", title: "Обращения" },
  { slug: "broadcast", title: "Трансляция" },
];

// Фиксированные контентные страницы (отображаются в списке даже если ещё не созданы в API)
const FIXED_CONTENT_PAGES = [
  { slug: "code-of-honor", title: "Кодекс чести мужчины Тувы" },
  { slug: "mothers-commandments", title: "Свод заповедей матерей Тувы" },
  { slug: "struct/council", title: "Представительство в Совете Федерации" },
  { slug: "info/finansy", title: "Финансы" },
  { slug: "info/iokrug", title: "Избирательные округа" },
  { slug: "info/zakon-karta", title: "Законодательная карта сайта" },
  { slug: "opendata", title: "Открытые данные" },
  { slug: "info/upoln-po-prav", title: "Уполномоченный по правам человека в Республике Тыва" },
  { slug: "info/upoln-po-reb", title: "Уполномоченный по правам ребенка в Республике Тыва" },
  { slug: "info/personnel", title: "Кадровое обеспечение" },
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
  onCreateFixedPage,
  onEdit,
  onPreview,
  onMessage,
}) {
  const { reload: reloadData } = useData();
  const [q, setQ] = React.useState("");
  const [localeMode, setLocaleMode] = React.useState("all"); // all | ru | tyv
  const [busy, setBusy] = React.useState(false);
  const [items, setItems] = React.useState([]);
  const [, setOvTick] = React.useState(0);
  const [windowWidth, setWindowWidth] = React.useState(typeof window !== "undefined" ? window.innerWidth : 1200);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const bump = () => setOvTick((x) => x + 1);
    const onStorage = (e) => {
      if (e?.key === PAGES_OVERRIDES_STORAGE_KEY) bump();
    };
    window.addEventListener(PAGES_OVERRIDES_EVENT_NAME, bump);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(PAGES_OVERRIDES_EVENT_NAME, bump);
      window.removeEventListener("storage", onStorage);
    };
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

      console.log('[AdminPagesV2List] Loaded pages:', arr.length, arr.map(p => ({ slug: p.slug, title: p.title, id: p.id })));

      // dedupe by slug
      const bySlug = new Map();
      for (const p of arr) {
        const slug = String(p?.slug || "");
        if (!slug) continue;
        if (!bySlug.has(slug)) bySlug.set(slug, p);
      }
      console.log('[AdminPagesV2List] After dedup:', bySlug.size, Array.from(bySlug.keys()));
      setItems(Array.from(bySlug.values()));
      
      if (arr.length === 0) {
        onMessage?.("warning", "Страницы не найдены в API. Нажмите 'Создать страницу' для добавления.");
      }
    } catch (e) {
      console.error('[AdminPagesV2List] Error loading pages:', e);
      onMessage?.("error", e?.message || "Не удалось загрузить страницы. Проверьте подключение к API.");
      setItems([]);
    } finally {
      setBusy(false);
    }
  }, [localeMode, onMessage]);

  React.useEffect(() => {
    // Загружаем страницы при монтировании и при изменении режима языка
    load();
  }, [localeMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = React.useMemo(() => {
    const qq = q.trim().toLowerCase();

    const systemRows = SYSTEM_ROUTE_DEFS.map((d) => {
      return {
        id: `system:${d.route}`,
        title: d.title,
        slug: d.route.replace(/^\/+|\/+$/g, ""),
        __isSystem: true,
        __href: d.route,
        __adminLinks: Array.isArray(d.adminLinks) ? d.adminLinks : [],
      };
    });

    // Add static sections as potential parents
    const staticSectionRows = STATIC_SECTIONS.map((s) => ({
      id: `static:${s.slug}`,
      title: s.title,
      slug: s.slug,
      __isStatic: true,
    }));

    // Фиксированные страницы: показываем только если такой slug ещё нет в API
    const existingSlugs = new Set((Array.isArray(items) ? items : []).map((p) => String(p?.slug || "").replace(/^\/+|\/+$/g, "")));
    const fixedContentRows = FIXED_CONTENT_PAGES.filter((p) => !existingSlugs.has(p.slug)).map((p) => ({
      id: `fixed:${p.slug}`,
      title: p.title,
      slug: p.slug,
      __isFixed: true,
    }));

    const base = (Array.isArray(items) ? items : [])
      .concat(systemRows)
      .concat(staticSectionRows)
      .concat(fixedContentRows);

    const byLocale =
      localeMode === "all"
        ? base
        : base.filter((p) => {
            if (p?.__isSystem || p?.__isStatic || p?.__isFixed) {
              return true;
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
            (p?.__isSystem || p?.__isStatic || p?.__isFixed ? p?.title : p?.title) || p?.name || ""
          ).toLowerCase();
          const slug = String(p.slug || "").toLowerCase();
          return title.includes(qq) || slug.includes(qq);
        });

    // Build hierarchy-aware list
    const slugMap = new Map();
    list.forEach((p) => {
      const slug = String(p.slug || "").replace(/^\/+|\/+$/g, "");
      if (slug) slugMap.set(slug, p);
    });

    const withHierarchy = list.map((p) => {
      const slug = String(p.slug || "").replace(/^\/+|\/+$/g, "");
      const parts = slug.split("/").filter(Boolean);
      const depth = Math.max(0, parts.length - 1);
      const parentSlug = parts.length > 1 ? parts.slice(0, -1).join("/") : "";
      const hasChildren = Array.from(slugMap.keys()).some((s) => s.startsWith(slug + "/"));
      return { 
        ...p, 
        __depth: depth, 
        __parentSlug: parentSlug,
        __hasChildren: hasChildren,
      };
    });

    return withHierarchy
      .sort((a, b) => {
        const as = Boolean(a?.__isSystem);
        const bs = Boolean(b?.__isSystem);
        if (as !== bs) return as ? 1 : -1; // CMS first, system routes last
        // Sort by slug hierarchy (parents before children)
        const aDepth = a.__depth || 0;
        const bDepth = b.__depth || 0;
        if (aDepth !== bDepth) return aDepth - bDepth;
        return String(a.slug || "").localeCompare(String(b.slug || ""));
      });
  }, [items, q, localeMode]);

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

  const cleanupSystemCmsPages = React.useCallback(async () => {
    if (!canWrite) return;
    setBusy(true);
    try {
      const systemSlugs = new Set(["home", "news", "deputies", "documents", "contacts", "about", "government", "section"]);
      const toDelete = (Array.isArray(items) ? items : []).filter((p) =>
        systemSlugs.has(String(p?.slug || "").toLowerCase())
      );
      if (!toDelete.length) {
        onMessage?.("success", "Пустых системных CMS-страниц не найдено");
        return;
      }
      for (const p of toDelete) {
        await AboutApi.deletePage(p.id);
        await new Promise((r) => setTimeout(r, 250));
      }
      onMessage?.("success", `Удалено: ${toDelete.length}`);
      reloadData();
      await load();
    } catch (e) {
      onMessage?.("error", e?.message || "Не удалось удалить");
    } finally {
      setBusy(false);
    }
  }, [canWrite, items, load, onMessage, reloadData]);

  const columns = [
    {
      title: "Название",
      dataIndex: "title",
      render: (_, row) => (
        <div className="admin-pages-list__titlecell">
          <div className="admin-pages-list__titleline">
            {row.__depth ? <span className="admin-pages-list__indent">{"— ".repeat(row.__depth)}</span> : null}
            <span className="admin-pages-list__title">
              {row.__isStatic ? "📁 " : ""}
              {row.title || row.name || "—"}
            </span>
            {row.__hasChildren && (
              <Tag color="green" style={{ marginLeft: 8 }}>
                📁 Есть подстраницы
              </Tag>
            )}
            {row.__isStatic && (
              <Tag color="cyan" style={{ marginLeft: 8 }}>
                Раздел
              </Tag>
            )}
            {row.__isFixed && (
              <Tag color="orange" style={{ marginLeft: 8 }}>
                Контент
              </Tag>
            )}
          </div>
          <div className="admin-pages-list__metarow">
            <Tag className="admin-pages-list__tag">{row.slug || "—"}</Tag>
            {row?.__isFixed ? (
              <Tag className="admin-pages-list__tag" color="orange">
                Нет в API
              </Tag>
            ) : row?.__isSystem ? (
              <Tag className="admin-pages-list__tag" color="gold">
                ROUTE
              </Tag>
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
            {!row?.__isSystem ? (() => {
              const ov = getPageOverrideById(row?.id);
              const mt = typeof ov?.menuTitle === "string" ? ov.menuTitle.trim() : "";
              const st = typeof ov?.submenuTitle === "string" ? ov.submenuTitle.trim() : "";
              if (!mt && !st) return null;
              return (
                <>
                  {mt ? (
                    <Tag className="admin-pages-list__tag" color="purple">
                      MENU: {mt}
                    </Tag>
                  ) : null}
                  {st ? (
                    <Tag className="admin-pages-list__tag" color="magenta">
                      SUB: {st}
                    </Tag>
                  ) : null}
                </>
              );
            })() : null}
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
          {/* Кнопка "Редактировать" - для всех страниц, где есть id */}
          <Button 
            size={isTablet ? "small" : "middle"} 
            onClick={() => onEdit?.(row.id)} 
            disabled={!canWrite || !row.id}
          >
            Редактировать
          </Button>
          
          {row?.__isFixed ? (
            <>
              <Button
                size={isTablet ? "small" : "middle"}
                type="primary"
                onClick={() => onCreateFixedPage?.(row.slug, row.title)}
                disabled={!canWrite}
              >
                Создать страницу
              </Button>
              <Button
                size={isTablet ? "small" : "middle"}
                onClick={() => onPreview?.(row.slug)}
              >
                Открыть на сайте
              </Button>
            </>
          ) : row?.__isSystem ? (
            <>
              <Button
                size={isTablet ? "small" : "middle"}
                onClick={() => window.open(row.__href || row.slug || "/", "_blank")}
              >
                Открыть
              </Button>
              {(Array.isArray(row.__adminLinks) ? row.__adminLinks : []).map((l) => (
                <Button
                  key={l.href}
                  size={isTablet ? "small" : "middle"}
                  onClick={() => (window.location.href = l.href)}
                >
                  {l.label}
                </Button>
              ))}
              {/* Allow creating subpages for system routes */}
              <Button
                size={isTablet ? "small" : "middle"}
                onClick={() => onCreate?.(row.slug, row.title)}
                disabled={!canWrite || !row.slug}
              >
                + Подстраница
              </Button>
            </>
          ) : row?.__isStatic ? (
            <>
              {/* Static sections can have subpages */}
              <Button
                size={isTablet ? "small" : "middle"}
                onClick={() => onCreate?.(row.slug, row.title)}
                disabled={!canWrite || !row.slug}
              >
                + Подстраница
              </Button>
              <Button
                size={isTablet ? "small" : "middle"}
                onClick={() => {
                  // Navigate to list filtered by this section
                  setQ(row.slug);
                }}
              >
                📋 Подстраницы
              </Button>
              <Button size={isTablet ? "small" : "middle"} onClick={() => onPreview?.(row.slug)} disabled={!row.slug}>
                Открыть
              </Button>
            </>
          ) : (
            <>
              <Button size={isTablet ? "small" : "middle"} onClick={() => onPreview?.(row.slug)} disabled={!row.slug}>
                Открыть
              </Button>
              <Button
                size={isTablet ? "small" : "middle"}
                onClick={() => onCreate?.(row.slug, row.title)}
                disabled={!canWrite || !row.slug}
              >
                + Подстраница
              </Button>
              <Popconfirm
                title="Удалить страницу?"
                description="Это действие нельзя отменить."
                okText="Удалить"
                cancelText="Отмена"
                onConfirm={() => deletePage(row.id)}
                disabled={!canWrite || !row.id}
              >
                <Button size={isTablet ? "small" : "middle"} danger disabled={!canWrite || !row.id}>
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
     
        <Popconfirm
          title="Удалить пустые системные CMS-страницы?"
          description="Удалит slug: home, news, deputies, documents, contacts, about, government, section."
          okText="Удалить"
          cancelText="Отмена"
          onConfirm={cleanupSystemCmsPages}
          disabled={!canWrite}
        >
          <Button danger disabled={!canWrite} size={isMobile ? "large" : "middle"}>
            Удалить пустые
          </Button>
        </Popconfirm>
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
                  "",
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
                    {row?.__isFixed ? (
                      <Tag className="admin-pages-list__tag" color="orange">
                        Нет в API
                      </Tag>
                    ) : row?.__isSystem ? (
                      <Tag className="admin-pages-list__tag" color="gold">
                        ROUTE
                      </Tag>
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
                  {/* Кнопка "Редактировать" - для всех страниц, где есть id */}
                  <Button 
                    onClick={() => onEdit?.(row.id)} 
                    disabled={!canWrite || !row.id} 
                    block
                  >
                    Редактировать
                  </Button>
                  
                  {row?.__isFixed ? (
                    <>
                      <Button
                        type="primary"
                        onClick={() => onCreateFixedPage?.(row.slug, row.title)}
                        disabled={!canWrite}
                        block
                      >
                        Создать страницу
                      </Button>
                      <Button onClick={() => onPreview?.(row.slug)} block>
                        Открыть на сайте
                      </Button>
                    </>
                  ) : row?.__isSystem ? (
                    <>
                      <Button onClick={() => window.open(row.__href || row.slug || "/", "_blank")} block>
                        Открыть
                      </Button>
                      {(Array.isArray(row.__adminLinks) ? row.__adminLinks : []).map((l) => (
                        <Button key={l.href} onClick={() => (window.location.href = l.href)} block>
                          {l.label}
                        </Button>
                      ))}
                    </>
                  ) : (
                    <>
                      <Button onClick={() => onPreview?.(row.slug)} disabled={!row.slug} block>
                        Открыть
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
              ? ["admin-pages-list__row--system"]
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



