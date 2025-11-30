// src/pages/Auth/LoginPage.tsx
// --------------------------------------------------------------------
// Friendly login page using Cloudflare Turnstile verification.
// Handles server feedback, email verification redirects, and OAuth fallback.
// --------------------------------------------------------------------
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/useAuth";
import { useToast } from "@/hooks/useToast";
import {
  loadTurnstile,
  renderTurnstile,
  getTurnstileToken,
  resetTurnstile,
} from "@/utils/security/turnstile";
import { getApiBase, setOAuthIntentCookie, getFrontendOrigin } from "@/utils/apiConfig";

// Don't call getApiBase() at module load time - it needs window.location
// Instead, call it at runtime when needed
const TURNSTILE_SITE_KEY =
  (import.meta as any)?.env?.VITE_TURNSTILE_SITE_KEY || "";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const { login } = useAuth();
  const { showToast, Toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Mount Turnstile - only run once on mount
  useEffect(() => {
    let active = true;
    (async () => {
      if (!TURNSTILE_SITE_KEY) {
        console.warn('Turnstile site key not configured. CAPTCHA will be disabled.');
        return;
      }
      
      // Small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!active) return;
      
      try {
        await renderTurnstile("captcha-login", (token) => {
          console.log('Turnstile token received');
        }, () => {
          console.log('Turnstile token expired');
        });
      } catch (err) {
        console.error('Failed to load Turnstile:', err);
        // Only show error if site key is configured (otherwise it's expected)
        if (TURNSTILE_SITE_KEY) {
          showToast(
            "We couldn't load the verification widget. Please refresh the page or try again later.",
            "error"
          );
        }
      }
    })();
    return () => {
      active = false;
      resetTurnstile("captcha-login");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  // Handle OAuth redirect messages
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");
    const reason = params.get("reason");
    const newEmail = params.get("newEmail");

    if (mode === "oauth-failed") {
      if (reason === "user-not-found") {
        showToast(
          "No account exists for that Google email. Please register first.",
          "warning"
        );
        // Redirect to register page after showing the message
        setTimeout(() => {
          navigate("/auth?mode=register", { replace: true });
        }, 1500);
      } else if (reason === "email-moved" && newEmail) {
        showToast(
          "Your account email was changed to " +
            newEmail +
            ". Please log in with the new address.",
          "info"
        );
      } else {
        showToast("Google sign-in failed. Please try again.", "error");
      }
    }
  }, [location.search, showToast, navigate]);

  // Handle Login
  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      showToast("Please fill in both email/username and password.", "warning");
      return;
    }

    let captchaToken: string | null = "TEST_PASS";
    if (TURNSTILE_SITE_KEY) {
      captchaToken = getTurnstileToken();
      if (!captchaToken) {
        showToast("Please complete the verification first.", "warning");
        return;
      }
    }

    try {
      // Add CSRF token for login request
      const { addCsrfToken } = await import("@/utils/csrf");
      const headers = addCsrfToken({ "Content-Type": "application/json" });
      const API_BASE = getApiBase(); // Get API base at runtime
      
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ identifier, password, remember, captchaToken }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        /* tolerate non-JSON */
      }

      if (res.ok) {
        // Login successful - tokens are now stored in HTTP-only cookies by backend
        // Fetch complete user data from /auth/me using cookies (credentials: "include")
        // This ensures we have the most up-to-date user information including role
        try {
          const API_BASE = getApiBase(); // Get API base at runtime
          const meRes = await fetch(`${API_BASE}/auth/me`, {
            credentials: "include", // Uses HTTP-only cookies automatically
          });
          
          if (meRes.ok) {
            const meData = await meRes.json();
            const generatedUsername =
              meData?.username ||
              identifier.trim().toLowerCase().replace(/\s+/g, "") ||
              "user" + Math.floor(Math.random() * 1000);

            // Note: No token passed - tokens are in HTTP-only cookies, not accessible to JS
            login(
              {
                name: meData?.username || meData?.name || identifier.trim(),
                email: meData?.email || identifier.trim(),
                username: generatedUsername,
                role: meData?.role || "USER",
                registeredWithMaster: meData?.registeredWithMaster || false,
                isRestricted: meData?.isRestricted || false,
              },
              undefined // Tokens are in HTTP-only cookies, not passed here
            );
            
            showToast("Welcome back! Login successful.", "success");
            resetTurnstile();
            navigate("/profile", { replace: true });
            return;
          } else {
            // If /auth/me fails, still show success but user will need to refresh
            showToast("Login successful, but couldn't fetch user details. Please refresh the page.", "warning");
            setTimeout(() => {
              window.location.href = "/profile";
            }, 1000);
            return;
          }
        } catch (meError) {
          // Network error fetching user data
          console.error("Error fetching user data after login:", meError);
          showToast("Login successful, but couldn't fetch user details. Please refresh the page.", "warning");
          setTimeout(() => {
            window.location.href = "/profile";
          }, 1000);
          return;
        }
      }

      // Too many attempts / lockouts
      if (res.status === 429) {
        const retryAfter = data?.retryAfterSec ?? 60;
        showToast(
          `Too many attempts. Please wait ${retryAfter}s before trying again.`,
          "warning"
        );
        return;
      }

      // Account temporarily locked (brute-force protection)
      if (res.status === 423) {
        const remaining = data?.retryAfterSec;
        showToast(
          remaining
            ? `Your account is temporarily locked. Try again in ${remaining}s.`
            : "Your account has been temporarily locked after multiple failed attempts.",
          "warning"
        );
        resetTurnstile();
        return;
      }

      // CAPTCHA validation failed
      if (res.status === 400 && data?.error === "captcha_failed") {
        showToast(
          "Verification failed. Please complete the verification again.",
          "error"
        );
        resetTurnstile();
        return;
      }

      // Authentication outcomes
      if (res.status === 401) {
        showToast("Incorrect email/username or password.", "error");
        resetTurnstile();
      } else if (res.status === 403) {
        showToast(
          data?.error || "Please verify your email before logging in.",
          "info"
        );
        setTimeout(() => {
          navigate(
            `/verify-email?status=pending&email=${encodeURIComponent(
              identifier.trim()
            )}`,
            { replace: true }
          );
        }, 1500);
      } else if (res.status === 404) {
        showToast(
          "No account found with this email or username. Please register.",
          "warning"
        );
      } else if (res.status === 400) {
        showToast(
          data?.error || "Please check your details and try again.",
          "warning"
        );
        resetTurnstile();
      } else {
        showToast(
          "Something went wrong while logging in. Please try again later.",
          "error"
        );
      }
    } catch (err) {
      console.error("Login error:", err);
      showToast(
        "We couldn’t connect to the server. Please check your connection.",
        "error"
      );
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md bg-white p-6 md:p-8 rounded-lg shadow-lg"
      >
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-1 text-gray-900">
          Login
        </h1>
        <p className="text-sm md:text-base text-gray-600 text-center mb-6">
          Access your account and keep your playlists in sync.
        </p>

        {/* Identifier */}
        <label className="block text-sm md:text-base font-medium mb-2">
          Email or Username
        </label>
        <input
          type="text"
          required
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="Enter your email or username"
          className="mb-4 w-full px-4 py-3 md:py-3 text-base border rounded-md focus:ring-2 focus:ring-purple-500 outline-none transition-all duration-200 touch-manipulation"
          autoComplete="username"
          inputMode="email"
        />

        {/* Password */}
        <label className="block text-sm md:text-base font-medium mb-2">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          className="mb-4 w-full px-4 py-3 md:py-3 text-base border rounded-md focus:ring-2 focus:ring-purple-500 outline-none transition-all duration-200 touch-manipulation"
          autoComplete="current-password"
        />

        {/* Remember me */}
        <label className="inline-flex items-center mb-4 text-sm md:text-base">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="mr-2 w-4 h-4"
          />
          Remember me
        </label>

        {/* Turnstile - Always render container, widget only renders if site key is configured */}
        <div id="captcha-login" className="mb-4" style={{ minHeight: TURNSTILE_SITE_KEY ? '65px' : '0' }}></div>

        {/* Login */}
        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-500 text-white hover:from-purple-700 hover:to-indigo-600 py-3 md:py-6 text-base md:text-lg font-semibold"
        >
          Login
        </Button>

        {/* Google login */}
        <Button
          type="button"
          onClick={() => {
            // Set cookie with appropriate SameSite attribute based on environment
            setOAuthIntentCookie('login');
            // Pass intent and frontend URL via query parameters
            // The backend will use the frontend_url to redirect back to the correct frontend after OAuth
            const API_BASE = getApiBase(); // Get API base at runtime
            const frontendOrigin = getFrontendOrigin(); // Get current frontend origin
            const redirectUrl = encodeURIComponent(`${frontendOrigin}/auth?mode=oauth-success`);
            window.location.assign(`${API_BASE}/oauth2/authorization/google?intent=login&redirect_uri=${redirectUrl}`);
          }}
          className="mt-3 w-full border border-gray-300 bg-white text-gray-700 font-medium py-3 md:py-6 text-base md:text-lg rounded-md hover:bg-gray-50"
        >
          Login with Google
        </Button>

        {/* Links */}
        <div className="mt-4 text-sm md:text-base text-center text-gray-600">
          Don't have an account?{" "}
          <Link
            to="/auth?mode=register"
            className="text-blue-600 hover:underline"
          >
            Register now
          </Link>
          <span className="mx-2 text-gray-400">|</span>
          <Link
            to="/auth?mode=forgot"
            className="text-blue-600 hover:underline"
          >
            Forgot your password?
          </Link>
        </div>

        {Toast}
      </form>
    </div>
  );
}
