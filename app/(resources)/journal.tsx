import { useAuth } from "@/context/AuthContext";
import { db } from "@/firebaseConfig";
import { useColorScheme } from "@/lib/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { addDoc, collection, getDocs, limit, orderBy, query, Timestamp, where } from "firebase/firestore";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

// Mood options with scores for tracking
const MOODS = [
  { emoji: "😊", label: "Great", color: "#2AA79D", score: 5 },
  { emoji: "🙂", label: "Good", color: "#3A9C94", score: 4 },
  { emoji: "😐", label: "Okay", color: "#F59E0B", score: 3 },
  { emoji: "😔", label: "Low", color: "#248F87", score: 2 },
  { emoji: "😢", label: "Sad", color: "#E57373", score: 1 },
];

interface MoodEntry {
  id: string;
  moodIndex: number;
  moodScore: number;
  journalEntry: string;
  gratitude: string;
  createdAt: Date;
}

export default function JournalScreen() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { isDarkColorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [journalEntry, setJournalEntry] = useState("");
  const [gratitude, setGratitude] = useState("");
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"checkin" | "history">("checkin");

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Load mood history
  const loadMoodHistory = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const moodRef = collection(db, "moodEntries");
      const q = query(
        moodRef,
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(30)
      );
      
      const snapshot = await getDocs(q);
      const entries: MoodEntry[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        entries.push({
          id: doc.id,
          moodIndex: data.moodIndex,
          moodScore: data.moodScore,
          journalEntry: data.journalEntry || "",
          gratitude: data.gratitude || "",
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      });
      
      setMoodHistory(entries);
    } catch (error) {
      console.error("Error loading mood history:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadMoodHistory();
  }, [loadMoodHistory]);

  // Premium Material Design 3 colors
  const colors = {
    background: isDarkColorScheme ? "#0F1419" : "#FAFBFC",
    surface: isDarkColorScheme ? "#1C2128" : "#FFFFFF",
    surfaceVariant: isDarkColorScheme ? "#2D333B" : "#F1F5F9",
    text: isDarkColorScheme ? "#F0F6FC" : "#1F2937",
    textSecondary: isDarkColorScheme ? "#8B949E" : "#6B7280",
    textMuted: isDarkColorScheme ? "#6E7681" : "#9CA3AF",
    primary: "#2AA79D",
    primaryContainer: isDarkColorScheme ? "rgba(42, 167, 157, 0.15)" : "rgba(42, 167, 157, 0.08)",
    border: isDarkColorScheme ? "#30363D" : "#E5E7EB",
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const handleSave = async () => {
    if (selectedMood === null) {
      Alert.alert("Select a mood", "Please select how you're feeling today.");
      return;
    }
    
    if (!user) {
      Alert.alert("Error", "Please sign in to save your mood.");
      return;
    }

    try {
      setIsSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const moodRef = collection(db, "moodEntries");
      await addDoc(moodRef, {
        userId: user.uid,
        moodIndex: selectedMood,
        moodScore: MOODS[selectedMood].score,
        moodLabel: MOODS[selectedMood].label,
        journalEntry: journalEntry.trim(),
        gratitude: gratitude.trim(),
        createdAt: Timestamp.now(),
      });
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Reset form
      setSelectedMood(null);
      setJournalEntry("");
      setGratitude("");
      
      // Reload history
      await loadMoodHistory();
      
      Alert.alert("Saved! ✨", "Your mood has been recorded.", [
        { text: "OK", onPress: () => setViewMode("history") }
      ]);
    } catch (error) {
      console.error("Error saving mood:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to save your mood. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate mood stats
  const getMoodStats = () => {
    if (moodHistory.length === 0) return { avg: 0, trend: "neutral", streak: 0 };
    
    const total = moodHistory.reduce((sum, entry) => sum + entry.moodScore, 0);
    const avg = total / moodHistory.length;
    
    // Get last 7 days trend
    const recent = moodHistory.slice(0, 7);
    const older = moodHistory.slice(7, 14);
    
    let trend: "up" | "down" | "neutral" = "neutral";
    if (recent.length > 0 && older.length > 0) {
      const recentAvg = recent.reduce((s, e) => s + e.moodScore, 0) / recent.length;
      const olderAvg = older.reduce((s, e) => s + e.moodScore, 0) / older.length;
      if (recentAvg > olderAvg + 0.3) trend = "up";
      else if (recentAvg < olderAvg - 0.3) trend = "down";
    }
    
    // Calculate streak
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < moodHistory.length; i++) {
      const entryDate = new Date(moodHistory[i].createdAt);
      entryDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      
      if (entryDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }
    
    return { avg, trend, streak };
  };

  const stats = getMoodStats();

  // Render mood chart (simple bar chart)
  const renderMoodChart = () => {
    const last7Days = moodHistory.slice(0, 7).reverse();
    const maxScore = 5;
    
    return (
      <View style={{ marginTop: 16 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: 120 }}>
          {[...Array(7)].map((_, index) => {
            const entry = last7Days[index];
            const barHeight = entry ? (entry.moodScore / maxScore) * 100 : 0;
            const color = entry ? MOODS[entry.moodIndex].color : colors.border;
            
            const date = new Date();
            date.setDate(date.getDate() - (6 - index));
            const dayLabel = date.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1);
            
            return (
              <View key={index} style={{ alignItems: "center", flex: 1 }}>
                <View
                  style={{
                    width: 28,
                    height: barHeight || 8,
                    backgroundColor: entry ? color : colors.surfaceVariant,
                    borderRadius: 8,
                    marginBottom: 8,
                  }}
                />
                {entry && (
                  <Text style={{ fontSize: 16, marginBottom: 4 }}>{MOODS[entry.moodIndex].emoji}</Text>
                )}
                <Text style={{ fontSize: 11, color: colors.textMuted }}>{dayLabel}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // Render history list
  const renderHistoryItem = (entry: MoodEntry, index: number) => {
    const mood = MOODS[entry.moodIndex];
    const date = new Date(entry.createdAt);
    
    return (
      <View
        key={entry.id}
        style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: `${mood.color}20`,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 24 }}>{mood.emoji}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>
              Feeling {mood.label}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
              {date.toLocaleDateString("en-US", { 
                weekday: "long", 
                month: "short", 
                day: "numeric",
                hour: "numeric",
                minute: "2-digit"
              })}
            </Text>
          </View>
        </View>
        
        {entry.journalEntry && (
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 4 }}>
              <Ionicons name="book-outline" size={12} /> Journal
            </Text>
            <Text style={{ fontSize: 14, color: colors.text, lineHeight: 20 }}>
              {entry.journalEntry}
            </Text>
          </View>
        )}
        
        {entry.gratitude && (
          <View>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 4 }}>
              <Ionicons name="heart-outline" size={12} /> Gratitude
            </Text>
            <Text style={{ fontSize: 14, color: colors.text, lineHeight: 20 }}>
              {entry.gratitude}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
        <StatusBar
          barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
          backgroundColor={colors.background}
        />

        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: colors.surfaceVariant,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 16,
            }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text, letterSpacing: -0.3 }}>
              Mood Tracker
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 2 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={{ 
          flexDirection: "row", 
          padding: 20, 
          paddingBottom: 10,
          gap: 12,
        }}>
          <Pressable
            onPress={() => setViewMode("checkin")}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: viewMode === "checkin" ? colors.primary : colors.surfaceVariant,
              alignItems: "center",
            }}
          >
            <Text style={{ 
              fontSize: 14, 
              fontWeight: "600", 
              color: viewMode === "checkin" ? "#FFF" : colors.textSecondary 
            }}>
              Check-in
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setViewMode("history")}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: viewMode === "history" ? colors.primary : colors.surfaceVariant,
              alignItems: "center",
            }}
          >
            <Text style={{ 
              fontSize: 14, 
              fontWeight: "600", 
              color: viewMode === "history" ? "#FFF" : colors.textSecondary 
            }}>
              History
            </Text>
          </Pressable>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
        >
          {viewMode === "checkin" ? (
            <>
              {/* Greeting */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 26, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
                  {getGreeting()}, {userProfile?.displayName?.split(' ')[0] || 'there'} 👋
                </Text>
                <Text style={{ fontSize: 16, color: colors.textSecondary, lineHeight: 24 }}>
                  Take a moment to reflect on how you're feeling today.
                </Text>
              </View>

              {/* Stats Cards */}
              {moodHistory.length > 0 && (
                <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
                  <View style={{
                    flex: 1,
                    backgroundColor: colors.surface,
                    borderRadius: 16,
                    padding: 16,
                    alignItems: "center",
                  }}>
                    <Text style={{ fontSize: 24, fontWeight: "700", color: colors.primary }}>
                      {stats.streak}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                      Day Streak 🔥
                    </Text>
                  </View>
                  <View style={{
                    flex: 1,
                    backgroundColor: colors.surface,
                    borderRadius: 16,
                    padding: 16,
                    alignItems: "center",
                  }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={{ fontSize: 24, fontWeight: "700", color: colors.text }}>
                        {stats.avg.toFixed(1)}
                      </Text>
                      <Ionicons 
                        name={stats.trend === "up" ? "arrow-up" : stats.trend === "down" ? "arrow-down" : "remove"} 
                        size={18} 
                        color={stats.trend === "up" ? "#22C55E" : stats.trend === "down" ? "#EF4444" : colors.textMuted}
                        style={{ marginLeft: 4 }}
                      />
                    </View>
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                      Avg Mood
                    </Text>
                  </View>
                  <View style={{
                    flex: 1,
                    backgroundColor: colors.surface,
                    borderRadius: 16,
                    padding: 16,
                    alignItems: "center",
                  }}>
                    <Text style={{ fontSize: 24, fontWeight: "700", color: colors.text }}>
                      {moodHistory.length}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                      Entries
                    </Text>
                  </View>
                </View>
              )}

              {/* Mood Selection */}
              <View style={{
                backgroundColor: colors.surface,
                borderRadius: 20,
                padding: 20,
                marginBottom: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDarkColorScheme ? 0.2 : 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}>
                <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text, marginBottom: 16 }}>
                  How are you feeling?
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  {MOODS.map((mood, index) => (
                    <Pressable
                      key={index}
                      onPress={() => {
                        setSelectedMood(index);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      style={{
                        alignItems: 'center',
                        padding: 12,
                        borderRadius: 16,
                        backgroundColor: selectedMood === index ? `${mood.color}20` : 'transparent',
                        borderWidth: 2,
                        borderColor: selectedMood === index ? mood.color : 'transparent',
                      }}
                    >
                      <Text style={{ fontSize: 32, marginBottom: 6 }}>{mood.emoji}</Text>
                      <Text style={{ 
                        fontSize: 12, 
                        fontWeight: '600', 
                        color: selectedMood === index ? mood.color : colors.textSecondary 
                      }}>
                        {mood.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Journal Entry */}
              <View style={{
                backgroundColor: colors.surface,
                borderRadius: 20,
                padding: 20,
                marginBottom: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDarkColorScheme ? 0.2 : 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Ionicons name="book-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text }}>
                    What's on your mind?
                  </Text>
                </View>
                <TextInput
                  value={journalEntry}
                  onChangeText={setJournalEntry}
                  placeholder="Write about your thoughts, feelings, or anything you want to reflect on..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  textAlignVertical="top"
                  style={{
                    minHeight: 100,
                    backgroundColor: colors.surfaceVariant,
                    borderRadius: 14,
                    padding: 16,
                    fontSize: 15,
                    color: colors.text,
                    lineHeight: 22,
                  }}
                />
              </View>

              {/* Gratitude */}
              <View style={{
                backgroundColor: colors.surface,
                borderRadius: 20,
                padding: 20,
                marginBottom: 28,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDarkColorScheme ? 0.2 : 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Ionicons name="heart-outline" size={20} color="#E57373" style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text }}>
                    What are you grateful for?
                  </Text>
                </View>
                <TextInput
                  value={gratitude}
                  onChangeText={setGratitude}
                  placeholder="List one or more things you're grateful for today..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  textAlignVertical="top"
                  style={{
                    minHeight: 80,
                    backgroundColor: colors.surfaceVariant,
                    borderRadius: 14,
                    padding: 16,
                    fontSize: 15,
                    color: colors.text,
                    lineHeight: 22,
                  }}
                />
              </View>

              {/* Save Button */}
              <Pressable 
                onPress={handleSave} 
                disabled={isSaving}
                style={{ overflow: 'hidden', borderRadius: 16, opacity: isSaving ? 0.7 : 1 }}
              >
                <LinearGradient
                  colors={['#2AA79D', '#3A9C94']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: 18,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700' }}>
                    {isSaving ? "Saving..." : "Save Check-in"}
                  </Text>
                </LinearGradient>
              </Pressable>
            </>
          ) : (
            <>
              {/* History View */}
              {/* Mood Chart */}
              <View style={{
                backgroundColor: colors.surface,
                borderRadius: 20,
                padding: 20,
                marginBottom: 20,
              }}>
                <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text, marginBottom: 4 }}>
                  Last 7 Days
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 8 }}>
                  Your mood over the past week
                </Text>
                {renderMoodChart()}
              </View>

              {/* History List */}
              <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text, marginBottom: 16 }}>
                All Entries
              </Text>
              
              {isLoading ? (
                <View style={{ padding: 40, alignItems: "center" }}>
                  <Text style={{ color: colors.textSecondary }}>Loading...</Text>
                </View>
              ) : moodHistory.length === 0 ? (
                <View style={{ 
                  padding: 40, 
                  alignItems: "center",
                  backgroundColor: colors.surface,
                  borderRadius: 20,
                }}>
                  <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
                  <Text style={{ 
                    fontSize: 16, 
                    fontWeight: "600", 
                    color: colors.text, 
                    marginTop: 16 
                  }}>
                    No entries yet
                  </Text>
                  <Text style={{ 
                    fontSize: 14, 
                    color: colors.textSecondary, 
                    marginTop: 4,
                    textAlign: "center"
                  }}>
                    Start tracking your mood to see your history here.
                  </Text>
                  <Pressable 
                    onPress={() => setViewMode("checkin")}
                    style={{
                      marginTop: 20,
                      paddingHorizontal: 24,
                      paddingVertical: 12,
                      backgroundColor: colors.primary,
                      borderRadius: 12,
                    }}
                  >
                    <Text style={{ color: "#FFF", fontWeight: "600" }}>Add First Entry</Text>
                  </Pressable>
                </View>
              ) : (
                moodHistory.map((entry, index) => renderHistoryItem(entry, index))
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
}
