import "@/app/global.css";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import { useColorScheme } from "@/lib/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { ActivityIndicator, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChannelList } from "stream-chat-expo";

export default function ChannelListScreen() {
  const { chatClient, isChatConnected, isConnecting, connectionError, retryConnection } = useChat();
  const { user } = useAuth();
  const { isDarkColorScheme } = useColorScheme();

  // Premium colors - matching app theme
  const colors = {
    background: isDarkColorScheme ? "#0C0F14" : "#FAFBFC",
    surface: isDarkColorScheme ? "#1A1F2E" : "#FFFFFF",
    surfaceVariant: isDarkColorScheme ? "#252B3B" : "#F1F5F9",
    primary: "#6366F1",
    primaryLight: "#818CF8",
    text: isDarkColorScheme ? "#F1F5F9" : "#0F172A",
    textSecondary: isDarkColorScheme ? "#94A3B8" : "#64748B",
    border: isDarkColorScheme ? "#334155" : "#E2E8F0",
    error: "#EF4444",
  };

  // Show error state with retry option
  if (connectionError) {
    return (
      <SafeAreaView
        edges={["top"]}
        style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }}
      >
        <StatusBar
          barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
          backgroundColor={colors.background}
        />
        <View style={{
          width: 80,
          height: 80,
          borderRadius: 24,
          backgroundColor: colors.error + '15',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 20,
        }}>
          <Ionicons name="cloud-offline-outline" size={40} color={colors.error} />
        </View>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: '600', marginBottom: 8, textAlign: 'center' }}>
          Connection Error
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
          {connectionError}
        </Text>
        <TouchableOpacity
          onPress={retryConnection}
          disabled={isConnecting}
          accessibilityLabel="Retry connection"
          accessibilityRole="button"
          accessibilityState={{ disabled: isConnecting }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
            backgroundColor: colors.primary,
            opacity: isConnecting ? 0.7 : 1,
          }}
        >
          {isConnecting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="refresh" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Try Again</Text>
            </>
          )}
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

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
          {isConnecting ? "Connecting to chat..." : "Loading channels..."}
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

  const handleChannelSelect = (channel: any) => {
    // Navigate within the (main) tab group to keep tabs visible during transition
    router.push(`/(main)/chat/${channel.id}`);
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
        paddingTop: 12,
        paddingBottom: 20,
        backgroundColor: colors.background,
      }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5 }}>
          Messages
        </Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4, fontWeight: '500' }}>
          Your conversations
        </Text>
      </View>

      {/* Channel List */}
      <ChannelList
        filters={filters}
        sort={sort}
        options={options}
        onSelect={handleChannelSelect}
        additionalFlatListProps={{
          style: { backgroundColor: colors.background },
          contentContainerStyle: { paddingBottom: 20 },
          showsVerticalScrollIndicator: false,
        }}
        EmptyStateIndicator={() => (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 60 }}>
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
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <Ionicons name="chatbubbles-outline" size={48} color="#FFFFFF" />
            </LinearGradient>
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700', marginBottom: 12, letterSpacing: -0.3 }}>
              No conversations yet
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 15, textAlign: 'center', lineHeight: 24, paddingHorizontal: 20 }}>
              Start a conversation with a counselor{'\n'}to begin your wellness journey
            </Text>
            
            {/* CTA Button */}
            <TouchableOpacity
              onPress={() => router.push("/(main)/Counselors")}
              accessibilityLabel="Find a counselor"
              accessibilityRole="button"
              style={{
                marginTop: 28,
                paddingHorizontal: 28,
                paddingVertical: 14,
                backgroundColor: colors.primary,
                borderRadius: 14,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
              activeOpacity={0.85}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600" }}>
                Find a Counselor
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
