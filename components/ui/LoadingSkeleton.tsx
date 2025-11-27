import { DimensionValue, View } from "react-native";

interface LoadingSkeletonProps {
  variant?: "text" | "avatar" | "card" | "image" | "button";
  width?: DimensionValue;
  height?: number;
  className?: string;
  lines?: number;
}

export function LoadingSkeleton({
  variant = "text",
  width,
  height,
  className = "",
  lines = 1,
}: LoadingSkeletonProps) {
  const baseClasses = "bg-muted rounded-md animate-pulse";

  if (variant === "text") {
    return (
      <View className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <View
            key={i}
            className={`${baseClasses} ${className}`}
            style={{
              width: width ?? (i === lines - 1 ? "75%" : "100%"),
              height: height ?? 16,
            }}
          />
        ))}
      </View>
    );
  }

  if (variant === "avatar") {
    const size = typeof width === "number" ? width : 48;
    return (
      <View
        className={`${baseClasses} ${className}`}
        style={{
          width: width ?? 48,
          height: height ?? 48,
          borderRadius: size / 2,
        }}
      />
    );
  }

  if (variant === "card") {
    return (
      <View
        className={`${baseClasses} ${className}`}
        style={{
          width: width ?? "100%",
          height: height ?? 120,
        }}
      />
    );
  }

  if (variant === "image") {
    return (
      <View
        className={`${baseClasses} ${className}`}
        style={{
          width: width ?? "100%",
          height: height ?? 200,
        }}
      />
    );
  }

  if (variant === "button") {
    return (
      <View
        className={`${baseClasses} ${className}`}
        style={{
          width: width ?? 120,
          height: height ?? 44,
        }}
      />
    );
  }

  return null;
}

