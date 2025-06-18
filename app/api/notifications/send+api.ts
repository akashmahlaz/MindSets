import { GoogleAuth } from 'google-auth-library';

// Environment variables for Firebase service account
const getFirebaseCredentials = () => {
  // In production, these should be set as environment variables
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID || "mental-health-f7b7f",
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
  };

  return serviceAccount;
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

interface SendNotificationRequest {
  token?: string;
  tokens?: string[];
  topic?: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  channelId?: string;
  imageUrl?: string;
}

/**
 * Send push notification using Firebase Cloud Messaging V1 API
 */
async function sendPushNotificationV1(params: {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  channelId?: string;
  imageUrl?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const { token, title, body, data = {}, channelId = 'default', imageUrl } = params;

    // Initialize Google Auth with the Service Account
    const serviceAccount = getFirebaseCredentials();
    const auth = new GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
    });

    // Get access token
    const accessToken = await auth.getAccessToken();
    
    const projectId = serviceAccount.project_id;
    const fcmEndpoint = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

    const message: FCMMessage = {
      message: {
        token,
        notification: {
          title,
          body,
          ...(imageUrl && { image: imageUrl }),
        },
        data: {
          ...data,
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
          timestamp: Date.now().toString(),
        },
        android: {
          notification: {
            channel_id: channelId,
            sound: 'default',
            icon: 'ic_notification',
            color: '#1976D2',
          },
          data: {
            ...data,
            click_action: 'FLUTTER_NOTIFICATION_CLICK',
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
              badge: 1,
            },
          },
          headers: {
            'apns-priority': '10',
            'apns-push-type': 'alert',
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
async function sendBatchPushNotificationV1(params: {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  channelId?: string;
  imageUrl?: string;
}): Promise<{ successCount: number; failureCount: number; results: any[] }> {
  const { tokens, title, body, data, channelId, imageUrl } = params;
  
  const results = await Promise.allSettled(
    tokens.map(token => 
      sendPushNotificationV1({ token, title, body, data, channelId, imageUrl })
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

export async function POST(request: Request) {
  try {
    const body: SendNotificationRequest = await request.json();
    
    const { token, tokens, topic, title, body: messageBody, data, channelId, imageUrl } = body;

    // Validate required fields
    if (!title || !messageBody) {
      return Response.json(
        { success: false, error: 'Title and body are required' },
        { status: 400 }
      );
    }

    // Check if we have a target (token, tokens, or topic)
    if (!token && !tokens && !topic) {
      return Response.json(
        { success: false, error: 'Either token, tokens, or topic must be provided' },
        { status: 400 }
      );
    }

    // Send to multiple tokens
    if (tokens && tokens.length > 0) {
      const result = await sendBatchPushNotificationV1({
        tokens,
        title,
        body: messageBody,
        data,
        channelId,
        imageUrl,
      });

      return Response.json({
        success: true,
        type: 'batch',
        ...result,
      });
    }

    // Send to single token
    if (token) {
      const result = await sendPushNotificationV1({
        token,
        title,
        body: messageBody,
        data,
        channelId,
        imageUrl,
      });

      return Response.json(result);
    }

    // Send to topic (not implemented yet, but structure is ready)
    if (topic) {
      return Response.json(
        { success: false, error: 'Topic messaging not implemented yet' },
        { status: 501 }
      );
    }

    return Response.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );

  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
