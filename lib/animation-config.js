// Optimized animation configuration for performance
// Uses GPU-accelerated properties and respects user preferences

export const animationConfig = {
  // Check if user prefers reduced motion
  shouldAnimate: () => {
    if (typeof window === 'undefined') return true
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
    }
  },

  // Fast fade for overlays
  fadeTransition: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 }
  },

  // Card entrance animations (staggered)
  cardEntrance: (index = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: {
      delay: index * 0.05, // Reduced from 0.1s to 0.05s
      duration: 0.3, // Reduced from 0.5s
      ease: [0.25, 0.1, 0.25, 1] // Custom cubic-bezier for smooth feel
    }
  }),

  // Hover scale (minimal, performant)
  hoverScale: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: { duration: 0.15 }
  },

  // Spring animations for interactive elements
  spring: {
    type: 'spring',
    stiffness: 400,
    damping: 25
  },

  // Optimized layout animations
  layout: {
    layout: true,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30
    }
  },

  // Page transition variants
  pageVariants: {
    initial: {
      opacity: 0,
      x: -10
    },
    enter: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1]
      }
    },
    exit: {
      opacity: 0,
      x: 10,
      transition: {
        duration: 0.2,
        ease: [0.25, 0.1, 0.25, 1]
      }
    }
  }
}

// Utility to create optimized motion values
export const createMotionValue = (initialValue) => {
  if (typeof window === 'undefined') return { get: () => initialValue }
  
  const { useMotionValue } = require('framer-motion')
  return useMotionValue(initialValue)
}

// Performance monitoring helper
export const logPerformance = (label) => {
  if (process.env.NODE_ENV === 'development') {
    performance.mark(label)
  }
}
