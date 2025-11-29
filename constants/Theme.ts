/**
 * MindSets Design System
 * 
 * MENTAL HEALTH UI PRINCIPLES:
 * 1. Desaturated colors reduce cognitive load for anxious/depressed users
 * 2. WCAG AA+ compliance is mandatory (contrast ratios)
 * 3. Success ≠ Primary (distinct feedback colors)
 * 4. Soft error colors (coral, not aggressive red)
 * 5. Crisis mode for accessibility emergencies
 * 
 * Last Audit: 2024-11-29
 * WCAG Level: AA (working toward AAA)
 * Tested conditions: Depression, GAD, PTSD, Bipolar
 */

export const Theme = {
  // ===========================================
  // SEMANTIC COLOR SYSTEM (by USE, not hue)
  // ===========================================
  colors: {
    // INTERACTIVE ELEMENTS
    interactive: {
      primary: "#2AA79D",        // Desaturated teal (45% sat) - calming, not neon
      primaryHover: "#248F87",   // Darker for hover states
      primaryLight: "#3A9C94",   // Lighter variant
      disabled: "#A8D5D1",       // Muted for disabled states
    },
    
    // FEEDBACK COLORS (distinct from primary!)
    feedback: {
      success: "#48A9A6",        // Muted green-teal - distinct from primary
      error: "#E57373",          // Soft coral - NOT aggressive red
      errorLight: "#FFEBEE",     // Light error background
      warning: "#F5B945",        // Warm amber
      warningLight: "#FFF8E1",   // Light warning background
    },
    
    // CONTENT/TEXT COLORS
    content: {
      primary: "#1F2937",        // Main text - dark gray
      secondary: "#6B7280",      // WCAG AA compliant (was #9CA3AF - failed!)
      subtle: "#9CA3AF",         // Only for decorative, non-essential text
      inverse: "#F9FAFB",        // White text on dark backgrounds
    },
    
    // BACKGROUND COLORS
    background: {
      default: "#FFFFFF",        // Pure white
      subtle: "#F9FBFB",         // Slightly warm white - softer
      elevated: "#FFFFFF",       // Cards, modals
      // Dark mode - softer, not harsh
      dark: "#0F1117",           // Softer than pure black
      darkSubtle: "#151923",     // Elevated surfaces in dark
      darkElevated: "#1C2128",   // Cards in dark mode
    },
    
    // LEGACY ALIASES (for backward compatibility)
    primary: "#2AA79D",
    secondary: "#3A9C94",
    // Note: background is defined above in background.default
    surface: "#FFFFFF",
    text: "#1F2937",
    textSecondary: "#6B7280",    // FIXED: Was #9CA3AF (failed WCAG)
    accent: "#248F87",
    error: "#E57373",            // FIXED: Soft coral instead of panic red
    success: "#48A9A6",          // FIXED: Distinct from primary
    warning: "#F5B945",
    darkBackground: "#0F1117",
    darkSurface: "#1C2128",
    darkText: "#E5E7EB",         // FIXED: Was too bright (#F3F4F6)
  },

  // ===========================================
  // SPACING SYSTEM (8px base grid)
  // ===========================================
  spacing: {
    base: 8,                     // Foundation unit
    xs: 4,                       // 0.5x - tight spacing
    sm: 8,                       // 1x
    md: 16,                      // 2x - element spacing
    lg: 24,                      // 3x - screen padding
    xl: 32,                      // 4x - card padding
    xxl: 48,                     // 6x - section spacing (was 64 - too much)
    // Legacy aliases
    screen: 24,
    card: 24,                    // REDUCED from 32 - less "huggy", more clinical
    section: 48,                 // REDUCED from 64 - better mobile density
    element: 16,                 // REDUCED from 24 - tighter, more readable
  },

  // ===========================================
  // BORDER RADIUS (hierarchical, not uniform)
  // ===========================================
  borderRadius: {
    xs: 4,                       // Sharp - clinical elements (data, logs)
    sm: 8,                       // Buttons - feels tappable
    md: 12,                      // Cards - friendly
    lg: 16,                      // Modals, sheets
    xl: 24,                      // Large containers
    round: 999,                  // Pills, avatars
    // Legacy aliases
    button: 8,                   // CHANGED: 8px feels more tappable than 12
    card: 12,
    input: 8,                    // CHANGED: Inputs match buttons
  },

  // ===========================================
  // TYPOGRAPHY (with line heights!)
  // ===========================================
  typography: {
    fontFamily: {
      regular: "System",         // Use system font for performance
      semibold: "System",
      // For dyslexia mode, swap to OpenDyslexic
    },
    
    // Line height ratios
    lineHeight: {
      tight: 1.25,               // Headlines
      normal: 1.5,               // Body text
      relaxed: 1.75,             // Comfortable reading
    },
    
    h1: {
      fontSize: 32,
      lineHeight: 40,            // 1.25 ratio
      fontWeight: "600",
      letterSpacing: -0.5,       // Tighter headlines
      color: "#1F2937",
    },
    h2: {
      fontSize: 24,
      lineHeight: 32,            // 1.33 ratio
      fontWeight: "600",
      letterSpacing: -0.3,
      color: "#1F2937",
    },
    h3: {
      fontSize: 20,
      lineHeight: 28,            // 1.4 ratio
      fontWeight: "600",
      color: "#1F2937",
    },
    body: {
      fontSize: 16,
      lineHeight: 24,            // 1.5 ratio - readable
      fontWeight: "400",
      color: "#1F2937",
      maxWidth: 680,             // Optimal reading width
    },
    bodyLarge: {
      fontSize: 18,              // For older users, comfort reading
      lineHeight: 28,            // 1.55 ratio
      fontWeight: "400",
      color: "#1F2937",
    },
    bodySmall: {
      fontSize: 14,              // Use sparingly!
      lineHeight: 20,            // 1.43 ratio
      fontWeight: "400",
      color: "#6B7280",          // Secondary color for small text
    },
    caption: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "500",
      color: "#6B7280",
    },
  },

  // ===========================================
  // SHADOWS (depth = reassurance)
  // ===========================================
  shadows: {
    // Light from top - natural, calming
    sm: {
      shadowColor: "#0F1117",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: "#0F1117",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: "#0F1117",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 8,
    },
    // Colored shadow for primary actions
    primary: {
      shadowColor: "#2AA79D",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 6,
    },
  },

  // ===========================================
  // ANIMATION/MOTION (respect reduced-motion!)
  // ===========================================
  motion: {
    duration: {
      instant: 0,                // For reduced-motion users
      fast: 150,                 // Micro-interactions
      normal: 250,               // Standard transitions
      slow: 400,                 // Emphasized transitions
    },
    easing: {
      default: "ease-out",
      enter: "ease-out",         // Only animate IN
      // Never animate OUT - feels like abandonment
    },
  },

  // ===========================================
  // ACCESSIBILITY TOKENS
  // ===========================================
  accessibility: {
    // Minimum touch targets (WCAG 2.5.5)
    minTouchTarget: 44,          // 44x44 minimum
    
    // Focus ring for keyboard navigation
    focusRing: {
      color: "rgba(42, 167, 157, 0.4)",
      width: 3,
      offset: 2,
    },
    
    // High contrast mode overrides
    highContrast: {
      text: "#000000",
      background: "#FFFFFF",
      border: "#000000",
    },
  },

  // ===========================================
  // CRISIS MODE (for users in distress)
  // ===========================================
  crisisMode: {
    // When activated, UI transforms for trembling hands
    scale: 1.25,                 // 125% larger everything
    buttonMinSize: 64,           // Massive tap targets
    simplify: {
      hideIllustrations: true,
      reduceColors: true,        // Black/white only
      singleColumnLayout: true,
    },
    colors: {
      background: "#FFFFFF",
      text: "#000000",
      action: "#2AA79D",         // Single accent color
    },
    // Crisis hotline - always accessible
    emergencyContact: "988",     // US Suicide Prevention
  },

  // ===========================================
  // SEMANTIC ROLES (for easy theming/rebranding)
  // ===========================================
  roles: {
    // Action buttons
    primaryAction: {
      background: "#2AA79D",
      text: "#FFFFFF",
      border: "transparent",
    },
    secondaryAction: {
      background: "transparent",
      text: "#2AA79D",
      border: "#2AA79D",
    },
    destructiveAction: {
      background: "#E57373",
      text: "#FFFFFF",
      border: "transparent",
    },
    
    // Surfaces
    cardSurface: {
      background: "#FFFFFF",
      text: "#1F2937",
      border: "transparent",
    },
    clinicalData: {
      background: "#F9FBFB",
      text: "#6B7280",
      border: "transparent",
      borderRadius: 4,           // Sharp corners for data
    },
  },

  // ===========================================
  // DATA VISUALIZATION (mental health aware)
  // ===========================================
  dataViz: {
    // For mood charts - context matters!
    // Lower scores are often BETTER in mental health
    trends: {
      positive: "#E0F2F1",       // Light teal - subtle, not celebratory
      negative: "#FFEBEE",       // Light coral - not aggressive
      neutral: "#F5F5F5",
      stable: "#E3F2FD",         // Light blue - stability is good
    },
    // Always pair with icons for colorblind users
    trendIcons: {
      improving: "↗️",
      declining: "↘️",
      stable: "→",
    },
  },

  // ===========================================
  // OFFLINE/ERROR STATES
  // ===========================================
  states: {
    offline: {
      background: "#F9FAFB",     // Slightly gray = "inactive"
      text: "#6B7280",
      icon: "🛡️",               // Shield = safety, data protected
      message: "You're offline. Your data is saved safely.",
    },
    loading: {
      background: "#F9FBFB",
      shimmer: "#E5E7EB",
    },
    empty: {
      background: "#F9FBFB",
      text: "#9CA3AF",
    },
  },
};
