// Optimized animation configuration for performance
// Uses GPU-accelerated properties and respects user preferences

import { motionValue } from 'framer-motion'

export const animationConfig = {
  // Check if user prefers reduced motion
  shouldAnimate: () => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  },

  // iOS-style tab transitions
  tabTransition: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
      mass: 0.8,
    },
  },

  // Fast fade for overlays
  fadeTransition: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
  },

  // Card entrance animations (staggered)
  cardEntrance: (index = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: {
      delay: index * 0.05,
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1],
    },
  }),

  // Hover scale (minimal, performant)
  hoverScale: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: { duration: 0.15 },
  },

  // Spring animations for interactive elements
  spring: {
    type: 'spring',
    stiffness: 400,
    damping: 25,
  },

  // Optimized layout animations
  layout: {
    layout: true,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },

  // Page transition variants
  pageVariants: {
    initial: { opacity: 0, x: -10 },
    enter: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
    },
    exit: {
      opacity: 0,
      x: 10,
      transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] },
    },
  },
}

// Utility to create optimized motion values (SSR-safe, no hooks)
export const createMotionValue = (initialValue) => {
  if (typeof window === 'undefined') {
    // Lightweight shim for SSR to avoid undefined access
    let v = initialValue
    const listeners = new Set()
    return {
      get: () => v,
      set: (nv) => {
        v = nv
        listeners.forEach((fn) => fn(v))
      },
      on: (_event, fn) => {
        listeners.add(fn)
        return () => listeners.delete(fn)
      },
    }
  }
  return motionValue(initialValue)
}

// Performance monitoring helper
export const logPerformance = (label) => {
  if (
    process.env.NODE_ENV === 'development' &&
    typeof performance !== 'undefined' &&
    performance.mark
  ) {
    performance.mark(label)
  }
}
