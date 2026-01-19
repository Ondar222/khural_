import React from "react";
import { Button, Input, Space, Table, Popconfirm, Tag } from "antd";
import { AboutApi, apiFetch } from "../../api/client.js";
import { useData } from "../../context/DataContext.jsx";

function normalizeList(res) {
  if (Array.isArray(res)) return res;
  if (res && typeof res === "object" && Array.isArray(res.items)) return res.items;
  return [];
}

async function listPagesWithFallback({ locale, authPreferred } = {}) {
  // Используем auth: true для админки, чтобы получить все страницы
  const qs = new URLSearchParams();
  if (locale) qs.set("locale", locale);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  
  try {
    // Пробуем с авторизацией сначала
    const res = await apiFetch(`/pages${suffix}`, { method: "GET", auth: true });
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
      const locales = localeMode === "all" ? ["ru", "tyv"] : [localeMode];
      // Загружаем последовательно, чтобы избежать 429 ошибок
      const results = [];
      for (const loc of locales) {
        try {
          const res = await listPagesWithFallback({ locale: loc, authPreferred: true });
          results.push(Array.isArray(res) ? res : []);
          // Небольшая задержка между запросами
          if (locales.length > 1) {
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
        } catch (e) {
          console.warn(`Failed to load pages for locale ${loc}:`, e);
          results.push([]);
        }
      }
      const merged = results.flat();
      setItems(Array.isArray(merged) ? merged : []);
    } catch (e) {
      onMessage?.("error", e?.message || "Не удалось загрузить страницы");
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
    const base = Array.isArray(items) ? items : [];
    const list = !qq
      ? base
      : base.filter((p) => {
      const title = String(p.title || p.name || "").toLowerCase();
      const slug = String(p.slug || "").toLowerCase();
      return title.includes(qq) || slug.includes(qq);
    });
    return list
      .map((p) => {
        const slug = String(p.slug || "");
        const parts = slug.split("/").filter(Boolean);
        const depth = Math.max(0, parts.length - 1);
        const parentSlug = parts.slice(0, -1).join("/");
        return { ...p, __depth: depth, __parentSlug: parentSlug };
      })
      .sort((a, b) => String(a.slug || "").localeCompare(String(b.slug || "")));
  }, [items, q]);

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
            <Tag className="admin-pages-list__tag" color="blue">
              {(row.locale || row.lang || "ru").toUpperCase()}
            </Tag>
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
              <div key={String(row.id || row.slug)} className="admin-card admin-pages-list__card">
                <div className="admin-pages-list__card-head">
                  <div className="admin-pages-list__card-title">
                    {row.title || row.name || "—"}
                  </div>
                  <div className="admin-pages-list__metarow">
                    <Tag className="admin-pages-list__tag">{row.slug || "—"}</Tag>
                    <Tag className="admin-pages-list__tag" color="blue">
                      {(row.locale || row.lang || "ru").toUpperCase()}
                    </Tag>
                  </div>
                </div>

                <div className="admin-pages-list__card-actions">
                  <Button
                    onClick={() => onPreview?.(row.slug)}
                    disabled={!row.slug}
                    block
                  >
                    Открыть
                  </Button>
                  <Button
                    onClick={() => onEdit?.(row.id)}
                    disabled={!canWrite}
                    block
                  >
                    Редактировать
                  </Button>
                  <Button
                    onClick={() => onCreate?.(row.slug)}
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
                    onConfirm={() => deletePage(row.id)}
                    disabled={!canWrite}
                  >
                    <Button danger disabled={!canWrite} block>
                      Удалить
                    </Button>
                  </Popconfirm>
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



