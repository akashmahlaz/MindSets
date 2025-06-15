import notifee from "@notifee/react-native";
import messaging from "@react-native-firebase/messaging";
import {
    firebaseDataHandler,
    isFirebaseStreamVideoMessage,
    isNotifeeStreamVideoEvent,
    onAndroidNotifeeEvent,
} from "@stream-io/video-react-native-sdk";

export const setFirebaseListeners = () => {
  // Set up the background message handler
  messaging().setBackgroundMessageHandler(async (msg) => {
    if (isFirebaseStreamVideoMessage(msg)) {
      await firebaseDataHandler(msg.data);
    } else {
      // your other background notifications (if any)
      console.log('Background message received:', msg);
    }
  });

  // on press handlers of background notifications
  notifee.onBackgroundEvent(async (event) => {
    if (isNotifeeStreamVideoEvent(event)) {
      await onAndroidNotifeeEvent({ event, isBackground: true });
    } else {
      // your other background notifications (if any)
      console.log('Background notifee event:', event);
    }
  });

  // Optionally: set up the foreground message handler
  messaging().onMessage((msg) => {
    if (isFirebaseStreamVideoMessage(msg)) {
      firebaseDataHandler(msg.data);
    } else {
      // your other foreground notifications (if any)
      console.log('Foreground message received:', msg);
    }
  });

  // Optionally: on press handlers of foreground notifications
  notifee.onForegroundEvent((event) => {
    if (isNotifeeStreamVideoEvent(event)) {
      onAndroidNotifeeEvent({ event, isBackground: false });
    } else {
      // your other foreground notifications (if any)
      console.log('Foreground notifee event:', event);
    }
  });
};
