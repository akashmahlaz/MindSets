import messaging from '@react-native-firebase/messaging';

export interface SendNotificationParams {
  token?: string;
  tokens?: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  channelId?: string;
  imageUrl?: string;
}

export interface NotificationResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  successCount?: number;
  failureCount?: number;
  results?: any[];
}

/**
 * Client service for managing push notifications using Expo API routes
 */
export class PushNotificationService {
  private static instance: PushNotificationService;
  private fcmToken: string | null = null;
  private readonly baseUrl = process.env.EXPO_PUBLIC_API_URL || '';

  private constructor() {}

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }  /**
   * Initialize push notifications and get FCM token
   */
  async initialize(): Promise<string | null> {
    try {
      // Request permission for both platforms
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log('Push notification permission denied');
        return null;
      }

      // Get FCM token
      const token = await messaging().getToken();
      this.fcmToken = token;
      
      console.log('FCM Token:', token);
      
      // Listen for token refresh
      messaging().onTokenRefresh(this.onTokenRefresh.bind(this));

      // Set up message listeners
      this.setupMessageListeners();

      return token;
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return null;
    }
  }

  /**
   * Get current FCM token
   */
  getToken(): string | null {
    return this.fcmToken;
  }

  /**
   * Handle token refresh
   */
  private onTokenRefresh(token: string) {
    console.log('FCM Token refreshed:', token);
    this.fcmToken = token;
    // You can send the new token to your backend here
    this.updateTokenOnServer(token);
  }

  /**
   * Set up message listeners for foreground and background notifications
   */
  private setupMessageListeners() {
    // Foreground message handler
    messaging().onMessage(async remoteMessage => {
      console.log('Foreground notification received:', remoteMessage);
      this.handleForegroundNotification(remoteMessage);
    });

    // Background message handler
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Background notification received:', remoteMessage);
      this.handleBackgroundNotification(remoteMessage);
    });

    // Notification opened app handler
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification opened app:', remoteMessage);
      this.handleNotificationOpened(remoteMessage);
    });

    // Check if app was opened from a notification
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('App opened from notification:', remoteMessage);
          this.handleNotificationOpened(remoteMessage);
        }
      });
  }

  /**
   * Handle foreground notifications (app is open)
   */
  private handleForegroundNotification(remoteMessage: any) {
    // You can show an in-app notification or update UI
    console.log('Handling foreground notification:', remoteMessage);
  }

  /**
   * Handle background notifications
   */
  private handleBackgroundNotification(remoteMessage: any) {
    console.log('Handling background notification:', remoteMessage);
  }

  /**
   * Handle notification opened (user tapped on notification)
   */
  private handleNotificationOpened(remoteMessage: any) {
    console.log('Handling notification opened:', remoteMessage);
    // Navigate to specific screen based on notification data
    if (remoteMessage.data) {
      // Example: Navigate to chat if it's a chat notification
      if (remoteMessage.data.type === 'chat') {
        // router.push(`/chat/${remoteMessage.data.channelId}`);
      }
    }
  }
  /**
   * Send notification using your Expo API route
   */
  async sendNotification(params: SendNotificationParams): Promise<NotificationResponse> {
    try {
      const response = await fetch(`/api/push-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error sending notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send notification to current device (for testing)
   */
  async sendTestNotification(): Promise<NotificationResponse> {
    if (!this.fcmToken) {
      return {
        success: false,
        error: 'No FCM token available',
      };
    }

    return this.sendNotification({
      token: this.fcmToken,
      title: '🧪 Test Notification',
      body: 'Your push notification system is working!',
      data: {
        type: 'test',
        timestamp: Date.now().toString(),
      },
    });
  }

  /**
   * Send notification to specific user token
   */
  async sendToUser(token: string, title: string, body: string, data?: Record<string, string>): Promise<NotificationResponse> {
    return this.sendNotification({
      token,
      title,
      body,
      data,
    });
  }

  /**
   * Send notification to multiple users
   */
  async sendToUsers(tokens: string[], title: string, body: string, data?: Record<string, string>): Promise<NotificationResponse> {
    return this.sendNotification({
      tokens,
      title,
      body,
      data,
    });
  }

  /**
   * Update token on your server (implement based on your user management)
   */
  private async updateTokenOnServer(token: string) {
    try {
      // Implement your logic to update the token in your database
      console.log('Should update token on server:', token);
      
      // Example:
      // await fetch('/api/users/update-token', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ token, userId: currentUserId })
      // });
    } catch (error) {
      console.error('Error updating token on server:', error);
    }
  }

  /**
   * Clear FCM token (for logout)
   */
  async clearToken(): Promise<void> {
    try {
      await messaging().deleteToken();
      this.fcmToken = null;
      console.log('FCM token cleared');
    } catch (error) {
      console.error('Error clearing FCM token:', error);
    }
  }
}

// Export singleton instance
export const pushNotificationService = PushNotificationService.getInstance();
