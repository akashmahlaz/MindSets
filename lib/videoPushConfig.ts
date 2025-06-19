import { AndroidImportance } from '@notifee/react-native';
import { StreamVideoRN } from '@stream-io/video-react-native-sdk';
import { getAuth } from 'firebase/auth';
import { createVideoClient } from '../services/stream';

export function setupVideoPushConfig() {
  // Configure Stream Video push notifications
  StreamVideoRN.setPushConfig({
    // Pass true to inform the SDK that this is an expo app
    isExpo: true,
    ios: {
      // Add your push_provider_name for iOS that you have setup in Stream dashboard
      pushProviderName: __DEV__ ? 'apn-video-staging' : 'apn-video-production',
    },
    android: {
      // The name of android notification icon - use launcher icon to avoid missing icon issues
      smallIcon: 'ic_launcher',
      // Add your push_provider_name for Android that you have setup in Stream dashboard
      pushProviderName: __DEV__
        ? 'firebase-video-staging'
        : 'firebase-video-production',
      // Configure the notification channel to be used for incoming calls for Android.
      incomingCallChannel: {
        id: 'stream_incoming_call',
        name: 'Incoming call notifications',
        // This is the advised importance of receiving incoming call notifications.
        // This will ensure that the notification will appear on-top-of applications.
        importance: AndroidImportance.HIGH,
        // Optional: if you don't pass a sound, default ringtone will be used
        // sound: '<url to the ringtone>',
      },      // Configure the functions to create the texts shown in the notification
      // for incoming calls in Android.
      incomingCallNotificationTextGetters: {
        getTitle: (userName: string) => `Incoming call from ${userName}`,
        getBody: (_userName: string) => 'Tap to answer the call',
      },
    },// Add the async callback to create a video client
    // for incoming calls in the background on a push notification
    createStreamVideoClient: async () => {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        console.log('No current user for video client creation');
        return undefined;
      }

      try {
        // Get fresh token for the user
        const response = await fetch('https://us-central1-mental-health-f7b7f.cloudfunctions.net/generateStreamToken', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await currentUser.getIdToken()}`,
          },
          body: JSON.stringify({ userId: currentUser.uid }),
        });

        if (!response.ok) {
          throw new Error(`Failed to get token: ${response.status}`);
        }

        const data = await response.json();
        const token = data.token;

        // Create and return video client
        const client = createVideoClient(currentUser, token);
        return client || undefined;
      } catch (error) {
        console.error('Error creating video client for push:', error);
        return undefined;
      }
    },
  });
}

// Function to disable push notifications (e.g., on logout)
export async function disableVideoPushNotifications() {
  try {
    await StreamVideoRN.onPushLogout();
    console.log('Video push notifications disabled');
  } catch (error) {
    console.error('Error disabling video push notifications:', error);
  }
}
