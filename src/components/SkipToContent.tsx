// src/components/SkipToContent.tsx
// Skip to main content link for accessibility
import { Link } from "react-router-dom";

export default function SkipToContent() {
  return (
    <Link
      to="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-purple-600 focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
    >
      Skip to main content
    </Link>
  );
}

