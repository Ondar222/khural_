import React from "react";
import { Form, Input, Button, Result } from "antd";

export default function Appeals() {
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    phone: "",
    text: "",
  });
  const [ok, setOk] = React.useState(false);
  const onSubmit = () => setOk(true);

  return (
    <section className="section">
      
      <div className="container">
        <h1>Обращения граждан</h1>
        

        {ok ? (
          
          <Result
            status="success"
            title="Спасибо! Ваше обращение отправлено"
            subTitle={`Номер регистрации: A-${Date.now().toString().slice(-6)}`}
          />
        ) : (
          <Form layout="vertical" className="tile" onFinish={onSubmit}>
            <Form.Item
              label="ФИО"
              name="name"
              rules={[{ required: true, message: "Укажите ФИО" }]}
            >
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Form.Item>
            <Form.Item
              label="Email"
              name="email"
              rules={[
                {
                  required: true,
                  type: "email",
                  message: "Укажите корректный Email",
                },
              ]}
            >
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Form.Item>
            <Form.Item label="Телефон" name="phone">
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Form.Item>
            <Form.Item
              label="Текст обращения"
              name="text"
              rules={[{ required: true, message: "Введите текст обращения" }]}
            >
              <Input.TextArea
                rows={6}
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Отправить
              </Button>
            </Form.Item>
          </Form>
        )}
          <a href="/deputies#/feedback">Правила о приеме обращений граждан</a>
      </div>
    </section>
  );
}
