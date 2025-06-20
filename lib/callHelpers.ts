import { StreamVideoClient } from "@stream-io/video-react-native-sdk";

export const makeCall = async (
  videoClient: StreamVideoClient,
  callId: string,
  memberIds: string[],
  isVideo: boolean = true,
) => {
  try {
    console.log("Making call with ID:", callId);
    console.log("Members:", memberIds);

    const call = videoClient.call("default", callId);

    await call.getOrCreate({
      ring: true,
      video: isVideo,
      data: {
        members: memberIds.map((id) => ({ user_id: id })),
      },
    });

    console.log("Call created successfully, joining call...");
    // Note: The caller will automatically join when the first callee accepts

    return call;
  } catch (error) {
    console.error("Error making call:", error);
    throw error;
  }
};

export const generateCallId = (): string => {
  // Generate a unique call ID using timestamp and random string
  return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
