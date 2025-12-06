// src/context/ThemeContext.tsx
import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "penguinshift_theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Initialize theme - apply immediately to prevent flash
  // Use function initializer to only run once
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    
    // Check localStorage first
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (stored === "light" || stored === "dark") {
      // Apply immediately
      const root = document.documentElement;
      if (stored === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
      return stored;
    }
    // Fallback to system preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const root = document.documentElement;
    if (prefersDark) {
      root.classList.add("dark");
      return "dark";
    }
    root.classList.remove("dark");
    return "light";
  });

  // Apply theme to document whenever it changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const root = document.documentElement;
    const isDark = theme === "dark";
    
    // Apply class immediately
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    
    // Store in localStorage immediately to mark as user preference
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  // Listen for system theme changes (only if user hasn't set a preference)
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't manually set a preference
      // Check if localStorage has a user-set preference
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      // If no stored preference, follow system preference
      if (!stored || stored === "") {
        const newTheme = e.matches ? "dark" : "light";
        setThemeState(newTheme);
      }
    };

    // Only add listener if no user preference is set
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (!stored || stored === "") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const newTheme = prev === "light" ? "dark" : "light";
      
      // Immediately update localStorage and DOM to prevent delay
      if (typeof window !== "undefined") {
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
        const root = document.documentElement;
        if (newTheme === "dark") {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
      }
      
      return newTheme;
    });
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

