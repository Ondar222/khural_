import React from "react";
import { Form, Input, Button, Alert } from "antd";
import { useAuth } from "../context/AuthContext.jsx";
import { useHashRoute } from "../Router.jsx";

export default function Login() {
  const { login, isAuthenticated, user } = useAuth();
  const { route, navigate } = useHashRoute();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [loginUser, setLoginUser] = React.useState(null);

  const isAdminUser = React.useCallback((u) => {
    const role = String(u?.role || "").toLowerCase();
    return Boolean(u?.admin) || role === "admin";
  }, []);

  const nextPath = React.useMemo(() => {
    const q = String(route || "").split("?")[1] || "";
    const params = new URLSearchParams(q);
    const next = params.get("next") || "/";
    // Only allow in-app paths
    if (!next.startsWith("/") || next.startsWith("//")) return "/";
    return next;
  }, [route]);

  const targetAfterLogin = React.useMemo(() => {
    const u = loginUser || user;
    const isAdmin = isAdminUser(u);
    // If explicit next is provided, honor it, except non-admins can't be sent to /admin.
    if (nextPath && nextPath !== "/") {
      if (!isAdmin && nextPath.startsWith("/admin")) return "/cabinet";
      return nextPath;
    }
    return isAdmin ? "/admin" : "/cabinet";
  }, [nextPath, user, loginUser, isAdminUser]);

  const hasNavigatedRef = React.useRef(false);

  React.useEffect(() => {
    // Only auto-navigate if user just became authenticated and we haven't navigated yet
    if (isAuthenticated && !hasNavigatedRef.current && targetAfterLogin) {
      hasNavigatedRef.current = true;
      // Use setTimeout to ensure navigation happens after state updates
      setTimeout(() => {
        navigate(targetAfterLogin);
      }, 0);
    } else if (!isAuthenticated) {
      hasNavigatedRef.current = false;
    }
  }, [isAuthenticated, navigate, targetAfterLogin]);

  const onFinish = async (values) => {
    setError("");
    setLoading(true);
    try {
      const res = await login(values);
      if (res?.user) setLoginUser(res.user);
      // Navigation will happen automatically via useEffect when isAuthenticated becomes true
      // But we can also navigate here as a fallback
      if (targetAfterLogin) {
        hasNavigatedRef.current = true;
        navigate(targetAfterLogin);
      }
    } catch (e) {
      let errorMessage = e?.message || "Ошибка входа";
      
      // Более понятные сообщения для пользователя
      if (e?.status === 405) {
        errorMessage = "Ошибка подключения к серверу. Пожалуйста, обратитесь к администратору.";
      } else if (e?.status === 0 || e?.networkError) {
        errorMessage = "Не удалось подключиться к серверу. Проверьте подключение к интернету.";
      } else if (e?.status === 401) {
        errorMessage = "Неверный email или пароль.";
      } else if (errorMessage.includes("VITE_API_BASE_URL") || errorMessage.includes("API base URL")) {
        errorMessage = "Ошибка конфигурации сервера. Пожалуйста, обратитесь к администратору.";
      }
      
      setError(errorMessage);
      hasNavigatedRef.current = false;
      
      // Логируем детали для отладки (только в dev режиме)
      if (import.meta.env.DEV) {
        console.error("Login error:", e);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 520 }}>
        <h1>Вход</h1>
        {error ? <Alert type="error" message={error} style={{ marginBottom: 12 }} /> : null}
        <Form layout="vertical" onFinish={onFinish}>
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
            rules={[{ required: true, message: "Введите пароль" }]}
          >
            <Input.Password placeholder="••••••••" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Войти
            </Button>
            <Button style={{ marginLeft: 12 }} onClick={() => navigate("/register")}>
              Регистрация
            </Button>
          </Form.Item>
        </Form>
      </div>
    </section>
  );
}
