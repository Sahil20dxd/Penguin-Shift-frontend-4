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
      const maxRetries = 5;
      const initialDelay = 500; // Start with 500ms delay
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          // Exponential backoff: 500ms, 1000ms, 1500ms, 2000ms, 2500ms
          const delay = initialDelay + (attempt * 500);
          if (attempt > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            // First attempt: wait a bit for cookies to be processed
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          const res = await fetch(`${API_BASE}/auth/me`, {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          });
          
          if (res.ok) {
            const data = await res.json();
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
            return; // Success - exit the retry loop
          } else if (res.status === 401 && attempt < maxRetries - 1) {
            // 401 means cookies aren't available yet, retry
            console.log(`OAuth callback: /auth/me returned 401, retrying (attempt ${attempt + 1}/${maxRetries})...`);
            continue;
          } else {
            // Non-401 error or last attempt failed
            console.error(`OAuth callback: /auth/me failed with status ${res.status}`);
            navigate("/auth?mode=login", { replace: true });
            return;
          }
        } catch (error) {
          if (attempt < maxRetries - 1) {
            console.log(`OAuth callback: Error fetching /auth/me, retrying (attempt ${attempt + 1}/${maxRetries})...`, error);
            continue;
          } else {
            // Last attempt failed
            console.error("OAuth callback: Failed to fetch /auth/me after all retries", error);
            navigate("/auth?mode=login", { replace: true });
            return;
          }
        }
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
