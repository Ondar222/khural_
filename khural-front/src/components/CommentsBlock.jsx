import React from "react";
import { App, Button, Input, Space } from "antd";
import { CommentsApi } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

function pickAuthorName(c) {
  const u = c?.user;
  if (!u) return "Пользователь";
  if (typeof u === "string") return "Пользователь";
  return u?.name || [u?.surname, u?.name].filter(Boolean).join(" ") || u?.email || "Пользователь";
}

export default function CommentsBlock({ entityType, entityId }) {
  const { message } = App.useApp();
  const { isAuthenticated } = useAuth();
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [text, setText] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await CommentsApi.list({
        entityType,
        entityId,
        onlyApproved: true,
        includeReplies: true,
      });
      setItems(Array.isArray(res) ? res : []);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  React.useEffect(() => {
    if (!entityType || !entityId) return;
    load();
  }, [load, entityType, entityId]);

  const submit = async () => {
    const content = text.trim();
    if (!content) return;
    if (!isAuthenticated) {
      message.info("Чтобы оставить комментарий, нужно войти");
      return;
    }
    try {
      await CommentsApi.create({ content, entityType, entityId });
      setText("");
      message.success("Комментарий отправлен");
      await load();
    } catch (e) {
      message.error(e?.message || "Не удалось отправить комментарий");
    }
  };

  return (
    <div className="tile" style={{ marginTop: 14 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <div style={{ fontWeight: 900 }}>Комментарии</div>
        <Button onClick={load} loading={loading}>
          Обновить
        </Button>
      </div>

      <div style={{ marginTop: 12 }}>
        <Space.Compact style={{ width: "100%" }}>
          <Input
            placeholder={isAuthenticated ? "Напишите комментарий…" : "Войдите, чтобы комментировать"}
            value={text}
            disabled={!isAuthenticated}
            onChange={(e) => setText(e.target.value)}
            onPressEnter={submit}
          />
          <Button type="primary" onClick={submit} disabled={!isAuthenticated}>
            Отправить
          </Button>
        </Space.Compact>
      </div>

      <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
        {!loading && (!items || items.length === 0) ? (
          <div style={{ opacity: 0.75 }}>Пока нет комментариев</div>
        ) : null}

        {(items || []).map((c) => (
          <div key={c.id} style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div style={{ fontWeight: 800 }}>{pickAuthorName(c)}</div>
              <div style={{ opacity: 0.65, fontSize: 12 }}>
                {c?.createdAt ? new Date(c.createdAt).toLocaleString("ru-RU") : ""}
              </div>
            </div>
            <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{c.content}</div>
            {Array.isArray(c.replies) && c.replies.length ? (
              <div style={{ marginTop: 10, paddingLeft: 14, display: "grid", gap: 10 }}>
                {c.replies.map((r) => (
                  <div key={r.id} style={{ borderLeft: "3px solid rgba(0,0,0,0.08)", paddingLeft: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ fontWeight: 800 }}>{pickAuthorName(r)}</div>
                      <div style={{ opacity: 0.65, fontSize: 12 }}>
                        {r?.createdAt ? new Date(r.createdAt).toLocaleString("ru-RU") : ""}
                      </div>
                    </div>
                    <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{r.content}</div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}


