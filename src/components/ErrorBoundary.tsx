// src/components/ErrorBoundary.tsx
// React Error Boundary to catch and handle component errors gracefully
import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    // Log to error tracking service in production
    if (import.meta.env.PROD && window.LogRocket) {
      window.LogRocket.captureException(error, {
        extra: {
          componentStack: errorInfo.componentStack,
        },
      });
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    // Force a page reload to ensure clean state
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = createPageUrl("LandingPage");
  };

  handleContactSupport = () => {
    window.location.href = "/contact";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/30 p-4"
        >
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-200">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="flex justify-center mb-6"
            >
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
            </motion.div>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-4">
              Oops! Something went wrong
            </h1>

            <p className="text-gray-600 text-center mb-8 text-lg">
              We encountered an unexpected error. Don't worry, your data is safe.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-mono text-red-600 mb-2">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <pre className="text-xs text-gray-500 overflow-auto max-h-40">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={this.handleReset}
                  className="bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-700 hover:to-indigo-600"
                  size="lg"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  size="lg"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </motion.div>
            </div>

            <p className="text-center text-sm text-gray-500 mt-6">
              If this problem persists, please{" "}
              <button
                onClick={this.handleContactSupport}
                className="text-purple-600 hover:underline font-medium cursor-pointer"
              >
                contact support
              </button>
            </p>
          </div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

