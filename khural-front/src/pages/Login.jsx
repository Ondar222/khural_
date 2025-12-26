import React from "react";
import { Form, Input, Button, Alert } from "antd";
import { useAuth } from "../context/AuthContext.jsx";
import { useHashRoute } from "../Router.jsx";

export default function Login() {
  const { login, isAuthenticated, user } = useAuth();
  const { route, navigate } = useHashRoute();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const nextPath = React.useMemo(() => {
    const q = String(route || "").split("?")[1] || "";
    const params = new URLSearchParams(q);
    const next = params.get("next") || "/";
    // Only allow in-app paths
    if (!next.startsWith("/") || next.startsWith("//")) return "/";
    return next;
  }, [route]);

  const targetAfterLogin = React.useMemo(() => {
    // If explicit next is provided, honor it. Otherwise, admins go to /admin, others to home.
    if (nextPath && nextPath !== "/") return nextPath;
    if ((user?.role || "").toString().toLowerCase() === "admin") return "/admin";
    return "/";
  }, [nextPath, user]);

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
      await login(values);
      // Navigation will happen automatically via useEffect when isAuthenticated becomes true
      // But we can also navigate here as a fallback
      if (targetAfterLogin) {
        hasNavigatedRef.current = true;
        navigate(targetAfterLogin);
      }
    } catch (e) {
      setError(e?.message || "Ошибка входа");
      hasNavigatedRef.current = false;
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
            rules={[{ required: true, message: "Введите email" }]}
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
