import "@/app/global.css";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import { useVideo } from "@/context/VideoContext";
import { useColorScheme } from "@/lib/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActionSheetIOS,
    ActivityIndicator,
    Alert,
    Image,
    Keyboard,
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
  const { createCall, isVideoConnected, isCreatingCall } = useVideo();
  const { user } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isDarkColorScheme } = useColorScheme();
  const [channel, setChannel] = useState<StreamChannel | null>(null);
  const [loading, setLoading] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Track keyboard height
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  // Hide tab bar when chat screen is focused - more reliable approach
  useEffect(() => {
    const parent = navigation.getParent();
    if (!parent) return;

    // Hide tab bar immediately when this screen mounts
    parent.setOptions({
      tabBarStyle: { display: 'none', height: 0 },
    });

    // Also hide on focus (in case of navigation back to this screen)
    const unsubscribeFocus = navigation.addListener('focus', () => {
      parent.setOptions({
        tabBarStyle: { display: 'none', height: 0 },
      });
    });

    // Restore tab bar when leaving (blur)
    const unsubscribeBlur = navigation.addListener('blur', () => {
      parent.setOptions({
        tabBarStyle: {
          display: 'flex',
          backgroundColor: isDarkColorScheme ? '#0C0F14' : '#FAFBFC',
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 52 + insets.bottom : 60 + insets.bottom,
          paddingTop: 4,
          paddingBottom: insets.bottom,
          elevation: 0,
          shadowOpacity: 0,
        },
      });
    });

    // Cleanup: restore tab bar when component unmounts
    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
      parent.setOptions({
        tabBarStyle: {
          display: 'flex',
          backgroundColor: isDarkColorScheme ? '#0C0F14' : '#FAFBFC',
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 52 + insets.bottom : 60 + insets.bottom,
          paddingTop: 4,
          paddingBottom: insets.bottom,
          elevation: 0,
          shadowOpacity: 0,
        },
      });
    };
  }, [navigation, isDarkColorScheme, insets.bottom]);

  // Premium colors - matching app theme
  const colors = {
    background: isDarkColorScheme ? "#0C0F14" : "#FAFBFC",
    surface: isDarkColorScheme ? "#1A1F2E" : "#FFFFFF",
    surfaceVariant: isDarkColorScheme ? "#252B3B" : "#F1F5F9",
    text: isDarkColorScheme ? "#F1F5F9" : "#0F172A",
    textSecondary: isDarkColorScheme ? "#94A3B8" : "#64748B",
    primary: "#2AA79D",
    primaryLight: "#3A9C94",
    border: isDarkColorScheme ? "#334155" : "#E2E8F0",
    online: "#2AA79D",
  };

  useEffect(() => {
    let isMounted = true;
    let watchedChannel: StreamChannel | null = null;
    
    const fetchChannel = async () => {
      if (!chatClient || !isChatConnected || !user || !channelId) {
        if (isMounted) setLoading(false);
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
        watchedChannel = channelObj;
        if (isMounted) setChannel(channelObj);
      } catch (error) {
        console.error("Error fetching channel:", error);
        if (isMounted) Alert.alert("Error", "Failed to load chat channel.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchChannel();
    
    // Cleanup: stop watching channel on unmount to prevent memory leaks
    return () => {
      isMounted = false;
      if (watchedChannel) {
        watchedChannel.stopWatching().catch((err) => 
          console.log("Error stopping channel watch:", err)
        );
      }
    };
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

  // Generate a short unique call ID (max 64 chars for Stream.io)
  const generateCallId = (): string => {
    // Use shorter format: first 8 chars of each UID + timestamp base36
    const shortUserId = user?.uid?.substring(0, 8) || "u";
    const shortOtherId = otherUser?.id?.substring(0, 8) || "o";
    const timestamp = Date.now().toString(36); // Base36 is shorter
    return `${shortUserId}${shortOtherId}${timestamp}`;
  };

  // Handle initiating a call
  const handleCall = async (isVideo: boolean) => {
    if (!otherUser?.id || !user?.uid) {
      Alert.alert("Error", "Cannot initiate call - user information missing");
      return;
    }

    if (!isVideoConnected) {
      Alert.alert("Error", "Video service not connected. Please try again.");
      return;
    }

    if (isCreatingCall) {
      return; // Already creating a call
    }

    try {
      // Generate short unique call ID (max 64 chars for Stream.io)
      const callId = generateCallId();
      
      console.log("Initiating call:", { callId, isVideo, to: otherUser.id, length: callId.length });
      
      const call = await createCall(callId, [otherUser.id], isVideo);
      
      if (call) {
        // Navigate to call screen
        router.push({
          pathname: "/call/[callId]",
          params: { 
            callId: call.id,
            callType: "default",
            isVideo: isVideo.toString()
          }
        });
      } else {
        Alert.alert("Error", "Failed to create call. Please try again.");
      }
    } catch (error) {
      console.error("Error initiating call:", error);
      Alert.alert("Error", "Failed to start call. Please try again.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <StatusBar
          barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
          backgroundColor={colors.background}
        />
        
        {/* Premium Header - Clean design */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 10,
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}>
          <Pressable
            onPress={handleBack}
            accessibilityLabel="Go back"
            accessibilityRole="button"
            style={({ pressed }) => ({
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: colors.surfaceVariant,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 10,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          
          {/* Avatar */}
          <View 
            style={{ position: 'relative', marginRight: 10 }}
            accessibilityLabel={`${getDisplayName()}'s profile picture${isOnline ? ', online' : ', offline'}`}
          >
            <View style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              overflow: 'hidden',
              backgroundColor: colors.surfaceVariant,
            }}>
              {getAvatarUrl() ? (
                <Image
                  source={{ uri: getAvatarUrl() }}
                  style={{ width: 42, height: 42 }}
                  accessibilityIgnoresInvertColors
                />
              ) : (
                <View style={{
                  width: 42,
                  height: 42,
                  backgroundColor: colors.primary + '20',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <Ionicons name="person" size={20} color={colors.primary} />
                </View>
              )}
            </View>
            {/* Online indicator */}
            {isOnline && (
              <View 
                style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: colors.online,
                borderWidth: 2,
                borderColor: colors.background,
              }} />
            )}
          </View>
          
          {/* Name & Status */}
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }} numberOfLines={1}>
              {getDisplayName()}
            </Text>
            <Text style={{ 
              fontSize: 12, 
              color: isOnline ? colors.online : colors.textSecondary,
              marginTop: 1,
            }}>
              {isOnline ? "Online" : "Offline"}
            </Text>
          </View>
          
          {/* Call button - shows options */}
          <Pressable
            onPress={() => {
              if (Platform.OS === 'ios') {
                ActionSheetIOS.showActionSheetWithOptions(
                  {
                    options: ['Cancel', 'Voice Call', 'Video Call'],
                    cancelButtonIndex: 0,
                  },
                  (buttonIndex) => {
                    if (buttonIndex === 1) handleCall(false);
                    else if (buttonIndex === 2) handleCall(true);
                  }
                );
              } else {
                Alert.alert(
                  'Start Call',
                  'Choose call type',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Voice Call', onPress: () => handleCall(false) },
                    { text: 'Video Call', onPress: () => handleCall(true) },
                  ]
                );
              }
            }}
            disabled={isCreatingCall}
            accessibilityLabel="Start a call"
            accessibilityRole="button"
            accessibilityState={{ disabled: isCreatingCall }}
            style={({ pressed }) => ({
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: colors.surfaceVariant,
              justifyContent: 'center',
              alignItems: 'center',
              opacity: pressed || isCreatingCall ? 0.6 : 1,
            })}
          >
            <Ionicons name="call-outline" size={20} color={colors.primary} />
          </Pressable>
        </View>

        {/* Chat Area with proper keyboard handling */}
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <Channel
            channel={channel}
            enforceUniqueReaction={true}
            keyboardVerticalOffset={0}
          >
            <MessageList />
            {/* Add bottom padding when keyboard is hidden to stay above navigation bar */}
            <View style={{ 
              paddingBottom: Platform.OS === 'android' && keyboardHeight === 0 ? Math.max(insets.bottom, 16) : 0 
            }}>
              <MessageInput />
            </View>
          </Channel>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}