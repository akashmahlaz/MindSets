# Firebase HTTP v1 API Setup Guide

## Overview

This project implements Firebase Cloud Messaging (FCM) HTTP v1 API using Expo API routes. The implementation includes:

- ✅ Expo API route for sending push notifications (`/api/push-notification`)
- ✅ Client-side push notification service
- ✅ React hooks for easy integration
- ✅ Support for single and batch notifications
- ✅ Proper error handling and validation

## Setup Instructions

### 1. Generate Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`mental-health-f7b7f`)
3. Go to **Project Settings** → **Service accounts**
4. Click **Generate new private key**
5. Download the JSON file (keep it secure!)

### 2. Configure Environment Variables

Create a `.env.local` file in your project root:

```bash
# Copy from your downloaded service account JSON file
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=mental-health-f7b7f
FIREBASE_PRIVATE_KEY_ID=your_private_key_id_here
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@mental-health-f7b7f.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id_here
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=your_client_x509_cert_url_here
```

**Important**: Never commit the `.env.local` file to version control!

### 3. Test the Implementation

Navigate to `/push-test` in your app to test the push notification functionality.

## Usage Examples

### Basic Hook Usage

```typescript
import { usePushNotifications } from '@/hooks/usePushNotifications';

function MyComponent() {
  const { fcmToken, isInitialized, sendTestNotification } = usePushNotifications();

  const handleTest = async () => {
    await sendTestNotification();
  };

  return (
    <View>
      <Text>FCM Token: {fcmToken ? '✅ Available' : '❌ Not Available'}</Text>
      <Button title="Send Test" onPress={handleTest} />
    </View>
  );
}
```

### Direct Service Usage

```typescript
import { pushNotificationService } from "@/lib/pushNotificationService";

// Send to specific token
await pushNotificationService.sendNotification({
  token: "user_fcm_token",
  title: "Hello!",
  body: "This is a test message",
  data: { custom: "data" },
});

// Send to multiple tokens
await pushNotificationService.sendNotification({
  tokens: ["token1", "token2", "token3"],
  title: "Broadcast Message",
  body: "Message for multiple users",
});
```

### API Route Usage (Server-side)

```typescript
// POST /api/push-notification
{
  "token": "fcm_token_here",
  "title": "Notification Title",
  "body": "Notification Body",
  "data": {
    "custom": "data"
  },
  "channelId": "default"
}

// For batch notifications
{
  "tokens": ["token1", "token2"],
  "title": "Batch Notification",
  "body": "Message for multiple users",
  "type": "batch"
}
```

## Architecture

### Files Structure

```
app/
  api/
    push-notification+api.ts    # Expo API route for FCM v1
lib/
  pushNotificationService.ts   # Client service for push notifications
hooks/
  usePushNotifications.ts      # React hook for easy integration
app/
  push-test.tsx               # Test screen for notifications
```

### Flow

1. **Client** → Get FCM token from Firebase
2. **Client** → Send notification request to `/api/push-notification`
3. **API Route** → Authenticate with Firebase using service account
4. **API Route** → Send notification via FCM v1 API
5. **Firebase** → Deliver notification to target device(s)

## Security Notes

- ✅ Service account credentials are server-side only
- ✅ Environment variables for sensitive data
- ✅ No client-side exposure of private keys
- ✅ OAuth 2.0 authentication for API calls

## Testing

1. Run your Expo app: `npm start`
2. Navigate to `/push-test` screen
3. Copy your FCM token
4. Send test notifications
5. Verify notifications are received

## Troubleshooting

### Common Issues

1. **"No FCM token available"**

   - Check notification permissions
   - Ensure Firebase is properly configured
   - Check device connectivity

2. **"Service Account credentials not found"**

   - Verify environment variables are set
   - Check `.env.local` file exists
   - Confirm private key format (includes `\n` for line breaks)

3. **"Authentication failed"**

   - Verify service account has FCM permissions
   - Check project ID matches
   - Ensure service account JSON is not corrupted

4. **"CORS errors"**
   - API routes should work without CORS issues in Expo
   - If testing externally, ensure proper headers

### Debug Steps

1. Check console logs for detailed error messages
2. Verify environment variables are loaded
3. Test with the `/push-test` screen first
4. Ensure Firebase project has FCM enabled

## Production Deployment

For production:

1. Set environment variables in your hosting platform
2. Use secure secret management
3. Enable Firebase App Check for additional security
4. Monitor usage and rate limits
5. Implement proper error logging

This implementation provides a secure, scalable solution for push notifications using Firebase HTTP v1 API with Expo!
