import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import { cn } from "@/lib/utils";

interface StatusIndicatorProps {
  status: "online" | "away" | "offline" | "pending" | "confirmed" | "completed" | "cancelled";
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

const statusConfig = {
  online: {
    bg: "bg-success",
    icon: "radio-button-on" as const,
  },
  away: {
    bg: "bg-warning",
    icon: "time" as const,
  },
  offline: {
    bg: "bg-muted",
    icon: "radio-button-off" as const,
  },
  pending: {
    bg: "bg-warning",
    icon: "hourglass" as const,
  },
  confirmed: {
    bg: "bg-success",
    icon: "checkmark-circle" as const,
  },
  completed: {
    bg: "bg-success",
    icon: "checkmark-done-circle" as const,
  },
  cancelled: {
    bg: "bg-destructive",
    icon: "close-circle" as const,
  },
};

const sizeConfig = {
  sm: { dot: 8, icon: 12 },
  md: { dot: 12, icon: 16 },
  lg: { dot: 16, icon: 20 },
};

export function StatusIndicator({ 
  status, 
  size = "md", 
  showIcon = false,
  className 
}: StatusIndicatorProps) {
  const config = statusConfig[status];
  const sizes = sizeConfig[size];

  if (showIcon) {
    return (
      <View className={cn("items-center justify-center", className)}>
        <Ionicons 
          name={config.icon} 
          size={sizes.icon} 
          className={config.bg.replace("bg-", "text-")}
        />
      </View>
    );
  }

  return (
    <View
      className={cn(
        "rounded-full border-2 border-card",
        config.bg,
        className
      )}
      style={{
        width: sizes.dot,
        height: sizes.dot,
      }}
    />
  );
}

