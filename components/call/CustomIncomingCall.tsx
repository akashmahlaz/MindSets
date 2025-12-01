import { getSoundSource, SOUND_IDS } from "@/lib/soundAssets";
import { soundService } from "@/lib/SoundService";
import { useColorScheme } from "@/lib/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import {
  CallingState,
  useCall,
  useCallStateHooks,
} from "@stream-io/video-react-native-sdk";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Alert, Animated, Dimensions, Image, Pressable, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Animated pulse ring component
const PulseRing = ({ delay = 0, color }: { delay?: number; color: string }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 2.5,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.6,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [delay, scale, opacity]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        width: 160,
        height: 160,
        borderRadius: 80,
        borderWidth: 2,
        borderColor: color,
        transform: [{ scale }],
        opacity,
      }}
    />
  );
};

export const CustomIncomingCall = () => {
  const { isDarkColorScheme } = useColorScheme();
  const call = useCall();
  const { useCallMembers, useCallCallingState } = useCallStateHooks();
  const members = useCallMembers();
  const callingState = useCallCallingState();
  const ringtoneId = useRef('incoming-ringtone');

  // Play ringtone when component mounts
  useEffect(() => {
    const soundId = ringtoneId.current;
    const playRingtone = async () => {
      const ringtoneSource = getSoundSource(SOUND_IDS.CALL_RINGTONE);
      if (ringtoneSource) {
        await soundService.initialize();
        await soundService.loadSound(soundId, ringtoneSource, { loop: true, volume: 0.8 });
        await soundService.play(soundId);
      }
    };
    playRingtone();

    return () => {
      soundService.unloadSound(soundId);
    };
  }, []);

  // Colors matching app theme
  const colors = {
    background: isDarkColorScheme ? "#0C0F14" : "#F8FAFB",
    surface: isDarkColorScheme ? "#1A1F2E" : "#FFFFFF",
    text: isDarkColorScheme ? "#F1F5F9" : "#0F172A",
    textSecondary: isDarkColorScheme ? "#94A3B8" : "#64748B",
    primary: "#2AA79D",
    accept: "#22C55E",
    decline: "#EF4444",
    ring: isDarkColorScheme ? "rgba(42,167,157,0.3)" : "rgba(42,167,157,0.2)",
  };

  // Find the caller (not the current user)
  const caller = members.find(
    (member) => member.user.id !== call?.currentUserId,
  );
  const callerName = caller?.user.name || caller?.user.id || "Unknown";
  const callerImage = caller?.user.image;
  const isVideoCall = Boolean(call?.state.custom?.isVideo) || call?.state.custom?.callType === "video";

  // Navigate to the call screen once the call is joined
  useEffect(() => {
    if (callingState === CallingState.JOINED && call) {
      // Stop ringtone and play connected sound
      soundService.unloadSound(ringtoneId.current);
      const connectedSource = getSoundSource(SOUND_IDS.CALL_CONNECTED);
      if (connectedSource) {
        soundService.playUISound(connectedSource, 0.5);
      }
      
      router.push({
        pathname: "/call/[callId]",
        params: {
          callId: call.id,
          callType: call.type,
          isVideo: isVideoCall ? "true" : "false",
        },
      });
    }
  }, [callingState, call, isVideoCall]);

  const handleAccept = async () => {
    if (!call) return;
    try {
      // Stop ringtone
      await soundService.unloadSound(ringtoneId.current);
      await call.join();
    } catch {
      Alert.alert("Error", "Failed to accept call");
    }
  };

  const handleDecline = async () => {
    if (!call) return;
    try {
      // Stop ringtone and play ended sound
      await soundService.unloadSound(ringtoneId.current);
      const endedSource = getSoundSource(SOUND_IDS.CALL_ENDED);
      if (endedSource) {
        soundService.playUISound(endedSource, 0.5);
      }
      await call.leave({ reject: true });
    } catch {
      // Handle decline error silently
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDarkColorScheme ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      {/* Background gradient overlay */}
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: SCREEN_WIDTH * 0.8 }}>
        <Svg height={SCREEN_WIDTH * 0.8} width={SCREEN_WIDTH}>
          <Defs>
            <RadialGradient id="grad" cx="50%" cy="30%" rx="80%" ry="60%" fx="50%" fy="30%">
              <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.15" />
              <Stop offset="100%" stopColor={colors.background} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={SCREEN_WIDTH / 2} cy={SCREEN_WIDTH * 0.3} r={SCREEN_WIDTH * 0.6} fill="url(#grad)" />
        </Svg>
      </View>

      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          
          {/* Incoming call label */}
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
              Incoming {isVideoCall ? "Video" : "Voice"} Call
            </Text>
          </View>

          {/* Caller avatar with pulse rings */}
          <View style={{ alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
            <PulseRing delay={0} color={colors.ring} />
            <PulseRing delay={600} color={colors.ring} />
            <PulseRing delay={1200} color={colors.ring} />
            
            <View style={{
              width: 160,
              height: 160,
              borderRadius: 80,
              backgroundColor: colors.surface,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.2,
              shadowRadius: 24,
              elevation: 12,
            }}>
              {callerImage ? (
                <Image
                  source={{ uri: callerImage }}
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
                    {callerName.charAt(0).toUpperCase()}
                  </Text>
                </LinearGradient>
              )}
            </View>
          </View>

          {/* Caller name */}
          <Text style={{
            fontSize: 32,
            fontWeight: "800",
            color: colors.text,
            marginBottom: 8,
            textAlign: "center",
          }}>
            {callerName}
          </Text>
          
          <Text style={{
            fontSize: 16,
            color: colors.textSecondary,
            textAlign: "center",
          }}>
            is calling you...
          </Text>
        </View>

        {/* Call action buttons */}
        <View style={{ paddingHorizontal: 48, paddingBottom: 48 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            
            {/* Decline button */}
            <View style={{ alignItems: "center" }}>
              <Pressable
                onPress={handleDecline}
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
                Decline
              </Text>
            </View>

            {/* Accept button */}
            <View style={{ alignItems: "center" }}>
              <Pressable
                onPress={handleAccept}
                style={({ pressed }) => ({
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: colors.accept,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.8 : 1,
                  shadowColor: colors.accept,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8,
                })}
              >
                <Ionicons name={isVideoCall ? "videocam" : "call"} size={32} color="#FFF" />
              </Pressable>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 12, fontWeight: "500" }}>
                Accept
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};
