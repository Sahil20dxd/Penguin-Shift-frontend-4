// src/components/ui/skeleton-loader.tsx
// Optimized skeleton loaders for better perceived performance
import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonLoaderProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular" | "card";
  width?: string | number;
  height?: string | number;
  count?: number;
}

export function SkeletonLoader({
  className,
  variant = "rectangular",
  width,
  height,
  count = 1,
}: SkeletonLoaderProps) {
  const baseClasses = "animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer";
  
  const variantClasses = {
    text: "h-4 rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
    card: "rounded-xl",
  };

  if (count > 1) {
    return (
      <>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={cn(
              baseClasses,
              variantClasses[variant],
              className
            )}
            style={{
              width: width || (variant === "text" ? "100%" : "100%"),
              height: height || (variant === "text" ? "1rem" : variant === "circular" ? width : "100%"),
              animationDelay: `${i * 100}ms`,
            }}
          />
        ))}
      </>
    );
  }

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
      style={{
        width: width || (variant === "text" ? "100%" : "100%"),
        height: height || (variant === "text" ? "1rem" : variant === "circular" ? width : "100%"),
      }}
    />
  );
}

// Pre-built skeleton components for common use cases
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 space-y-4">
      <SkeletonLoader variant="rectangular" height="200px" className="rounded-lg" />
      <div className="space-y-2">
        <SkeletonLoader variant="text" width="80%" />
        <SkeletonLoader variant="text" width="60%" />
      </div>
    </div>
  );
}

export function SkeletonPlaylistCard() {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
      <SkeletonLoader variant="rectangular" height="180px" />
      <div className="p-4 space-y-3">
        <SkeletonLoader variant="text" width="70%" height="20px" />
        <SkeletonLoader variant="text" width="50%" height="16px" />
        <div className="flex gap-2">
          <SkeletonLoader variant="rectangular" width="60px" height="24px" className="rounded-full" />
          <SkeletonLoader variant="rectangular" width="80px" height="24px" className="rounded-full" />
        </div>
      </div>
    </div>
  );
}

