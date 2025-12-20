import React from "react";
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

function normalizeUser(u) {
  if (!u || typeof u !== "object") return null;
  const firstName = u.firstName || u.name || u.firstname || "";
  const lastName = u.lastName || u.surname || u.lastname || "";
  return {
    ...u,
    name: u?.name || [firstName, lastName].filter(Boolean).join(" ") || u?.email,
    role: u?.role?.id || u?.role || u?.role_id || "user",
  };
}

export default function AuthProvider({ children }) {
  const [token, setToken] = React.useState(() => getAuthToken());
  const [refreshToken, setRefresh] = React.useState(() => getRefreshToken());
  const [user, setUser] = React.useState(null);
  const isAuthenticated = Boolean(token);

  const saveAuth = React.useCallback((payload) => {
    const p = payload?.data ? payload.data : payload;
    const newToken = p?.access_token || p?.accessToken || p?.token || p?.accessToken || "";
    const newRefresh = p?.refresh_token || p?.refreshToken || "";
    setToken(newToken);
    setAuthToken(newToken);
    setRefresh(newRefresh);
    setRefreshToken(newRefresh);
  }, []);

  // Load current user profile when we have an access token
  React.useEffect(() => {
    if (!token) {
      setUser(null);
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
    const res = await AuthApi.register(form);
    return res;
  }, []);

  const login = React.useCallback(
    async ({ email, password }) => {
      const res = await AuthApi.loginWithPassword({ email, password });
      saveAuth(res || {});
      // Ensure we have a real user object (backend returns only credentials)
      try {
        const me = await AuthApi.me();
        setUser(normalizeUser(me));
      } catch {
        // ignore; token may still be valid, user will be loaded by effect
      }
      return res;
    },
    [saveAuth]
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
