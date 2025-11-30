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
      const API_BASE = getApiBase(); // Get API base at runtime
      
      try {
        // Step 1: Call /auth/oauth-callback to set cookies from session
        // This endpoint reads tokens from session and sets them as HTTP-only cookies
        console.log("OAuth callback: Calling /auth/oauth-callback to set cookies...");
        const callbackRes = await fetch(`${API_BASE}/auth/oauth-callback`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
        
        if (!callbackRes.ok) {
          const errorData = await callbackRes.json().catch(() => ({}));
          console.error(`OAuth callback: /auth/oauth-callback failed with status ${callbackRes.status}`, errorData);
          navigate("/auth?mode=login", { replace: true });
          return;
        }
        
        // Step 2: Wait a moment for cookies to be processed by browser
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Step 3: Call /auth/me to get user info (cookies should now be set)
        console.log("OAuth callback: Calling /auth/me to get user info...");
        const meRes = await fetch(`${API_BASE}/auth/me`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
        
        if (meRes.ok) {
          const data = await meRes.json();
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
          console.log("OAuth callback: Successfully logged in user:", data.email);
          navigate("/profile", { replace: true });
        } else {
          // If /auth/me fails, try using data from /auth/oauth-callback response
          const callbackData = await callbackRes.json();
          if (callbackData.email) {
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
            console.log("OAuth callback: Using data from oauth-callback response");
            navigate("/profile", { replace: true });
          } else {
            console.error(`OAuth callback: /auth/me failed with status ${meRes.status}`);
            navigate("/auth?mode=login", { replace: true });
          }
        }
      } catch (error) {
        console.error("OAuth callback: Error during OAuth flow", error);
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
