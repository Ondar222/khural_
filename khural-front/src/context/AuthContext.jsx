import React from "react";
import { message } from "antd";
import {
  AuthApi,
  setAuthToken,
  getAuthToken,
  setRefreshToken,
  getRefreshToken,
} from "../api/client.js";

const AuthContext = React.createContext({
  user: null,
  token: "",
  refreshToken: "",
  isAuthenticated: false,
  register: async () => {},
  login: async () => {},
  logout: () => {},
});

export function useAuth() {
  return React.useContext(AuthContext);
}

function toRoleString(role) {
  if (!role) return "";
  if (typeof role === "string" || typeof role === "number") return String(role);
  if (typeof role === "object") {
    return String(role?.name || role?.id || role?.role || "");
  }
  return String(role);
}

function normalizeUser(u) {
  if (!u || typeof u !== "object") return null;
  // Поддержка полей из Swagger API: surname, name, phone, email, password, role
  const firstName = u.name || u.firstName || u.firstname || "";
  const lastName = u.surname || u.lastName || u.lastname || "";
  const roleStr =
    toRoleString(u?.role) ||
    toRoleString(u?.role_id) ||
    toRoleString(u?.roleId) ||
    "user";
  const adminAccess =
    Boolean(u?.admin) ||
    Boolean(u?.isAdmin) ||
    Boolean(u?.admin_access) ||
    Boolean(u?.role?.admin_access) ||
    String(roleStr).toLowerCase() === "admin";
  
  // Формируем полное имя из surname и name, если они есть
  const fullName = [lastName, firstName].filter(Boolean).join(" ") || 
                   u?.name || 
                   [firstName, lastName].filter(Boolean).join(" ") || 
                   u?.email || "";
  
  return {
    ...u,
    surname: u.surname || u.lastName || u.lastname || "",
    name: fullName, // Полное имя для отображения (surname + name)
    firstName: firstName, // Имя отдельно
    phone: u.phone || "",
    email: u.email || "",
    role: roleStr,
    admin: adminAccess,
  };
}

function isInAdminArea() {
  try {
    if (typeof window === "undefined") return false;
    const hash = String(window.location?.hash || "");
    // hash-router: #/admin...
    return hash.includes("/admin");
  } catch {
    return false;
  }
}

function friendlyAuthError(e, fallback) {
  let errorMessage = e?.message || fallback;
  if (e?.status === 405) {
    errorMessage = "Ошибка подключения к серверу. Пожалуйста, обратитесь к администратору.";
  } else if (e?.status === 0 || e?.networkError) {
    errorMessage = "Не удалось подключиться к серверу. Проверьте подключение к интернету.";
  } else if (e?.status === 401) {
    errorMessage = "Неверный email или пароль.";
  } else if (e?.status === 409) {
    errorMessage = "Пользователь с таким email уже существует.";
  } else if (
    typeof errorMessage === "string" &&
    (errorMessage.includes("VITE_API_BASE_URL") || errorMessage.includes("API base URL"))
  ) {
    errorMessage = "Ошибка конфигурации сервера. Пожалуйста, обратитесь к администратору.";
  }
  return errorMessage || fallback;
}

export default function AuthProvider({ children }) {
  const [token, setToken] = React.useState(() => getAuthToken());
  const [refreshToken, setRefresh] = React.useState(() => getRefreshToken());
  const [user, setUser] = React.useState(null);
  const isAuthenticated = Boolean(token);

  const applySessionFromResponse = React.useCallback((payload) => {
    const p = payload?.data ? payload.data : payload;
    const newToken = p?.access_token || p?.accessToken || p?.token || p?.jwt || "";
    const newRefresh = p?.refresh_token || p?.refreshToken || "";
    const maybeUser = p?.user || p?.profile || null;
  
    if (!newToken) return false; // <-- ВАЖНО: без токена НЕ логиним
  
    setToken(newToken);
    setAuthToken(newToken);
    setRefresh(newRefresh);
    setRefreshToken(newRefresh);
    if (maybeUser) setUser(normalizeUser(maybeUser));
    return true;
  }, []);

  const setFakeDevSession = React.useCallback(
    (profile = {}) => {
      // Dev-only offline admin fallback to unblock UI when backend is unavailable.
      if (!import.meta.env.DEV) return false;
      const fakeToken = "dev-fake-token";
      setToken(fakeToken);
      setAuthToken(fakeToken);
      setRefresh("");
      setRefreshToken("");
      setUser(
        normalizeUser({
          id: "dev",
          email: profile.email || "dev@example.org",
          firstName: profile.firstName || "Dev",
          lastName: profile.lastName || "Admin",
          role: "admin",
        })
      );
      return true;
    },
    []
  );

  const saveAuth = React.useCallback((payload) => {
    const p = payload?.data ? payload.data : payload;
    const newToken = p?.access_token || p?.accessToken || p?.token || p?.accessToken || "";
    const newRefresh = p?.refresh_token || p?.refreshToken || "";
    setToken(newToken);
    setAuthToken(newToken);
    setRefresh(newRefresh);
    setRefreshToken(newRefresh);
  }, []);

  // Listen for token expiration events from apiFetch
  React.useEffect(() => {
    const handleTokenExpired = () => {
      setToken("");
      setAuthToken("");
      setRefresh("");
      setRefreshToken("");
      setUser(null);
    };
    
    if (typeof window !== "undefined") {
      window.addEventListener("auth:token-expired", handleTokenExpired);
      return () => {
        window.removeEventListener("auth:token-expired", handleTokenExpired);
      };
    }
  }, []);

  // Load current user profile when we have an access token
  React.useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    // For locally generated dummy tokens, skip calling backend.
    if (token === "dev-fake-token" || String(token).startsWith("session-")) {
      return;
    }
    (async () => {
      try {
        const me = await AuthApi.me();
        setUser(normalizeUser(me));
      } catch (e) {
        // Only hard-reset on auth errors; keep session for transient network errors.
        if (e?.status === 401 || e?.status === 403) {
          setToken("");
          setAuthToken("");
          setRefresh("");
          setRefreshToken("");
          setUser(null);
        }
      }
    })();
  }, [token]);

  const register = React.useCallback(async (form) => {
    try {
      const res = await AuthApi.register(form);
      // Some backends return tokens on registration; preserve session if so.
      if (res) {
        applySessionFromResponse(res);
        if (res?.user) setUser(normalizeUser(res.user));
        // If backend didn't return user, try to load it with the new token.
        if (!res?.user) {
          try {
            const me = await AuthApi.me();
            setUser(normalizeUser(me));
          } catch {
            // ignore
          }
        }
      }
      message.success("Регистрация выполнена");
      return res;
    } catch (e) {
      const errorMessage = friendlyAuthError(e, "Ошибка регистрации");
      message.error(errorMessage);
      if (e && typeof e === "object") e.message = errorMessage;
      throw e;
    }
  }, [applySessionFromResponse]);

  const login = React.useCallback(
    async ({ email, password }) => {
      let res;
      try {
        res = await AuthApi.loginWithPassword({ email, password });
      } catch (e) {
        // Dev-only fallback: allow working locally without backend when specific creds are used
        if (
          import.meta.env.DEV &&
          String(email).toLowerCase() === "arslanondar2003@gmail.com" &&
          String(password) === "Tc7yf6rt!"
        ) {
          setFakeDevSession({
            email,
            firstName: "Арслан",
            lastName: "Одар",
          });
          return { token: "dev-fake-token" };
        }
        const errorMessage = friendlyAuthError(e, "Ошибка входа");
        // In admin area, UI already shows its own notifications; avoid duplicates.
        if (!isInAdminArea()) message.error(errorMessage);
        if (e && typeof e === "object") e.message = errorMessage;
        throw e;
      }

      applySessionFromResponse(res);
      const resUser = res?.user ? normalizeUser(res.user) : null;
      if (resUser) setUser(resUser);
      // Ensure we have a real user object (backend returns only credentials)
      let meUser = resUser;
      try {
        const me = await AuthApi.me();
        meUser = normalizeUser(me);
        setUser(meUser);
      } catch {
        // ignore; token may still be valid, user will be loaded by effect
      }
      // In admin area, UI already shows its own notifications; avoid duplicates.
      if (!isInAdminArea()) message.success("Вход выполнен");
      // Return user info for immediate role-based routing in UI
      return { ...(res || {}), user: meUser || resUser || null };
    },
    [applySessionFromResponse, setFakeDevSession]
  );

  const logout = React.useCallback(() => {
    saveAuth({});
    setUser(null);
  }, [saveAuth]);

  const value = React.useMemo(
    () => ({ user, token, refreshToken, isAuthenticated, register, login, logout }),
    [user, token, refreshToken, isAuthenticated, register, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
