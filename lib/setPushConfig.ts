import notifee, { AndroidImportance } from '@notifee/react-native';
import {
    StreamVideoClient,
    StreamVideoRN
} from "@stream-io/video-react-native-sdk";

// Stream API key from your dashboard
const STREAM_API_KEY = "egq2n55kb4yn";

export async function setPushConfig() {
  // Create notification channel for Android
  await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
    lights: true,
  });
  
  // Configure Stream Video push notifications
  await StreamVideoRN.setPushConfig({
    isExpo: true,
    ios: {
      pushProviderName: 'firebase',
    },
    android: {
      pushProviderName: 'firebase',
      smallIcon: 'ic_notification',
    },
    createStreamVideoClient: async () => {
      // This will be handled by the VideoContext
      return new StreamVideoClient({ apiKey: STREAM_API_KEY });
    },
  });
}
