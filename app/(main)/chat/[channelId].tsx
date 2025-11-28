import "@/app/global.css";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import { useColorScheme } from "@/lib/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StatusBar,
    Text,
    View
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Channel as StreamChannel } from "stream-chat";
import {
    Channel,
    MessageInput,
    MessageList,
} from "stream-chat-expo";

export default function ChatScreen() {
  const { channelId } = useLocalSearchParams();
  const { chatClient, isChatConnected } = useChat();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDarkColorScheme } = useColorScheme();
  const [channel, setChannel] = useState<StreamChannel | null>(null);
  const [loading, setLoading] = useState(true);

  // Premium colors - matching app theme
  const colors = {
    background: isDarkColorScheme ? "#0C0F14" : "#FAFBFC",
    surface: isDarkColorScheme ? "#1A1F2E" : "#FFFFFF",
    surfaceVariant: isDarkColorScheme ? "#252B3B" : "#F1F5F9",
    text: isDarkColorScheme ? "#F1F5F9" : "#0F172A",
    textSecondary: isDarkColorScheme ? "#94A3B8" : "#64748B",
    primary: "#6366F1",
    primaryLight: "#818CF8",
    border: isDarkColorScheme ? "#334155" : "#E2E8F0",
    online: "#10B981",
    myMessageBg: "#6366F1",
    otherMessageBg: isDarkColorScheme ? "#1A1F2E" : "#F1F5F9",
  };

  useEffect(() => {
    const fetchChannel = async () => {
      if (!chatClient || !isChatConnected || !user || !channelId) {
        setLoading(false);
        return;
      }
      try {
        let channelIdStr: string = Array.isArray(channelId)
          ? channelId[0]
          : channelId;
        
        // Try to extract member IDs from channel ID for DM channels
        // Supports both "dm-uid1-uid2" and "uid1-uid2" formats
        let members: string[] = [user.uid];
        if (typeof channelIdStr === "string") {
          let idParts: string[];
          if (channelIdStr.startsWith("dm-")) {
            idParts = channelIdStr.split("-").slice(1);
          } else {
            // Assume format is "uid1-uid2" (sorted)
            idParts = channelIdStr.split("-");
          }
          idParts.forEach((id) => {
            if (id && !members.includes(id)) members.push(id);
          });
        }
        
        const channelObj = chatClient.channel("messaging", channelIdStr, {
          members,
        });
        await channelObj.watch();
        setChannel(channelObj);
      } catch (error) {
        console.error("Error fetching channel:", error);
        Alert.alert("Error", "Failed to load chat channel.");
      } finally {
        setLoading(false);
      }
    };
    fetchChannel();
  }, [chatClient, isChatConnected, user, channelId]);

  // Handle back navigation - go back to chat list
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // Fallback to chat tab if no history
      router.replace("/(main)/chat");
    }
  };

  if (loading || !channel) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
        <StatusBar
          barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
          backgroundColor={colors.background}
        />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
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
            Loading chat...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Helper to get other member's user object
  const getOtherMember = () => {
    if (!channel || !channel.state?.members) return null;
    const members = Object.values(channel.state.members);
    return members.find((m: any) => m.user?.id !== user?.uid)?.user || null;
  };
  
  const otherUser = getOtherMember();
  
  const getOnlineStatus = () => {
    if (!otherUser) return false;
    return otherUser.online === true;
  };
  
  const getAvatarUrl = () => {
    return otherUser?.image || undefined;
  };

  // Get display name - clean up if it's an email
  const getDisplayName = () => {
    if (!otherUser) return "Chat";
    const name = otherUser.name || otherUser.id || "Chat";
    // If name looks like an email, extract the part before @
    if (name.includes("@")) {
      const emailName = name.split("@")[0];
      // Capitalize first letter and replace dots/underscores with spaces
      return emailName
        .replace(/[._]/g, " ")
        .replace(/\b\w/g, (l: string) => l.toUpperCase());
    }
    return name;
  };

  const isOnline = getOnlineStatus();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />
      {/* Safe area only for top - tab bar handles bottom */}
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      
      {/* Premium Header - Clean, no border */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: colors.surface,
        ...Platform.select({
          ios: {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: isDarkColorScheme ? 0.15 : 0.05,
            shadowRadius: 4,
          },
          android: {
            elevation: 2,
          },
        }),
      }}>
        <Pressable
          onPress={handleBack}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: colors.surfaceVariant,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
          }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        
        {/* Avatar */}
        <View style={{ position: 'relative', marginRight: 12 }}>
          <View style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            overflow: 'hidden',
            backgroundColor: colors.surfaceVariant,
          }}>
            {getAvatarUrl() ? (
              <Image
                source={{ uri: getAvatarUrl() }}
                style={{ width: 44, height: 44 }}
              />
            ) : (
              <View style={{
                width: 44,
                height: 44,
                backgroundColor: colors.primary + '20',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Ionicons name="person" size={22} color={colors.primary} />
              </View>
            )}
          </View>
          {/* Online indicator */}
          {isOnline && (
            <View style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: colors.online,
              borderWidth: 2,
              borderColor: colors.surface,
            }} />
          )}
        </View>
        
        {/* Name & Status */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text }} numberOfLines={1}>
            {getDisplayName()}
          </Text>
          <Text style={{ 
            fontSize: 13, 
            color: isOnline ? colors.online : colors.textSecondary,
            marginTop: 2,
          }}>
            {isOnline ? "Online" : "Offline"}
          </Text>
        </View>
        
        {/* Call buttons */}
        <Pressable
          onPress={() => {/* TODO: Voice call */}}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: colors.surfaceVariant,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 8,
          }}
        >
          <Ionicons name="call-outline" size={20} color={colors.primary} />
        </Pressable>
        <Pressable
          onPress={() => {/* TODO: Video call */}}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: colors.surfaceVariant,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name="videocam-outline" size={20} color={colors.primary} />
        </Pressable>
      </View>

      {/* Chat Area with proper keyboard handling */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <Channel
            channel={channel}
            keyboardVerticalOffset={0}
            disableKeyboardCompatibleView={true}
          >
            <MessageList />
            <MessageInput />
          </Channel>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
