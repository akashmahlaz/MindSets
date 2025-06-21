import { Ionicons } from "@expo/vector-icons";
import {
    CallingState,
    useCall,
    useCallStateHooks,
    useConnectedUser,
    UserResponse,
} from "@stream-io/video-react-native-sdk";
import React, { useCallback } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

// User Info Component for showing call participants
export const UserInfoComponent = () => {
  const connectedUser = useConnectedUser();
  const { useCallMembers } = useCallStateHooks();
  const members = useCallMembers();
  
  const membersToShow: UserResponse[] = (members || [])
    .map(({ user }) => user)
    .filter((user) => user.id !== connectedUser?.id);

  return (
    <View style={styles.container}>
      <View style={styles.userInfo}>
        {membersToShow.map((memberToShow) => {
          return (
            <View key={memberToShow.id} style={styles.memberContainer}>
              {memberToShow.image ? (
                <Image
                  style={styles.avatar}
                  source={{ uri: memberToShow.image }}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>
                    {memberToShow.name?.charAt(0)?.toUpperCase() || "U"}
                  </Text>
                </View>
              )}
              <Text style={styles.title}>
                {memberToShow.name || memberToShow.id}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

// Media Stream Controls (Camera and Microphone)
export const MediaStreamButtonGroup = () => {
  const call = useCall();
  const { useMicrophoneState, useCameraState } = useCallStateHooks();
  const { isMute: microphoneMuted } = useMicrophoneState();
  const { isMute: cameraMuted } = useCameraState();

  const toggleAudioMuted = useCallback(async () => {
    try {
      await call?.microphone.toggle();
    } catch (error) {
      console.error("Error toggling microphone:", error);
    }
  }, [call]);

  const toggleVideoMuted = useCallback(async () => {
    try {
      await call?.camera.toggle();
    } catch (error) {
      console.error("Error toggling camera:", error);
    }
  }, [call]);

  return (
    <View style={styles.buttonGroup}>
      <Pressable
        onPress={toggleAudioMuted}
        style={[
          styles.mediaButton,
          { backgroundColor: microphoneMuted ? "#FF3742" : "#4CAF50" },
        ]}
      >
        <Ionicons
          name={microphoneMuted ? "mic-off" : "mic"}
          size={24}
          color="white"
        />
      </Pressable>
      <Pressable
        onPress={toggleVideoMuted}
        style={[
          styles.mediaButton,
          { backgroundColor: cameraMuted ? "#FF3742" : "#4CAF50" },
        ]}
      >
        <Ionicons
          name={cameraMuted ? "videocam-off" : "videocam"}
          size={24}
          color="white"
        />
      </Pressable>
    </View>
  );
};

// Incoming Call Button Group (Accept/Reject)
export const IncomingCallButtonGroup = () => {
  const call = useCall();
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  const acceptCallHandler = useCallback(async () => {
    try {
      console.log("Accepting incoming call");
      await call?.join();
    } catch (error) {
      console.error("Error accepting call:", error);
    }
  }, [call]);

  const rejectCallHandler = useCallback(async () => {
    try {
      if (callingState === CallingState.LEFT) {
        return;
      }
      console.log("Rejecting incoming call");
      await call?.leave({ reject: true, reason: "decline" });
    } catch (error) {
      console.error("Error rejecting call:", error);
    }
  }, [call, callingState]);

  return (
    <View style={styles.buttonGroup}>
      <Pressable
        style={[styles.callButton, styles.rejectButton]}
        onPress={rejectCallHandler}
      >
        <Ionicons name="call" size={32} color="white" style={{ transform: [{ rotate: '135deg' }] }} />
      </Pressable>
      <Pressable
        style={[styles.callButton, styles.acceptButton]}
        onPress={acceptCallHandler}
      >
        <Ionicons name="call" size={32} color="white" />
      </Pressable>
    </View>
  );
};

// Outgoing Call Button Group (Hang up)
export const OutgoingCallButtonGroup = () => {
  const call = useCall();
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  const hangupCallHandler = useCallback(async () => {
    try {
      if (callingState === CallingState.LEFT) {
        return;
      }
      console.log("Hanging up outgoing call");
      await call?.leave({ reject: true, reason: "cancel" });
    } catch (error) {
      console.error("Error hanging up call:", error);
    }
  }, [call, callingState]);

  return (
    <View style={styles.buttonGroup}>
      <Pressable
        style={[styles.callButton, styles.hangupButton]}
        onPress={hangupCallHandler}
      >
        <Ionicons name="call" size={32} color="white" style={{ transform: [{ rotate: '135deg' }] }} />
      </Pressable>
    </View>
  );
};

// Active Call Controls (End Call + Media Controls)
export const ActiveCallButtonGroup = ({ onEndCall }: { onEndCall: () => void }) => {
  const call = useCall();
  const { useMicrophoneState, useCameraState } = useCallStateHooks();
  const { isMute: microphoneMuted } = useMicrophoneState();
  const { isMute: cameraMuted } = useCameraState();

  const toggleAudioMuted = useCallback(async () => {
    try {
      await call?.microphone.toggle();
    } catch (error) {
      console.error("Error toggling microphone:", error);
    }
  }, [call]);

  const toggleVideoMuted = useCallback(async () => {
    try {
      await call?.camera.toggle();
    } catch (error) {
      console.error("Error toggling camera:", error);
    }
  }, [call]);

  const handleEndCall = useCallback(async () => {
    try {
      console.log("Ending active call");
      // Try to end the call for everyone first
      try {
        await call?.endCall();
        console.log("Call ended for all participants");
      } catch (endError) {
        console.log("Could not end call for everyone, leaving call:", endError);
        // Fallback to leave if endCall fails
        await call?.leave();
      }
      onEndCall();
    } catch (error) {
      console.error("Error ending call:", error);
      onEndCall(); // Still trigger the navigation
    }
  }, [call, onEndCall]);

  return (
    <View style={styles.activeCallControls}>
      <Pressable
        onPress={toggleAudioMuted}
        style={[
          styles.mediaButton,
          { backgroundColor: microphoneMuted ? "#FF3742" : "#333" },
        ]}
      >
        <Ionicons
          name={microphoneMuted ? "mic-off" : "mic"}
          size={24}
          color="white"
        />
      </Pressable>
      
      <Pressable
        style={[styles.callButton, styles.endCallButton]}
        onPress={handleEndCall}
      >
        <Ionicons name="call" size={32} color="white" style={{ transform: [{ rotate: '135deg' }] }} />
      </Pressable>
      
      <Pressable
        onPress={toggleVideoMuted}
        style={[
          styles.mediaButton,
          { backgroundColor: cameraMuted ? "#FF3742" : "#333" },
        ]}
      >
        <Ionicons
          name={cameraMuted ? "videocam-off" : "videocam"}
          size={24}
          color="white"
        />
      </Pressable>
    </View>
  );
};

// Complete Incoming Call Component
export const CustomIncomingCallComponent = () => {
  return (
    <View style={[StyleSheet.absoluteFill, styles.callContainer]}>
      <View style={styles.topSection}>
        <Text style={styles.callStatus}>Incoming Call</Text>
        <UserInfoComponent />
      </View>
      <View style={styles.bottomSection}>
        <IncomingCallButtonGroup />
      </View>
    </View>
  );
};

// Complete Outgoing Call Component
export const CustomOutgoingCallComponent = () => {
  return (
    <View style={[StyleSheet.absoluteFill, styles.callContainer]}>
      <View style={styles.topSection}>
        <Text style={styles.callStatus}>Calling...</Text>
        <UserInfoComponent />
      </View>
      <View style={styles.middleSection}>
        <MediaStreamButtonGroup />
      </View>
      <View style={styles.bottomSection}>
        <OutgoingCallButtonGroup />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  userInfo: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  memberContainer: {
    alignItems: "center",
    marginHorizontal: 20,
  },
  title: {
    fontSize: 24,
    color: "white",
    marginTop: 16,
    textAlign: "center",
    fontWeight: "600",
  },
  avatar: {
    height: 120,
    width: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 36,
    color: "white",
    fontWeight: "bold",
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  callButton: {
    height: 80,
    width: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  mediaButton: {
    height: 60,
    width: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  acceptButton: {
    backgroundColor: "#4CAF50",
  },
  rejectButton: {
    backgroundColor: "#FF3742",
  },
  hangupButton: {
    backgroundColor: "#FF3742",
  },
  endCallButton: {
    backgroundColor: "#FF3742",
  },
  callContainer: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    justifyContent: "space-between",
    paddingVertical: 60,
  },
  topSection: {
    flex: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  middleSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  callStatus: {
    fontSize: 20,
    color: "white",
    marginBottom: 40,
    textAlign: "center",
  },
  activeCallControls: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 20,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 50,
    marginHorizontal: 20,
  },
});
