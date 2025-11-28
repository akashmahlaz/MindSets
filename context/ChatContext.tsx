import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import { StreamChat } from "stream-chat";
import { chatNotificationService } from "../services/chatNotificationService";
import { getStreamToken } from "../services/stream";
import { getUserProfile } from "../services/userService";
import { useAuth } from "./AuthContext";

interface ChatContextType {
  chatClient: StreamChat | null;
  isChatConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  connectToChat: () => Promise<void>;
  disconnectFromChat: () => Promise<void>;
  retryConnection: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | null>(null);

// Initialize Stream Chat client
const STREAM_API_KEY = "egq2n55kb4yn";
const chatClient = StreamChat.getInstance(STREAM_API_KEY);

// Configure client options
chatClient.setBaseURL("https://chat.stream-io-api.com");
chatClient.recoverStateOnReconnect = true;

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [isChatConnected, setIsChatConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const appState = useRef(AppState.currentState);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;

  // Store event handler references for cleanup
  const eventHandlers = useRef({
    onMessage: (event: any) => {
      console.log("New message event received:", event.message?.text);
      chatNotificationService.handleNewMessage(event);
    },
    onTyping: (event: any) => {
      chatNotificationService.handleTypingStart(event);
    },
    onMemberAdded: (event: any) => {
      chatNotificationService.handleMemberAdded(event);
    },
    onConnectionChanged: (event: any) => {
      console.log("Connection changed:", event.online);
      if (!event.online) {
        setIsChatConnected(false);
      }
    },
  });

  const connectToChat = useCallback(async () => {
    if (!user) {
      console.log("Cannot connect to chat: No user");
      return;
    }

    // Check if already connected with same user
    if (chatClient.userID === user.uid && isChatConnected) {
      console.log("Already connected to chat with same user");
      return;
    }

    // If connected with different user, disconnect first
    if (chatClient.userID && chatClient.userID !== user.uid) {
      console.log("Disconnecting from chat (different user)");
      await chatClient.disconnectUser();
    }

    if (isConnecting) {
      console.log("Already connecting to chat");
      return;
    }

    try {
      setIsConnecting(true);
      setConnectionError(null);
      console.log("Connecting to Stream Chat for user:", user.uid);

      // Get Stream token
      const token = await getStreamToken(user.uid);
      if (!token) {
        throw new Error("Failed to get Stream token - please check your internet connection");
      }

      // Get user profile from Firestore for proper displayName and photoURL
      let displayName = user.displayName || user.email || "Anonymous";
      let photoURL = user.photoURL || `https://getstream.io/random_png/?name=${user.displayName || user.email}`;
      
      try {
        const userProfile = await getUserProfile(user.uid);
        if (userProfile) {
          displayName = userProfile.displayName || displayName;
          photoURL = userProfile.photoURL || photoURL;
        }
      } catch (profileError) {
        console.log("Could not fetch user profile, using auth data:", profileError);
      }

      // Connect user to Stream Chat
      await chatClient.connectUser(
        {
          id: user.uid,
          name: displayName,
          image: photoURL,
        },
        token,
      );
      
      setIsChatConnected(true);
      reconnectAttempts.current = 0;
      console.log("✅ Successfully connected to Stream Chat");

      // Set up message event listeners for push notifications
      setupMessageEventListeners();
    } catch (error: any) {
      console.error("Error connecting to Stream Chat:", error);
      setIsChatConnected(false);
      setConnectionError(error.message || "Failed to connect to chat");
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [user, isConnecting, isChatConnected]);

  const retryConnection = useCallback(async () => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.log("Max reconnect attempts reached");
      setConnectionError("Unable to connect after multiple attempts. Please check your internet connection.");
      return;
    }

    reconnectAttempts.current += 1;
    console.log(`Retry attempt ${reconnectAttempts.current}/${maxReconnectAttempts}`);
    
    // Exponential backoff
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    try {
      await connectToChat();
    } catch (error) {
      console.error("Retry failed:", error);
    }
  }, [connectToChat]);

  // Set up event listeners for push notifications
  const setupMessageEventListeners = useCallback(() => {
    if (!chatClient) return;

    console.log("Setting up chat message event listeners for push notifications");

    // Listen for new messages
    chatClient.on("message.new", eventHandlers.current.onMessage);
    chatClient.on("typing.start", eventHandlers.current.onTyping);
    chatClient.on("member.added", eventHandlers.current.onMemberAdded);
    chatClient.on("connection.changed", eventHandlers.current.onConnectionChanged);

    console.log("✅ Chat event listeners set up successfully");
  }, []);

  // Clean up event listeners
  const removeMessageEventListeners = useCallback(() => {
    if (!chatClient) return;

    console.log("Removing chat message event listeners");
    chatClient.off("message.new", eventHandlers.current.onMessage);
    chatClient.off("typing.start", eventHandlers.current.onTyping);
    chatClient.off("member.added", eventHandlers.current.onMemberAdded);
    chatClient.off("connection.changed", eventHandlers.current.onConnectionChanged);
  }, []);

  const disconnectFromChat = useCallback(async () => {
    if (chatClient.userID && isChatConnected) {
      try {
        console.log("Disconnecting from Stream Chat");
        removeMessageEventListeners();
        await chatClient.disconnectUser();
        setIsChatConnected(false);
        setConnectionError(null);
        console.log("Successfully disconnected from Stream Chat");
      } catch (error) {
        console.error("Error disconnecting from Stream Chat:", error);
      }
    }
  }, [isChatConnected, removeMessageEventListeners]);

  // Handle app state changes for reconnection
  useEffect(() => {
    const subscription = AppState.addEventListener("change", async (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === "active") {
        console.log("App came to foreground - checking chat connection");
        if (user && !isChatConnected && !isConnecting) {
          try {
            await connectToChat();
          } catch (error) {
            console.error("Reconnect on foreground failed:", error);
          }
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [user, isChatConnected, isConnecting, connectToChat]);

  // Auto-connect when user is available
  useEffect(() => {
    if (user && !isChatConnected && !isConnecting) {
      connectToChat().catch((error) => {
        console.error("Auto-connect to chat failed:", error);
        // Auto retry on failure
        retryConnection();
      });
    } else if (!user && isChatConnected) {
      disconnectFromChat();
    }
  }, [user?.uid]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      removeMessageEventListeners();
    };
  }, [removeMessageEventListeners]);

  const value: ChatContextType = {
    chatClient: isChatConnected ? chatClient : null,
    isChatConnected,
    isConnecting,
    connectionError,
    connectToChat,
    disconnectFromChat,
    retryConnection,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
