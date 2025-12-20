import React from "react";
import { App, Button } from "antd";
import { apiFetchText } from "../../api/client.js";

export default function AdminEnvDocs() {
  const { message } = App.useApp();
  const [text, setText] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const md = await apiFetchText("/docs/env", { auth: true });
      setText(String(md || ""));
    } catch (e) {
      setText("");
      message.error(e?.message || "Не удалось загрузить документацию ENV");
    } finally {
      setLoading(false);
    }
  }, [message]);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="admin-grid">
      <div className="admin-card admin-toolbar" style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ fontWeight: 900 }}>ENV_VARIABLES.md</div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <Button onClick={load} loading={loading}>
            Обновить
          </Button>
          <Button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(text || "");
                message.success("Скопировано");
              } catch {
                message.error("Не удалось скопировать");
              }
            }}
            disabled={!text}
          >
            Копировать
          </Button>
        </div>
      </div>

      <div className="admin-card" style={{ padding: 14 }}>
        <pre
          style={{
            margin: 0,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          {loading ? "Загрузка…" : text || "Пусто (или нет доступа)."}
        </pre>
      </div>
    </div>
  );
}


