import React from "react";
import { Form, Input, Button, Alert } from "antd";
import { useAuth } from "../context/AuthContext.jsx";
import { useHashRoute } from "../Router.jsx";

export default function Register() {
  const { register, login } = useAuth();
  const { navigate } = useHashRoute();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const onFinish = async (values) => {
    setError("");
    setLoading(true);
    try {
      await register(values);
      // Try to log in immediately after successful registration
      try {
        await login({ email: values.email, password: values.password });
      } catch {
        // ignore; fallback to manual login if backend doesn't allow immediate login
      }
      // If login succeeded, user will have token and can go to cabinet; otherwise go to login
      setTimeout(() => {
        const token =
          sessionStorage.getItem("access_token") ||
          sessionStorage.getItem("token") ||
          sessionStorage.getItem("auth_token") ||
          sessionStorage.getItem("jwt") ||
          "";
        navigate(token ? "/cabinet" : "/login");
      }, 500);
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
        {error ? <Alert type="error" message={error} style={{ marginBottom: 12 }} /> : null}
        <Form layout="vertical" onFinish={onFinish} initialValues={{ role: "citizen" }}>
          <Form.Item
            label="Фамилия"
            name="surname"
            rules={[{ required: true, message: "Введите фамилию" }]}
          >
            <Input placeholder="Иванов" />
          </Form.Item>
          <Form.Item 
            label="Имя" 
            name="name" 
            rules={[{ required: true, message: "Введите имя" }]}
          >
            <Input placeholder="Иван" />
          </Form.Item>
          <Form.Item 
            label="Телефон" 
            name="phone"
            rules={[
              { required: false },
              { pattern: /^[\d\s\+\-\(\)]+$/, message: "Введите корректный номер телефона" }
            ]}
          >
            <Input placeholder="+7 (999) 123-45-67" />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Введите email" },
              { type: "email", message: "Введите корректный email" }
            ]}
          >
            <Input type="email" placeholder="you@example.org" />
          </Form.Item>
          <Form.Item
            label="Пароль"
            name="password"
            rules={[
              { required: true, message: "Введите пароль" },
              { min: 6, message: "Пароль должен быть не менее 6 символов" }
            ]}
          >
            <Input.Password placeholder="••••••••" />
          </Form.Item>
          <Form.Item name="role" hidden>
            <Input />
          </Form.Item>
          <Form.Item>
            <div className="container_submit">
              <Button type="primary" htmlType="submit" loading={loading}>
                Создать аккаунт
              </Button>
              <Button style={{ marginLeft: 12 }} onClick={() => navigate("/login")}>
                Уже есть аккаунт
              </Button>
            </div>
          </Form.Item>
        </Form>
      </div>
    </section>
  );
}
