import React from "react";
import { Form, Input, Button, Result, Alert } from "antd";
import { useAuth } from "../context/AuthContext.jsx";
import { AppealsApi } from "../api/client.js";

export default function Appeals() {
  const { isAuthenticated } = useAuth();
  const [form, setForm] = React.useState({ subject: "", message: "" });
  const [ok, setOk] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const onSubmit = async () => {
    if (!isAuthenticated) return;
    setBusy(true);
    try {
      await AppealsApi.create({ subject: form.subject, message: form.message });
      setOk(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="section">
      <div className="container">
        <h1 className="h1-compact">Обращения граждан</h1>

        {!isAuthenticated ? (
          <Alert
            type="info"
            showIcon
            message="Для отправки обращения требуется авторизация"
            description={
              <span>
                Перейдите на страницу <a href="/login">входа</a> или{" "}
                <a href="/register">регистрации</a>, затем вернитесь сюда.
              </span>
            }
            style={{ marginBottom: 16 }}
          />
        ) : null}

        {ok ? (
          <Result
            status="success"
            title="Спасибо! Ваше обращение отправлено"
            subTitle={`Номер регистрации: A-${Date.now().toString().slice(-6)}`}
          />
        ) : (
          <Form layout="vertical" className="tile" onFinish={onSubmit}>
            <Form.Item
              label="Тема"
              name="subject"
              rules={[{ required: true, message: "Укажите тему" }]}
            >
              <Input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </Form.Item>
            <Form.Item
              label="Текст обращения"
              name="message"
              rules={[{ required: true, message: "Введите текст обращения" }]}
            >
              <Input.TextArea
                rows={6}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" disabled={!isAuthenticated} loading={busy}>
                Отправить
              </Button>
            </Form.Item>
          </Form>
        )}
        <a href="/feedback">Правила о приеме обращений граждан</a>
      </div>
    </section>
  );
}
