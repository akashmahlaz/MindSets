import { useColorScheme } from "@/lib/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { useCall, useCallStateHooks } from "@stream-io/video-react-native-sdk";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, Image, Pressable, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Animated pulse ring for outgoing call
const CallingPulse = ({ color }: { color: string }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.4,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim, opacityAnim]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: color,
        transform: [{ scale: pulseAnim }],
        opacity: opacityAnim,
      }}
    />
  );
};

// Animated dots for "Calling..."
const CallingDots = ({ color }: { color: string }) => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );

    const anim1 = animateDot(dot1, 0);
    const anim2 = animateDot(dot2, 150);
    const anim3 = animateDot(dot3, 300);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [dot1, dot2, dot3]);

  const dotStyle = (anim: Animated.Value) => ({
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: color,
    marginHorizontal: 3,
    opacity: anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    }),
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -6],
        }),
      },
    ],
  });

  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
      <Animated.View style={dotStyle(dot1)} />
      <Animated.View style={dotStyle(dot2)} />
      <Animated.View style={dotStyle(dot3)} />
    </View>
  );
};

export const CustomOutgoingCall = () => {
  const { isDarkColorScheme } = useColorScheme();
  const call = useCall();
  const { useCallMembers } = useCallStateHooks();
  const members = useCallMembers();
  const [isWaiting, setIsWaiting] = useState(true);

  // Colors matching app theme
  const colors = {
    background: isDarkColorScheme ? "#0C0F14" : "#F8FAFB",
    surface: isDarkColorScheme ? "#1A1F2E" : "#FFFFFF",
    text: isDarkColorScheme ? "#F1F5F9" : "#0F172A",
    textSecondary: isDarkColorScheme ? "#94A3B8" : "#64748B",
    primary: "#2AA79D",
    decline: "#EF4444",
    pulseColor: isDarkColorScheme ? "rgba(42,167,157,0.1)" : "rgba(42,167,157,0.08)",
  };

  // Find the person being called (not the current user)
  const recipient = members.find(
    (member) => member.user.id !== call?.currentUserId,
  );
  const recipientName = recipient?.user.name || recipient?.user.id || "Unknown";
  const recipientImage = recipient?.user.image;
  const isVideoCall = Boolean(call?.state.custom?.isVideo) || call?.state.custom?.callType === "video";

  const handleCancel = async () => {
    if (!call) return;
    try {
      console.log("Canceling outgoing call:", call.cid);
      await call.leave({ reject: true });
    } catch (error) {
      console.error("Error canceling call:", error);
    }
  };

  // Listen for when someone accepts the call
  useEffect(() => {
    if (!call) return;

    const handleCallAccepted = () => {
      console.log("Call was accepted, navigating to call screen...");
      setIsWaiting(false);

      router.push({
        pathname: "/call/[callId]",
        params: {
          callId: call.id,
          callType: call.type,
          isVideo: isVideoCall,
        },
      });
    };

    const unsubscribe = call.on("call.session_started", handleCallAccepted);
    return () => unsubscribe();
  }, [call, isVideoCall]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDarkColorScheme ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      {/* Background gradient */}
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: SCREEN_WIDTH * 0.8 }}>
        <Svg height={SCREEN_WIDTH * 0.8} width={SCREEN_WIDTH}>
          <Defs>
            <RadialGradient id="grad" cx="50%" cy="30%" rx="80%" ry="60%" fx="50%" fy="30%">
              <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.12" />
              <Stop offset="100%" stopColor={colors.background} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={SCREEN_WIDTH / 2} cy={SCREEN_WIDTH * 0.3} r={SCREEN_WIDTH * 0.6} fill="url(#grad)" />
        </Svg>
      </View>

      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          
          {/* Calling label */}
          <View style={{
            backgroundColor: isDarkColorScheme ? "rgba(42,167,157,0.15)" : "rgba(42,167,157,0.1)",
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            marginBottom: 32,
            flexDirection: "row",
            alignItems: "center",
          }}>
            <Ionicons name={isVideoCall ? "videocam" : "call"} size={16} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={{ color: colors.primary, fontSize: 14, fontWeight: "600" }}>
              {isVideoCall ? "Video" : "Voice"} Call
            </Text>
          </View>

          {/* Recipient avatar with pulsing effect */}
          <View style={{ alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
            <CallingPulse color={colors.pulseColor} />
            
            <View style={{
              width: 160,
              height: 160,
              borderRadius: 80,
              backgroundColor: colors.surface,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 20,
              elevation: 10,
            }}>
              {recipientImage ? (
                <Image
                  source={{ uri: recipientImage }}
                  style={{ width: 160, height: 160, borderRadius: 80 }}
                  resizeMode="cover"
                />
              ) : (
                <LinearGradient
                  colors={["#2AA79D", "#0D9488"]}
                  style={{
                    width: 160,
                    height: 160,
                    borderRadius: 80,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 56, fontWeight: "700", color: "#FFF" }}>
                    {recipientName.charAt(0).toUpperCase()}
                  </Text>
                </LinearGradient>
              )}
            </View>
          </View>

          {/* Recipient name */}
          <Text style={{
            fontSize: 32,
            fontWeight: "800",
            color: colors.text,
            marginBottom: 8,
            textAlign: "center",
          }}>
            {recipientName}
          </Text>

          {/* Status */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{
              fontSize: 16,
              color: colors.textSecondary,
              textAlign: "center",
            }}>
              {isWaiting ? "Calling" : "Connecting"}
            </Text>
            <CallingDots color={colors.textSecondary} />
          </View>
        </View>

        {/* Cancel button */}
        <View style={{ paddingHorizontal: 48, paddingBottom: 48, alignItems: "center" }}>
          <View style={{ alignItems: "center" }}>
            <Pressable
              onPress={handleCancel}
              style={({ pressed }) => ({
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: colors.decline,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.8 : 1,
                shadowColor: colors.decline,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              })}
            >
              <Ionicons name="close" size={36} color="#FFF" />
            </Pressable>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 12, fontWeight: "500" }}>
              Cancel
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};
