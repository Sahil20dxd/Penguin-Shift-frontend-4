// src/pages/Auth/AuthRouter/AuthRouter.tsx
/**
 * Auth router:
 * - Handles Google OAuth cookie callback via mode=oauth-success
 * - Falls back to normal auth pages (login/register/forgot/resend)
 */

import React, { useEffect } from "react";
import LoginPage from "../LoginPage";
import RegisterPage from "../RegisterPage";
import ForgotPassword from "../ForgotPasswordPage";
import ResendVerificationPage from "../ResendVerificationPage";
import { useAuth } from "@/context/useAuth";
import { useNavigate, Navigate, useLocation } from "react-router-dom";
import { getApiBase } from "@/utils/apiConfig";

// Don't call getApiBase() at module load time - it needs window.location
// Instead, call it at runtime when needed

export default function AuthRouter() {
  const { isAuthenticated, loading, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const mode = params.get("mode") || "login";

  useEffect(() => {
    const status = new URLSearchParams(location.search).get("status");

    // Helper to refresh session from cookies and land on profile
    const finishAndGoProfile = async () => {
      console.log("═══════════════════════════════════════════════════════════");
      console.log("🚀 Frontend OAuth Callback: Starting OAuth success flow");
      console.log("═══════════════════════════════════════════════════════════");
      
      const API_BASE = getApiBase(); // Get API base at runtime
      console.log("📋 Configuration:");
      console.log("  - API Base URL:", API_BASE);
      console.log("  - Current URL:", window.location.href);
      console.log("  - Current Origin:", window.location.origin);
      console.log("  - Search Params:", location.search);
      
      // Extract token from URL if present (new approach - uses token cache instead of session)
      const tokenParam = params.get("token");
      const sessionParam = params.get("session"); // Legacy support
      if (tokenParam) {
        console.log("  - Token from URL:", tokenParam);
      } else if (sessionParam) {
        console.log("  - Session ID from URL (legacy):", sessionParam);
      } else {
        console.warn("⚠️ No token or session ID in URL parameters");
      }
      
      try {
        // Step 1: Wait a moment for cookies to be processed by browser (cookies are set in redirect response)
        console.log("═══════════════════════════════════════════════════════════");
        console.log("⏳ Step 1: Waiting for cookies to be processed by browser");
        console.log("═══════════════════════════════════════════════════════════");
        console.log("  - Wait time: 500ms");
        console.log("  - Note: Cookies should be set directly in OAuth redirect response");
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log("✅ Wait complete");
        
        // Step 2: Try /auth/me first (cookies should be set directly from redirect)
        console.log("═══════════════════════════════════════════════════════════");
        console.log("📞 Step 2: Calling /auth/me to get user info");
        console.log("═══════════════════════════════════════════════════════════");
        console.log("  - Endpoint:", `${API_BASE}/auth/me`);
        console.log("  - Method: GET");
        console.log("  - Credentials: include");
        console.log("  - Headers: Content-Type: application/json");
        console.log("  - Note: Cookies should be sent automatically with credentials: 'include'");
        
        const meStartTime = Date.now();
        let meRes = await fetch(`${API_BASE}/auth/me`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const meDuration = Date.now() - meStartTime;
        
        console.log("📥 /auth/me Response received:");
        console.log("  - Status:", meRes.status, meRes.statusText);
        console.log("  - Duration:", meDuration, "ms");
        console.log("  - OK:", meRes.ok);
        console.log("  - Headers:", Object.fromEntries(meRes.headers.entries()));
        
        if (meRes.ok) {
          const data = await meRes.json();
          console.log("✅ /auth/me Success:");
          console.log("  - User data:", data);
          console.log("  - Email:", data.email);
          console.log("  - Username:", data.username);
          console.log("  - Role:", data.role);
          
          console.log("🔐 Setting user in auth context...");
          login(
            {
              name: data.username || data.name || "User",
              email: data.email,
              username: data.username || data.name || "user",
              role: data.role || "USER",
              registeredWithMaster: data.registeredWithMaster || false,
              isRestricted: data.isRestricted || false,
            },
            undefined
          );
          console.log("✅ User set in auth context");
          console.log("═══════════════════════════════════════════════════════════");
          console.log("✅ OAuth Callback: SUCCESS - Navigating to profile");
          console.log("═══════════════════════════════════════════════════════════");
          navigate("/profile", { replace: true });
          return;
        }
        
        // Step 3: If /auth/me fails, fallback to /auth/oauth-callback (token-based approach)
        console.log("═══════════════════════════════════════════════════════════");
        console.log("⚠️ /auth/me failed, trying fallback: /auth/oauth-callback");
        console.log("═══════════════════════════════════════════════════════════");
        
        // Use token parameter if available, otherwise try session parameter (legacy)
        const tokenParam = params.get("token");
        const sessionParam = params.get("session");
        const callbackUrl = tokenParam 
          ? `${API_BASE}/auth/oauth-callback?token=${encodeURIComponent(tokenParam)}`
          : sessionParam
          ? `${API_BASE}/auth/oauth-callback?session=${encodeURIComponent(sessionParam)}`
          : `${API_BASE}/auth/oauth-callback`;
        
        console.log("  - Endpoint:", callbackUrl);
        console.log("  - Method: GET");
        console.log("  - Credentials: include");
        console.log("  - Headers: Content-Type: application/json");
        if (tokenParam) {
          console.log("  - Using token parameter (new approach)");
        } else if (sessionParam) {
          console.log("  - Using session parameter (legacy approach)");
        }
        
        const callbackStartTime = Date.now();
        const callbackRes = await fetch(callbackUrl, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const callbackDuration = Date.now() - callbackStartTime;
        
        console.log("📥 /auth/oauth-callback Response received:");
        console.log("  - Status:", callbackRes.status, callbackRes.statusText);
        console.log("  - Duration:", callbackDuration, "ms");
        console.log("  - OK:", callbackRes.ok);
        console.log("  - Headers:", Object.fromEntries(callbackRes.headers.entries()));
        
        // Check Set-Cookie headers
        const setCookieHeaders = callbackRes.headers.getSetCookie?.() || [];
        if (setCookieHeaders.length > 0) {
          console.log("🍪 Set-Cookie headers received:", setCookieHeaders.length);
          setCookieHeaders.forEach((cookie, index) => {
            console.log(`  - Cookie ${index + 1}:`, cookie.substring(0, Math.min(100, cookie.length)) + "...");
          });
        } else {
          console.warn("⚠️ No Set-Cookie headers in response");
        }
        
        if (!callbackRes.ok) {
          const errorData = await callbackRes.json().catch(() => ({}));
          console.error("❌ /auth/oauth-callback also failed:");
          console.error("  - Status:", callbackRes.status);
          console.error("  - Status Text:", callbackRes.statusText);
          console.error("  - Error Data:", errorData);
          navigate("/auth?mode=login", { replace: true });
          return;
        }
        
        // Parse response
        console.log("📦 Parsing /auth/oauth-callback response data...");
        const callbackData = await callbackRes.json().catch((err) => {
          console.error("❌ Failed to parse JSON response:", err);
          return null;
        });
        
        if (callbackData && callbackData.email) {
          console.log("✅ Callback data parsed:");
          console.log("  - Email:", callbackData.email);
          console.log("  - Username:", callbackData.username);
          console.log("  - Role:", callbackData.role);
          
          // Wait for cookies to be set
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Try /auth/me again
          meRes = await fetch(`${API_BASE}/auth/me`, {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          });
          
          if (meRes.ok) {
            const data = await meRes.json();
            console.log("✅ /auth/me Success after callback:");
            login(
              {
                name: data.username || data.name || "User",
                email: data.email,
                username: data.username || data.name || "user",
                role: data.role || "USER",
                registeredWithMaster: data.registeredWithMaster || false,
                isRestricted: data.isRestricted || false,
              },
              undefined
            );
            navigate("/profile", { replace: true });
            return;
          }
          
          // Last resort: use callback data directly
          console.log("⚠️ Using callback data directly as last resort");
          login(
            {
              name: callbackData.username || callbackData.name || "User",
              email: callbackData.email,
              username: callbackData.username || callbackData.name || "user",
              role: callbackData.role || "USER",
              registeredWithMaster: callbackData.registeredWithMaster || false,
              isRestricted: callbackData.isRestricted || false,
            },
            undefined
          );
          navigate("/profile", { replace: true });
        } else {
          console.error("❌ Both /auth/me and /auth/oauth-callback failed:");
          console.error("  - /auth/me status:", meRes.status);
          console.error("  - Callback data:", callbackData);
          const errorText = await meRes.text().catch(() => "Could not read error");
          console.error("  - Error response:", errorText);
          navigate("/auth?mode=login", { replace: true });
        }
      } catch (error) {
        console.error("═══════════════════════════════════════════════════════════");
        console.error("❌ OAuth Callback: ERROR during OAuth flow");
        console.error("═══════════════════════════════════════════════════════════");
        console.error("  - Error type:", error instanceof Error ? error.constructor.name : typeof error);
        console.error("  - Error message:", error instanceof Error ? error.message : String(error));
        console.error("  - Error stack:", error instanceof Error ? error.stack : "N/A");
        console.error("  - Full error:", error);
        navigate("/auth?mode=login", { replace: true });
      }
    };

    if (mode === "oauth-success") {
      finishAndGoProfile();
    }

    if (mode === "email-change" && status === "success") {
      // After confirming the link, server updated the email — refetch /me
      finishAndGoProfile();
    }
  }, [mode, location.search, login, navigate]);

  if (loading) return null;

  if (isAuthenticated && mode !== "oauth-success") {
    return <Navigate to="/profile" replace />;
  }

  switch (mode) {
    case "register":
      return <RegisterPage />;
    case "forgot":
      return <ForgotPassword />;
    case "resend":
      return <ResendVerificationPage />;
    case "login":
    default:
      return <LoginPage />;
  }
}
