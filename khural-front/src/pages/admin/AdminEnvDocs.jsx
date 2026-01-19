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
    <div className="admin-grid admin-env-docs">
      <div className="admin-card admin-toolbar admin-env-docs__toolbar">
        <div className="admin-env-docs__title">ENV_VARIABLES.md</div>
        <div className="admin-env-docs__actions">
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

      <div className="admin-card admin-env-docs__content">
        <pre className="admin-env-docs__pre">
          {loading ? "Загрузка…" : text || "Пусто (или нет доступа)."}
        </pre>
      </div>
    </div>
  );
}
