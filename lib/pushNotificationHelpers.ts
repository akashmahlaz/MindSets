import { StreamVideoRN } from "@stream-io/video-react-native-sdk";

export const disablePushNotifications = async () => {
  try {
    await StreamVideoRN.onPushLogout();
    console.log("Push notifications disabled successfully");
  } catch (error) {
    console.error("Error disabling push notifications:", error);
  }
};
