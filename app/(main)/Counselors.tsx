import "@/app/global.css";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/lib/useColorScheme";
import { getCounsellors } from "@/services/userService";
import { CounsellorProfileData } from "@/types/user";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.35;

// Card matching the existing layout style
function CounsellorCard({
  counsellor,
  index,
  colors,
  onPress,
  isDark,
}: {
  counsellor: CounsellorProfileData;
  index: number;
  colors: Record<string, string>;
  onPress: () => void;
  isDark: boolean;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 50,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, index]);

  // Vibrant gradient colors for placeholder initials
  const gradientSets = [
    ["#C6F135", "#B8E62E"], // Yellow-green like in screenshot
    ["#14B8A6", "#2DD4BF"], // Teal
    ["#3B82F6", "#60A5FA"], // Blue (instead of purple)
    ["#F472B6", "#EC4899"], // Pink
  ];

  const isOnline = counsellor.status === "online";
  const rating = counsellor.averageRating?.toFixed(1) || "4.9";
  const specialty =
    counsellor.specializations?.[0]
      ?.replace(/-/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase()) || "Mental Health";

  return (
    <Animated.View
      style={{
        width: CARD_WIDTH,
        marginBottom: 16,
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
      }}
    >
      <Pressable
        onPress={onPress}
        style={{
          borderRadius: 16,
          overflow: "hidden",
          backgroundColor: isDark ? "#1E2733" : "#FFFFFF",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 12,
          elevation: 6,
        }}
      >
        {/* Image Section */}
        <View style={{ height: CARD_HEIGHT * 0.65, position: "relative" }}>
          {counsellor.photoURL ? (
            <Image
              source={{ uri: counsellor.photoURL }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={gradientSets[index % 4] as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: "100%",
                height: "100%",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 48,
                  fontWeight: "800",
                  color: index % 4 === 0 ? "#1F2937" : "#FFF",
                  letterSpacing: 2,
                }}
              >
                {counsellor.displayName
                  ?.split(" ")
                  .map((n) => n.charAt(0))
                  .join("")
                  .substring(0, 2)
                  .toUpperCase() || "C"}
              </Text>
            </LinearGradient>
          )}

          {/* Verified Badge - Top Left */}
          {counsellor.verificationStatus === "verified" && (
            <View
              style={{
                position: "absolute",
                top: 10,
                left: 10,
                backgroundColor: "#22C55E",
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 10,
              }}
            >
              <Ionicons name="checkmark-circle" size={12} color="#FFF" />
              <Text style={{ fontSize: 10, color: "#FFF", fontWeight: "600", marginLeft: 4 }}>
                Verified
              </Text>
            </View>
          )}

          {/* Online Dot - Top Right */}
          {isOnline && (
            <View
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: "#22C55E",
                borderWidth: 2,
                borderColor: isDark ? "#1E2733" : "#FFF",
              }}
            />
          )}
        </View>

        {/* Info Section - Theme Aware */}
        <View
          style={{
            backgroundColor: isDark ? "#1A2332" : "#FFFFFF",
            padding: 12,
            borderTopWidth: isDark ? 0 : 1,
            borderTopColor: "#E5E7EB",
          }}
        >
          {/* Name */}
          <Text
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: isDark ? "#FFF" : "#1F2937",
              marginBottom: 2,
            }}
            numberOfLines={1}
          >
            Dr. {counsellor.displayName}
          </Text>

          {/* Specialty */}
          <Text
            style={{
              fontSize: 12,
              color: isDark ? "rgba(255,255,255,0.7)" : "#6B7280",
              marginBottom: 10,
            }}
            numberOfLines={1}
          >
            {specialty}
          </Text>

          {/* Rating & Price Row */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Rating */}
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="star" size={14} color="#FBBF24" />
              <Text style={{ fontSize: 14, color: isDark ? "#FFF" : "#1F2937", fontWeight: "600", marginLeft: 4 }}>
                {rating}
              </Text>
            </View>

            {/* Price Badge */}
            <View
              style={{
                backgroundColor: isDark ? "rgba(42, 167, 157, 0.2)" : "rgba(42, 167, 157, 0.15)",
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
              }}
            >
              <Text style={{ fontSize: 13, color: "#2AA79D", fontWeight: "700" }}>
                ${counsellor.hourlyRate || 80}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// Grid Skeleton matching the layout
function GridSkeleton({ colors, isDark }: { colors: Record<string, string>; isDark: boolean }) {
  const shimmerAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 0.6, duration: 800, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [shimmerAnim]);

  return (
    <Animated.View
      style={{
        width: CARD_WIDTH,
        marginBottom: 16,
        borderRadius: 16,
        overflow: "hidden",
        opacity: shimmerAnim,
      }}
    >
      {/* Image placeholder */}
      <View
        style={{
          height: CARD_HEIGHT * 0.65,
          backgroundColor: isDark ? "#2D3748" : "#E2E8F0",
        }}
      />
      {/* Info placeholder */}
      <View
        style={{
          backgroundColor: isDark ? "#1A2332" : "#FFFFFF",
          padding: 12,
          borderTopWidth: isDark ? 0 : 1,
          borderTopColor: "#E5E7EB",
        }}
      >
        <View
          style={{
            width: "80%",
            height: 16,
            backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB",
            borderRadius: 4,
            marginBottom: 6,
          }}
        />
        <View
          style={{
            width: "50%",
            height: 12,
            backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB",
            borderRadius: 4,
            marginBottom: 10,
          }}
        />
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <View
            style={{
              width: 50,
              height: 16,
              backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB",
              borderRadius: 4,
            }}
          />
          <View
            style={{
              width: 60,
              height: 24,
              backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB",
              borderRadius: 8,
            }}
          />
        </View>
      </View>
    </Animated.View>
  );
}

export default function CounselorsScreen() {
  useAuth();
  const { isDarkColorScheme } = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [counsellors, setCounsellors] = useState<CounsellorProfileData[]>([]);
  const [filteredCounsellors, setFilteredCounsellors] = useState<CounsellorProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  const colors = {
    background: isDarkColorScheme ? "#0F1117" : "#F8FAFB",
    cardBg: isDarkColorScheme ? "#1A1D24" : "#FFFFFF",
    text: isDarkColorScheme ? "#F3F4F6" : "#1F2937",
    textSecondary: isDarkColorScheme ? "#9CA3AF" : "#6B7280",
    primary: "#2AA79D",
    border: isDarkColorScheme ? "#2D3139" : "#E8ECEF",
    searchBg: isDarkColorScheme ? "#1A1D24" : "#FFFFFF",
    skeleton: isDarkColorScheme ? "#2D3139" : "#E5E7EB",
    filterActive: "#2AA79D",
    filterInactive: isDarkColorScheme ? "#1A1D24" : "#FFFFFF",
    filterTextActive: "#FFFFFF",
    filterTextInactive: isDarkColorScheme ? "#9CA3AF" : "#6B7280",
    headerGradientStart: isDarkColorScheme ? "#0F1117" : "#F8FAFB",
    headerGradientEnd: isDarkColorScheme ? "#0F1117" : "#F8FAFB",
  };

  const filters = [
    { id: "all", label: "All", icon: "grid-outline" },
    { id: "anxiety", label: "Anxiety", icon: "pulse-outline" },
    { id: "depression", label: "Depression", icon: "cloudy-outline" },
    { id: "stress", label: "Stress", icon: "fitness-outline" },
    { id: "trauma", label: "Trauma", icon: "heart-outline" },
    { id: "relationships", label: "Relationships", icon: "people-outline" },
  ];

  const loadCounsellors = async () => {
    try {
      setLoading(true);
      const data = await getCounsellors();
      setCounsellors(data as CounsellorProfileData[]);
      setFilteredCounsellors(data as CounsellorProfileData[]);
    } catch (error) {
      console.error("Error loading counsellors:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCounsellors();
  }, []);

  useEffect(() => {
    let filtered = [...counsellors];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.displayName?.toLowerCase().includes(query) ||
          c.specializations?.some((s) => s.toLowerCase().includes(query))
      );
    }
    if (selectedFilter !== "all") {
      filtered = filtered.filter((c) =>
        c.specializations?.some((s) => s.toLowerCase().includes(selectedFilter))
      );
    }
    setFilteredCounsellors(filtered);
  }, [searchQuery, selectedFilter, counsellors]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCounsellors();
    setRefreshing(false);
  };

  const handlePress = (counsellor: CounsellorProfileData) => {
    router.push(`/profile/${counsellor.uid}`);
  };

  // Split data into two columns for grid
  const leftColumn = filteredCounsellors.filter((_, i) => i % 2 === 0);
  const rightColumn = filteredCounsellors.filter((_, i) => i % 2 === 1);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />

      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 }}>
          <Text style={{ fontSize: 26, fontWeight: "800", color: colors.text }}>
            Find Your Counselor
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>
            Connect with licensed professionals who can help
          </Text>
        </View>

        {/* Search Bar */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: isDarkColorScheme ? "#1A1D24" : "#F3F4F6",
              borderRadius: 12,
              paddingHorizontal: 14,
              height: 48,
              borderWidth: 1,
              borderColor: isDarkColorScheme ? "#2D3139" : "#E5E7EB",
            }}
          >
            <Ionicons name="search" size={20} color={isDarkColorScheme ? "#9CA3AF" : "#6B7280"} />
            <TextInput
              placeholder="Search by name or specialty..."
              placeholderTextColor={isDarkColorScheme ? "#9CA3AF" : "#9CA3AF"}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{ flex: 1, marginLeft: 10, fontSize: 15, color: isDarkColorScheme ? "#F3F4F6" : "#1F2937" }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12, gap: 10 }}
        >
          {filters.map((f) => (
            <TouchableOpacity
              key={f.id}
              onPress={() => setSelectedFilter(f.id)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 20,
                backgroundColor: selectedFilter === f.id ? "#2AA79D" : isDarkColorScheme ? "#1A1D24" : "#F3F4F6",
                borderWidth: selectedFilter === f.id ? 0 : 1,
                borderColor: isDarkColorScheme ? "#2D3139" : "#E5E7EB",
              }}
            >
              <Ionicons
                name={f.icon as any}
                size={16}
                color={selectedFilter === f.id ? "#FFF" : isDarkColorScheme ? "#9CA3AF" : "#6B7280"}
                style={{ marginRight: 6 }}
              />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: selectedFilter === f.id ? "#FFF" : isDarkColorScheme ? "#9CA3AF" : "#6B7280",
                }}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Count */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
          <Text style={{ fontSize: 14, color: colors.textSecondary }}>
            {filteredCounsellors.length} counselors found
          </Text>
        </View>
      </SafeAreaView>

      {/* Main Content */}
      {loading ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View>
              {[0, 1, 2].map((i) => (
                <GridSkeleton key={`l${i}`} colors={colors} isDark={isDarkColorScheme} />
              ))}
            </View>
            <View>
              {[3, 4, 5].map((i) => (
                <GridSkeleton key={`r${i}`} colors={colors} isDark={isDarkColorScheme} />
              ))}
            </View>
          </View>
        </ScrollView>
      ) : filteredCounsellors.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 40 }}>
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: isDarkColorScheme ? "rgba(42,167,157,0.15)" : "rgba(42,167,157,0.1)",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Ionicons name="search" size={44} color={colors.primary} />
          </View>
          <Text style={{ fontSize: 20, fontWeight: "700", color: colors.text }}>No counselors found</Text>
          <Text
            style={{
              fontSize: 15,
              color: colors.textSecondary,
              textAlign: "center",
              marginTop: 8,
              lineHeight: 22,
            }}
          >
            Try adjusting your search or{"\n"}clearing the filters
          </Text>
          <TouchableOpacity
            onPress={() => {
              setSearchQuery("");
              setSelectedFilter("all");
            }}
            style={{
              marginTop: 24,
              paddingHorizontal: 28,
              paddingVertical: 14,
              backgroundColor: colors.primary,
              borderRadius: 16,
              flexDirection: "row",
              alignItems: "center",
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Ionicons name="refresh" size={18} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 15 }}>Reset Filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingTop: 8 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {/* Section Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 20,
              marginBottom: 14,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                backgroundColor: isDarkColorScheme ? "rgba(42,167,157,0.15)" : "rgba(42,167,157,0.1)",
                justifyContent: "center",
                alignItems: "center",
                marginRight: 10,
              }}
            >
              <Ionicons name="people" size={18} color={colors.primary} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>
              {selectedFilter === "all" ? "All Counselors" : `${selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1)} Specialists`}
            </Text>
          </View>

          {/* 2-Column Grid */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16 }}>
            {/* Left Column */}
            <View>
              {leftColumn.map((c, i) => (
                <CounsellorCard
                  key={c.uid}
                  counsellor={c}
                  index={i * 2}
                  colors={colors}
                  onPress={() => handlePress(c)}
                  isDark={isDarkColorScheme}
                />
              ))}
            </View>
            {/* Right Column */}
            <View>
              {rightColumn.map((c, i) => (
                <CounsellorCard
                  key={c.uid}
                  counsellor={c}
                  index={i * 2 + 1}
                  colors={colors}
                  onPress={() => handlePress(c)}
                  isDark={isDarkColorScheme}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
