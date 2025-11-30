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
const CARD_HEIGHT = CARD_WIDTH * 1.55;

// Professional Tinder-style Card
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
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 50,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, index]);

  // Calming gradient colors for placeholder
  const gradientSets = [
    ["#0D9488", "#14B8A6", "#2DD4BF"],
    ["#0F766E", "#0D9488", "#14B8A6"],
    ["#115E59", "#0F766E", "#0D9488"],
    ["#134E4A", "#115E59", "#0F766E"],
  ];

  const isOnline = counsellor.status === "online";
  const rating = counsellor.averageRating?.toFixed(1) || "4.9";
  const specialty = counsellor.specializations?.[0]
    ?.replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase()) || "Mental Health";

  return (
    <Animated.View
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        marginBottom: 16,
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
      }}
    >
      <Pressable
        onPress={onPress}
        style={{
          flex: 1,
          borderRadius: 20,
          overflow: "hidden",
          backgroundColor: colors.cardBg,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.4 : 0.15,
          shadowRadius: 16,
          elevation: 8,
        }}
      >
        {/* Full Image Background */}
        <View style={{ flex: 1, position: "relative" }}>
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
              <View
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 35,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 32, fontWeight: "700", color: "#FFF" }}>
                  {counsellor.displayName?.charAt(0)?.toUpperCase() || "C"}
                </Text>
              </View>
            </LinearGradient>
          )}

          {/* Top Bar - Status & Verified */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 10,
            }}
          >
            {/* Online Status */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: isOnline ? "rgba(34,197,94,0.9)" : "rgba(0,0,0,0.5)",
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12,
              }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: "#FFF",
                  marginRight: 5,
                }}
              />
              <Text style={{ fontSize: 10, color: "#FFF", fontWeight: "600" }}>
                {isOnline ? "Available" : "Away"}
              </Text>
            </View>

            {/* Verified Badge */}
            {counsellor.verificationStatus === "verified" && (
              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.95)",
                  borderRadius: 12,
                  padding: 5,
                }}
              >
                <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
              </View>
            )}
          </View>

          {/* Bottom Gradient Overlay */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.4)", "rgba(0,0,0,0.85)"]}
            locations={[0, 0.5, 1]}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: CARD_HEIGHT * 0.55,
              justifyContent: "flex-end",
              padding: 12,
            }}
          >
            {/* Name & Title */}
            <View style={{ marginBottom: 6 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: "#FFF",
                  marginBottom: 2,
                }}
                numberOfLines={1}
              >
                Dr. {counsellor.displayName}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.85)",
                  fontWeight: "500",
                }}
                numberOfLines={1}
              >
                {counsellor.licenseType || "Licensed Therapist"}
              </Text>
            </View>

            {/* Specialty Tag */}
            <View
              style={{
                alignSelf: "flex-start",
                backgroundColor: "rgba(42,167,157,0.9)",
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
                marginBottom: 10,
              }}
            >
              <Text style={{ fontSize: 10, color: "#FFF", fontWeight: "600" }}>
                {specialty}
              </Text>
            </View>

            {/* Stats Row */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "rgba(255,255,255,0.15)",
                borderRadius: 10,
                paddingVertical: 8,
                paddingHorizontal: 10,
                marginBottom: 10,
              }}
            >
              {/* Rating */}
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="star" size={12} color="#FBBF24" />
                <Text style={{ fontSize: 12, color: "#FFF", fontWeight: "700", marginLeft: 4 }}>
                  {rating}
                </Text>
              </View>

              <View style={{ width: 1, height: 14, backgroundColor: "rgba(255,255,255,0.3)" }} />

              {/* Experience */}
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="briefcase-outline" size={11} color="rgba(255,255,255,0.8)" />
                <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", marginLeft: 4 }}>
                  {counsellor.yearsExperience || 5}yr
                </Text>
              </View>

              <View style={{ width: 1, height: 14, backgroundColor: "rgba(255,255,255,0.3)" }} />

              {/* Price */}
              <Text style={{ fontSize: 12, color: "#FFF", fontWeight: "700" }}>
                ${counsellor.hourlyRate || 80}
              </Text>
            </View>

            {/* Book Button */}
            <TouchableOpacity
              onPress={onPress}
              style={{
                backgroundColor: "#FFF",
                borderRadius: 10,
                paddingVertical: 10,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
              activeOpacity={0.9}
            >
              <Ionicons name="calendar-outline" size={14} color={colors.primary} />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: colors.primary,
                  marginLeft: 6,
                }}
              >
                Book Session
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// Grid Skeleton
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
        height: CARD_HEIGHT,
        marginBottom: 16,
        borderRadius: 20,
        backgroundColor: isDark ? "#1C2128" : "#E8F0EF",
        opacity: shimmerAnim,
        overflow: "hidden",
      }}
    >
      <LinearGradient
        colors={["transparent", isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.3)"]}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "50%",
          justifyContent: "flex-end",
          padding: 12,
        }}
      >
        <View style={{ width: "70%", height: 16, borderRadius: 6, backgroundColor: colors.skeleton, marginBottom: 6 }} />
        <View style={{ width: "50%", height: 12, borderRadius: 4, backgroundColor: colors.skeleton, marginBottom: 10 }} />
        <View style={{ width: "40%", height: 20, borderRadius: 8, backgroundColor: colors.skeleton, marginBottom: 10 }} />
        <View style={{ width: "100%", height: 36, borderRadius: 10, backgroundColor: colors.skeleton }} />
      </LinearGradient>
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
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View>
              <Text style={{ fontSize: 28, fontWeight: "800", color: colors.text, letterSpacing: -0.5 }}>
                Discover
              </Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 2 }}>
                {filteredCounsellors.length} counselors ready to help
              </Text>
            </View>
            <TouchableOpacity
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: colors.cardBg,
                justifyContent: "center",
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <Ionicons name="options-outline" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar - Enhanced */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.searchBg,
              borderRadius: 16,
              paddingHorizontal: 16,
              height: 52,
              borderWidth: 1.5,
              borderColor: searchQuery.length > 0 ? colors.primary : colors.border,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <Ionicons name="search" size={22} color={searchQuery.length > 0 ? colors.primary : colors.textSecondary} />
            <TextInput
              placeholder="Search by name or specialty..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{ flex: 1, marginLeft: 12, fontSize: 15, color: colors.text, fontWeight: "500" }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: isDarkColorScheme ? "#374151" : "#E5E7EB",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons name="close" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Chips - Enhanced with Icons */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16, gap: 10 }}
        >
          {filters.map((f) => (
            <TouchableOpacity
              key={f.id}
              onPress={() => setSelectedFilter(f.id)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 24,
                backgroundColor: selectedFilter === f.id ? colors.filterActive : colors.filterInactive,
                borderWidth: 1.5,
                borderColor: selectedFilter === f.id ? colors.filterActive : colors.border,
                shadowColor: selectedFilter === f.id ? colors.primary : "transparent",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: selectedFilter === f.id ? 4 : 0,
              }}
            >
              <Ionicons
                name={f.icon as any}
                size={16}
                color={selectedFilter === f.id ? colors.filterTextActive : colors.filterTextInactive}
                style={{ marginRight: 6 }}
              />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: selectedFilter === f.id ? colors.filterTextActive : colors.filterTextInactive,
                }}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
