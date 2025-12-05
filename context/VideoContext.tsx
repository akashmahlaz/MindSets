import { CustomIncomingCall } from "@/components/call/CustomIncomingCall";
import {
    CallingState,
    DeepPartial,
    StreamCall,
    StreamVideo,
    StreamVideoClient,
    Theme,
    useCall,
    useCalls,
    useCallStateHooks,
} from "@stream-io/video-react-native-sdk";
import React, { createContext, useContext, useEffect, useState } from "react";
import InCallManager from "react-native-incall-manager";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createVideoClient } from "../services/stream";
import { getUserProfile } from "../services/userService";
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

// Component to handle INCOMING ringing calls when user is anywhere in the app
// This acts as an overlay for incoming calls only - outgoing calls are handled by the call screen
const RingingCalls = () => {
  const { user } = useAuth();
  const calls = useCalls();
  const ringingCalls = calls.filter((c) => c.ringing);

  // Log call state changes
  useEffect(() => {
    console.log("RingingCalls: Calls updated:", {
      total: calls.length,
      ringing: ringingCalls.length,
      callStates: calls.map((c) => ({
        id: c.id,
        cid: c.cid,
        ringing: c.ringing,
        isCreatedByMe: c.isCreatedByMe,
      })),
    });
  }, [calls, ringingCalls.length]);

  if (!ringingCalls.length || !user) {
    return null;
  }

  // Handle the first ringing call
  const ringingCall = ringingCalls[0];

  if (!ringingCall || !user) {
    return null;
  }

  // Check if current user is the creator of the call
  const callCreator = ringingCall.state.custom?.createdBy;
  const isCallCreatedByMe =
    ringingCall.isCreatedByMe || callCreator === user.uid;

  // ONLY show overlay for INCOMING calls (calls we did NOT create)
  // Outgoing calls are handled by the call screen where user navigates after creating the call
  if (isCallCreatedByMe) {
    console.log("RingingCalls: Skipping - this is an outgoing call, handled by call screen");
    return null;
  }

  console.log("RingingCalls: Showing incoming call overlay");

  // Show custom professional incoming call UI
  return (
    <StreamCall call={ringingCall}>
      <RingingSound />
      <CustomIncomingCall />
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
          
          // Get user profile from Firestore for proper displayName
          let displayName = user.displayName || user.email || "Anonymous";
          let photoURL = user.photoURL;
          
          try {
            const userProfile = await getUserProfile(user.uid);
            if (userProfile) {
              displayName = userProfile.displayName || displayName;
              photoURL = userProfile.photoURL || photoURL;
            }
          } catch (profileError) {
            console.log("VideoContext: Could not fetch user profile, using auth data");
          }
          
          // Create a modified user object with Firestore data
          const userWithProfile = {
            ...user,
            displayName,
            photoURL,
          } as typeof user;
          
          const client = createVideoClient(userWithProfile, token);
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
        setIsInitializing(false);
        setCurrentCall(null);
      }
    };

    initVideoClient();
  }, [user?.uid]); // Only depend on user ID changes  

  // Create a ringing call following Stream.io's best practices
  // NOTE: Stream.io recommends using unique call IDs for ring calls (e.g., UUIDs)
  // Call ID must be max 64 characters
  const createCall = async (
    callId: string,
    members: string[],
    isVideo: boolean = true,
  ) => {
    if (!videoClient || !user) {
      console.error("Video client not initialized or user not available");
      return null;
    }

    // Validate call ID length (Stream.io requires max 64 chars)
    if (callId.length > 64) {
      console.error("Call ID too long, truncating to 64 characters");
      callId = callId.substring(0, 64);
    }

    try {
      setIsCreatingCall(true);
      console.log(
        "Creating call:",
        callId,
        "(length:",
        callId.length,
        ") with members:",
        members,
        "isVideo:",
        isVideo,
      );
      const call = videoClient.call("default", callId);

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
            callType: isVideo ? "video" : "voice",
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
      console.log("VideoContext: Call type:", isVideo ? "video" : "audio");

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
  }; // End a call for everyone (proper way to end a call according to Stream.io docs)
  const endCall = async (callId?: string) => {
    try {
      if (currentCall) {
        console.log("Ending current call for everyone:", currentCall.cid);

        // According to Stream.io documentation:
        // call.endCall() terminates the call for ALL participants
        // This sends call.ended event to all call members
        await currentCall.endCall();
        console.log("Call ended successfully for all participants");
        setCurrentCall(null);
      } else if (callId && videoClient) {
        console.log("Ending call by ID:", callId);
        const call = videoClient.call("default", callId);

        try {
          // Get the call first to ensure it exists
          await call.get();
          // End the call for everyone
          await call.endCall();
          console.log("Call ended successfully for all participants");
        } catch (getError) {
          console.log("Call not found or already ended:", getError);
        }
      }
    } catch (error) {
      console.error("Error ending call:", error);

      // If endCall fails (permission issue), fall back to leave
      // But note: this only removes the current user, doesn't end for everyone
      try {
        if (currentCall) {
          console.log("Fallback: Leaving call instead of ending");
          await currentCall.leave();
          setCurrentCall(null);
        }
      } catch (leaveError) {
        console.error("Error leaving call:", leaveError);
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
    const unsubscribeSessionEnded = currentCall.on(
      "call.session_ended",
      handleSessionEnded,
    );

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
  };
  return (
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
    if (callingState !== CallingState.RINGING) {
      // Stop any ringing when not in RINGING state
      InCallManager.stopRingtone();
      InCallManager.stop();
      return;
    }

    console.log("RingingSound: Starting ringtone", {
      callingState,
      isCallCreatedByMe,
      callCreator,
      currentUser: user?.uid,
    });

    if (isCallCreatedByMe) {
      // OUTGOING CALL - Play ringback tone (the beeping sound caller hears)
      console.log("🔊 OUTGOING call - Playing ringback tone");
      try {
        InCallManager.start({
          media: "audio",
          auto: true,
          ringback: "_BUNDLE_", // Built-in ringback tone
        });
      } catch (error) {
        console.error("Error starting ringback:", error);
      }

      return () => {
        console.log("⏹️ Stopping outgoing ringback");
        try {
          InCallManager.stop();
        } catch (error) {
          console.error("Error stopping ringback:", error);
        }
      };
    } else {
      // INCOMING CALL - Play ringtone (the sound callee hears)
      console.log("📞 INCOMING call - Playing ringtone");
      try {
        InCallManager.startRingtone(
          "_BUNDLE_", // Use built-in ringtone
          [500, 1000, 500, 1000], // Vibration pattern
          "ringtone", // iOS category
          30000, // Timeout after 30 seconds
        );
      } catch (error) {
        console.error("Error starting ringtone:", error);
      }

      return () => {
        console.log("⏹️ Stopping incoming ringtone");
        try {
          InCallManager.stopRingtone();
        } catch (error) {
          console.error("Error stopping ringtone:", error);
        }
      };
    }
  }, [callingState, isCallCreatedByMe, callCreator, user?.uid]);

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
