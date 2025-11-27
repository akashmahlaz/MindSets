import "@/app/global.css";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import { useColorScheme } from "@/lib/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { ActivityIndicator, Pressable, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChannelList } from "stream-chat-expo";

export default function ChatTabScreen() {
  const { chatClient, isChatConnected } = useChat();
  const { user } = useAuth();
  const { isDarkColorScheme } = useColorScheme();

  // MD3 Premium Colors
  const colors = {
    background: isDarkColorScheme ? "#0F172A" : "#FAFBFC",
    surface: isDarkColorScheme ? "#1E293B" : "#FFFFFF",
    surfaceVariant: isDarkColorScheme ? "#334155" : "#F1F5F9",
    primary: "#6366F1",
    primaryLight: "#818CF8",
    text: isDarkColorScheme ? "#F1F5F9" : "#0F172A",
    textSecondary: isDarkColorScheme ? "#94A3B8" : "#64748B",
    border: isDarkColorScheme ? "#334155" : "#E2E8F0",
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
          Connecting to chat...
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

  // Navigate to chat detail - use the chat route group for proper stack navigation
  const handleChannelSelect = (channel: any) => {
    router.push({
      pathname: "/chat/[channelId]",
      params: { channelId: channel.id }
    });
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
            <Text style={{ fontSize: 28, fontWeight: '700', color: colors.text, letterSpacing: -0.5 }}>
              Messages
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 4 }}>
              Your conversations
            </Text>
          </View>
          <Pressable 
            onPress={() => router.push("/(main)/Counselors")}
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: colors.surfaceVariant,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="add" size={24} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      {/* Channel List */}
      <ChannelList
        filters={filters}
        sort={sort}
        options={options}
        onSelect={handleChannelSelect}
        additionalFlatListProps={{
          style: { backgroundColor: colors.background },
          contentContainerStyle: { paddingTop: 8, paddingBottom: 100 },
        }}
        EmptyStateIndicator={() => (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 40 }}>
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
            <Text style={{ color: colors.textSecondary, fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 24 }}>
              Start a conversation with a counselor{'\n'}to begin your journey
            </Text>
            <Pressable 
              onPress={() => router.push("/(main)/Counselors")}
              style={{ overflow: 'hidden', borderRadius: 14 }}
            >
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingHorizontal: 24,
                  paddingVertical: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="search" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Find a Counselor</Text>
              </LinearGradient>
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
