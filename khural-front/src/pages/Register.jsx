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
    // Предотвращаем повторную отправку, если уже идет загрузка
    if (loading) return;
    
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
    <section className="auth-page">
      <div className="auth-glass-card">
        <div className="auth-glass-card__header">
          <div className="auth-glass-card__logo">
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c3/Coat_of_arms_of_Tuva.svg" alt="Герб" />
          </div>
          <h1 className="auth-glass-card__title">Регистрация</h1>
          <p className="auth-glass-card__subtitle">Создайте аккаунт</p>
        </div>
        
        {error ? <Alert type="error" message={error} showIcon={false} /> : null}
        
        <Form 
          layout="vertical" 
          onFinish={onFinish} 
          initialValues={{ role: "citizen" }}
          className="auth-glass-form"
        >
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
              { required: true, message: "Введите номер телефона" },
              {
                pattern: /^[\d\s\+\-\(\)]+$/,
                message: "Номер телефона может содержать только цифры, пробелы и символы + - ( )"
              },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  // Проверяем, что есть хотя бы 10 цифр (минимум для российского номера)
                  const digits = value.replace(/\D/g, '');
                  if (digits.length < 10) {
                    return Promise.reject(new Error('Номер телефона должен содержать минимум 10 цифр'));
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <Input placeholder="+7 (999) 123-45-67" />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Введите email" },
              {
                type: "email",
                message: "Введите корректный email (например: user@example.com)"
              },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  // Дополнительная проверка на полный домен
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (!emailRegex.test(value)) {
                    return Promise.reject(new Error('Email должен содержать полное доменное имя (например: user@mail.ru)'));
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <Input type="email" placeholder="you@example.org" />
          </Form.Item>
          <Form.Item
            label="Пароль"
            name="password"
            rules={[
              { required: true, message: "Введите пароль" },
              { min: 8, message: "Пароль должен быть не менее 8 символов" },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();

                  const errors = [];

                  // Проверка на наличие заглавной буквы
                  if (!/[A-ZА-ЯЁ]/.test(value)) {
                    errors.push('минимум 1 заглавную букву');
                  }

                  // Проверка на наличие строчной буквы
                  if (!/[a-zа-яё]/.test(value)) {
                    errors.push('минимум 1 строчную букву');
                  }

                  // Проверка на наличие цифры
                  if (!/\d/.test(value)) {
                    errors.push('минимум 1 цифру');
                  }

                  // Проверка на наличие спецсимвола
                  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
                    errors.push('минимум 1 спецсимвол (!@#$%^&* и т.д.)');
                  }

                  if (errors.length > 0) {
                    return Promise.reject(
                      new Error(`Пароль должен содержать: ${errors.join(', ')}`)
                    );
                  }

                  return Promise.resolve();
                }
              }
            ]}
            help="Минимум 8 символов: заглавная буква, строчная буква, цифра и спецсимвол"
          >
            <Input.Password placeholder="••••••••" />
          </Form.Item>
          <Form.Item name="role" hidden>
            <Input type="hidden" value="citizen" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Создать аккаунт
            </Button>
          </Form.Item>
        </Form>

        <div className="auth-glass-card__footer">
          <p className="auth-glass-card__footer-text">
            Уже есть аккаунт?{" "}
            <a href="#/login" className="auth-glass-card__link" onClick={(e) => { e.preventDefault(); navigate("/login"); }}>
              Войти
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
