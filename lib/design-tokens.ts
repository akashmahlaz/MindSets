/**
 * Professional Design Tokens - Single source of truth for all design values
 * Based on 4px grid system for consistent spacing
 * Optimized for mental health application context
 */

export const designTokens = {
  colors: {
    // Primary colors from theme
    primary: "hsl(var(--primary))",
    primaryForeground: "hsl(var(--primary-foreground))",
    secondary: "hsl(var(--secondary))",
    secondaryForeground: "hsl(var(--secondary-foreground))",
    
    // Status colors - Professional, calming palette
    success: "hsl(var(--success))",
    successForeground: "hsl(var(--success-foreground))",
    warning: "hsl(var(--warning))",
    warningForeground: "hsl(var(--warning-foreground))",
    destructive: "hsl(var(--destructive))",
    destructiveForeground: "hsl(var(--destructive-foreground))",
    info: "hsl(var(--info))",
    infoForeground: "hsl(var(--info-foreground))",
  },
  
  // 4px grid spacing system - Professional spacing scale
  spacing: {
    "0": 0,
    "1": 4,   // 0.25rem
    "2": 8,   // 0.5rem
    "3": 12,  // 0.75rem
    "4": 16,  // 1rem
    "5": 20,  // 1.25rem
    "6": 24,  // 1.5rem
    "8": 32,  // 2rem
    "10": 40, // 2.5rem
    "12": 48, // 3rem
    "16": 64, // 4rem
    "20": 80, // 5rem
  },
  
  // Professional border radius scale
  borderRadius: {
    none: 0,
    sm: 6,    // Subtle rounding
    md: 8,    // Standard cards
    lg: 12,   // Large cards
    xl: 16,   // Extra large
    "2xl": 20, // Hero elements
    full: 9999,
  },
  
  // Professional typography scale - Clear hierarchy
  typography: {
    display: {
      fontSize: 36,
      fontWeight: "700" as const,
      lineHeight: 44,
      letterSpacing: -0.5,
    },
    h1: {
      fontSize: 28,
      fontWeight: "700" as const,
      lineHeight: 36,
      letterSpacing: -0.3,
    },
    h2: {
      fontSize: 24,
      fontWeight: "600" as const,
      lineHeight: 32,
      letterSpacing: -0.2,
    },
    h3: {
      fontSize: 20,
      fontWeight: "600" as const,
      lineHeight: 28,
      letterSpacing: 0,
    },
    h4: {
      fontSize: 18,
      fontWeight: "600" as const,
      lineHeight: 24,
      letterSpacing: 0,
    },
    body: {
      fontSize: 16,
      fontWeight: "400" as const,
      lineHeight: 24,
      letterSpacing: 0,
    },
    bodyMedium: {
      fontSize: 16,
      fontWeight: "500" as const,
      lineHeight: 24,
      letterSpacing: 0,
    },
    bodySmall: {
      fontSize: 14,
      fontWeight: "400" as const,
      lineHeight: 20,
      letterSpacing: 0,
    },
    caption: {
      fontSize: 12,
      fontWeight: "400" as const,
      lineHeight: 16,
      letterSpacing: 0.2,
    },
    label: {
      fontSize: 14,
      fontWeight: "500" as const,
      lineHeight: 20,
      letterSpacing: 0.1,
    },
  },
  
  // Professional elevation system (shadows)
  elevation: {
    none: {
      shadowColor: "transparent",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    sm: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    xl: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  
  // Touch target minimums (WCAG AAA)
  touchTargets: {
    minimum: 44, // iOS/Android minimum
    recommended: 48, // Better for accessibility
    comfortable: 56, // Most comfortable
  },
  
  // Professional icon sizes - Consistent scale
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
  
  // Professional animation timings
  animation: {
    fast: 150,
    normal: 200,
    slow: 300,
    slower: 500,
  },
  
  // Professional opacity scale
  opacity: {
    disabled: 0.4,
    hover: 0.8,
    pressed: 0.6,
    overlay: 0.5,
  },
} as const;

// Helper function to get color class name
export const getColorClass = (color: string, variant: "text" | "bg" | "border" = "text") => {
  const colorMap: Record<string, string> = {
    primary: `text-primary`,
    success: `text-success`,
    warning: `text-warning`,
    destructive: `text-destructive`,
    muted: `text-muted-foreground`,
  };
  
  if (variant === "bg") {
    return colorMap[color]?.replace("text-", "bg-") || `bg-${color}`;
  }
  if (variant === "border") {
    return colorMap[color]?.replace("text-", "border-") || `border-${color}`;
  }
  return colorMap[color] || `text-${color}`;
};

// Status color helper
export const getStatusColor = (status: "online" | "away" | "offline" | "pending" | "confirmed" | "completed" | "cancelled") => {
  const statusColors: Record<string, string> = {
    online: "bg-success",
    away: "bg-warning",
    offline: "bg-muted",
    pending: "bg-warning",
    confirmed: "bg-success",
    completed: "bg-success",
    cancelled: "bg-destructive",
  };
  return statusColors[status] || "bg-muted";
};

