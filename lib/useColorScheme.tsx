import { useColorScheme as useNativewindColorScheme } from "nativewind";
import { useColorScheme as useRNColorScheme } from "react-native";

export function useColorScheme() {
  const nativewind = useNativewindColorScheme();
  const systemColorScheme = useRNColorScheme();
  
  // Use nativewind colorScheme if available, otherwise fall back to system
  const colorScheme = nativewind?.colorScheme ?? systemColorScheme ?? "light";
  
  return {
    colorScheme,
    isDarkColorScheme: colorScheme === "dark",
    setColorScheme: nativewind?.setColorScheme ?? (() => {}),
    toggleColorScheme: nativewind?.toggleColorScheme ?? (() => {}),
  };
}
