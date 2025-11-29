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
const CARD_WIDTH = SCREEN_WIDTH - 40; // Full width cards for professional layout

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
    primary: "#2AA79D",
    primaryContainer: isDarkColorScheme ? "rgba(42, 167, 157, 0.15)" : "rgba(42, 167, 157, 0.08)",
    secondary: "#3A9C94",
    secondaryContainer: isDarkColorScheme ? "rgba(58, 156, 148, 0.15)" : "rgba(58, 156, 148, 0.08)",
    purple: "#3A9C94",
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
        activeOpacity={0.95}
        style={{
          width: CARD_WIDTH,
          marginBottom: 16,
        }}
      >
        <View 
          style={{
            backgroundColor: colors.surface,
            borderRadius: 20,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDarkColorScheme ? 0.3 : 0.08,
            shadowRadius: 12,
            elevation: 4,
            borderWidth: 1,
            borderColor: isDarkColorScheme ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
          }}
        >
          {/* Horizontal Layout Container */}
          <View style={{ flexDirection: "row", padding: 16 }}>
            {/* Left: Profile Image Section */}
            <View style={{ marginRight: 16 }}>
              <View style={{ position: "relative" }}>
                {c.photoURL ? (
                  <Image
                    source={{ uri: c.photoURL }}
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: 16,
                    }}
                  />
                ) : (
                  <LinearGradient
                    colors={["#2AA79D", "#248F87"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: 16,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: "#FFF", fontSize: 36, fontWeight: "700" }}>
                      {c.displayName?.charAt(0) || "C"}
                    </Text>
                  </LinearGradient>
                )}
                
                {/* Online Indicator */}
                <View style={{
                  position: "absolute",
                  bottom: 4,
                  right: 4,
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  backgroundColor: "#22C55E",
                  borderWidth: 2,
                  borderColor: colors.surface,
                }} />
              </View>
              
              {/* Rating Badge Below Image */}
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isDarkColorScheme ? "rgba(251,191,36,0.15)" : "rgba(251,191,36,0.1)",
                borderRadius: 10,
                paddingVertical: 6,
                marginTop: 8,
              }}>
                <Ionicons name="star" size={14} color="#FBBF24" />
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text, marginLeft: 4 }}>
                  {c.averageRating?.toFixed(1) || "4.9"}
                </Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginLeft: 2 }}>
                  ({c.totalReviews || 128})
                </Text>
              </View>
            </View>
            
            {/* Right: Info Section */}
            <View style={{ flex: 1, justifyContent: "space-between" }}>
              {/* Top Row: Name & Verified */}
              <View>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "700",
                      color: colors.text,
                      flex: 1,
                    }}
                    numberOfLines={1}
                  >
                    Dr. {c.displayName}
                  </Text>
                  {c.verificationStatus === "verified" && (
                    <View style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: colors.primary,
                      alignItems: "center",
                      justifyContent: "center",
                      marginLeft: 6,
                    }}>
                      <Ionicons name="checkmark" size={14} color="#FFF" />
                    </View>
                  )}
                </View>
                
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.textSecondary,
                    marginBottom: 8,
                  }}
                  numberOfLines={1}
                >
                  {c.licenseType || "Licensed Therapist"} • {c.yearsExperience || 5}+ yrs
                </Text>
                
                {/* Specialization Tags */}
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                  {c.specializations?.slice(0, 2).map((spec, idx) => (
                    <View key={idx} style={{
                      backgroundColor: colors.primaryContainer,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 8,
                    }}>
                      <Text style={{ fontSize: 11, color: colors.primary, fontWeight: "600" }}>
                        {spec.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </Text>
                    </View>
                  ))}
                  {(!c.specializations || c.specializations.length === 0) && (
                    <View style={{
                      backgroundColor: colors.primaryContainer,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 8,
                    }}>
                      <Text style={{ fontSize: 11, color: colors.primary, fontWeight: "600" }}>
                        General Counseling
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              
              {/* Bottom: Price & Book Button */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View>
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>Starting from</Text>
                  <Text style={{ fontSize: 20, fontWeight: "800", color: colors.primary }}>
                    ${c.hourlyRate || 80}<Text style={{ fontSize: 12, fontWeight: "500", color: colors.textSecondary }}>/hr</Text>
                  </Text>
                </View>
                
                <TouchableOpacity 
                  onPress={() => handleCounsellorPress(c)} 
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["#2AA79D", "#248F87"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 20,
                      borderRadius: 12,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#FFF", fontSize: 13, fontWeight: "700" }}>Book Now</Text>
                    <Ionicons name="arrow-forward" size={16} color="#FFF" style={{ marginLeft: 4 }} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          
          {/* Bottom Action Bar */}
          <View style={{
            flexDirection: "row",
            borderTopWidth: 1,
            borderTopColor: isDarkColorScheme ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
          }}>
            <TouchableOpacity 
              onPress={() => handleCounsellorPress(c)}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 12,
                borderRightWidth: 1,
                borderRightColor: isDarkColorScheme ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
              }}
            >
              <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "600", marginLeft: 6 }}>Message</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => handleCounsellorPress(c)}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 12,
                borderRightWidth: 1,
                borderRightColor: isDarkColorScheme ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
              }}
            >
              <Ionicons name="videocam-outline" size={18} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: "600", marginLeft: 6 }}>Video</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => handleCounsellorPress(c)}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 12,
              }}
            >
              <Ionicons name="heart-outline" size={18} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: "600", marginLeft: 6 }}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSkeleton = () => (
    <View style={{ width: CARD_WIDTH, marginBottom: 16 }}>
      <View 
        style={{
          backgroundColor: colors.surface,
          borderRadius: 20,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: isDarkColorScheme ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
        }}
      >
        <View style={{ flexDirection: "row", padding: 16 }}>
          {/* Left skeleton */}
          <View style={{ marginRight: 16 }}>
            <View style={{ width: 100, height: 100, borderRadius: 16, backgroundColor: colors.surfaceVariant }} />
            <View style={{ height: 28, borderRadius: 10, backgroundColor: colors.surfaceVariant, marginTop: 8 }} />
          </View>
          {/* Right skeleton */}
          <View style={{ flex: 1 }}>
            <View style={{ height: 20, backgroundColor: colors.surfaceVariant, borderRadius: 8, marginBottom: 8, width: "80%" }} />
            <View style={{ height: 14, backgroundColor: colors.surfaceVariant, borderRadius: 6, marginBottom: 10, width: "60%" }} />
            <View style={{ flexDirection: "row", gap: 6, marginBottom: 16 }}>
              <View style={{ height: 24, width: 70, backgroundColor: colors.surfaceVariant, borderRadius: 8 }} />
              <View style={{ height: 24, width: 80, backgroundColor: colors.surfaceVariant, borderRadius: 8 }} />
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ height: 28, width: 60, backgroundColor: colors.surfaceVariant, borderRadius: 6 }} />
              <View style={{ height: 40, width: 100, backgroundColor: colors.surfaceVariant, borderRadius: 12 }} />
            </View>
          </View>
        </View>
        {/* Bottom bar skeleton */}
        <View style={{ 
          height: 48, 
          backgroundColor: colors.surfaceVariant, 
          borderTopWidth: 1,
          borderTopColor: isDarkColorScheme ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
        }} />
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
                      colors={['#2AA79D', '#3A9C94']}
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

        {/* Counselors List */}
        {loading ? (
          <ScrollView
            contentContainerStyle={{ 
              paddingHorizontal: 20,
              paddingTop: 8,
            }}
            showsVerticalScrollIndicator={false}
          >
            {[1, 2, 3].map((i) => (
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
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }}
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
