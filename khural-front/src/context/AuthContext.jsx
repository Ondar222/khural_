import React from "react";
import { AuthApi, setAuthToken, getAuthToken } from "../api/client.js";

const AuthContext = React.createContext({
  user: null,
  token: "",
  isAuthenticated: false,
  register: async () => {},
  login: async () => {},
  logout: () => {},
});

export function useAuth() {
  return React.useContext(AuthContext);
}

export default function AuthProvider({ children }) {
  const [token, setToken] = React.useState(() => getAuthToken());
  const [user, setUser] = React.useState(null);
  const isAuthenticated = Boolean(token);

  const saveAuth = React.useCallback((payload) => {
    const p = payload?.data ? payload.data : payload;
    const newToken =
      p?.token || p?.accessToken || p?.access_token || p?.access_token || "";
    setToken(newToken);
    setAuthToken(newToken);
    const u = p?.user;
    if (u && typeof u === "object") {
      setUser({
        ...u,
        name:
          u?.name ||
          [u?.firstName, u?.lastName].filter(Boolean).join(" ") ||
          u?.email,
        role: u?.role?.id || u?.role || "admin",
      });
    }
  }, []);

  const register = React.useCallback(async (form) => {
    const res = await AuthApi.register(form);
    return res;
  }, []);

  const login = React.useCallback(
    async ({ email, password }) => {
      const res = await AuthApi.loginWithPassword({ email, password });
      saveAuth(res || {});
      return res;
    },
    [saveAuth]
  );

  const logout = React.useCallback(() => {
    saveAuth({});
    setUser(null);
  }, [saveAuth]);

  const value = React.useMemo(
    () => ({ user, token, isAuthenticated, register, login, logout }),
    [user, token, isAuthenticated, register, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
