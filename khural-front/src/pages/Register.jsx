import React from "react";
import { Form, Input, Button, Alert, Select } from "antd";
import { useAuth } from "../context/AuthContext.jsx";
import { useHashRoute } from "../Router.jsx";

export default function Register() {
  const { register } = useAuth();
  const { navigate } = useHashRoute();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState(false);

  const onFinish = async (values) => {
    setError("");
    setSuccess(false);
    setLoading(true);
    try {
      await register(values);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 800);
    } catch (e) {
      setError(e?.message || "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 640 }}>
        <h1>Регистрация</h1>
        {error ? (
          <Alert type="error" message={error} style={{ marginBottom: 12 }} />
        ) : null}
        {success ? (
          <Alert
            type="success"
            message="Регистрация выполнена. Сейчас вы будете перенаправлены на страницу входа."
            style={{ marginBottom: 12 }}
          />
        ) : null}
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Фамилия"
            name="surname"
            rules={[{ required: true, message: "Введите фамилию" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Имя"
            name="name"
            rules={[{ required: true, message: "Введите имя" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Телефон" name="phone">
            <Input placeholder="+7..." />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, message: "Введите email" }]}
          >
            <Input type="email" placeholder="you@example.org" />
          </Form.Item>
          <Form.Item
            label="Пароль"
            name="password"
            rules={[{ required: true, message: "Введите пароль" }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item label="Роль" name="role" initialValue="citizen">
            <Select
              options={[
                { value: "citizen", label: "Гражданин" },
                { value: "admin", label: "Администратор" },
              ]}
            />
          </Form.Item>
          <Form.Item>
            <div className="container_submit">
              <Button type="primary" htmlType="submit" loading={loading}>
                Создать аккаунт
              </Button>
              <Button
                style={{ marginLeft: 12 }}
                onClick={() => navigate("/login")}
              >
                Уже есть аккаунт
              </Button>
            </div>
          </Form.Item>
        </Form>
      </div>
    </section>
  );
}
