import { useColorScheme } from "@/lib/useColorScheme";
import * as React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";
import { cn } from "~/lib/utils";

const duration = 1000;

interface SkeletonProps extends Omit<React.ComponentPropsWithoutRef<typeof Animated.View>, "style"> {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

function Skeleton({
  className,
  width,
  height,
  borderRadius,
  style,
  ...props
}: SkeletonProps) {
  const sv = useSharedValue(1);

  React.useEffect(() => {
    sv.value = withRepeat(
      withSequence(withTiming(0.5, { duration }), withTiming(1, { duration })),
      -1,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: sv.value,
  }));

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          width: width as any,
          height,
          borderRadius,
        },
        style,
      ]}
      className={cn("rounded-md bg-secondary dark:bg-muted", className)}
      {...props}
    />
  );
}

/**
 * Skeleton for text lines
 */
function SkeletonText({
  lines = 3,
  lastLineWidth = "60%",
  lineHeight = 14,
  spacing = 10,
}: {
  lines?: number;
  lastLineWidth?: string | number;
  lineHeight?: number;
  spacing?: number;
}) {
  return (
    <View style={{ gap: spacing }}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? lastLineWidth : "100%"}
          height={lineHeight}
          borderRadius={6}
        />
      ))}
    </View>
  );
}

/**
 * Skeleton for avatar/profile image
 */
function SkeletonAvatar({ size = 48 }: { size?: number }) {
  return <Skeleton width={size} height={size} borderRadius={size / 2} />;
}

/**
 * Skeleton for cards (counsellor card style)
 */
function SkeletonCard({
  hasImage = true,
  imageHeight = 180,
}: {
  hasImage?: boolean;
  imageHeight?: number;
}) {
  const { isDarkColorScheme } = useColorScheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDarkColorScheme ? "#171D26" : "#FFFFFF",
          borderColor: isDarkColorScheme ? "#323A48" : "#E2E5E9",
        },
      ]}
    >
      {hasImage && (
        <Skeleton
          width="100%"
          height={imageHeight}
          borderRadius={0}
          style={{ borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
        />
      )}
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Skeleton width="70%" height={20} borderRadius={8} />
          <Skeleton width={50} height={20} borderRadius={8} />
        </View>
        <Skeleton width="50%" height={16} borderRadius={6} style={{ marginTop: 8 }} />
        <View style={styles.cardFooter}>
          <Skeleton width={80} height={14} borderRadius={6} />
          <Skeleton width={70} height={18} borderRadius={6} />
        </View>
      </View>
    </View>
  );
}

/**
 * Skeleton for list items
 */
function SkeletonListItem({
  hasAvatar = true,
  avatarSize = 56,
}: {
  hasAvatar?: boolean;
  avatarSize?: number;
}) {
  const { isDarkColorScheme } = useColorScheme();

  return (
    <View
      style={[
        styles.listItem,
        {
          backgroundColor: isDarkColorScheme ? "#171D26" : "#FFFFFF",
          borderColor: isDarkColorScheme ? "#323A48" : "#E2E5E9",
        },
      ]}
    >
      {hasAvatar && <SkeletonAvatar size={avatarSize} />}
      <View style={styles.listItemContent}>
        <Skeleton width="60%" height={16} borderRadius={6} />
        <Skeleton width="40%" height={14} borderRadius={6} style={{ marginTop: 6 }} />
      </View>
      <Skeleton width={24} height={24} borderRadius={12} />
    </View>
  );
}

/**
 * Skeleton for article/resource cards
 */
function SkeletonArticle() {
  const { isDarkColorScheme } = useColorScheme();

  return (
    <View
      style={[
        styles.article,
        {
          backgroundColor: isDarkColorScheme ? "#171D26" : "#FFFFFF",
          borderColor: isDarkColorScheme ? "#323A48" : "#E2E5E9",
        },
      ]}
    >
      <Skeleton width={72} height={72} borderRadius={12} />
      <View style={styles.articleContent}>
        <Skeleton width="90%" height={16} borderRadius={6} />
        <Skeleton width="70%" height={14} borderRadius={6} style={{ marginTop: 6 }} />
        <View style={styles.articleMeta}>
          <Skeleton width={60} height={12} borderRadius={4} />
          <Skeleton width={50} height={12} borderRadius={4} />
        </View>
      </View>
    </View>
  );
}

/**
 * Skeleton for stats/metrics
 */
function SkeletonStats({ count = 3 }: { count?: number }) {
  const { isDarkColorScheme } = useColorScheme();

  return (
    <View style={styles.statsContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.statItem,
            {
              backgroundColor: isDarkColorScheme ? "#171D26" : "#FFFFFF",
              borderColor: isDarkColorScheme ? "#323A48" : "#E2E5E9",
            },
          ]}
        >
          <Skeleton width={44} height={44} borderRadius={22} />
          <Skeleton width="70%" height={12} borderRadius={4} style={{ marginTop: 10 }} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
  },
  listItemContent: {
    flex: 1,
  },
  article: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
  },
  articleContent: {
    flex: 1,
  },
  articleMeta: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
});

export { Skeleton, SkeletonArticle, SkeletonAvatar, SkeletonCard, SkeletonListItem, SkeletonStats, SkeletonText };
