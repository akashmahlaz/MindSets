import { PushNotificationService } from "@/lib/pushNotificationService";
import React, { useEffect, useState } from "react";
import { Alert } from "react-native";

// Get singleton instance
const pushNotificationService = PushNotificationService.getInstance();

interface UsePushNotificationsReturn {
  fcmToken: string | null;
  isInitialized: boolean;
  sendTestNotification: () => Promise<void>;
  sendNotification: typeof pushNotificationService.sendNotification;
}

/**
 * Hook for managing push notifications in your React Native app
 */
export const usePushNotifications = (): UsePushNotificationsReturn => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initializePushNotifications();
  }, []);

  const initializePushNotifications = async () => {
    try {
      const token = await pushNotificationService.initialize();
      setFcmToken(token);
      setIsInitialized(true);

      if (token) {
        console.log("✅ Push notifications initialized successfully");
        console.log("📱 FCM Token:", token);
      } else {
        console.warn("⚠️ Failed to get FCM token");
      }
    } catch (error) {
      console.error("❌ Error initializing push notifications:", error);
      setIsInitialized(true); // Set to true even on error to prevent retry loops
    }
  };

  const sendTestNotification = async () => {
    try {
      const result = await pushNotificationService.sendTestNotification();

      if (result.success) {
        Alert.alert("✅ Success", "Test notification sent successfully!", [
          { text: "OK" },
        ]);
      } else {
        Alert.alert(
          "❌ Error",
          `Failed to send notification: ${result.error}`,
          [{ text: "OK" }],
        );
      }
    } catch (error) {
      Alert.alert("❌ Error", `Error sending test notification: ${error}`, [
        { text: "OK" },
      ]);
    }
  };

  return {
    fcmToken,
    isInitialized,
    sendTestNotification,
    sendNotification: pushNotificationService.sendNotification.bind(
      pushNotificationService,
    ),
  };
};

/**
 * Component that initializes push notifications - use this in your app root
 */
export const PushNotificationInitializer: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { isInitialized } = usePushNotifications();

  return React.createElement(React.Fragment, null, children);
};
