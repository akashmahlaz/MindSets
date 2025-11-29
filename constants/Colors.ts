/**
 * MindSets Color System
 * 
 * MENTAL HEALTH OPTIMIZED:
 * - Desaturated primary (45% sat) - calming, not neon
 * - WCAG AA compliant contrast ratios
 * - Soft error colors (coral, not panic red)
 * - Dark mode optimized for reduced eye strain
 */

// Desaturated teal - calming, professional, accessible
const primaryColor = "#2AA79D";

export const Colors = {
  light: {
    text: "#1F2937",
    textSecondary: "#6B7280",      // WCAG AA compliant
    background: "#FFFFFF",
    surface: "#F9FBFB",            // Slightly warm white
    tint: primaryColor,
    icon: "#6B7280",               // Better contrast than #9CA3AF
    tabIconDefault: "#9CA3AF",
    tabIconSelected: primaryColor,
    // Feedback colors
    success: "#48A9A6",            // Distinct from primary
    error: "#E57373",              // Soft coral
    warning: "#F5B945",
  },
  dark: {
    text: "#E5E7EB",               // Softer than #F3F4F6
    textSecondary: "#9CA3AF",
    background: "#0F1117",         // Softer black
    surface: "#1C2128",
    tint: primaryColor,
    icon: "#9CA3AF",
    tabIconDefault: "#6B7280",
    tabIconSelected: primaryColor,
    // Feedback colors
    success: "#48A9A6",
    error: "#E57373",
    warning: "#F5B945",
  },
};
