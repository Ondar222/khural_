import React from "react";
import { Button, Input, Space, Table, Popconfirm, Tag, Pagination } from "antd";
import { AboutApi, apiFetch } from "../../api/client.js";
import { useData } from "../../context/DataContext.jsx";
import { FolderIcon, ClipboardIcon } from "../../components/icons/LinearIcons.jsx";
import {
  getPageOverrideForPage,
  PAGES_OVERRIDES_EVENT_NAME,
  PAGES_OVERRIDES_STORAGE_KEY,
} from "../../utils/pagesOverrides.js";
import { STATIC_SECTIONS, SYSTEM_ROUTE_DEFS } from "../../utils/adminPagesCatalog.js";
import { COMMISSION_PAGE_SLUG_PREFIX } from "../../utils/commissionPages.js";
import { getHeaderSectionForSlug } from "../../data/sectionMenus.js";
import { pageStatusOf, pageStatusOption } from "../../utils/pageStatus.js";
import { refreshPagesTree } from "../../utils/cmsPagesTree.js";
import {
  removePageHeaderMenu,
  syncPageHeaderMenu,
} from "../../utils/headerParentMenu.js";

/**
 * Номер страницы и размер страницы списка храним в sessionStorage, чтобы после
 * перехода в редактор и возврата (компонент монтируется заново) пользователь
 * оставался на той же странице пагинации.
 */
const PAGINATION_STORAGE_KEY = "khural_admin_pages_pagination_v1";
const DEFAULT_PAGINATION = { current: 1, pageSize: 10 };

const LOCALE_LABELS = { ru: "РУ", ty: "ТЫВ", tyv: "ТЫВ" };

function formatLocales(locales) {
  if (!locales?.length) return "—";
  return locales.map((locale) => LOCALE_LABELS[locale] || "ДРУГОЙ").join(" + ");
}

/** Раздел шапки, который нужно подставить при создании страницы из списка. */
function getCreateParent(row) {
  const firstSegment = String(row?.slug || "").split("/").filter(Boolean)[0] || "";
  return getHeaderSectionForSlug(firstSegment)?.value || "";
}

/** Название страницы для админского списка: сначала сохранённая подпись меню, затем заголовки локалей. */
function getDisplayName(page) {
  const override = getPageOverrideForPage(page);
  const custom =
    (typeof override?.menuTitle === "string" && override.menuTitle.trim()) ||
    (typeof override?.submenuTitle === "string" && override.submenuTitle.trim());
  if (custom) return custom;
  const content = Array.isArray(page?.content) ? page.content : [];
  const ru = content.find((c) => String(c?.locale || "").toLowerCase() === "ru");
  const ty = content.find((c) => String(c?.locale || "").toLowerCase().startsWith("ty"));
  return String(ru?.title || page?.title || page?.name || ty?.title || "Страница без названия");
}

function getMenuTitles(page) {
  const content = Array.isArray(page?.content) ? page.content : [];
  const ty = content.find((c) => String(c?.locale || "").toLowerCase().startsWith("ty"));
  return {
    titleRu: getDisplayName(page),
    titleTy: String(ty?.title || "").trim(),
  };
}

function readStoredPagination() {
  if (typeof window === "undefined") return DEFAULT_PAGINATION;
  try {
    const parsed = JSON.parse(window.sessionStorage?.getItem(PAGINATION_STORAGE_KEY) || "null");
    const current = Number(parsed?.current);
    const pageSize = Number(parsed?.pageSize);
    return {
      current: Number.isFinite(current) && current > 0 ? Math.floor(current) : 1,
      pageSize: Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : 10,
    };
  } catch {
    return DEFAULT_PAGINATION;
  }
}

function storePagination(next) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage?.setItem(PAGINATION_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // sessionStorage может быть недоступен (приватный режим) — не критично.
  }
}

function normalizeList(res) {
  if (Array.isArray(res)) return res;
  let value = res;
  for (let depth = 0; depth < 4; depth += 1) {
    if (Array.isArray(value)) return value;
    if (!value || typeof value !== "object") break;
    const list = value.items ?? value.results ?? value.pages ?? value.data;
    if (list === undefined) break;
    value = list;
  }
  if (Array.isArray(value)) return value;
  throw new Error("Сервер API вернул список страниц в неизвестном формате");
}

async function listPages({ locale, authenticated }) {
  const pages = authenticated
    ? await AboutApi.listAdminPages()
    : normalizeList(
        await apiFetch("/pages?publishedOnly=true", { method: "GET", auth: false })
      );
  if (!locale) return { pages, responseEmpty: pages.length === 0 };
  const want = String(locale).toLowerCase();
  const filteredPages = pages.filter((page) => {
    const content = page?.content;
    if (Array.isArray(content)) {
      return content.some((entry) => String(entry?.locale || "").toLowerCase() === want);
    }
    return want === "ru";
  });
  return { pages: filteredPages, responseEmpty: pages.length === 0 };
}

export default function AdminPagesV2List({
  canWrite,
  isAuthenticated,
  onReloadData,
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
  const [apiReturnedEmpty, setApiReturnedEmpty] = React.useState(false);
  const [loadStatus, setLoadStatus] = React.useState("loading");
  const [, setOvTick] = React.useState(0);
  const [windowWidth, setWindowWidth] = React.useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  const [pagination, setPagination] = React.useState(readStoredPagination);

  const updatePagination = React.useCallback((next) => {
    setPagination((prev) => {
      const resolved = typeof next === "function" ? next(prev) : next;
      if (!resolved || resolved === prev) return prev;
      const normalized = {
        current: Number(resolved.current) > 0 ? Math.floor(Number(resolved.current)) : 1,
        pageSize: Number(resolved.pageSize) > 0 ? Math.floor(Number(resolved.pageSize)) : 10,
      };
      if (normalized.current === prev.current && normalized.pageSize === prev.pageSize) {
        return prev;
      }
      storePagination(normalized);
      return normalized;
    });
  }, []);

  const handlePaginationChange = React.useCallback(
    (page, pageSize) => {
      // antd/rc-pagination при монтировании с ещё не загруженным списком может
      // «схлопнуть» страницу до 1. Игнорируем такие вызовы, пока данных нет.
      if (loadStatus !== "success") return;
      updatePagination({ current: page, pageSize: pageSize || pagination.pageSize });
    },
    [pagination.pageSize, updatePagination, loadStatus]
  );

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
    setLoadStatus("loading");
    try {
      const { pages, responseEmpty } = await listPages({
        locale: localeMode === "all" ? undefined : localeMode,
        authenticated: isAuthenticated,
      });

      const bySlug = new Map();
      for (const p of pages) {
        const slug = String(p?.slug || "");
        if (!slug) continue;
        // Страницы комиссий (commission-data-*) управляются в разделе «Комиссии»,
        // в общем списке страниц они только засоряют его техническими slug'ами.
        if (slug.startsWith(COMMISSION_PAGE_SLUG_PREFIX)) continue;
        if (!bySlug.has(slug)) bySlug.set(slug, p);
      }
      setItems(Array.from(bySlug.values()));
      setApiReturnedEmpty(responseEmpty);
      setLoadStatus("success");
    } catch (e) {
      console.error("[AdminPagesV2List] Error loading pages:", e);
      setLoadStatus("error");
      onMessage?.("error", e?.message || "Не удалось загрузить страницы. Проверьте подключение к API.");
    } finally {
      setBusy(false);
    }
  }, [isAuthenticated, localeMode, onMessage]);

  React.useEffect(() => {
    // Загружаем страницы при монтировании и при изменении режима языка
    load();
  }, [load]);

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

    const base = (Array.isArray(items) ? items : [])
      .concat(systemRows)
      .concat(staticSectionRows);

    const byLocale =
      localeMode === "all"
        ? base
        : base.filter((p) => {
            if (p?.__isSystem || p?.__isStatic) {
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
          const title = getDisplayName(p).toLowerCase();
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

    // Дерево: родитель сразу за ним идут его подстраницы, а не все страницы
    // одного уровня единым блоком.
    const bySlug = new Map(
      withHierarchy
        .map((p) => [String(p.slug || "").replace(/^\/+|\/+$/g, ""), p])
        .filter(([slug]) => Boolean(slug))
    );
    const childrenByParent = new Map();
    const roots = [];
    for (const row of withHierarchy) {
      const parent = row.__parentSlug && bySlug.has(row.__parentSlug) ? row.__parentSlug : "";
      if (parent) {
        if (!childrenByParent.has(parent)) childrenByParent.set(parent, []);
        childrenByParent.get(parent).push(row);
      } else {
        roots.push(row);
      }
    }
    const ordered = [];
    const visited = new Set();
    const walk = (rows) => {
      for (const row of rows) {
        const slug = String(row.slug || "").replace(/^\/+|\/+$/g, "");
        if (visited.has(slug)) continue;
        visited.add(slug);
        ordered.push(row);
        walk(childrenByParent.get(slug) || []);
      }
    };
    walk(roots);
    walk(withHierarchy); // страницы без родителя, циклы и «осиротевшие» записи
    return ordered;
  }, [items, q, localeMode]);

  // При смене поиска/фильтра языка показываем первую страницу результата.
  const filterKeyRef = React.useRef({ q, localeMode });
  React.useEffect(() => {
    const prev = filterKeyRef.current;
    if (prev.q === q && prev.localeMode === localeMode) return;
    filterKeyRef.current = { q, localeMode };
    updatePagination((current) => (current.current === 1 ? current : { ...current, current: 1 }));
  }, [q, localeMode, updatePagination]);

  // Если после удаления/фильтра страниц стало меньше — не остаёмся на пустой странице.
  // Пока данные грузятся, filtered пуст: не сбрасываем сохранённую страницу раньше времени.
  const maxPage = Math.max(1, Math.ceil(filtered.length / pagination.pageSize));
  React.useEffect(() => {
    if (loadStatus !== "success" || busy) return;
    updatePagination((current) =>
      current.current > maxPage ? { ...current, current: maxPage } : current
    );
  }, [maxPage, loadStatus, busy, updatePagination]);

  // Срез для мобильной карточной верстки (Table пагинирует себя сам)
  const { current: pageNumber, pageSize } = pagination;
  const pagedFiltered = React.useMemo(() => {
    const start = (pageNumber - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, pageNumber, pageSize]);

  const deletePage = React.useCallback(
    async (target) => {
      if (!canWrite) return;
      const page =
        target && typeof target === "object"
          ? target
          : (Array.isArray(items) ? items : []).find((p) => String(p?.id) === String(target));
      const id = page?.id ?? target;
      setBusy(true);
      try {
        await AboutApi.deletePage(id);
        await removePageHeaderMenu({ page: page || { id }, slug: page?.slug });
        await refreshPagesTree();
        onMessage?.("success", "Страница удалена");
        reloadData();
        await load();
        await onReloadData?.();
      } catch (e) {
        onMessage?.("error", e?.message || "Не удалось удалить страницу");
      } finally {
        setBusy(false);
      }
    },
    [canWrite, items, load, onMessage, onReloadData, reloadData]
  );

  const setPageStatus = React.useCallback(
    async (row, status) => {
      if (!canWrite || !row?.id) return;
      setBusy(true);
      try {
        const saved = await AboutApi.updatePage(row.id, {
          status,
          isPublished: status === "published",
        });
        const updated = { ...row, ...(saved || {}), status, isPublished: status === "published" };
        const { titleRu, titleTy } = getMenuTitles(updated);
        await syncPageHeaderMenu({
          page: updated,
          slug: updated.slug,
          sectionValue: getHeaderSectionForSlug(updated.slug)?.value || "",
          titleRu,
          titleTy,
          isPublished: status === "published",
        });
        await refreshPagesTree();
        const label = pageStatusOption(status)?.label || status;
        onMessage?.("success", `Статус изменён: ${label}`);
        reloadData();
        await load();
        await onReloadData?.();
      } catch (e) {
        onMessage?.("error", e?.message || "Не удалось изменить статус страницы");
      } finally {
        setBusy(false);
      }
    },
    [canWrite, load, onMessage, onReloadData, reloadData]
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
        await removePageHeaderMenu({ page: p, slug: p.slug });
        await new Promise((r) => setTimeout(r, 250));
      }
      await refreshPagesTree();
      onMessage?.("success", `Удалено: ${toDelete.length}`);
      reloadData();
      await load();
      await onReloadData?.();
    } catch (e) {
      onMessage?.("error", e?.message || "Не удалось удалить");
    } finally {
      setBusy(false);
    }
  }, [canWrite, items, load, onMessage, onReloadData, reloadData]);

  const columns = [
    {
      title: "Название",
      dataIndex: "title",
      render: (_, row) => (
        <div className="admin-pages-list__titlecell">
          <div className="admin-pages-list__titleline">
            {row.__depth ? (
              <span className="admin-pages-list__indent" style={{ display: "inline-block", width: row.__depth * 18 }}>
                ↳
              </span>
            ) : null}
            <span className="admin-pages-list__title">
              {row.__isStatic || row.__hasChildren ? <FolderIcon size={14} style={{ marginRight: 4 }} /> : ""}
              {getDisplayName(row)}
            </span>
            {row.__hasChildren && (
              <Tag color="green" style={{ marginLeft: 8 }}>
                <FolderIcon size={13} style={{ marginRight: 4 }} /> Есть подстраницы
              </Tag>
            )}
            {row.__isStatic && (
              <Tag color="cyan" style={{ marginLeft: 8 }}>
                Раздел
              </Tag>
            )}
            {row.slug ? (
              <Tag style={{ marginLeft: 8 }}>/ {row.slug}</Tag>
            ) : null}
          </div>
          <div className="admin-pages-list__metarow">
            {row?.__isSystem ? (
              <Tag className="admin-pages-list__tag" color="gold">
                МАРШРУТ
              </Tag>
            ) : (
              <Tag className="admin-pages-list__tag" color="blue">
                {(() => {
                  const c = row?.content;
                  const locales = Array.isArray(c)
                    ? Array.from(new Set(c.map((x) => String(x?.locale || "").toLowerCase()).filter(Boolean)))
                    : ["ru"];
                  return formatLocales(locales);
                })()}
              </Tag>
            )}
            {!row?.__isSystem ? (() => {
              const statusOption = pageStatusOption(pageStatusOf(row));
              return (
                <Tag className="admin-pages-list__tag" color={statusOption.color}>
                  {statusOption.label}
                </Tag>
              );
            })() : null}
            {!row?.__isSystem ? (() => {
              const ov = getPageOverrideForPage(row);
              const mt = typeof ov?.menuTitle === "string" ? ov.menuTitle.trim() : "";
              const st = typeof ov?.submenuTitle === "string" ? ov.submenuTitle.trim() : "";
              if (!mt && !st) return null;
              return (
                <>
                  {mt ? (
                    <Tag className="admin-pages-list__tag" color="purple">
                      МЕНЮ: {mt}
                    </Tag>
                  ) : null}
                  {st ? (
                    <Tag className="admin-pages-list__tag" color="magenta">
                      ПОДМЕНЮ: {st}
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
          {!row?.__isSystem && !row?.__isStatic ? (
            <Button
              size={isTablet ? "small" : "middle"}
              onClick={() => onEdit?.(row.id)}
              disabled={!canWrite || !row.id}
            >
              Редактировать
            </Button>
          ) : null}
          
          {row?.__isSystem ? (
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
                onClick={() => onCreate?.(getCreateParent(row), getDisplayName(row))}
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
                onClick={() => onCreate?.(getCreateParent(row), getDisplayName(row))}
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
                <ClipboardIcon size={14} style={{ marginRight: 4 }} /> Подстраницы
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
              {pageStatusOf(row) === "published" ? (
                <Popconfirm
                  title="Снять страницу с публикации?"
                  okText="Снять"
                  cancelText="Отмена"
                  onConfirm={() => setPageStatus(row, "unpublished")}
                  disabled={!canWrite || !row?.id}
                >
                  <Button size={isTablet ? "small" : "middle"} disabled={!canWrite || !row?.id}>
                    Снять с публикации
                  </Button>
                </Popconfirm>
              ) : (
                <Button
                  size={isTablet ? "small" : "middle"}
                  onClick={() => setPageStatus(row, "published")}
                  disabled={!canWrite || !row?.id}
                >
                  Опубликовать
                </Button>
              )}
              <Button
                size={isTablet ? "small" : "middle"}
                onClick={() => onCreate?.(getCreateParent(row), getDisplayName(row))}
                disabled={!canWrite || !row.slug}
              >
                + Подстраница
              </Button>
              <Popconfirm
                title="Удалить страницу?"
                description="Это действие нельзя отменить."
                okText="Удалить"
                cancelText="Отмена"
                onConfirm={() => deletePage(row)}
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
          placeholder="Поиск по названию или адресу страницы..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="admin-input"
          size={isMobile ? "large" : "middle"}
        />
      </div>
      <div className="admin-pages-list__toolbar-right">
     
        <Popconfirm
          title="Удалить пустые системные CMS-страницы?"
          description="Удалит пустые системные страницы (главная, новости, депутаты, документы, контакты, общие сведения, структура)."
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
          <React.Fragment>
            <div className="admin-cards admin-pages-list__cards">
              {pagedFiltered.map((row) => (
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
                    {row.__depth ? <span style={{ color: "#888", marginRight: 6 }}>↳</span> : null}
                    {getDisplayName(row)}
                  </div>
                  <div className="admin-pages-list__metarow">
                    {row?.__isSystem ? (
                      <Tag className="admin-pages-list__tag" color="gold">
                        МАРШРУТ
                      </Tag>
                    ) : (
                      <Tag className="admin-pages-list__tag" color="blue">
                        {(() => {
                          const c = row?.content;
                          const locales = Array.isArray(c)
                            ? Array.from(new Set(c.map((x) => String(x?.locale || "").toLowerCase()).filter(Boolean)))
                            : ["ru"];
                          return formatLocales(locales);
                        })()}
                      </Tag>
                    )}
                    {!row?.__isSystem && !row?.__isStatic ? (() => {
                      const statusOption = pageStatusOption(pageStatusOf(row));
                      return (
                        <Tag className="admin-pages-list__tag" color={statusOption.color}>
                          {statusOption.label}
                        </Tag>
                      );
                    })() : null}
                    {row?.__isStatic ? (
                      <Tag className="admin-pages-list__tag" color="cyan">Раздел</Tag>
                    ) : null}
                  </div>
                </div>

                <div className="admin-pages-list__card-actions">
                  {!row?.__isSystem && !row?.__isStatic ? (
                    <Button
                      onClick={() => onEdit?.(row.id)}
                      disabled={!canWrite || !row.id}
                      block
                    >
                      Редактировать
                    </Button>
                  ) : null}
                  
                  {row?.__isSystem ? (
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
                  ) : row?.__isStatic ? (
                    <>
                      <Button onClick={() => onPreview?.(row.slug)} disabled={!row.slug} block>
                        Открыть
                      </Button>
                      <Button onClick={() => setQ(row.slug)} block>
                        Подстраницы
                      </Button>
                      <Button
                        onClick={() => onCreate?.(getCreateParent(row), getDisplayName(row))}
                        disabled={!canWrite || !row.slug}
                        block
                      >
                        + Подстраница
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={() => onPreview?.(row.slug)} disabled={!row.slug} block>
                        Открыть
                      </Button>
                      {pageStatusOf(row) === "published" ? (
                        <Popconfirm
                          title="Снять страницу с публикации?"
                          okText="Снять"
                          cancelText="Отмена"
                          onConfirm={() => setPageStatus(row, "unpublished")}
                          disabled={!canWrite || !row?.id}
                        >
                          <Button disabled={!canWrite || !row?.id} block>
                            Снять с публикации
                          </Button>
                        </Popconfirm>
                      ) : (
                        <Button
                          type="primary"
                          onClick={() => setPageStatus(row, "published")}
                          disabled={!canWrite || !row?.id}
                          block
                        >
                          Опубликовать
                        </Button>
                      )}
                      <Button
                        onClick={() => onCreate?.(getCreateParent(row), getDisplayName(row))}
                        disabled={!canWrite || !row.slug}
                        block
                      >
                        + Подстраница
                      </Button>
                      <Popconfirm
                        title="Удалить страницу?"
                        description="Это действие нельзя отменить."
                        okText="Удалить"
                        cancelText="Отмена"
                        onConfirm={() => deletePage(row)}
                        disabled={!canWrite || !row?.id}
                      >
                        <Button danger disabled={!canWrite || !row?.id} block>
                          Удалить
                        </Button>
                      </Popconfirm>
                    </>
                  )}
                 </div>
               </div>
             ))}
            </div>

            {filtered.length > pagination.pageSize ? (
              <div className="admin-card admin-pages-list__pagination">
                <Pagination
                  current={pagination.current}
                  pageSize={pagination.pageSize}
                  total={filtered.length}
                  onChange={(page, pageSize) => {
                    handlePaginationChange(page, pageSize);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  showSizeChanger={false}
                  showTotal={(total) => `Всего: ${total}`}
                />
              </div>
            ) : null}
          </React.Fragment>
        )}
      </div>
    );
  }

  return (
    <div className="admin-grid admin-pages-list">
      {renderToolbar()}

      <div className="admin-card admin-table">
        {loadStatus === "loading" ? (
          <div role="status" style={{ padding: 12, color: "#6b7280" }}>
            Загружаем CMS-страницы…
          </div>
        ) : null}
        {loadStatus === "error" ? (
          <div role="alert" style={{ padding: 12, color: "#b42318" }}>
            Не удалось проверить CMS-страницы. Пустое состояние не отображается.
            <Button type="link" loading={busy} onClick={load}>
              Повторить
            </Button>
          </div>
        ) : null}
        {loadStatus === "success" && apiReturnedEmpty ? (
          <div role="status" style={{ padding: 12, color: "#6b7280" }}>
            CMS-страниц пока нет. Системные разделы ниже не учитываются в этом количестве.
          </div>
        ) : null}
        <Table
          rowKey={(r) => String(r.id || r.slug || r.__href || "row")}
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
            current: pagination.current,
            pageSize: pagination.pageSize,
            showSizeChanger: !isTablet,
            showQuickJumper: !isTablet,
            size: isTablet ? "small" : "default",
            onChange: handlePaginationChange,
          }}
          scroll={isTablet ? { x: "max-content" } : undefined}
        />
      </div>
    </div>
  );
}
