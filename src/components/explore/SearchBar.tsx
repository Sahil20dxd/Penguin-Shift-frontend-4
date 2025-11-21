// src/components/explore/SearchBar.tsx

import React from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="relative">
      {" "}
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onChange(value);
        }}
        placeholder="Search public playlists…"
        className="pl-10 pr-10 h-12 text-base border-gray-200 focus:border-purple-500 focus:ring-purple-500"
        aria-label="Search public playlists"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onClear}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
