import { useColorScheme } from "@/lib/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
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
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  
  // Track keyboard visibility so we only add bottom inset when keyboard is hidden
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    
    const showSub = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));
    
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);
  
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

  // Calculate bottom padding:
  // - When keyboard is VISIBLE: minimal padding (keyboard pushes content up via resize on Android, KAV on iOS)
  // - When keyboard is HIDDEN: add bottom safe-area inset so input stays above phone buttons
  const bottomPadding = isKeyboardVisible ? 8 : Math.max(insets.bottom, 8);

  return (
    <View
      style={{
        backgroundColor: colors.background,
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: bottomPadding,
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
