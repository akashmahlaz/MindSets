import { User } from "firebase/auth";
import { StreamChat } from "stream-chat";

const API_KEY = "egq2n55kb4yn";
export const chatClient = StreamChat.getInstance(API_KEY);

let isConnecting = false;
let isConnected = false;

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
