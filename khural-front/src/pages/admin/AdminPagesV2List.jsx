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
  // Public list endpoint (auth: false) is preferred for prod compatibility.
  // Some backends might restrict it => retry with auth: true.
  try {
    if (!authPreferred) {
      const res = await AboutApi.listPages({ locale });
      return normalizeList(res);
    }
  } catch {
    // fallthrough
  }
  const qs = new URLSearchParams();
  if (locale) qs.set("locale", locale);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const res = await apiFetch(`/pages${suffix}`, { method: "GET", auth: true });
  return normalizeList(res);
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

  const load = React.useCallback(async () => {
    setBusy(true);
    try {
      const locales = localeMode === "all" ? ["ru", "tyv"] : [localeMode];
      const results = await Promise.all(
        locales.map((loc) => listPagesWithFallback({ locale: loc }).catch(() => []))
      );
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
    load();
  }, [load]);

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



