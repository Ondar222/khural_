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
    } catch (e2) {
      throw e; // Возвращаем первую ошибку
    }
  }
}

// Список существующих страниц сайта для импорта
const EXISTING_PAGES = [
  { slug: "code-of-honor", title: "Кодекс чести мужчины Тувы", menuTitle: "Кодекс чести мужчины Тувы" },
  { slug: "mothers-commandments", title: "Свод заповедей матерей Тувы", menuTitle: "Свод заповедей матерей Тувы" },
  { slug: "news-subscription", title: "Подписка на новости", menuTitle: "Подписка на новости" },
  { slug: "for-media", title: "Для СМИ", menuTitle: "Для СМИ" },
  { slug: "photos", title: "Фотографии", menuTitle: "Фотографии" },
  { slug: "videos", title: "Видеозаписи", menuTitle: "Видеозаписи" },
  { slug: "pd-policy", title: "Политика обработки персональных данных", menuTitle: "Политика обработки ПДн" },
  { slug: "license", title: "Лицензия", menuTitle: "Лицензия" },
];

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

  const importExistingPages = React.useCallback(async () => {
    if (!canWrite) return;
    setImporting(true);
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    try {
      // Сначала загружаем текущий список страниц
      await load();
      const existingSlugs = new Set((items || []).map((p) => String(p.slug || "").toLowerCase()));

      // Импортируем страницы последовательно с задержками, чтобы избежать 429
      for (let i = 0; i < EXISTING_PAGES.length; i++) {
        const pageData = EXISTING_PAGES[i];
        const slugLower = pageData.slug.toLowerCase();
        
        // Проверяем, не существует ли уже страница
        if (existingSlugs.has(slugLower)) {
          skipped++;
          continue;
        }

        try {
          await AboutApi.createPage({
            title: pageData.title,
            menuTitle: pageData.menuTitle || pageData.title,
            slug: pageData.slug,
            locale: "ru",
            content: `<p>Страница "${pageData.title}"</p>`,
          });
          imported++;
          existingSlugs.add(slugLower); // Добавляем в список, чтобы не создавать дубликаты
          
          // Задержка между запросами, чтобы избежать 429
          if (i < EXISTING_PAGES.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        } catch (e) {
          console.error(`Failed to import page ${pageData.slug}:`, e);
          errors++;
          // Продолжаем импорт других страниц даже если одна не удалась
        }
      }

      const message = `Импорт завершен: создано ${imported} страниц, пропущено ${skipped} (уже существуют)${errors > 0 ? `, ошибок: ${errors}` : ""}`;
      onMessage?.(errors > 0 ? "warning" : "success", message);
      
      // Перезагружаем список страниц
      await new Promise((resolve) => setTimeout(resolve, 500)); // Задержка перед перезагрузкой
      reloadData();
      await load();
    } catch (e) {
      console.error("Import error:", e);
      onMessage?.("error", e?.message || "Не удалось импортировать страницы");
    } finally {
      setImporting(false);
    }
  }, [canWrite, items, load, onMessage, reloadData]);

  const columns = [
    {
      title: "Название",
      dataIndex: "title",
      render: (_, row) => (
        <div style={{ display: "grid", gap: 4 }}>
          <div style={{ fontWeight: 800 }}>
            {row.__depth ? <span style={{ opacity: 0.6 }}>{"— ".repeat(row.__depth)}</span> : null}
            {row.title || row.name || "—"}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Tag>{row.slug || "—"}</Tag>
            <Tag color="blue">{(row.locale || row.lang || "ru").toUpperCase()}</Tag>
          </div>
        </div>
      ),
    },
    {
      title: "Действия",
      key: "actions",
      width: 520,
      render: (_, row) => (
        <Space wrap>
          <Button onClick={() => onPreview?.(row.slug)} disabled={!row.slug}>
            Открыть
          </Button>
          <Button onClick={() => onCreate?.(row.slug)} disabled={!canWrite || !row.slug}>
            + Подстраница
          </Button>
          <Button onClick={() => onEdit?.(row.id)} disabled={!canWrite}>
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
            <Button danger disabled={!canWrite}>
              Удалить
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="admin-grid">
      <div className="admin-card admin-toolbar">
        <Input
          placeholder="Поиск по названию или slug..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="admin-input"
        />
        <Space wrap>
          <Button
            onClick={() =>
              setLocaleMode((x) => (x === "all" ? "ru" : x === "ru" ? "tyv" : "all"))
            }
          >
            Язык: {localeMode === "all" ? "Все" : localeMode === "tyv" ? "Тыва" : "Русский"}
          </Button>
          <Button onClick={load} loading={busy}>
            Обновить
          </Button>
          <Button
            onClick={importExistingPages}
            loading={importing}
            disabled={!canWrite || importing}
            type="default"
          >
            Импортировать существующие страницы
          </Button>
          <Button type="primary" onClick={() => onCreate?.()} disabled={!canWrite}>
            + Создать страницу
          </Button>
        </Space>
      </div>

      <div className="admin-card admin-table">
        <Table
          rowKey={(r) => String(r.id || r.slug || Math.random())}
          columns={columns}
          dataSource={filtered}
          loading={busy}
          pagination={{ pageSize: 10 }}
        />
      </div>
    </div>
  );
}



