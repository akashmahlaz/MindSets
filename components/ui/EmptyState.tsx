import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { Button } from "./button";
import { designTokens } from "@/lib/design-tokens";

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: "default" | "minimal";
}

export function EmptyState({
  icon = "document-outline",
  title,
  description,
  actionLabel,
  onAction,
  variant = "default",
}: EmptyStateProps) {
  if (variant === "minimal") {
    return (
      <View className="items-center justify-center py-12 px-6">
        <Ionicons
          name={icon}
          size={designTokens.icons["2xl"]}
          className="text-muted-foreground mb-3"
        />
        <Text className="text-foreground font-semibold text-base mb-1 text-center">
          {title}
        </Text>
        <Text className="text-muted-foreground text-sm text-center leading-relaxed">
          {description}
        </Text>
      </View>
    );
  }

  return (
    <View className="items-center justify-center py-16 px-6">
      <View className="w-20 h-20 bg-muted rounded-full items-center justify-center mb-6">
        <Ionicons
          name={icon}
          size={designTokens.icons["3xl"]}
          className="text-muted-foreground"
        />
      </View>
      <Text
        className="text-foreground font-semibold text-lg mb-2 text-center"
        style={designTokens.typography.h3}
      >
        {title}
      </Text>
      <Text
        className="text-muted-foreground text-sm text-center leading-relaxed max-w-sm mb-6"
        style={designTokens.typography.bodySmall}
      >
        {description}
      </Text>
      {actionLabel && onAction && (
        <Button onPress={onAction} variant="outline" className="min-w-[140px]">
          <Text className="text-foreground font-medium">{actionLabel}</Text>
        </Button>
      )}
    </View>
  );
}

