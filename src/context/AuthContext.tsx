// src/context/AuthContext.tsx
import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { getApiBase } from "@/utils/apiConfig";
import { addCsrfToken, getCsrfToken } from "@/utils/csrf";

export interface User {
  name: string;
  email: string;
  username: string;
  role?: string;
  registeredWithMaster?: boolean;
  isRestricted?: boolean;
}

type AuthFetchInit = RequestInit & { json?: unknown };

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (userData: User, token?: string) => void;
  logout: () => void;
  getToken: () => string | null;
  authFetch: (input: RequestInfo | URL, init?: AuthFetchInit) => Promise<Response>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const getToken = useCallback(() => token, [token]);
  const isAuthenticated = !!user;

  const authFetch = useCallback(
    async (input: RequestInfo | URL, init: AuthFetchInit = {}) => {
      const headers = new Headers(init.headers || {});
      if (init.json !== undefined) {
        headers.set("Content-Type", "application/json");
      }

      // Add Authorization header if token is available (primary method for cross-origin)
      const accessToken = token || localStorage.getItem("penguinshift_access_token");
      if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`);
      }

      const method = (init.method || 'GET').toUpperCase();
      const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
      const headersWithCsrf = addCsrfToken(Object.fromEntries(headers.entries()));

      let res = await fetch(input, {
        ...init,
        headers: headersWithCsrf,
        credentials: "include", // Still include credentials for cookie fallback
        body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
      });

      // Retry with CSRF token if 401 on state-changing operations
      if (!res.ok && res.status === 401 && isStateChanging) {
        await new Promise(resolve => setTimeout(resolve, 300));
        
        let csrfToken = getCsrfToken();
        if (!csrfToken) {
          try {
            await fetch(`${getApiBase()}/auth/me`, {
              method: 'GET',
              credentials: 'include',
              headers: accessToken ? { "Authorization": `Bearer ${accessToken}` } : {},
            });
            await new Promise(resolve => setTimeout(resolve, 200));
            csrfToken = getCsrfToken();
          } catch {
            // Continue without CSRF token
          }
        }

        const retryHeaders = new Headers(headers);
        if (csrfToken) {
          retryHeaders.set('X-CSRF-TOKEN', csrfToken);
        }
        if (accessToken) {
          retryHeaders.set("Authorization", `Bearer ${accessToken}`);
        }

        res = await fetch(input, {
          ...init,
          headers: retryHeaders,
          credentials: "include",
          body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
        });
      }

      return res;
    },
    [token]
  );

  useEffect(() => {
    // Load cached user data and tokens
    const cached = localStorage.getItem("penguinshift_user");
    if (cached) {
      try {
        setUser(JSON.parse(cached));
      } catch {
        localStorage.removeItem("penguinshift_user");
      }
    }

    // Load token from localStorage
    const storedToken = localStorage.getItem("penguinshift_access_token");
    if (storedToken) {
      setToken(storedToken);
    }

    // Verify authentication via Authorization header (primary) or cookies (fallback)
    (async () => {
      try {
        const headers: HeadersInit = {};
        if (storedToken) {
          headers["Authorization"] = `Bearer ${storedToken}`;
        }

        const res = await fetch(`${getApiBase()}/auth/me`, {
          credentials: "include",
          headers,
        });

        if (res.ok) {
          const data = await res.json();
          const u: User = {
            name: data.username || data.name || "User",
            email: data.email,
            username: data.username || data.email.split("@")[0],
            role: data.role || "USER",
            registeredWithMaster: data.registeredWithMaster || false,
            isRestricted: data.isRestricted || false,
          };
          setUser(u);
          localStorage.setItem("penguinshift_user", JSON.stringify(u));
          // Ensure token is set if we have it
          if (storedToken) {
            setToken(storedToken);
          }
        } else {
          // Clear invalid tokens
          setUser(null);
          localStorage.removeItem("penguinshift_user");
          localStorage.removeItem("penguinshift_access_token");
          localStorage.removeItem("penguinshift_refresh_token");
          setToken(null);
        }
      } catch {
        setUser(null);
        localStorage.removeItem("penguinshift_user");
        localStorage.removeItem("penguinshift_access_token");
        localStorage.removeItem("penguinshift_refresh_token");
        setToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = (userData: User, incomingToken?: string) => {
    const username =
      userData.username ||
      userData.name?.toLowerCase().replace(/\s+/g, "") ||
      "user" + Math.floor(Math.random() * 1000);

    const finalUser: User = { ...userData, username, role: userData.role || "USER" };
    setUser(finalUser);
    localStorage.setItem("penguinshift_user", JSON.stringify(finalUser));
    
    // Store token in state and localStorage
    const tokenToStore = incomingToken || localStorage.getItem("penguinshift_access_token");
    if (tokenToStore) {
      setToken(tokenToStore);
      localStorage.setItem("penguinshift_access_token", tokenToStore);
    } else {
      setToken(null);
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    // Clear tokens from localStorage
    localStorage.removeItem("penguinshift_user");
    localStorage.removeItem("penguinshift_access_token");
    localStorage.removeItem("penguinshift_refresh_token");
    localStorage.removeItem("penguinshift_user");
    
    try {
      const headers = addCsrfToken({ "Content-Type": "application/json" });
      await fetch(`${getApiBase()}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers,
      });
    } catch {
      // Ignore logout errors
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticated, login, logout, getToken, authFetch }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
