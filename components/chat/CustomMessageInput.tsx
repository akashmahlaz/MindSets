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
    background: isDarkColorScheme ? "#0C0F14" : "#FAFBFC",
    inputBg: isDarkColorScheme ? "#1E293B" : "#F1F5F9",
    inputBorder: isDarkColorScheme ? "#334155" : "#E2E8F0",
    text: isDarkColorScheme ? "#F1F5F9" : "#0F172A",
    textSecondary: isDarkColorScheme ? "#94A3B8" : "#64748B",
    primary: "#6366F1",
    sendButton: "#6366F1",
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
