import {
    HangUpCallButton,
    ReactionsButton,
    ToggleAudioPublishingButton,
    ToggleCameraFaceButton,
    ToggleVideoPublishingButton,
    useCall,
} from "@stream-io/video-react-native-sdk";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface CustomCallControlsProps {
  onHangupCallHandler?: () => void;
}

export const CustomCallControls = ({ onHangupCallHandler }: CustomCallControlsProps) => {
  const insets = useSafeAreaInsets();
  const call = useCall();

  const handleHangup = async () => {
    if (onHangupCallHandler) {
      onHangupCallHandler();
    } else {
      // Fallback: End call for everyone using Stream.io's recommended approach
      try {
        if (call) {
          console.log("CustomCallControls: Ending call for all participants");
          await call.endCall();
        }
      } catch (error) {
        console.error("CustomCallControls: Error ending call:", error);
        // Fallback to leave if endCall fails
        try {
          if (call) {
            await call.leave();
          }
        } catch (leaveError) {
          console.error("CustomCallControls: Error leaving call:", leaveError);
        }
      }
    }
  };
  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 20) }]}>
      <View style={styles.controlsRow}>
        <ToggleAudioPublishingButton />
        <ToggleVideoPublishingButton />
        <ToggleCameraFaceButton />
        <ReactionsButton />
        <HangUpCallButton onPressHandler={handleHangup} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
});
