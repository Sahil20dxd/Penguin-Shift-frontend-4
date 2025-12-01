// src/components/PageTransition.tsx
// Smooth page transition wrapper for better UX
import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";

interface PageTransitionProps {
  children: React.ReactNode;
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -10,
  },
};

const pageTransition = {
  type: "tween",
  ease: [0.4, 0, 0.2, 1], // Custom cubic-bezier for smoother animation
  duration: 0.2,
};

export default function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();

  // Scroll to top and focus management on route change for better UX
  useEffect(() => {
    // Use requestAnimationFrame for smoother scroll
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Focus management for accessibility
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
          mainContent.focus();
        }, 100);
      }
    });
  }, [location.pathname]);

  return (
    <motion.div
      key={location.pathname}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={pageTransition}
      className="w-full"
      style={{ willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  );
}

