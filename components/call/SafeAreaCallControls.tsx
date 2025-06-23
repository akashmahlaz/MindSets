import {
  CallControls,
  HangUpCallButton,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
} from "@stream-io/video-react-native-sdk";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Custom CallControls component with proper safe area inset handling
export const CustomCallControls = () => {
  const { bottom } = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(bottom, 20), // Ensure at least 20px padding, more if safe area requires it
        },
      ]}
    >
      <View style={styles.controlsRow}>
        <ToggleAudioPublishingButton />
        <HangUpCallButton />
        <ToggleVideoPublishingButton />
      </View>
    </View>
  );
};

// Alternative: Use the default CallControls with custom container
export const SafeAreaCallControls = () => {
  const { bottom } = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.safeContainer,
        {
          paddingBottom: Math.max(bottom, 20), // Ensure safe area compliance
        },
      ]}
    >
      <CallControls />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
  },
  safeContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
});
