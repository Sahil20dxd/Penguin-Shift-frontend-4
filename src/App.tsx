// src/App.tsx
import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { useToast } from "@/hooks/useToast";
import * as RadixToast from "@radix-ui/react-toast";
import { ShiftProvider } from "@/components/shift/ShiftContext";
import { Loader2 } from "lucide-react";

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

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
  </div>
);

export default function App() {
  // Mount the UI component once
  const { Toast: ToastUI } = useToast();

  return (
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

            {/* Shift flow */}
            <Route
              path="/shift/select"
              element={
                <ProtectedRoute>
                  <Layout currentPageName="Shift">
                    <SelectPlaylist />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/shift/destination"
              element={
                <ProtectedRoute>
                  <Layout currentPageName="Shift">
                    <SelectDestination />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/shift/public-destination"
              element={
                <ProtectedRoute>
                  <Layout currentPageName="Shift">
                    <PublicPlaylistDestination />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/shift/public-destination-select"
              element={
                <ProtectedRoute>
                  <Layout currentPageName="Shift">
                    <PublicPlaylistSelectDestination />
                  </Layout>
                </ProtectedRoute>
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
              path="/shift/results"
              element={
                <ProtectedRoute>
                  <Layout currentPageName="Shift">
                    <TransferResults />
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </ShiftProvider>
      {/* Render the element (NOT <ToastUI />) */}
      {ToastUI}

      {/* Radix viewport (where toasts are placed) */}
      <RadixToast.Viewport className="fixed bottom-4 right-4 z-[100] w-[360px] max-w-[90vw] outline-none" />
    </RadixToast.Provider>
  );
}
