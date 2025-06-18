import { GoogleAuth } from 'google-auth-library';

// Types for FCM V1 API (minimal version without priority)
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
        title?: string;
        body?: string;
        icon?: string;
        color?: string;
        sound?: string;
        tag?: string;
        click_action?: string;
        body_loc_key?: string;
        body_loc_args?: string[];
        title_loc_key?: string;
        title_loc_args?: string[];
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

interface PushNotificationRequest {
  token?: string;
  tokens?: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  channelId?: string;
  type?: 'single' | 'batch';
}

// Service Account credentials (in production, use environment variables)
const getServiceAccountCredentials = () => {
  try {
    // Use environment variables for security
    const serviceAccount = {
      type: process.env.FIREBASE_TYPE || "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID || "mental-health-f7b7f",
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
      token_uri: process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    };

    // Validate required fields
    if (!serviceAccount.private_key || !serviceAccount.client_email) {
      throw new Error('Missing required Firebase service account credentials');
    }

    return serviceAccount;
  } catch (error) {
    console.error('Failed to load Service Account credentials:', error);
    throw new Error('Service Account credentials not found or invalid');
  }
};

async function sendSingleNotification(params: {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  channelId?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const { token, title, body, data = {}, channelId = 'default' } = params;

    // Initialize Google Auth with the Service Account
    const serviceAccount = getServiceAccountCredentials();
    const auth = new GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
    });

    // Get access token
    const accessToken = await auth.getAccessToken();
    
    const projectId = 'mental-health-f7b7f';
    const fcmEndpoint = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;    const message: FCMMessage = {
      message: {
        token,
        notification: {
          title,
          body,
        },
        data: {
          ...data,
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },        android: {
          notification: {
            channel_id: channelId || 'default',
            sound: 'default',
            icon: 'ic_notification',
            color: '#1976D2',
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

    console.log('📤 Sending FCM message:', JSON.stringify(message, null, 2));

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
      return {
        success: true,
        messageId: result.name,
      };
    } else {
      return {
        success: false,
        error: result.error?.message || 'Unknown error',
      };
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function sendBatchNotifications(params: {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  channelId?: string;
}): Promise<{ successCount: number; failureCount: number; results: any[] }> {
  const { tokens, title, body, data, channelId } = params;
  
  const results = await Promise.allSettled(
    tokens.map(token => 
      sendSingleNotification({ token, title, body, data, channelId })
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

// Expo API Route Handler
export async function POST(request: Request): Promise<Response> {
  try {
    const body: PushNotificationRequest = await request.json();
    
    // Validate request
    if (!body.title || !body.body) {
      return Response.json(
        { error: 'Title and body are required' },
        { status: 400 }
      );
    }

    if (body.type === 'batch' || body.tokens) {
      // Batch notification
      if (!body.tokens || !Array.isArray(body.tokens) || body.tokens.length === 0) {
        return Response.json(
          { error: 'Tokens array is required for batch notifications' },
          { status: 400 }
        );
      }

      const result = await sendBatchNotifications({
        tokens: body.tokens,
        title: body.title,
        body: body.body,
        data: body.data,
        channelId: body.channelId,
      });

      return Response.json({
        success: true,
        type: 'batch',
        ...result,
      });
    } else {
      // Single notification
      if (!body.token) {
        return Response.json(
          { error: 'Token is required for single notifications' },
          { status: 400 }
        );
      }

      const result = await sendSingleNotification({
        token: body.token,
        title: body.title,
        body: body.body,
        data: body.data,
        channelId: body.channelId,
      });

      return Response.json({
        success: result.success,
        type: 'single',
        messageId: result.messageId,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
