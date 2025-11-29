import { useColorScheme } from "@/lib/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Keyboard,
    Platform,
    Pressable,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMessageInputContext } from "stream-chat-expo";

export const CustomMessageInput = () => {
  const { isDarkColorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  
  const {
    text,
    setText,
    sendMessage,
    openAttachmentPicker,
  } = useMessageInputContext();

  const colors = {
    background: isDarkColorScheme ? "#0F1117" : "#FFFFFF",
    inputBg: isDarkColorScheme ? "#151923" : "#F9FBFB",
    inputBorder: isDarkColorScheme ? "#374151" : "#E5E7EB",
    text: isDarkColorScheme ? "#E5E7EB" : "#1F2937",
    textSecondary: isDarkColorScheme ? "#9CA3AF" : "#6B7280",
    primary: "#2AA79D",
    sendButton: "#2AA79D",
  };

  const handleSend = async () => {
    if (!text.trim()) return;
    
    Keyboard.dismiss();
    await sendMessage();
  };

  return (
    <View
      style={{
        backgroundColor: colors.background,
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: Platform.OS === "ios" ? 8 : Math.max(insets.bottom, 8),
        borderTopWidth: 0,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          backgroundColor: colors.inputBg,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: colors.inputBorder,
          paddingHorizontal: 4,
          paddingVertical: 4,
          minHeight: 52,
        }}
      >
        {/* Attachment Button */}
        <Pressable
          onPress={openAttachmentPicker}
          accessibilityLabel="Add attachment"
          accessibilityRole="button"
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "transparent",
          }}
        >
          <Ionicons name="add-circle-outline" size={26} color={colors.textSecondary} />
        </Pressable>

        {/* Text Input */}
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Message..."
          placeholderTextColor={colors.textSecondary}
          multiline
          accessibilityLabel="Message input"
          accessibilityHint="Type your message here"
          style={{
            flex: 1,
            fontSize: 16,
            color: colors.text,
            paddingHorizontal: 8,
            paddingVertical: Platform.OS === "ios" ? 10 : 8,
            maxHeight: 120,
            minHeight: 40,
          }}
        />

        {/* Send Button */}
        <Pressable
          onPress={handleSend}
          disabled={!text.trim()}
          accessibilityLabel="Send message"
          accessibilityRole="button"
          accessibilityState={{ disabled: !text.trim() }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: text.trim() ? colors.sendButton : "transparent",
            opacity: text.trim() ? 1 : 0.5,
          }}
        >
          <Ionicons 
            name="arrow-up" 
            size={22} 
            color={text.trim() ? "#FFFFFF" : colors.textSecondary} 
          />
        </Pressable>
      </View>
    </View>
  );
};

export default CustomMessageInput;
