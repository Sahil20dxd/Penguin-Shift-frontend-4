// src/App.tsx
import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminBlockedRoute from "./components/AdminBlockedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import { useToast } from "@/hooks/useToast";
import * as RadixToast from "@radix-ui/react-toast";
import { ShiftProvider } from "@/components/shift/ShiftContext";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

// Lazy load all pages for code splitting
const Landing = lazy(() => import("./pages/LandingPage/LandingPage"));
const LoginPage = lazy(() => import("./pages/Auth/LoginPage"));
const AuthRouter = lazy(() => import("./pages/Auth/AuthRouter/AuthRouter"));
const VerifyEmailPage = lazy(() => import("./pages/Auth/VerifyEmailPage"));
const ResendVerificationPage = lazy(() => import("./pages/Auth/ResendVerificationPage"));
const ResetPasswordPage = lazy(() => import("./pages/Auth/ResetPasswordPage"));
const MyProfile = lazy(() => import("./pages/Profile/MyProfile"));
const DashboardPage = lazy(() => import("./pages/Dashboard/DashboardPage"));
const ContactPage = lazy(() => import("./pages/Contact/ContactPage"));
const ExplorePublicPlaylists = lazy(() => import("./pages/ExplorePublicPlaylists"));
const SelectPlaylist = lazy(() => import("./pages/Shift/SelectPlaylist"));
const SelectDestination = lazy(() => import("./pages/Shift/SelectDestination"));
const TransferResults = lazy(() => import("./pages/Shift/TransferResults"));
const PublicPlaylistDestination = lazy(() => import("./pages/PublicPlaylistDestination"));
const PublicPlaylistSelectDestination = lazy(() => import("./pages/PublicPlaylistSelectDestination"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Enhanced loading fallback component with animation
const PageLoader = () => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50"
  >
    <motion.div
      animate={{ 
        rotate: 360,
        scale: [1, 1.1, 1]
      }}
      transition={{ 
        rotate: { duration: 1, repeat: Infinity, ease: "linear" },
        scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
      }}
      className="mb-4"
    >
      <Loader2 className="w-12 h-12 text-purple-600" />
    </motion.div>
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="text-gray-600 font-medium"
    >
      Loading...
    </motion.p>
  </motion.div>
);

export default function App() {
  // Mount the UI component once
  const { Toast: ToastUI } = useToast();

  return (
    <ErrorBoundary>
      <RadixToast.Provider swipeDirection="right" duration={3500}>
        <ShiftProvider>
          <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route
              path="/"
              element={
                <Layout currentPageName="LandingPage">
                  <Landing />
                </Layout>
              }
            />
            <Route
              path="/login"
              element={
                <Layout currentPageName="Auth">
                  <LoginPage />
                </Layout>
              }
            />
            <Route
              path="/auth"
              element={
                <Layout currentPageName="Auth">
                  <AuthRouter />
                </Layout>
              }
            />
            <Route 
              path="/verify-email" 
              element={
                <Suspense fallback={<PageLoader />}>
                  <VerifyEmailPage />
                </Suspense>
              } 
            />
            <Route
              path="/auth/resend-verification"
              element={
                <Layout currentPageName="Auth">
                  <ResendVerificationPage />
                </Layout>
              }
            />
            <Route
              path="/reset-password"
              element={
                <Layout currentPageName="Auth">
                  <ResetPasswordPage />
                </Layout>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Layout currentPageName="Profile">
                    <MyProfile />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout currentPageName="Dashboard">
                    <DashboardPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Shift flow - Block admins from accessing */}
            <Route
              path="/shift/select"
              element={
                <AdminBlockedRoute>
                  <Layout currentPageName="Shift">
                    <SelectPlaylist />
                  </Layout>
                </AdminBlockedRoute>
              }
            />
            <Route
              path="/shift/destination"
              element={
                <AdminBlockedRoute>
                  <Layout currentPageName="Shift">
                    <SelectDestination />
                  </Layout>
                </AdminBlockedRoute>
              }
            />
            <Route
              path="/shift/public-destination"
              element={
                <AdminBlockedRoute>
                  <Layout currentPageName="Shift">
                    <PublicPlaylistDestination />
                  </Layout>
                </AdminBlockedRoute>
              }
            />
            <Route
              path="/shift/public-destination-select"
              element={
                <AdminBlockedRoute>
                  <Layout currentPageName="Shift">
                    <PublicPlaylistSelectDestination />
                  </Layout>
                </AdminBlockedRoute>
              }
            />
            <Route
              path="/explore"
              element={
                <Layout currentPageName="Explore">
                  <ExplorePublicPlaylists />
                </Layout>
              }
            />
            <Route
              path="/contact"
              element={
                <Layout currentPageName="Contact">
                  <ContactPage />
                </Layout>
              }
            />
            <Route
              path="/shift/results"
              element={
                <AdminBlockedRoute>
                  <Layout currentPageName="Shift">
                    <TransferResults />
                  </Layout>
                </AdminBlockedRoute>
              }
            />
            {/* 404 Catch-all route */}
            <Route
              path="*"
              element={
                <Layout currentPageName="NotFound">
                  <NotFound />
                </Layout>
              }
            />
          </Routes>
        </Suspense>
      </ShiftProvider>
      {/* Render the element (NOT <ToastUI />) */}
      {ToastUI}

        {/* Radix viewport (where toasts are placed) - Mobile optimized */}
        <RadixToast.Viewport className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-[100] w-auto sm:w-[360px] max-w-[calc(100vw-2rem)] sm:max-w-[90vw] outline-none" />
      </RadixToast.Provider>
    </ErrorBoundary>
  );
}
