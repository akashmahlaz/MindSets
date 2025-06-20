import { StreamVideoClient } from "@stream-io/video-react-native-sdk";
import { getAuth, User } from "firebase/auth"; // Import User type
import { StreamChat } from "stream-chat";
import { app } from "../firebaseConfig";

// From Stream Dashboard
const STREAM_API_KEY = "egq2n55kb4yn";

// Initialize clients
export const chatClient = StreamChat.getInstance(STREAM_API_KEY);

// Connection state management
let isConnecting = false;
let isConnected = false;

// Create video client with better configuration using singleton pattern
export const createVideoClient = (
  user: User,
  token: string,
): StreamVideoClient | null => {
  try {
    if (!user || !user.uid) {
      console.error("Error creating video client: User or user.uid is missing");
      return null;
    }

    // Use getOrCreateInstance to prevent duplicate clients
    return StreamVideoClient.getOrCreateInstance({
      apiKey: STREAM_API_KEY,
      user: {
        id: user.uid,
        name: user.displayName || user.email || "Anonymous",
        image:
          user.photoURL ||
          `https://getstream.io/random_png/?name=${user.displayName || user.email || user.uid}`,
      },
      token,
      options: {
        timeout: 10000,
        locationHintUrl: undefined,
      },
    });
  } catch (error) {
    console.error("Error creating video client:", error);
    return null;
  }
};

// Legacy video client for backward compatibility - Consider removing if not used
export const videoClient = new StreamVideoClient({
  apiKey: STREAM_API_KEY,
});

// Initialize Firebase Auth
const auth = getAuth(app);

// Generate Stream token via Firebase Function
export const getStreamToken = async (
  userId: string,
): Promise<string | null> => {
  // Allow null return for error cases
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error("No current user found for getting Stream token.");
      throw new Error("User not authenticated");
    }
    const idToken = await currentUser.getIdToken();
    if (!idToken) {
      console.error("Failed to get ID token for current user.");
      throw new Error("Failed to get ID token");
    }

    const response = await fetch(
      "https://us-central1-mental-health-f7b7f.cloudfunctions.net/generateStreamToken",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ userId }),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        "Failed to get Stream token. Status:",
        response.status,
        "Body:",
        errorBody,
      );
      throw new Error(`Failed to get Stream token. Status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.token) {
      console.error("Stream token not found in response data.");
      throw new Error("Stream token not found in response");
    }
    return data.token;
  } catch (error) {
    console.error("Error in getStreamToken:", error);
    return null; // Return null on error to be handled by the caller
  }
};

// Stream Chat connection management
export const connectUserToStream = async (user: User, token: string) => {
  // Prevent multiple simultaneous connection attempts
  if (isConnecting || isConnected || chatClient.userID === user.uid) {
    console.log("Stream user already connected or connecting");
    return;
  }

  try {
    isConnecting = true;
    console.log("Connecting user to Stream Chat:", user.uid);

    await chatClient.connectUser(
      {
        id: user.uid,
        name: user.displayName || user.email || "Anonymous",
        image:
          user.photoURL ||
          `https://getstream.io/random_png/?name=${user.displayName || user.email}`,
      },
      token,
    );

    isConnected = true;
    console.log("User connected to Stream Chat successfully");
  } catch (error) {
    console.error("Error connecting to Stream:", error);
    throw error;
  } finally {
    isConnecting = false;
  }
};

export const disconnectUserFromStream = async () => {
  if (chatClient.userID && isConnected) {
    try {
      console.log("Disconnecting user from Stream Chat");
      await chatClient.disconnectUser();
      isConnected = false;
      console.log("User disconnected from Stream Chat successfully");
    } catch (error) {
      console.error("Error disconnecting from Stream:", error);
    }
  }
};

//install dependencies
// Make sure to install the necessary dependencies for Stream Video and Chat
// You can use the following command to install them in your Expo project
//npx expo install @stream-io/video-react-native-sdk @stream-io/react-native-webrtc @config-plugins/react-native-webrtc react-native-incall-manager react-native-svg @react-native-community/netinfo expo-build-properties
// For Stream Chat
//npm install stream-chat
