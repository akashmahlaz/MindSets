import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/lib/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Pressable,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

// Mood options
const MOODS = [
  { emoji: "😊", label: "Great", color: "#10B981" },
  { emoji: "🙂", label: "Good", color: "#6366F1" },
  { emoji: "😐", label: "Okay", color: "#F59E0B" },
  { emoji: "😔", label: "Low", color: "#8B5CF6" },
  { emoji: "😢", label: "Sad", color: "#EF4444" },
];

export default function JournalScreen() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const { isDarkColorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [journalEntry, setJournalEntry] = useState("");
  const [gratitude, setGratitude] = useState("");

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

  // Premium Material Design 3 colors
  const colors = {
    background: isDarkColorScheme ? "#0F172A" : "#FAFBFC",
    surface: isDarkColorScheme ? "#1E293B" : "#FFFFFF",
    surfaceVariant: isDarkColorScheme ? "#334155" : "#F1F5F9",
    text: isDarkColorScheme ? "#F1F5F9" : "#0F172A",
    textSecondary: isDarkColorScheme ? "#94A3B8" : "#64748B",
    primary: "#6366F1",
    primaryContainer: isDarkColorScheme ? "rgba(99, 102, 241, 0.15)" : "rgba(99, 102, 241, 0.08)",
    border: isDarkColorScheme ? "#334155" : "#E2E8F0",
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const handleSave = () => {
    // TODO: Save to Firestore
    console.log("Saving journal entry:", { mood: selectedMood, journalEntry, gratitude });
    router.back();
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
              Daily Check-in
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 2 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Greeting */}
          <View style={{ marginBottom: 28 }}>
            <Text style={{ fontSize: 26, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
              {getGreeting()}, {userProfile?.displayName?.split(' ')[0] || 'there'} 👋
            </Text>
            <Text style={{ fontSize: 16, color: colors.textSecondary, lineHeight: 24 }}>
              Take a moment to reflect on how you're feeling today.
            </Text>
          </View>

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
                  onPress={() => setSelectedMood(index)}
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
                minHeight: 120,
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
              <Ionicons name="heart-outline" size={20} color="#EC4899" style={{ marginRight: 8 }} />
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
          <Pressable onPress={handleSave} style={{ overflow: 'hidden', borderRadius: 16 }}>
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
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
                Save Check-in
              </Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
}
