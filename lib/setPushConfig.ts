import { AndroidImportance } from "@notifee/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    StreamVideoClient,
    StreamVideoRN,
    User,
} from "@stream-io/video-react-native-sdk";
import { getStreamToken } from "../services/stream";

// Stream API key from your dashboard
const STREAM_API_KEY = "egq2n55kb4yn";

export function setPushConfig() {
  StreamVideoRN.setPushConfig({
    // pass true to inform the SDK that this is an expo app
    isExpo: true,
    ios: {
      // add your push_provider_name for iOS that you have setup in Stream dashboard
      pushProviderName: __DEV__ ? "apn-video-staging" : "apn-video-production",
    },
    android: {
      // the name of android notification icon (Optional, defaults to 'ic_launcher')
      smallIcon: "ic_notification",
      // add your push_provider_name for Android that you have setup in Stream dashboard
      pushProviderName: __DEV__
        ? "firebase-video-staging"
        : "firebase-video-production",
      // configure the notification channel to be used for incoming calls for Android.
      incomingCallChannel: {
        id: "stream_incoming_call",
        name: "Incoming call notifications",
        // This is the advised importance of receiving incoming call notifications.
        // This will ensure that the notification will appear on-top-of applications.
        importance: AndroidImportance.HIGH,
        // optional: if you dont pass a sound, default ringtone will be used
        sound: "default",
      },
      // configure the functions to create the texts shown in the notification
      // for incoming calls in Android.
      incomingCallNotificationTextGetters: {
        getTitle: (userName: string) => `Incoming call from ${userName}`,
        getBody: (_userName: string) => "Tap to answer the call",
      },
    },
    // add the async callback to create a video client
    // for incoming calls in the background on a push notification
    createStreamVideoClient: async () => {
      const userId = await AsyncStorage.getItem("@userId");
      const userName = await AsyncStorage.getItem("@userName");
      if (!userId) return undefined;
        // Token provider that fetches token from your backend
      const tokenProvider = async (): Promise<string> => {
        const token = await getStreamToken(userId);
        if (!token) {
          throw new Error("Failed to get Stream token");
        }
        return token;
      };
      
      const user: User = { id: userId, name: userName || userId };
      return StreamVideoClient.getOrCreateInstance({
        apiKey: STREAM_API_KEY,
        user,
        tokenProvider,
      });
    },
  });
}
