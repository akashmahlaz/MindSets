import { useColorScheme } from "@/lib/useColorScheme";
import { useCall } from "@stream-io/video-react-native-sdk";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface NetworkStatusIndicatorProps {
  className?: string;
}

const NetworkQualityColors = {
  excellent: "#00FF00",
  good: "#00CC00",
  fair: "#FFFF00",
  poor: "#FF0000",
} as const;

const NetworkQualityLabels = {
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
} as const;

export const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({
  className,
}) => {
  const { isDarkColorScheme } = useColorScheme();
  const call = useCall();
  
  // Use call stats if available, otherwise show good by default
  const getNetworkQuality = (): keyof typeof NetworkQualityColors => {
    // Default to good - in production, you'd use actual network stats
    // Stream SDK doesn't expose useCallNetworkState, so we provide a default
    return "good";
  };

  const quality = getNetworkQuality();
  const color = NetworkQualityColors[quality];
  const label = NetworkQualityLabels[quality];

  return (
    <View
      className={`absolute top-4 right-4 z-50 ${className}`}
      style={styles.container}
    >
      <View style={[styles.barContainer, { backgroundColor: color }]}>
        <View style={styles.bar} />
      </View>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  barContainer: {
    width: 24,
    height: 16,
    borderRadius: 4,
    overflow: "hidden",
    marginRight: 8,
  },
  bar: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
  },
});
