// This file should be used on your server/backend, not in the React Native client
// For security reasons, Service Account credentials should never be exposed in client code

import { readFileSync } from 'fs';
import { GoogleAuth } from 'google-auth-library';
import { join } from 'path';

// Load Service Account credentials (server-side only)
const getServiceAccountCredentials = () => {
  try {
    // In a real server environment, use environment variables or secure file storage
    const serviceAccountPath = join(__dirname, '../mental-health-f7b7f-firebase-adminsdk-fbsvc-24c1b3e827.json');
    return JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  } catch (error) {
    console.error('Failed to load Service Account credentials:', error);
    throw new Error('Service Account credentials not found');
  }
};

// Type definitions for FCM V1 API
interface FCMMessage {
  message: {
    token?: string;
    topic?: string;
    condition?: string;
    notification?: {
      title?: string;
      body?: string;
      image?: string;
    };
    data?: Record<string, string>;
    android?: {
      notification?: {
        icon?: string;
        color?: string;
        sound?: string;
        channel_id?: string;
      };
      data?: Record<string, string>;
    };
    apns?: {
      payload?: {
        aps?: {
          alert?: {
            title?: string;
            body?: string;
          };
          badge?: number;
          sound?: string;
          'content-available'?: number;
        };
      };
      headers?: Record<string, string>;
    };
  };
}

/**
 * Send push notification using Firebase Cloud Messaging V1 API
 * This function uses the Service Account for server-side authentication
 */
export async function sendPushNotificationV1(params: {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  channelId?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const { token, title, body, data = {}, channelId = 'default' } = params;    // Initialize Google Auth with the Service Account
    const serviceAccount = getServiceAccountCredentials();
    const auth = new GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
    });

    // Get access token
    const accessToken = await auth.getAccessToken();
    
    const projectId = 'mental-health-f7b7f';
    const fcmEndpoint = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

    const message: FCMMessage = {
      message: {
        token,
        notification: {
          title,
          body,
        },
        data,
        android: {
          notification: {
            channel_id: channelId,
            sound: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title,
                body,
              },
              sound: 'default',
              'content-available': 1,
            },
          },
        },
      },
    };

    const response = await fetch(fcmEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Push notification sent successfully:', result.name);
      return {
        success: true,
        messageId: result.name,
      };
    } else {
      console.error('❌ Failed to send push notification:', result);
      return {
        success: false,
        error: result.error?.message || 'Unknown error',
      };
    }
  } catch (error) {
    console.error('❌ Error sending push notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send push notification to multiple tokens
 */
export async function sendBatchPushNotificationV1(params: {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  channelId?: string;
}): Promise<{ successCount: number; failureCount: number; results: any[] }> {
  const { tokens, title, body, data, channelId } = params;
  
  const results = await Promise.allSettled(
    tokens.map(token => 
      sendPushNotificationV1({ token, title, body, data, channelId })
    )
  );

  const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failureCount = results.length - successCount;

  return {
    successCount,
    failureCount,
    results: results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: 'Promise rejected' }),
  };
}

/**
 * Test function to verify FCM V1 API setup
 */
export async function testFCMV1Setup(testToken: string): Promise<boolean> {
  try {
    const result = await sendPushNotificationV1({
      token: testToken,
      title: '🧪 FCM V1 Test',
      body: 'Your notification system is working correctly!',
      data: {
        test: 'true',
        timestamp: Date.now().toString(),
      },
    });

    return result.success;
  } catch (error) {
    console.error('FCM V1 test failed:', error);
    return false;
  }
}
