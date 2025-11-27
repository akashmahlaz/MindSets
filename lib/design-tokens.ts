/**
 * World-Class Design Tokens - Single source of truth for all design values
 * Based on Material Design 3 + Apple Human Interface Guidelines
 * Optimized for mental health application context
 * 
 * Philosophy:
 * - Calm, trustworthy colors that reduce anxiety
 * - Generous whitespace for breathing room
 * - Smooth animations for delightful interactions
 * - Accessible contrast ratios throughout
 */

export const designTokens = {
  // ============================================
  // COLOR SYSTEM - Material Design 3 Inspired
  // ============================================
  colors: {
    // Primary - Calming Indigo (Trust & Serenity)
    primary: {
      50: "#EEF2FF",
      100: "#E0E7FF",
      200: "#C7D2FE",
      300: "#A5B4FC",
      400: "#818CF8",
      500: "#6366F1", // Main
      600: "#4F46E5",
      700: "#4338CA",
      800: "#3730A3",
      900: "#312E81",
    },
    
    // Secondary - Sage Green (Growth & Healing)
    secondary: {
      50: "#ECFDF5",
      100: "#D1FAE5",
      200: "#A7F3D0",
      300: "#6EE7B7",
      400: "#34D399",
      500: "#10B981", // Main
      600: "#059669",
      700: "#047857",
      800: "#065F46",
      900: "#064E3B",
    },
    
    // Accent - Lavender (Mindfulness & Calm)
    accent: {
      50: "#F5F3FF",
      100: "#EDE9FE",
      200: "#DDD6FE",
      300: "#C4B5FD",
      400: "#A78BFA",
      500: "#8B5CF6", // Main
      600: "#7C3AED",
      700: "#6D28D9",
      800: "#5B21B6",
      900: "#4C1D95",
    },
    
    // Warm - For CTAs and highlights
    warm: {
      50: "#FFF7ED",
      100: "#FFEDD5",
      200: "#FED7AA",
      300: "#FDBA74",
      400: "#FB923C",
      500: "#F97316", // Main
      600: "#EA580C",
      700: "#C2410C",
    },
    
    // Semantic colors
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#0EA5E9",
    
    // Surface colors - Light mode
    light: {
      background: "#FAFBFC",
      surface: "#FFFFFF",
      surfaceElevated: "#FFFFFF",
      surfaceContainer: "#F4F5F7",
      onSurface: "#1E2530",
      onSurfaceVariant: "#64748B",
      outline: "#E2E8F0",
      outlineVariant: "#CBD5E1",
    },
    
    // Surface colors - Dark mode
    dark: {
      background: "#0F172A",
      surface: "#1E293B",
      surfaceElevated: "#334155",
      surfaceContainer: "#1E293B",
      onSurface: "#F1F5F9",
      onSurfaceVariant: "#94A3B8",
      outline: "#334155",
      outlineVariant: "#475569",
    },
  },
  
  // ============================================
  // SPACING - 4px Grid System
  // ============================================
  spacing: {
    "0": 0,
    "0.5": 2,
    "1": 4,
    "1.5": 6,
    "2": 8,
    "2.5": 10,
    "3": 12,
    "3.5": 14,
    "4": 16,
    "5": 20,
    "6": 24,
    "7": 28,
    "8": 32,
    "9": 36,
    "10": 40,
    "11": 44,
    "12": 48,
    "14": 56,
    "16": 64,
    "20": 80,
    "24": 96,
    "32": 128,
  },
  
  // Screen padding
  screenPadding: {
    horizontal: 24,
    top: 16,
    bottom: 32,
  },
  
  // ============================================
  // BORDER RADIUS - Material Design 3 Scale
  // ============================================
  borderRadius: {
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    "2xl": 24,
    "3xl": 28,
    full: 9999,
  },
  
  // ============================================
  // TYPOGRAPHY - Clean, Readable Scale
  // ============================================
  typography: {
    // Display - Hero sections
    displayLarge: {
      fontSize: 57,
      fontWeight: "400" as const,
      lineHeight: 64,
      letterSpacing: -0.25,
    },
    displayMedium: {
      fontSize: 45,
      fontWeight: "400" as const,
      lineHeight: 52,
      letterSpacing: 0,
    },
    displaySmall: {
      fontSize: 36,
      fontWeight: "400" as const,
      lineHeight: 44,
      letterSpacing: 0,
    },
    
    // Headlines - Section headers
    headlineLarge: {
      fontSize: 32,
      fontWeight: "500" as const,
      lineHeight: 40,
      letterSpacing: -0.3,
    },
    headlineMedium: {
      fontSize: 28,
      fontWeight: "500" as const,
      lineHeight: 36,
      letterSpacing: -0.2,
    },
    headlineSmall: {
      fontSize: 24,
      fontWeight: "500" as const,
      lineHeight: 32,
      letterSpacing: 0,
    },
    
    // Titles - Card headers
    titleLarge: {
      fontSize: 22,
      fontWeight: "500" as const,
      lineHeight: 28,
      letterSpacing: 0,
    },
    titleMedium: {
      fontSize: 16,
      fontWeight: "600" as const,
      lineHeight: 24,
      letterSpacing: 0.15,
    },
    titleSmall: {
      fontSize: 14,
      fontWeight: "600" as const,
      lineHeight: 20,
      letterSpacing: 0.1,
    },
    
    // Body - Main content
    bodyLarge: {
      fontSize: 16,
      fontWeight: "400" as const,
      lineHeight: 24,
      letterSpacing: 0.5,
    },
    bodyMedium: {
      fontSize: 14,
      fontWeight: "400" as const,
      lineHeight: 20,
      letterSpacing: 0.25,
    },
    bodySmall: {
      fontSize: 12,
      fontWeight: "400" as const,
      lineHeight: 16,
      letterSpacing: 0.4,
    },
    
    // Labels - Buttons, chips
    labelLarge: {
      fontSize: 14,
      fontWeight: "600" as const,
      lineHeight: 20,
      letterSpacing: 0.1,
    },
    labelMedium: {
      fontSize: 12,
      fontWeight: "600" as const,
      lineHeight: 16,
      letterSpacing: 0.5,
    },
    labelSmall: {
      fontSize: 11,
      fontWeight: "600" as const,
      lineHeight: 16,
      letterSpacing: 0.5,
    },
    
    // Legacy aliases for backwards compatibility
    h1: {
      fontSize: 32,
      fontWeight: "500" as const,
      lineHeight: 40,
      letterSpacing: -0.3,
    },
    h2: {
      fontSize: 28,
      fontWeight: "500" as const,
      lineHeight: 36,
      letterSpacing: -0.2,
    },
    h3: {
      fontSize: 24,
      fontWeight: "500" as const,
      lineHeight: 32,
      letterSpacing: 0,
    },
  },
  
  // ============================================
  // ELEVATION - Material Design 3 Shadows
  // ============================================
  elevation: {
    level0: {
      shadowColor: "transparent",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    level1: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    level2: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 2,
    },
    level3: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    level4: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 6,
    },
    level5: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.14,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  
  // ============================================
  // ANIMATION - Smooth, Purposeful Motion
  // ============================================
  animation: {
    // Durations
    duration: {
      instant: 100,
      fast: 200,
      normal: 300,
      slow: 400,
      slower: 500,
      slowest: 700,
    },
    
    // Easing curves (CSS cubic-bezier values)
    easing: {
      // Standard - most common
      standard: "cubic-bezier(0.2, 0, 0, 1)",
      // Emphasized - important transitions
      emphasized: "cubic-bezier(0.2, 0, 0, 1)",
      // Decelerate - entering elements
      decelerate: "cubic-bezier(0, 0, 0, 1)",
      // Accelerate - exiting elements
      accelerate: "cubic-bezier(0.3, 0, 1, 1)",
      // Linear - progress indicators
      linear: "linear",
    },
    
    // Spring configs for React Native Animated
    spring: {
      gentle: { tension: 40, friction: 7 },
      default: { tension: 50, friction: 8 },
      bouncy: { tension: 60, friction: 6 },
      stiff: { tension: 100, friction: 10 },
    },
  },
  
  // ============================================
  // TOUCH TARGETS - Accessibility
  // ============================================
  touchTargets: {
    minimum: 44,      // iOS minimum
    comfortable: 48,  // Material recommended
    large: 56,        // For important actions
  },
  
  // ============================================
  // ICONS - Consistent Scale
  // ============================================
  icons: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 28,
    "2xl": 32,
    "3xl": 40,
    "4xl": 48,
  },
  
  // ============================================
  // OPACITY - State Modifiers
  // ============================================
  opacity: {
    disabled: 0.38,   // Material Design 3 standard
    hover: 0.08,      // Hover overlay
    focus: 0.12,      // Focus overlay
    pressed: 0.12,    // Press overlay
    dragged: 0.16,    // Drag overlay
  },
} as const;

// Helper functions
export const getColor = (colorPath: string, isDark: boolean = false) => {
  const tokens = designTokens.colors;
  
  // Handle surface colors
  if (colorPath.startsWith("surface") || colorPath.startsWith("on")) {
    const key = colorPath as keyof typeof tokens.light;
    return isDark ? tokens.dark[key] : tokens.light[key];
  }
  
  return null;
};

export default designTokens;

