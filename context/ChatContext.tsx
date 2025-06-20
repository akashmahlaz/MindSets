import React, { createContext, useContext, useEffect, useState } from "react";
import { StreamChat } from "stream-chat";
import { chatNotificationService } from "../services/chatNotificationService";
import { getStreamToken } from "../services/stream";
import { useAuth } from "./AuthContext";

interface ChatContextType {
  chatClient: StreamChat | null;
  isChatConnected: boolean;
  isConnecting: boolean;
  connectToChat: () => Promise<void>;
  disconnectFromChat: () => Promise<void>;
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

  // Store event handler references for cleanup
  const eventHandlers = {
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
  };

  const connectToChat = async () => {
    if (!user || isConnecting || isChatConnected) {
      console.log("Cannot connect to chat:", {
        hasUser: !!user,
        isConnecting,
        isChatConnected,
        currentUserId: chatClient.userID,
      });
      return;
    }

    try {
      setIsConnecting(true);
      console.log("Connecting to Stream Chat for user:", user.uid);

      // Get Stream token
      const token = await getStreamToken(user.uid);
      if (!token) {
        throw new Error("Failed to get Stream token");
      }

      // Connect user to Stream Chat
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
      setIsChatConnected(true);
      console.log("Successfully connected to Stream Chat");

      // Set up message event listeners for push notifications
      setupMessageEventListeners();
    } catch (error) {
      console.error("Error connecting to Stream Chat:", error);
      setIsChatConnected(false);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };
  // Set up event listeners for push notifications
  const setupMessageEventListeners = () => {
    if (!chatClient) return;

    console.log(
      "Setting up chat message event listeners for push notifications",
    );

    // Listen for new messages
    chatClient.on("message.new", eventHandlers.onMessage);

    // Optional: Listen for other events
    chatClient.on("typing.start", eventHandlers.onTyping);
    chatClient.on("member.added", eventHandlers.onMemberAdded);

    console.log("✅ Chat event listeners set up successfully");
  };

  // Clean up event listeners
  const removeMessageEventListeners = () => {
    if (!chatClient) return;

    console.log("Removing chat message event listeners");
    chatClient.off("message.new", eventHandlers.onMessage);
    chatClient.off("typing.start", eventHandlers.onTyping);
    chatClient.off("member.added", eventHandlers.onMemberAdded);
  };
  const disconnectFromChat = async () => {
    if (chatClient.userID && isChatConnected) {
      try {
        console.log("Disconnecting from Stream Chat");

        // Remove event listeners before disconnecting
        removeMessageEventListeners();

        await chatClient.disconnectUser();
        setIsChatConnected(false);
        console.log("Successfully disconnected from Stream Chat");
      } catch (error) {
        console.error("Error disconnecting from Stream Chat:", error);
      }
    }
  };
  // Auto-connect when user is available
  useEffect(() => {
    if (user && !isChatConnected && !isConnecting) {
      connectToChat().catch((error) => {
        console.error("Auto-connect to chat failed:", error);
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
  }, []);

  const value: ChatContextType = {
    chatClient: isChatConnected ? chatClient : null,
    isChatConnected,
    isConnecting,
    connectToChat,
    disconnectFromChat,
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
