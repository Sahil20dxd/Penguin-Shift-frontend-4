// src/main.tsx
// ------------------------------------------------------------
// Entry point for the PenguinShift React application.
// Wraps the entire app with BrowserRouter, AuthProvider, and ToastProvider.
// ------------------------------------------------------------

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "@/components/ui/toast-provider"; //  Toast system wrapper

// Only use StrictMode in development to avoid double renders in production
const AppWrapper = import.meta.env.DEV ? (
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
) : (
  <BrowserRouter>
    <AuthProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AuthProvider>
  </BrowserRouter>
);

ReactDOM.createRoot(document.getElementById("root")!).render(AppWrapper);
