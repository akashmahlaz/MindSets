import "@/app/global.css";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import { useColorScheme } from "@/lib/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { ActivityIndicator, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChannelList } from "stream-chat-expo";

export default function ChannelListScreen() {
  const { chatClient, isChatConnected } = useChat();
  const { user } = useAuth();
  const { isDarkColorScheme } = useColorScheme();

  // MD3 Premium Colors
  const colors = {
    background: isDarkColorScheme ? "#0C0F14" : "#F8FAFF",
    surface: isDarkColorScheme ? "#1A1F2E" : "#FFFFFF",
    surfaceVariant: isDarkColorScheme ? "#232936" : "#F1F5F9",
    primary: "#6366F1",
    primaryLight: "#818CF8",
    text: isDarkColorScheme ? "#F9FAFB" : "#111827",
    textSecondary: isDarkColorScheme ? "#9CA3AF" : "#6B7280",
    border: isDarkColorScheme ? "#374151" : "#E5E7EB",
  };

  if (!chatClient || !isChatConnected || !user) {
    return (
      <SafeAreaView
        edges={["top"]}
        style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}
      >
        <StatusBar
          barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
          backgroundColor={colors.background}
        />
        <View style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          backgroundColor: colors.surfaceVariant,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 16,
        }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
        <Text style={{ color: colors.textSecondary, fontSize: 16, fontWeight: '500' }}>
          Loading channels...
        </Text>
      </SafeAreaView>
    );
  }

  const filters = {
    type: "messaging",
    members: { $in: [user.uid] },
  };

  const sort = {
    last_message_at: -1 as const,
  };

  const options = {
    watch: true,
    presence: true,
    limit: 30,
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <StatusBar
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />
      
      {/* Premium Header */}
      <View style={{ 
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.background,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 28, fontWeight: '700', color: colors.text }}>
              Messages
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 4 }}>
              Your conversations
            </Text>
          </View>
          <View style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            backgroundColor: colors.surfaceVariant,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Ionicons name="create-outline" size={22} color={colors.primary} />
          </View>
        </View>
      </View>

      {/* Channel List */}
      <ChannelList
        filters={filters}
        sort={sort}
        options={options}
        onSelect={(channel) => {
          router.push(`/chat/${channel.id}`);
        }}
        additionalFlatListProps={{
          style: { backgroundColor: colors.background },
          contentContainerStyle: { paddingTop: 8, paddingBottom: 20 },
        }}
        EmptyStateIndicator={() => (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
            <LinearGradient
              colors={[colors.primary, colors.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 100,
                height: 100,
                borderRadius: 30,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 24,
              }}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={48} color="#FFFFFF" />
            </LinearGradient>
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: '600', marginBottom: 8 }}>
              No conversations yet
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 15, textAlign: 'center', lineHeight: 22 }}>
              Start a conversation with a counsellor{'\n'}or connect with someone new
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
