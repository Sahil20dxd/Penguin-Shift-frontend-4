// src/context/AuthContext.tsx
import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

import { getApiBase } from "@/utils/apiConfig";

const API_BASE = getApiBase();

export interface User {
  name: string;
  email: string;
  username: string;
  role?: string; // 'ADMIN', 'CURATOR', 'USER', etc.
  registeredWithMaster?: boolean; // Track if user registered with master credentials
  isRestricted?: boolean; // Track if user is restricted from creating public playlists
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

function looksLikeJwt(t: string | null | undefined) {
  if (!t) return false;
  const parts = t.split(".");
  return parts.length === 3 && parts.every(Boolean);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Removed localStorage token access for security - rely on HTTP-only cookies only
  const getToken = useCallback(() => token, [token]);

  const isAuthenticated = !!user;

  const authFetch = useCallback(
    async (input: RequestInfo | URL, init: AuthFetchInit = {}) => {
      const maybeToken = getToken();
      const headers = new Headers(init.headers || {});
      if (looksLikeJwt(maybeToken)) {
        headers.set("Authorization", `Bearer ${maybeToken}`);
      }
      if (init.json !== undefined) headers.set("Content-Type", "application/json");

      // Determine if this is a state-changing operation
      const method = (init.method || 'GET').toUpperCase();
      const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);

      // Add CSRF token for state-changing operations
      const { addCsrfToken } = await import("@/utils/csrf");
      const csrfHeaders = addCsrfToken(Object.fromEntries(headers.entries()));
      const finalHeaders = new Headers(csrfHeaders);

      let res = await fetch(input, {
        ...init,
        headers: finalHeaders,
        credentials: "include",
        body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
      });

      // If we get 401 on a state-changing operation, it might be a CSRF token issue
      // Make a GET request first to initialize the CSRF token, then retry the original request
      if (!res.ok && res.status === 401 && isStateChanging) {
        // First, make a GET request to initialize the CSRF token cookie
        // Use a public endpoint that doesn't require authentication
        const { getApiBase } = await import("@/utils/apiConfig");
        const API_BASE = getApiBase();
        try {
          await fetch(`${API_BASE}/api/public-playlists?limit=1`, {
            method: 'GET',
            credentials: 'include',
          });
        } catch {
          // If GET fails, continue anyway - the original request might have set the cookie
        }
        
        // Wait a moment to ensure the CSRF token cookie is set
        await new Promise(resolve => setTimeout(resolve, 150));
        
        // Retry with fresh CSRF token (should be available now)
        const retryCsrfHeaders = addCsrfToken(Object.fromEntries(headers.entries()));
        const retryFinalHeaders = new Headers(retryCsrfHeaders);

        res = await fetch(input, {
          ...init,
          headers: retryFinalHeaders,
          credentials: "include",
          body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
        });
      }

      return res;
    },
    [getToken]
  );

  useEffect(() => {
    // Load cached user data from localStorage (non-sensitive data only)
    const cached = localStorage.getItem("penguinshift_user");
    if (cached) {
      try {
        setUser(JSON.parse(cached));
      } catch {
        // Invalid cache, clear it
        localStorage.removeItem("penguinshift_user");
      }
    }

    // Authenticate using HTTP-only cookies only (secure)
    // No localStorage token access - tokens are stored in HTTP-only cookies by backend
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, { 
          credentials: "include" // Uses HTTP-only cookies
        });

        if (res && res.ok) {
          const data = await res.json();
          // Normalize role: backend may return 'ROLE_ADMIN' or 'ADMIN', we preserve it as-is
          // Components check for both formats
          const u: User = {
            name: data.username || data.name || "User",
            email: data.email,
            username: data.username || data.email.split("@")[0],
            role: data.role || "USER",
            registeredWithMaster: data.registeredWithMaster || false,
            isRestricted: data.isRestricted || false,
          };
          setUser(u);
          // Store user data in localStorage (non-sensitive, for UX only)
          localStorage.setItem("penguinshift_user", JSON.stringify(u));
          // Note: Token is stored in HTTP-only cookie by backend, not accessible to JS
        } else {
          // Not authenticated - clear user data
          localStorage.removeItem("penguinshift_user");
          setUser(null);
          setToken(null);
        }
      } catch {
        // Network error or invalid response
        localStorage.removeItem("penguinshift_user");
        setUser(null);
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
    // Store user data in localStorage (non-sensitive, for UX only)
    localStorage.setItem("penguinshift_user", JSON.stringify(finalUser));

    // Note: Tokens are now stored in HTTP-only cookies by the backend
    // We don't store tokens in localStorage for security (XSS protection)
    // If a token is provided, we can use it temporarily, but it should be in a cookie
    if (incomingToken && looksLikeJwt(incomingToken)) {
      setToken(incomingToken); // Temporary in-memory only, not persisted
    } else {
      setToken(null);
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("penguinshift_user");
    // Note: authToken is no longer stored in localStorage (security improvement)
    // Backend will clear the HTTP-only cookie on logout
    try {
      const { addCsrfToken } = await import("@/utils/csrf");
      const headers = addCsrfToken({ "Content-Type": "application/json" });
      fetch(`${API_BASE}/auth/logout`, { 
        method: "POST", 
        credentials: "include",
        headers
      }).catch(() => {});
    } catch {
      // If CSRF fails, still try to logout
      fetch(`${API_BASE}/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
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
