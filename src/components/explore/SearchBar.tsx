// src/components/explore/SearchBar.tsx

import React from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
};

/**

SearchBar:

Controlled text input for searching public playlists.

Shows a leading search icon and a clear (X) button when there is text.
*/
export default function SearchBar({
  value,
  onChange,
  onClear,
}: SearchBarProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative"
    >
      <motion.div
        animate={{ 
          scale: value ? [1, 1.1, 1] : 1,
          rotate: value ? [0, -5, 5, 0] : 0
        }}
        transition={{ duration: 0.3 }}
      >
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
          aria-hidden="true"
        />
      </motion.div>
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onChange(value);
        }}
        placeholder="Search public playlists…"
        className="pl-10 pr-10 h-11 md:h-11 text-sm md:text-sm border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500 dark:focus:ring-purple-400 transition-all duration-200"
        aria-label="Search public playlists"
        autoComplete="off"
      />
      <AnimatePresence>
        {value && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute right-1 top-1/2 -translate-y-1/2"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={onClear}
              className="h-10 w-10 md:h-8 md:w-8 hover:bg-purple-50 active:bg-purple-100 touch-manipulation"
              aria-label="Clear search"
            >
              <X className="w-5 h-5 md:w-4 md:h-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
