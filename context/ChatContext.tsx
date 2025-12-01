import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import { Event, StreamChat } from "stream-chat";
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
const STREAM_API_KEY = process.env.EXPO_PUBLIC_STREAM_API_KEY || "egq2n55kb4yn";
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
    onMessage: (event: Event) => {
      chatNotificationService.handleNewMessage(event);
    },
    onTyping: (event: Event) => {
      chatNotificationService.handleTypingStart(event);
    },
    onMemberAdded: (event: Event) => {
      chatNotificationService.handleMemberAdded(event);
    },
    onConnectionChanged: (event: Event) => {
      if (!event.online) {
        setIsChatConnected(false);
      }
    },
  });

  const connectToChat = useCallback(async () => {
    if (!user) {
      return;
    }

    // Check if already connected with same user
    if (chatClient.userID === user.uid && isChatConnected) {
      return;
    }

    // If connected with different user, disconnect first
    if (chatClient.userID && chatClient.userID !== user.uid) {
      await chatClient.disconnectUser();
    }

    if (isConnecting) {
      return;
    }

    try {
      setIsConnecting(true);
      setConnectionError(null);

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
      } catch {
        // Use auth data if profile fetch fails
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

      // Set the current user ID in notification service to prevent self-notifications
      chatNotificationService.setCurrentUserId(user.uid);

      // Set up message event listeners for push notifications
      setupMessageEventListeners();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to connect to chat";
      setIsChatConnected(false);
      setConnectionError(errorMessage);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [user, isConnecting, isChatConnected]);

  const retryConnection = useCallback(async () => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      setConnectionError("Unable to connect after multiple attempts. Please check your internet connection.");
      return;
    }

    reconnectAttempts.current += 1;
    
    // Exponential backoff
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    try {
      await connectToChat();
    } catch {
      // Retry failed silently
    }
  }, [connectToChat]);

  // Set up event listeners for push notifications
  const setupMessageEventListeners = useCallback(() => {
    if (!chatClient) return;

    // Listen for new messages
    chatClient.on("message.new", eventHandlers.current.onMessage);
    chatClient.on("typing.start", eventHandlers.current.onTyping);
    chatClient.on("member.added", eventHandlers.current.onMemberAdded);
    chatClient.on("connection.changed", eventHandlers.current.onConnectionChanged);
  }, []);

  // Clean up event listeners
  const removeMessageEventListeners = useCallback(() => {
    if (!chatClient) return;

    chatClient.off("message.new", eventHandlers.current.onMessage);
    chatClient.off("typing.start", eventHandlers.current.onTyping);
    chatClient.off("member.added", eventHandlers.current.onMemberAdded);
    chatClient.off("connection.changed", eventHandlers.current.onConnectionChanged);
  }, []);

  const disconnectFromChat = useCallback(async () => {
    if (chatClient.userID && isChatConnected) {
      try {
        removeMessageEventListeners();
        await chatClient.disconnectUser();
        setIsChatConnected(false);
        setConnectionError(null);
      } catch {
        // Disconnect failed silently
      }
    }
  }, [isChatConnected, removeMessageEventListeners]);

  // Handle app state changes for reconnection
  useEffect(() => {
    const subscription = AppState.addEventListener("change", async (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === "active") {
        if (user && !isChatConnected && !isConnecting) {
          try {
            await connectToChat();
          } catch {
            // Reconnect failed silently
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
      connectToChat().catch(() => {
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
