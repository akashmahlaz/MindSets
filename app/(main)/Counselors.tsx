import "@/app/global.css";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/lib/useColorScheme";
import { getCounsellors } from "@/services/userService";
import {
  CounsellorProfileData,
  UserProfile,
} from "@/types/user";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 40;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.58; // Taller cards to show more photo

// Gradient color sets for cards without photos
const gradientSets = [
  ["#0D9488", "#2AA79D", "#14B8A6"],
  ["#2AA79D", "#0F766E", "#0D9488"],
  ["#14B8A6", "#2AA79D", "#0D9488"],
  ["#0F766E", "#14B8A6", "#2AA79D"],
];

// Story Card Component - Separate to properly use hooks
function StoryCard({ 
  counsellor, 
  index, 
  colors, 
  onPress 
}: { 
  counsellor: CounsellorProfileData; 
  index: number; 
  colors: Record<string, string>;
  onPress: (c: CounsellorProfileData) => void;
}) {
  const cardAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 50,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [cardAnim, scaleAnim, index]);

  const gradientColors = gradientSets[index % gradientSets.length];

  return (
    <Animated.View
      style={{
        opacity: cardAnim,
        transform: [
          { scale: scaleAnim },
          {
            translateY: cardAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [40, 0],
            }),
          },
        ],
      }}
    >
      <TouchableOpacity
        onPress={() => onPress(counsellor)}
        activeOpacity={0.95}
        style={{ marginBottom: 20, paddingHorizontal: 20 }}
      >
        <View 
          style={{
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            borderRadius: 24,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 16,
            elevation: 10,
          }}
        >
          {/* Background - Photo or Gradient */}
          {counsellor.photoURL ? (
            <Image
              source={{ uri: counsellor.photoURL }}
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
              }}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={gradientColors as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
              }}
            />
          )}
          
          {/* Lighter Gradient Overlay - Shows More Photo */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.1)", "rgba(0,0,0,0.7)"]}
            locations={[0, 0.6, 1]}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
            }}
          />
          
          {/* Top Section - Status & Verified - Compact */}
          <View style={{
            position: "absolute",
            top: 12,
            left: 12,
            right: 12,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            {/* Online Status Pill - Smaller */}
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "rgba(34, 197, 94, 0.85)",
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 12,
            }}>
              <View style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: "#FFF",
                marginRight: 4,
              }} />
              <Text style={{ color: "#FFF", fontSize: 10, fontWeight: "600" }}>Available</Text>
            </View>
            
            {/* Verified & Rating Row */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              {/* Rating */}
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "rgba(0,0,0,0.5)",
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12,
              }}>
                <Ionicons name="star" size={12} color="#FBBF24" />
                <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "700", marginLeft: 3 }}>
                  {counsellor.averageRating?.toFixed(1) || "4.9"}
                </Text>
              </View>
              
              {/* Verified Badge */}
              {counsellor.verificationStatus === "verified" && (
                <View style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "rgba(255,255,255,0.9)",
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 12,
                }}>
                  <Ionicons name="checkmark-circle" size={12} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontSize: 10, fontWeight: "700", marginLeft: 2 }}>Verified</Text>
                </View>
              )}
            </View>
          </View>
          
          {/* Bottom Content Overlay - Compact */}
          <View style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: 14,
          }}>
            {/* Name & Title - Compact */}
            <View style={{ marginBottom: 6 }}>
              <Text style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#FFF",
                letterSpacing: -0.3,
                marginBottom: 2,
                textShadowColor: "rgba(0,0,0,0.5)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 3,
              }}>
                Dr. {counsellor.displayName}
              </Text>
              <Text style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.8)",
                fontWeight: "500",
              }}>
                {counsellor.licenseType || "Licensed Therapist"} • {counsellor.yearsExperience || 5}+ yrs
              </Text>
            </View>
            
            {/* Specialization Tags - Smaller */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
              {counsellor.specializations?.slice(0, 3).map((spec, idx) => (
                <View key={idx} style={{
                  backgroundColor: "rgba(255,255,255,0.15)",
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 10,
                }}>
                  <Text style={{ fontSize: 9, color: "#FFF", fontWeight: "600" }}>
                    {spec.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Text>
                </View>
              ))}
              {(!counsellor.specializations || counsellor.specializations.length === 0) && (
                <View style={{
                  backgroundColor: "rgba(255,255,255,0.15)",
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 10,
                }}>
                  <Text style={{ fontSize: 9, color: "#FFF", fontWeight: "600" }}>
                    Mental Health
                  </Text>
                </View>
              )}
            </View>
            
            {/* Price & CTA Row - Compact */}
            <View style={{ 
              flexDirection: "row", 
              alignItems: "center", 
              justifyContent: "space-between",
            }}>
              <View>
                <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.6)" }}>
                  Starting from
                </Text>
                <Text style={{ fontSize: 20, fontWeight: "800", color: "#FFF" }}>
                  ${counsellor.hourlyRate || 80}
                  <Text style={{ fontSize: 11, fontWeight: "500", color: "rgba(255,255,255,0.7)" }}>/hr</Text>
                </Text>
              </View>
              
              <TouchableOpacity 
                onPress={() => onPress(counsellor)} 
                activeOpacity={0.9}
              >
                <View
                  style={{
                    backgroundColor: "#FFF",
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700" }}>Book Now</Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.primary} style={{ marginLeft: 4 }} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Decorative Elements - Floating Icons */}
          {!counsellor.photoURL && (
            <>
              <View style={{
                position: "absolute",
                top: "30%",
                left: "10%",
                opacity: 0.15,
              }}>
                <Ionicons name="heart" size={60} color="#FFF" />
              </View>
              <View style={{
                position: "absolute",
                top: "20%",
                right: "15%",
                opacity: 0.1,
              }}>
                <Ionicons name="leaf" size={80} color="#FFF" />
              </View>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Skeleton Loader Component
function StorySkeleton({ colors }: { colors: Record<string, string> }) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  return (
    <Animated.View
      style={{
        marginBottom: 20,
        paddingHorizontal: 20,
        opacity: shimmerAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.4, 0.8],
        }),
      }}
    >
      <View 
        style={{
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          borderRadius: 24,
          overflow: "hidden",
          backgroundColor: colors.surfaceVariant,
        }}
      >
        <LinearGradient
          colors={[colors.surfaceVariant, colors.surfaceElevated, colors.surfaceVariant]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
          }}
        />
        
        {/* Skeleton top badges */}
        <View style={{
          position: "absolute",
          top: 12,
          left: 12,
          right: 12,
          flexDirection: "row",
          justifyContent: "space-between",
        }}>
          <View style={{
            width: 80,
            height: 24,
            borderRadius: 12,
            backgroundColor: colors.surface,
          }} />
          <View style={{
            width: 60,
            height: 24,
            borderRadius: 12,
            backgroundColor: colors.surface,
          }} />
        </View>
        
        {/* Skeleton bottom content */}
        <View style={{
          position: "absolute",
          bottom: 14,
          left: 14,
          right: 14,
        }}>
          <View style={{
            width: "60%",
            height: 20,
            borderRadius: 6,
            backgroundColor: colors.surface,
            marginBottom: 6,
          }} />
          <View style={{
            width: "40%",
            height: 12,
            borderRadius: 4,
            backgroundColor: colors.surface,
            marginBottom: 10,
          }} />
          <View style={{ flexDirection: "row", gap: 6, marginBottom: 10 }}>
            <View style={{
              width: 60,
              height: 20,
              borderRadius: 10,
              backgroundColor: colors.surface,
            }} />
            <View style={{
              width: 60,
              height: 20,
              borderRadius: 10,
              backgroundColor: colors.surface,
            }} />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{
              width: 70,
              height: 26,
              borderRadius: 6,
              backgroundColor: colors.surface,
            }} />
            <View style={{
              width: 90,
              height: 32,
              borderRadius: 10,
              backgroundColor: colors.surface,
            }} />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

export default function CounselorsScreen() {
  useAuth(); // Check auth state
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const [counsellors, setCounsellors] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  // Premium animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Perplexity-inspired colors with depth
  const colors = {
    background: isDarkColorScheme ? "#0A0A0B" : "#FAFAFA",
    surface: isDarkColorScheme ? "#18181B" : "#FFFFFF",
    surfaceElevated: isDarkColorScheme ? "#27272A" : "#F4F4F5",
    surfaceVariant: isDarkColorScheme ? "#3F3F46" : "#E4E4E7",
    text: isDarkColorScheme ? "#FAFAFA" : "#09090B",
    textSecondary: isDarkColorScheme ? "#A1A1AA" : "#71717A",
    textMuted: isDarkColorScheme ? "#71717A" : "#A1A1AA",
    primary: "#2AA79D",
    primaryLight: isDarkColorScheme ? "rgba(42, 167, 157, 0.2)" : "rgba(42, 167, 157, 0.1)",
    primaryContainer: isDarkColorScheme ? "rgba(42, 167, 157, 0.15)" : "rgba(42, 167, 157, 0.08)",
    secondary: "#3A9C94",
    accent: "#14B8A6",
    warning: "#F59E0B",
    success: "#22C55E",
    border: isDarkColorScheme ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
    cardShadow: isDarkColorScheme ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.08)",
  };

  const filters = [
    { id: null, label: "All", icon: "grid-outline" },
    { id: "anxiety", label: "Anxiety", icon: "pulse-outline" },
    { id: "depression", label: "Depression", icon: "cloud-outline" },
    { id: "relationship", label: "Relationships", icon: "heart-outline" },
    { id: "trauma", label: "Trauma", icon: "shield-outline" },
    { id: "stress-management", label: "Stress", icon: "fitness-outline" },
  ];

  const loadCounsellors = async () => {
    try {
      const data = await getCounsellors();
      setCounsellors(data);
    } catch (error) {
      console.error("Error loading counsellors:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCounsellors();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadCounsellors();
  };

  const handleCounsellorPress = (counsellor: CounsellorProfileData) => {
    router.push({
      pathname: "/profile/[userId]",
      params: { userId: counsellor.uid },
    });
  };

  const filteredCounsellors = counsellors.filter((counsellor) => {
    const matchesSearch = 
      counsellor.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ("specializations" in counsellor &&
        counsellor.specializations?.some((spec) =>
          spec.toLowerCase().includes(searchQuery.toLowerCase()),
        ));
    
    const matchesFilter = !selectedFilter || 
      ("specializations" in counsellor && 
        counsellor.specializations?.includes(selectedFilter));
    
    return matchesSearch && matchesFilter;
  });

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
        <StatusBar
          barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
          backgroundColor={colors.background}
        />

        {/* Perplexity-Style Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 6 }}>
          <Text style={{ 
            fontSize: 28, 
            fontWeight: "800", 
            color: colors.text, 
            letterSpacing: -0.5,
          }}>
            Discover
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>
            Find your perfect counselor match
          </Text>
        </View>

        {/* Search Bar - Perplexity Style */}
        <View style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
          <View 
            style={{
              backgroundColor: colors.surfaceElevated,
              borderRadius: 14,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 14,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="search" size={20} color={colors.textMuted} />
            <TextInput
              placeholder="Search counselors..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 10,
                fontSize: 15,
                color: colors.text,
              }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Chips - Horizontal Scroll */}
        <View style={{ paddingBottom: 12 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          >
            {filters.map((filter) => {
              const isActive = selectedFilter === filter.id;
              return (
                <TouchableOpacity
                  key={filter.id || "all"}
                  onPress={() => setSelectedFilter(filter.id)}
                  activeOpacity={0.7}
                >
                  {isActive ? (
                    <LinearGradient
                      colors={['#2AA79D', '#0D9488']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 20,
                      }}
                    >
                      <Ionicons name={filter.icon as any} size={15} color="#FFFFFF" style={{ marginRight: 5 }} />
                      <Text style={{ fontSize: 13, fontWeight: "600", color: "#FFFFFF" }}>{filter.label}</Text>
                    </LinearGradient>
                  ) : (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: colors.surfaceElevated,
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <Ionicons name={filter.icon as any} size={15} color={colors.textSecondary} style={{ marginRight: 5 }} />
                      <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>{filter.label}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Results Count */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
          <Text style={{ fontSize: 13, color: colors.textMuted, fontWeight: "500" }}>
            {loading ? "Finding counselors..." : `${filteredCounsellors.length} counselors available`}
          </Text>
        </View>

        {/* Counselors Feed - Story Style */}
        {loading ? (
          <Animated.ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 8, paddingBottom: insets.bottom + 24 }}
          >
            {[0, 1, 2].map((i) => (
              <StorySkeleton key={i} colors={colors} />
            ))}
          </Animated.ScrollView>
        ) : filteredCounsellors.length === 0 ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 40 }}>
            <View 
              style={{
                width: 80,
                height: 80,
                borderRadius: 24,
                backgroundColor: colors.primaryLight,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Ionicons name="search-outline" size={36} color={colors.primary} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 8 }}>
              No counselors found
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center" }}>
              Try adjusting your search or filters
            </Text>
          </View>
        ) : (
          <Animated.ScrollView
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 8, paddingBottom: insets.bottom + 24 }}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh} 
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          >
            {filteredCounsellors.map((counsellor, index) => (
              <StoryCard 
                key={counsellor.uid} 
                counsellor={counsellor as CounsellorProfileData} 
                index={index} 
                colors={colors}
                onPress={handleCounsellorPress}
              />
            ))}
          </Animated.ScrollView>
        )}
      </SafeAreaView>
    </Animated.View>
  );
}
