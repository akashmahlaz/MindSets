export const Theme = {
  colors: {
    // Industry-Competitive Minimal Palette - Material Design 3 Inspired
    primary: "#6366F1", // Indigo - Calming, professional (Material Design 3)
    background: "#FFFFFF", // Pure white
    surface: "#FFFFFF", // Pure white for cards
    text: "#1F2937", // Dark Gray
    textSecondary: "#9CA3AF", // Light gray for secondary text
    accent: "#8B5CF6", // Digital Lavender (optional highlights)
    error: "#EF4444", // Red (critical actions only)
    // Dark mode colors (soft, not harsh)
    darkBackground: "#141820", // Soft dark gray (not pure black)
    darkSurface: "#1C2128", // Slightly lighter for cards
    darkText: "#F3F4F6", // Off-white for dark mode
  },
  spacing: {
    // Generous whitespace - Industry standard
    screen: 24, // Screen padding
    card: 32, // Card padding
    section: 64, // Section spacing
    element: 24, // Element spacing
  },
  borderRadius: {
    // Rounded - Modern, friendly
    button: 12, // Buttons (rounded-lg)
    card: 12, // Cards (rounded-lg)
    input: 12, // Inputs (rounded-lg)
  },
  typography: {
    // Clean typography - 2 weights only
    h1: {
      fontSize: 32,
      fontWeight: "600", // Semibold only
      color: "#1F2937",
    },
    h2: {
      fontSize: 24,
      fontWeight: "600", // Semibold only
      color: "#1F2937",
    },
    h3: {
      fontSize: 20,
      fontWeight: "600", // Semibold only
      color: "#1F2937",
    },
    body: {
      fontSize: 16,
      fontWeight: "400", // Regular
      color: "#1F2937",
    },
    bodySmall: {
      fontSize: 14,
      fontWeight: "400", // Regular
      color: "#1F2937",
    },
  },
};
