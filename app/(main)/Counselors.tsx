import "@/app/global.css";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/lib/useColorScheme";
import { getCounsellors } from "@/services/userService";
import {
  CounsellorProfileData,
  UserProfile,
  UserProfileData,
} from "@/types/user";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 20 * 2 - 12) / 2;

export default function CounselorsScreen() {
  const { userProfile } = useAuth();
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

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const userProfileData = userProfile as UserProfileData;

  // Premium Material Design 3 colors
  const colors = {
    background: isDarkColorScheme ? "#0C0F14" : "#FAFBFC",
    surface: isDarkColorScheme ? "#1E293B" : "#FFFFFF",
    surfaceVariant: isDarkColorScheme ? "#334155" : "#F1F5F9",
    text: isDarkColorScheme ? "#F1F5F9" : "#0F172A",
    textSecondary: isDarkColorScheme ? "#94A3B8" : "#64748B",
    primary: "#6366F1",
    primaryContainer: isDarkColorScheme ? "rgba(99, 102, 241, 0.15)" : "rgba(99, 102, 241, 0.08)",
    secondary: "#10B981",
    secondaryContainer: isDarkColorScheme ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.08)",
    purple: "#8B5CF6",
    warning: "#F59E0B",
    border: isDarkColorScheme ? "#334155" : "#E2E8F0",
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

  const getSpecializationLabel = (spec: string | undefined) => {
    const labels: Record<string, string> = {
      anxiety: "Anxiety & Stress",
      depression: "Depression",
      relationship: "Relationships",
      trauma: "Trauma & PTSD",
      "stress-management": "Stress Management",
    };
    return spec ? labels[spec] || spec.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase()) : "General Counseling";
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

  const renderCounsellorCard = ({ item: counsellor }: { item: UserProfile }) => {
    const c = counsellor as CounsellorProfileData;
    
    return (
      <TouchableOpacity
        onPress={() => handleCounsellorPress(c)}
        activeOpacity={0.7}
        style={{
          width: CARD_WIDTH,
          marginBottom: 14,
        }}
      >
        <View 
          style={{
            backgroundColor: colors.surface,
            borderRadius: 20,
            overflow: "hidden",
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          {/* Image */}
          <View style={{ height: 130, position: "relative" }}>
            {c.photoURL ? (
              <Image
                source={{ uri: c.photoURL }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                style={{
                  width: "100%", 
                  height: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View 
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' }}>
                    {c.displayName?.charAt(0) || "?"}
                  </Text>
                </View>
              </LinearGradient>
            )}
            
            {/* Verified Badge */}
            {c.verificationStatus === "verified" && (
              <View 
                style={{
                  position: "absolute",
                  top: 10,
                  left: 10,
                  backgroundColor: colors.secondaryContainer,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="checkmark-circle" size={12} color={colors.secondary} />
                <Text style={{ fontSize: 10, fontWeight: '600', color: colors.secondary, marginLeft: 3 }}>Verified</Text>
              </View>
            )}
            
            {/* Online Status */}
            <View 
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                backgroundColor: colors.secondary,
                width: 10,
                height: 10,
                borderRadius: 5,
                borderWidth: 2,
                borderColor: colors.surface,
              }}
            />
          </View>
          
          {/* Content */}
          <View style={{ padding: 14 }}>
            <Text 
              style={{ 
                fontSize: 15, 
                fontWeight: "700", 
                color: colors.text,
                marginBottom: 4,
              }}
              numberOfLines={1}
            >
              Dr. {c.displayName}
            </Text>
            
            <Text 
              style={{ 
                fontSize: 12, 
                color: colors.textSecondary,
                marginBottom: 10,
              }}
              numberOfLines={1}
            >
              {getSpecializationLabel(c.specializations?.[0])}
            </Text>
            
            {/* Stats Row */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="star" size={14} color={colors.warning} />
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text, marginLeft: 4 }}>
                  4.9
                </Text>
              </View>
              <View style={{
                backgroundColor: colors.primaryContainer,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 10,
              }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.primary }}>
                  ${c.hourlyRate || "80"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSkeleton = () => (
    <View style={{ width: CARD_WIDTH, marginBottom: 14 }}>
      <View 
        style={{
          backgroundColor: colors.surface,
          borderRadius: 20,
          overflow: "hidden",
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <View style={{ height: 130, backgroundColor: colors.surfaceVariant }} />
        <View style={{ padding: 14 }}>
          <View style={{ height: 16, backgroundColor: colors.surfaceVariant, borderRadius: 8, marginBottom: 6, width: "80%" }} />
          <View style={{ height: 12, backgroundColor: colors.surfaceVariant, borderRadius: 6, marginBottom: 10, width: "60%" }} />
          <View style={{ height: 14, backgroundColor: colors.surfaceVariant, borderRadius: 6, width: "40%" }} />
        </View>
      </View>
    </View>
  );

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
        <StatusBar
          barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
          backgroundColor={colors.background}
        />

        {/* Premium Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
          <Text style={{ fontSize: 26, fontWeight: "700", color: colors.text, letterSpacing: -0.5, marginBottom: 4 }}>
            Find Your Counselor
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary }}>
            Connect with licensed professionals who can help
          </Text>
        </View>

        {/* Premium Search Bar */}
        <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
          <View 
            style={{
              backgroundColor: colors.surfaceVariant,
              borderRadius: 16,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
            }}
          >
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              placeholder="Search by name or specialty..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{
                flex: 1,
                paddingVertical: 14,
                paddingHorizontal: 12,
                fontSize: 15,
                color: colors.text,
              }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Premium Filter Chips */}
        <View style={{ paddingBottom: 16 }}>
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
                      colors={['#6366F1', '#8B5CF6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 20,
                      }}
                    >
                      <Ionicons name={filter.icon as any} size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={{ fontSize: 13, fontWeight: "600", color: "#FFFFFF" }}>{filter.label}</Text>
                    </LinearGradient>
                  ) : (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: colors.surface,
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <Ionicons name={filter.icon as any} size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
                      <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>{filter.label}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Results Count */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
          <Text style={{ fontSize: 14, color: colors.textSecondary }}>
            {loading ? "Loading..." : `${filteredCounsellors.length} counselors found`}
          </Text>
        </View>

        {/* Counselors Grid */}
        {loading ? (
          <ScrollView
            contentContainerStyle={{ 
              paddingHorizontal: 20,
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
            }}
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <View key={i}>{renderSkeleton()}</View>
            ))}
          </ScrollView>
        ) : filteredCounsellors.length === 0 ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 40 }}>
            <View 
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.primaryContainer,
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
          <FlatList
            data={filteredCounsellors}
            renderItem={renderCounsellorCard}
            keyExtractor={(item) => item.uid}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: "space-between", paddingHorizontal: 20 }}
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </Animated.View>
  );
}
