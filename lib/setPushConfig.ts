import notifee, { AndroidImportance } from '@notifee/react-native';
import {
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
    ios: {
      incomingCall: {
        channelId: 'incoming-calls',
        sound: 'incoming_call.wav',
        title: 'Incoming Call',
        body: 'Tap to answer',
      },
    },
    android: {
      incomingCall: {
        channelId: 'incoming-calls',
        sound: 'incoming_call',
        title: 'Incoming Call',
        body: 'Tap to answer',
        importance: AndroidImportance.HIGH,
      },
    },
  });
}
