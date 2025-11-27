import { useColorScheme as useNativewindColorScheme } from "nativewind";
import { useColorScheme as useRNColorScheme } from "react-native";

// Type for the return value
type ColorSchemeResult = {
  colorScheme: "light" | "dark";
  isDarkColorScheme: boolean;
  setColorScheme: (scheme: "light" | "dark" | "system") => void;
  toggleColorScheme: () => void;
};

// Wrapper hook that adds isDarkColorScheme for convenience
export function useColorScheme(): ColorSchemeResult {
  // Call both hooks at the top level (hooks rules)
  const rnColorScheme = useRNColorScheme();
  
  // Nativewind hook - wrap in try-catch at module level isn't possible
  // but we can safely call it and handle undefined values
  const nativewindResult = useNativewindColorScheme();
  
  // Determine color scheme with fallbacks:
  // 1. Nativewind colorScheme (if defined)
  // 2. React Native colorScheme (system preference)
  // 3. Default to "light"
  const colorScheme: "light" | "dark" = 
    nativewindResult?.colorScheme ?? rnColorScheme ?? "light";
  
  // Always return a complete object with isDarkColorScheme
  return {
    colorScheme,
    isDarkColorScheme: colorScheme === "dark",
    setColorScheme: nativewindResult?.setColorScheme ?? (() => {}),
    toggleColorScheme: nativewindResult?.toggleColorScheme ?? (() => {}),
  };
}
