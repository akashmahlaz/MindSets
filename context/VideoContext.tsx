import {
  CallingState,
  DeepPartial,
  RingingCallContent,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  Theme,
  useCall,
  useCalls,
  useCallStateHooks,
} from "@stream-io/video-react-native-sdk";
import React, { createContext, useContext, useEffect, useState } from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import InCallManager from "react-native-incall-manager";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createVideoClient } from "../services/stream";
import { useAuth } from "./AuthContext";

interface VideoContextType {
  videoClient: StreamVideoClient | null;
  isVideoConnected: boolean;
  createCall: (
    callId: string,
    members: string[],
    isVideo?: boolean,
  ) => Promise<any | null>;
  joinCall: (callType: string, callId: string) => Promise<any | null>;
  currentCall: any | null;
  isCreatingCall: boolean;
  endCall: (callId?: string) => Promise<void>;
}

const VideoContext = createContext<VideoContextType | null>(null);

// Component to handle incoming and outgoing ringing calls
const RingingCalls = () => {
  const { user } = useAuth();
  const calls = useCalls();
  const ringingCalls = calls.filter((c) => c.ringing);

  // Log call state changes
  useEffect(() => {
    console.log("RingingCalls: Calls updated:", {
      total: calls.length,
      ringing: ringingCalls.length,
      callStates: calls.map(c => ({
        id: c.id,
        cid: c.cid,
        state: c.state,
        ringing: c.ringing,
        currentUserId: c.currentUserId,
        isCreatedByMe: c.isCreatedByMe,
        members: c.state.members?.map(m => m.user_id),
      }))
    });
  }, [calls]);

  if (!ringingCalls.length || !user) {
    console.log("RingingCalls: No ringing calls or no user");
    return null;
  }

  // Handle the first ringing call
  const ringingCall = ringingCalls[0];

  if (!ringingCall || !user) {
    console.log("RingingCalls: No ringing call or no user");
    return null;
  }

  console.log("RingingCalls: Rendering with call:", {
    id: ringingCall.id,
    cid: ringingCall.cid,
    state: ringingCall.state,
    ringing: ringingCall.ringing,
    currentUserId: ringingCall.currentUserId,
    isCreatedByMe: ringingCall.isCreatedByMe,
    members: ringingCall.state.members?.map(m => ({ user_id: m.user_id, role: m.role })),
  });

  // Check if current user is the creator of the call
  const callCreator = ringingCall.state.custom?.createdBy;
  const isCallCreatedByMe = ringingCall.isCreatedByMe || callCreator === user.uid;
  console.log(
    "RingingCalls: Call creator:",
    callCreator,
    "Current user:",
    user.uid,
    "Is creator:",
    isCallCreatedByMe,
    "SDK isCreatedByMe:",
    ringingCall.isCreatedByMe,
  );  // Show Stream.io's built-in ringing UI for both callers and callees
  // RingingCallContent automatically handles incoming vs outgoing call UI
  const { top, right, bottom, left } = useSafeAreaInsets();
  
  return (
    <StreamCall call={ringingCall}>
      <RingingSound />
      <SafeAreaView 
        style={[
          StyleSheet.absoluteFill,
          {
            paddingTop: top,
            paddingRight: right,
            paddingBottom: bottom,
            paddingLeft: left,
          }
        ]}
      >
        <RingingCallContent />
      </SafeAreaView>
    </StreamCall>
  );
};

export default RingingCalls;

export const VideoProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const customTheme = useCustomTheme(); // Use custom theme with safe area insets
  const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(
    null,
  );
  const [isVideoConnected, setIsVideoConnected] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [currentCall, setCurrentCall] = useState<any | null>(null);
  const [isCreatingCall, setIsCreatingCall] = useState(false);

  useEffect(() => {
    const initVideoClient = async () => {
      console.log("VideoContext: initVideoClient called");
      console.log("VideoContext: user available:", !!user);
      console.log("VideoContext: existing videoClient:", !!videoClient);
      console.log("VideoContext: isInitializing:", isInitializing);

      if (user && !videoClient && !isInitializing) {
        try {
          setIsInitializing(true);
          console.log(
            "VideoContext: Initializing video client for user:",
            user.uid,
          );

          // Get Stream token
          const response = await fetch(
            "https://us-central1-mental-health-f7b7f.cloudfunctions.net/generateStreamToken",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${await user.getIdToken()}`,
              },
              body: JSON.stringify({ userId: user.uid }),
            },
          );

          if (!response.ok) {
            throw new Error(`Failed to get token: ${response.status}`);
          }

          const data = await response.json();
          const token = data.token;

          console.log("VideoContext: Token received, creating video client");
          const client = createVideoClient(user, token);
          if (client) {
            setVideoClient(client);
            setIsVideoConnected(true);
            console.log("VideoContext: Video client initialized successfully");

            // Add some debugging for push notifications
            console.log(
              "VideoContext: User should be able to receive video call notifications",
            );
          } else {
            console.error("VideoContext: Failed to create video client");
          }
        } catch (error) {
          console.error(
            "VideoContext: Error initializing video client:",
            error,
          );
        } finally {
          setIsInitializing(false);
        }
      } else if (!user && videoClient) {
        console.log("VideoContext: No user, clearing video client");
        setVideoClient(null);
        setIsVideoConnected(false);
        setIsInitializing(false);        setCurrentCall(null);
      }
    };

    initVideoClient();
  }, [user?.uid]); // Only depend on user ID changes  // Create a ringing call following Stream.io's best practices
  // NOTE: Stream.io recommends using unique call IDs for ring calls (e.g., UUIDs)
  // instead of reusing the same call ID multiple times
  const createCall = async (
    callId: string,
    members: string[],
    isVideo: boolean = true,
  ) => {
    if (!videoClient || !user) {
      console.error("Video client not initialized or user not available");
      return null;
    }

    try {
      setIsCreatingCall(true);
      console.log(
        "Creating call:",
        callId,
        "with members:",
        members,
        "isVideo:",
        isVideo,
      );      const call = videoClient.call("default", callId);

      // According to Stream.io documentation, the caller should also be included in the members list
      // This is required for proper call state management and ringing flow
      const allMembers = [
        { user_id: user.uid }, // Current user (caller)
        ...members.map((memberId) => ({ user_id: memberId })), // Target users (callees)
      ];

      console.log("VideoContext: Creating call with members:", allMembers);
      console.log("VideoContext: Caller (current user):", user.uid);
      console.log("VideoContext: Target members (callees):", members);

      // Use getOrCreate with ring: true - this sends ringing notifications
      await call.getOrCreate({
        ring: true, // This sends ringing notifications to members
        video: isVideo, // Indicates whether it's a video or audio call
        data: {
          members: allMembers,
          custom: {
            isVideo,
            createdAt: new Date().toISOString(),
            createdBy: user.uid, // Track who created the call
            callType: isVideo ? 'video' : 'voice',
          },
          // Optional: Configure ring timeouts (in milliseconds)
          settings_override: {
            ring: {
              auto_cancel_timeout_ms: 30000, // Cancel call if no one accepts within 30 seconds
              incoming_call_timeout_ms: 20000, // Timeout individual participant after 20 seconds
            },
          },
        },
      });
        console.log("VideoContext: Ring call created successfully");
      console.log("VideoContext: Call ID:", call.id, "CID:", call.cid);
      console.log("VideoContext: Call members:", allMembers);
      console.log("VideoContext: Ringing notifications sent to:", members);
      console.log("VideoContext: Call creator (current user):", user.uid);
      console.log("VideoContext: Call type:", isVideo ? 'video' : 'audio');

      setCurrentCall(call);

      return call;
    } catch (err) {
      console.error("Error creating call:", err);
      return null;
    } finally {
      setIsCreatingCall(false);
    }
  };

  // Join an existing call
  const joinCall = async (callType: string, callId: string) => {
    if (!videoClient) {
      console.error("Video client not initialized");
      return null;
    }

    try {
      console.log("Joining call:", callType, callId);
      const call = videoClient.call(callType, callId);
      
      // Get call info first
      await call.get();
      
      // Then join
      await call.join();
      setCurrentCall(call);
      console.log("Joined call successfully:", call.cid);
      return call;
    } catch (err) {
      console.error("Error joining call:", err);
      return null;
    }
  };  // End a call for everyone (proper way to end a call according to Stream.io docs)
  const endCall = async (callId?: string) => {
    try {
      if (currentCall) {
        console.log('Ending current call for everyone:', currentCall.cid);
        
        // According to Stream.io documentation: 
        // call.endCall() terminates the call for ALL participants
        // This sends call.ended event to all call members
        await currentCall.endCall();
        console.log('Call ended successfully for all participants');
        setCurrentCall(null);
      } else if (callId && videoClient) {
        console.log('Ending call by ID:', callId);
        const call = videoClient.call('default', callId);
        
        try {
          // Get the call first to ensure it exists
          await call.get();
          // End the call for everyone
          await call.endCall();
          console.log('Call ended successfully for all participants');
        } catch (getError) {
          console.log('Call not found or already ended:', getError);
        }
      }
    } catch (error) {
      console.error('Error ending call:', error);
      
      // If endCall fails (permission issue), fall back to leave
      // But note: this only removes the current user, doesn't end for everyone
      try {
        if (currentCall) {
          console.log('Fallback: Leaving call instead of ending');
          await currentCall.leave();
          setCurrentCall(null);
        }
      } catch (leaveError) {
        console.error('Error leaving call:', leaveError);
      }
    }
  };
  // Listen to call events for proper state management
  useEffect(() => {
    if (!currentCall) return;

    const handleCallEnded = () => {
      console.log("VideoContext: Call ended for everyone, cleaning up");
      setCurrentCall(null);
    };

    const handleCallLeft = () => {
      console.log("VideoContext: Left call, cleaning up");
      setCurrentCall(null);
    };

    const handleSessionEnded = () => {
      console.log("VideoContext: Call session ended, cleaning up");
      setCurrentCall(null);
    };

    // Subscribe to call lifecycle events according to Stream.io documentation
    const unsubscribeEnded = currentCall.on("call.ended", handleCallEnded);
    const unsubscribeLeft = currentCall.on("call.left", handleCallLeft);
    const unsubscribeSessionEnded = currentCall.on("call.session_ended", handleSessionEnded);

    return () => {
      unsubscribeEnded();
      unsubscribeLeft();
      unsubscribeSessionEnded();
    };
  }, [currentCall]);

  const value = {
    videoClient,
    isVideoConnected,
    createCall,
    joinCall,
    currentCall,
    isCreatingCall,
    endCall,
  };  return (
    <VideoContext.Provider value={value}>
      {videoClient ? (
        <StreamVideo client={videoClient} style={customTheme}>
          {children}
          <RingingCalls />
        </StreamVideo>
      ) : (
        children
      )}
    </VideoContext.Provider>
  );
};

export const useVideo = () => {
  const context = useContext(VideoContext);
  if (!context) {
    throw new Error("useVideo must be used within a VideoProvider");
  }
  return context;
};

// Component to handle ringing sounds for incoming and outgoing calls
const RingingSound = () => {
  const call = useCall();
  const { user } = useAuth();
  const callCreator = call?.state?.custom?.createdBy;
  const isCallCreatedByMe = call?.isCreatedByMe || callCreator === user?.uid;
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  useEffect(() => {
    if (callingState !== CallingState.RINGING) return;

    console.log("RingingSound: Call state:", {
      callingState,
      isCallCreatedByMe,
      callCreator,
      currentUser: user?.uid,
      sdkIsCreatedByMe: call?.isCreatedByMe,
    });    if (isCallCreatedByMe) {
      // Play outgoing call sound (ringback tone)
      console.log("Playing outgoing call sound");
      // You can customize the ringback sound here
      // Options: '_BUNDLE_', '_DEFAULT_', or path to custom sound file
      InCallManager.start({ 
        media: "video", 
        ringback: "_BUNDLE_", // Use built-in ringback sound
        // ringback: "_DEFAULT_", // Use system default
        // ringback: "custom_ringback.mp3", // Use custom sound file
      });
      return () => {
        console.log("Stopping outgoing call sound");
        InCallManager.stopRingback();
      };
    } else {
      // Play incoming call sound (ringtone)
      console.log("Playing incoming call sound");
      try {
        // You can customize the ringtone here
        // First parameter: ringtone type ('_DEFAULT_', '_BUNDLE_', or file path)
        // Second parameter: vibration pattern (array of milliseconds)
        // Third parameter: play type ('playback' or 'ringtone')
        // Fourth parameter: timeout in milliseconds
        InCallManager.startRingtone(
          "_DEFAULT_", // Use system default ringtone
          // "_BUNDLE_", // Use built-in ringtone
          // "custom_ringtone.mp3", // Use custom ringtone file
          [1000, 2000, 1000], // Vibration pattern: vibrate 1s, pause 2s, vibrate 1s
          "playback", 
          30000
        );
      } catch (error) {
        console.log("Error starting ringtone:", error);
      }
      return () => {
        console.log("Stopping incoming call sound");
        try {
          InCallManager.stopRingtone();
        } catch (error) {
          console.log("Error stopping ringtone:", error);
        }
      };
    }
  }, [callingState, isCallCreatedByMe, callCreator, user?.uid]);

  // Renderless component
  return null;
};

// Custom theme hook for proper safe area insets according to Stream.io documentation
const useCustomTheme = (): DeepPartial<Theme> => {
  const { top, right, bottom, left } = useSafeAreaInsets();
  const variants: DeepPartial<Theme["variants"]> = {
    insets: {
      top,
      right,
      bottom,
      left,
    },
  };
  const customTheme: DeepPartial<Theme> = {
    variants,
  };
  return customTheme;
};
