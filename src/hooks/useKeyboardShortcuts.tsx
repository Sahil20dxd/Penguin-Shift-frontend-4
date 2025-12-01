// src/hooks/useKeyboardShortcuts.tsx
// Keyboard shortcuts hook for better UX
import { useEffect } from "react";

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  handler: (e: KeyboardEvent) => void;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      shortcuts.forEach((shortcut) => {
        const matchesKey = e.key === shortcut.key || e.code === shortcut.key;
        const matchesCtrl = shortcut.ctrlKey === undefined || e.ctrlKey === shortcut.ctrlKey;
        const matchesShift = shortcut.shiftKey === undefined || e.shiftKey === shortcut.shiftKey;
        const matchesAlt = shortcut.altKey === undefined || e.altKey === shortcut.altKey;

        if (matchesKey && matchesCtrl && matchesShift && matchesAlt) {
          // Don't trigger if user is typing in an input
          const target = e.target as HTMLElement;
          if (
            target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.isContentEditable
          ) {
            return;
          }

          e.preventDefault();
          shortcut.handler(e);
        }
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}

// Common keyboard shortcuts
export const ESC_KEY = "Escape";
export const ENTER_KEY = "Enter";

