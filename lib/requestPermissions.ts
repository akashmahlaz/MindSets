import { PermissionsAndroid, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export const requestNotificationPermissions = async () => {
  try {
    if (Platform.OS === 'android') {
      // Request notification permission for Android
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    } else if (Platform.OS === 'ios') {
      // Request notification permission for iOS
      await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true,
        },
      });
    }
    console.log('Notification permissions requested successfully');
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
  }
};
