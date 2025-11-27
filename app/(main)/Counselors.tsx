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
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    Dimensions,
    FlatList,
    Image,
    Pressable,
    RefreshControl,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 24 * 2 - 12) / 2; // 2 columns with gap

export default function CounselorsScreen() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();
  const [counsellors, setCounsellors] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  const userProfileData = userProfile as UserProfileData;

  // Premium colors
  const colors = {
    background: isDarkColorScheme ? "#0F1419" : "#FAFBFC",
    card: isDarkColorScheme ? "#171D26" : "#FFFFFF",
    cardAlt: isDarkColorScheme ? "#1E2632" : "#F8FAFC",
    text: isDarkColorScheme ? "#F0F2F5" : "#1E2530",
    textSecondary: isDarkColorScheme ? "#8B95A5" : "#747B8A",
    primary: isDarkColorScheme ? "#6B8CF5" : "#4A6CF4",
    secondary: isDarkColorScheme ? "#4CC38A" : "#3FA57A",
    accent: isDarkColorScheme ? "#B79CFC" : "#A78BFA",
    border: isDarkColorScheme ? "#323A48" : "#E2E5E9",
    input: isDarkColorScheme ? "#1E2632" : "#F4F5F7",
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
      <Pressable
        onPress={() => handleCounsellorPress(c)}
        style={{
          width: CARD_WIDTH,
          marginBottom: 16,
        }}
      >
        <View 
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          {/* Image */}
          <View style={{ height: 140, position: "relative" }}>
            {c.photoURL ? (
              <Image
                source={{ uri: c.photoURL }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <View 
                style={{ 
                  width: "100%", 
                  height: "100%", 
                  backgroundColor: colors.cardAlt,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View 
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: isDarkColorScheme ? "#2A3544" : "#E8ECF0",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="person" size={28} color={colors.textSecondary} />
                </View>
              </View>
            )}
            
            {/* Online Status */}
            <View 
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                backgroundColor: "rgba(63, 165, 122, 0.9)",
                width: 10,
                height: 10,
                borderRadius: 5,
                borderWidth: 2,
                borderColor: colors.card,
              }}
            />
          </View>
          
          {/* Content */}
          <View style={{ padding: 12 }}>
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
                marginBottom: 8,
              }}
              numberOfLines={1}
            >
              {getSpecializationLabel(c.specializations?.[0])}
            </Text>
            
            {/* Stats Row */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.text, marginLeft: 3 }}>
                  4.9
                </Text>
              </View>
              <Text style={{ fontSize: 13, fontWeight: "700", color: colors.primary }}>
                ${c.hourlyRate || "80"}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  const renderSkeleton = () => (
    <View style={{ width: CARD_WIDTH, marginBottom: 16 }}>
      <View 
        style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <View style={{ height: 140, backgroundColor: colors.cardAlt }} />
        <View style={{ padding: 12 }}>
          <View style={{ height: 16, backgroundColor: colors.cardAlt, borderRadius: 6, marginBottom: 6, width: "80%" }} />
          <View style={{ height: 12, backgroundColor: colors.cardAlt, borderRadius: 6, marginBottom: 8, width: "60%" }} />
          <View style={{ height: 12, backgroundColor: colors.cardAlt, borderRadius: 6, width: "40%" }} />
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 28, fontWeight: "700", color: colors.text, marginBottom: 4 }}>
          Find Your Counselor
        </Text>
        <Text style={{ fontSize: 15, color: colors.textSecondary }}>
          Connect with licensed professionals who can help
        </Text>
      </View>

      {/* Search Bar */}
      <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
        <View 
          style={{
            backgroundColor: colors.input,
            borderRadius: 14,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            borderWidth: 1,
            borderColor: colors.border,
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
            <Pressable onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Filter Chips */}
      <View style={{ paddingBottom: 16 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
        >
          {filters.map((filter) => {
            const isActive = selectedFilter === filter.id;
            return (
              <Pressable
                key={filter.id || "all"}
                onPress={() => setSelectedFilter(filter.id)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: isActive ? colors.primary : colors.card,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: isActive ? colors.primary : colors.border,
                }}
              >
                <Ionicons 
                  name={filter.icon as any} 
                  size={16} 
                  color={isActive ? "#FFFFFF" : colors.textSecondary}
                  style={{ marginRight: 6 }}
                />
                <Text 
                  style={{ 
                    fontSize: 13, 
                    fontWeight: "600",
                    color: isActive ? "#FFFFFF" : colors.text,
                  }}
                >
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Results Count */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 12 }}>
        <Text style={{ fontSize: 14, color: colors.textSecondary }}>
          {loading ? "Loading..." : `${filteredCounsellors.length} counselors found`}
        </Text>
      </View>

      {/* Counselors Grid */}
      {loading ? (
        <ScrollView
          contentContainerStyle={{ 
            paddingHorizontal: 24,
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
              backgroundColor: colors.cardAlt,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Ionicons name="search-outline" size={36} color={colors.textSecondary} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.text, marginBottom: 8 }}>
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
          columnWrapperStyle={{ justifyContent: "space-between", paddingHorizontal: 24 }}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
