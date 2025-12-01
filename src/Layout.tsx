// src/layout/Layout.tsx
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Menu,
  Repeat,
  Mail,
  User,
  Home,
  UserCircle,
  Globe2, // icon for Explore
} from "lucide-react";
import { Button } from "@/components/ui/button";
// LogRocket is a UMD module - use namespace import and access default
import * as LogRocketModule from "logrocket";
// UMD modules expose their API as default export
const LogRocket = (LogRocketModule as any).default || LogRocketModule;
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/context/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import logo from "/src/assets/PenguinShift_Logo.png";

// Optimized logo image component (not lazy since it's above the fold)
const LogoImage = ({ src, alt, className }: { src: string; alt: string; className: string }) => (
  <motion.img 
    src={src} 
    alt={alt} 
    className={className}
    decoding="async"
    fetchpriority="high"
    whileHover={{ scale: 1.05, rotate: 5 }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
  />
);

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigationItems: NavItem[] = [
  { title: "Home", url: createPageUrl("LandingPage"), icon: Home },
  { title: "Shift", url: "/shift/select", icon: Repeat },
  // New nav item: Explore public playlists
  { title: "Explore", url: "/explore", icon: Globe2 },
  { title: "Contact Us", url: createPageUrl("Contact"), icon: Mail },
];

interface LayoutProps {
  children: React.ReactNode;
  currentPageName: string;
}

export default function Layout({ children, currentPageName }: LayoutProps) {
  // Initialize LogRocket
  // Note: 401 errors from /auth/me are expected when user is not authenticated
  // LogRocket may log them, but they're not actual errors
  LogRocket.init("qjhgt3/penguinshift", {
    // Only capture network in production, or configure to ignore 401s
    ...(import.meta.env.DEV && {
      // In development, you can disable network capture to reduce noise
      // network: { captureConsole: false }
    }),
  });
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout, loading } = useAuth();

  // Smooth scroll to top on route change
  // This hook must be called before any early returns to maintain hook order
  useEffect(() => {
    if (currentPageName !== "Auth") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location.pathname, currentPageName]);

  // Early return after all hooks are called
  if (currentPageName === "Auth") return <>{children}</>;

  if (loading)
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center items-center min-h-screen"
      >
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full"
          />
          <p className="text-lg text-gray-600 font-medium">Loading...</p>
        </div>
      </motion.div>
    );

  // Hide "Shift" if user is admin (they can't perform transfers)
  // Note: Admin and Curator roles are treated the same
  const filteredNavItems = user
    ? navigationItems.filter((item) => {
        if (item.title === "Shift") {
          const isAdmin = user?.role === 'ADMIN' || user?.role === 'CURATOR' || user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_CURATOR';
          return !isAdmin; // Hide Shift for admins
        }
        return true;
      })
    : navigationItems;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      {/* Desktop Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="hidden md:flex sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-purple-100 shadow-sm"
      >
        <div className="max-w-7xl mx-auto w-full px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                to={createPageUrl("LandingPage")}
                className="flex items-center gap-3 group"
              >
                <LogoImage src={logo} alt="PenguinShift Logo" className="w-10 h-10 transition-transform group-hover:rotate-12" />
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-500 bg-clip-text text-transparent transition-all duration-300 group-hover:from-purple-700 group-hover:to-indigo-600">
                  PenguinShift
                </span>
              </Link>
            </motion.div>

            {/* Nav Links */}
            <nav className="flex items-center gap-2">
              {filteredNavItems.map((item, index) => {
                // Determine if this URL should use prefix matching (for routes with sub-paths like /shift)
                const usePrefixMatching = item.url.startsWith("/shift");
                
                // Check active state: exact match for most routes, prefix match for /shift
                const isActive = usePrefixMatching
                  ? location.pathname.startsWith(item.url)
                  : location.pathname === item.url;
                
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={item.url}
                      className={
                        "relative flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all duration-300 " +
                        (isActive
                          ? "text-purple-700"
                          : "text-gray-700 hover:text-purple-600")
                      }
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeNavIndicator"
                          className="absolute inset-0 bg-purple-100 rounded-full -z-10"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <item.icon className="w-4 h-4" />
                      </motion.div>
                      <span>{item.title}</span>
                    </Link>
                  </motion.div>
                );
              })}

              {/* Auth state-dependent buttons */}
              <AnimatePresence mode="wait">
                {user ? (
                  <motion.div
                    key="user-menu"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-3"
                  >
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="ghost"
                        className="flex items-center gap-2 text-gray-700 hover:text-purple-700 transition-colors"
                        onClick={() => navigate("/profile")}
                      >
                        <UserCircle className="w-5 h-5" />
                        {user.name}
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="ghost"
                        className="text-gray-500 hover:text-red-600 transition-colors"
                        onClick={logout}
                      >
                        Logout
                      </Button>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="signup-button"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link to="/auth?mode=register">
                      <Button className="bg-gradient-to-r from-purple-600 to-indigo-500 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                        <User className="w-4 h-4 mr-2" />
                        Sign Up
                      </Button>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </nav>
          </div>
        </div>
      </motion.header>

      {/* Mobile Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="md:hidden sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-purple-100 shadow-sm"
      >
        <div className="px-4 py-4 flex items-center justify-between">
          <Link
            to={createPageUrl("LandingPage")}
            className="flex items-center gap-2"
          >
            <LogoImage
              src={logo}
              alt="PenguinShift Logo"
              className="w-8 h-8 rounded-lg shadow-md"
            />
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-500 bg-clip-text text-transparent">
              PenguinShift
            </span>
          </Link>

          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-purple-50"
                aria-label="Open navigation menu"
              >
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-white/95 backdrop-blur-xl w-full sm:w-[400px]">
              <SheetHeader className="text-left">
                <SheetTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-500 bg-clip-text text-transparent">
                  PenguinShift
                </SheetTitle>
                <SheetDescription className="text-sm md:text-base">
                  Transfer your playlists between platforms
                </SheetDescription>
              </SheetHeader>

              <nav className="flex flex-col gap-2 mt-6 md:mt-8">
                {filteredNavItems.map((item, index) => {
                  // Determine if this URL should use prefix matching (for routes with sub-paths like /shift)
                  const usePrefixMatching = item.url.startsWith("/shift");
                  
                  // Check active state: exact match for most routes, prefix match for /shift
                  const isActive = usePrefixMatching
                    ? location.pathname.startsWith(item.url)
                    : location.pathname === item.url;
                  
                  return (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        to={item.url}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={
                          "relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 active:scale-95 " +
                          (isActive
                            ? "text-purple-700"
                            : "text-gray-700")
                        }
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeMobileNavIndicator"
                            className="absolute inset-0 bg-purple-50 rounded-xl -z-10"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <item.icon className="w-5 h-5" />
                        </motion.div>
                        <span>{item.title}</span>
                      </Link>
                    </motion.div>
                  );
                })}

                <div className="pt-4 border-t border-gray-200">
                  {user ? (
                    <>
                      <Button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          navigate("/profile");
                        }}
                        className="w-full flex items-center gap-2 text-gray-700 hover:text-purple-700 py-3 md:py-6 min-h-[44px] md:min-h-0 active:scale-95 transition-transform duration-150"
                      >
                        <UserCircle className="w-5 h-5" />
                        <span className="text-base md:text-sm">{user.name}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full text-gray-500 hover:text-red-600 mt-2 py-3 md:py-6 min-h-[44px] md:min-h-0 active:scale-95 transition-transform duration-150"
                        onClick={() => {
                          logout();
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <span className="text-base md:text-sm">Logout</span>
                      </Button>
                    </>
                  ) : (
                    <Link to="/auth?mode=register" className="w-full">
                      <Button className="w-full bg-gradient-to-r from-purple-600 to-indigo-500 text-white shadow-lg py-3 md:py-6 min-h-[44px] md:min-h-0 active:scale-95 transition-transform duration-150">
                        <User className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                        <span className="text-base md:text-sm">Sign Up</span>
                      </Button>
                    </Link>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer (only on LandingPage) */}
      {currentPageName === "LandingPage" && (
        <footer className="bg-slate-900 text-white py-16 text-center">
          <p className="text-gray-400">
            © {new Date().getFullYear()} PenguinShift — All rights reserved.
          </p>
        </footer>
      )}
    </div>
  );
}
