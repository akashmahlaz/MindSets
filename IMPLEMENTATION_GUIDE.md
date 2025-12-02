# 🚀 IMPLEMENTATION GUIDE - CRITICAL FIXES

## Step 1: Update app.json Configuration

Replace your current `app.json` plugins section with this:

```json
{
  "expo": {
    "plugins": [
      [
        "@stream-io/video-react-native-sdk",
        {
          "ringingPushNotifications": {
            "disableVideoIos": false,
            "includesCallsInRecentsIos": false,
            "showWhenLockedAndroid": true
          },
          "androidKeepCallAlive": true
        }
      ],
      "@config-plugins/react-native-callkeep",
      [
        "@config-plugins/react-native-webrtc",
        {
          "cameraPermission": "$(PRODUCT_NAME) requires camera access for video calls",
          "microphonePermission": "$(PRODUCT_NAME) requires microphone access for audio calls"
        }
      ],
      "@react-native-firebase/app",
      "@react-native-firebase/messaging",
      [
        "expo-build-properties",
        {
          "android": {
            "minSdkVersion": 24
          },
          "ios": {
            "useFrameworks": "static",
            "forceStaticLinking": [
              "RNFBApp",
              "RNFBMessaging",
              "stream-react-native-webrtc"
            ]
          }
        }
      ]
    ]
  }
}
```

After updating, run:
```bash
npx expo prebuild --clean
```

---

## Step 2: Initialize Push Config at App Entry

Create or update your `index.js` (at project root):

```javascript
// index.js
import 'expo-router/entry';
import { setupVideoPushConfig } from './lib/videoPushConfig';
import { setFirebaseListeners } from './lib/setFirebaseListeners';

// ✅ CRITICAL: Set up push config BEFORE app renders
console.log('🚀 Initializing push notifications...');
setupVideoPushConfig();
setFirebaseListeners();
console.log('✅ Push notifications initialized');
```

---

## Step 3: Request Permissions After Login

Update `context/AuthContext.tsx` to request permissions after user signs in:

```typescript
// In context/AuthContext.tsx
import { requestAllPermissions } from '@/lib/requestPermissions';

// Inside your login/signup success handler:
const handleAuthSuccess = async (user: FirebaseUser) => {
  // ... your existing auth code
  
  // ✅ Request permissions after successful auth
  try {
    await requestAllPermissions();
  } catch (error) {
    console.error('Failed to request permissions:', error);
  }
};
```

---

## Step 4: Hide Tab Bar in Chat Screens

Update `app/(main)/chat/[channelId].tsx`:

```typescript
import { useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';

export default function ChatScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isDarkColorScheme } = useColorScheme();
  
  const colors = {
    surfaceContainer: isDarkColorScheme ? "#0C0F14" : "#FAFBFC",
  };

  // ✅ Hide tab bar when in chat detail
  useEffect(() => {
    const parent = navigation.getParent();
    
    if (parent) {
      parent.setOptions({
        tabBarStyle: { display: 'none' }
      });
    }
    
    return () => {
      if (parent) {
        parent.setOptions({
          tabBarStyle: {
            backgroundColor: colors.surfaceContainer,
            borderTopWidth: 0,
            height: Platform.OS === 'ios' ? 52 + insets.bottom : 60 + insets.bottom,
            paddingTop: 4,
            paddingBottom: insets.bottom,
            elevation: 0,
            shadowOpacity: 0,
          }
        });
      }
    };
  }, [navigation, isDarkColorScheme, insets.bottom]);

  // ... rest of your component
}
```

---

## Step 5: Add iOS Notification Handler

Update `lib/setFirebaseListeners.ts` to add iOS support:

```typescript
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export const setFirebaseListeners = () => {
  // ... your existing Android handlers
  
  // ✅ Add iOS notification handler
  if (Platform.OS === 'ios') {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        };
      },
    });
  }
};
```

---

## Step 6: Add Counselor Approval Check to Video Calls

Update `context/VideoContext.tsx` in the `createCall` function:

```typescript
import { getUserProfile } from '../services/userService';
import { CounsellorProfileData } from '@/types/user';
import { Alert } from 'react-native';

const createCall = async (
  callId: string,
  members: string[],
  isVideo = true
) => {
  if (!videoClient || !user) return null;

  // ✅ Check if calling a counselor
  const otherUserId = members.find((m) => m !== user.uid);
  if (otherUserId) {
    try {
      const otherUserProfile = await getUserProfile(otherUserId);
      
      if (otherUserProfile?.role === 'counsellor') {
        const counsellorData = otherUserProfile as CounsellorProfileData;
        
        // ❌ Block call if counselor not approved
        if (counsellorData.isApproved === false) {
          Alert.alert(
            'Counsellor Not Available',
            'This counsellor is not currently accepting calls.',
            [{ text: 'OK' }]
          );
          return null;
        }
      }
    } catch (error) {
      console.error('Error checking counselor status:', error);
    }
  }

  // ... rest of your create call logic
};
```

---

## Step 7: Fix Video Client Singleton Pattern

Update `services/stream.ts`:

```typescript
import { StreamVideoClient } from '@stream-io/video-react-native-sdk';
import { getAuth } from 'firebase/auth';

export const createVideoClient = (user: any, token: string): StreamVideoClient => {
  // ✅ Use getOrCreateInstance to prevent duplicates
  return StreamVideoClient.getOrCreateInstance({
    apiKey: STREAM_API_KEY,
    user: {
      id: user.uid,
      name: user.displayName || user.email || 'User',
      image: user.photoURL || undefined,
    },
    token,
    tokenProvider: async () => {
      // ✅ Auto-refresh tokens
      const currentUser = getAuth().currentUser;
      if (!currentUser) throw new Error('No user authenticated');
      
      const response = await fetch(GENERATE_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await currentUser.getIdToken()}`,
        },
        body: JSON.stringify({ userId: currentUser.uid }),
      });
      
      if (!response.ok) {
        throw new Error(`Token fetch failed: ${response.status}`);
      }
      
      const data = await response.json();
      return data.token;
    },
    options: {
      rejectCallWhenBusy: true, // Auto-reject if in another call
    },
  });
};
```

---

## Step 8: Test Push Notifications

### Testing on Physical Devices (Required):

1. **Build and install on physical device:**
   ```bash
   eas build --profile development --platform android
   # or
   eas build --profile development --platform ios
   ```

2. **Test incoming call when app is:**
   - ✅ Foreground (app open)
   - ✅ Background (app minimized)
   - ✅ Killed (app completely closed)

3. **Expected behavior:**
   - Full-screen notification appears
   - "Accept" and "Decline" buttons work
   - Tapping "Accept" opens call screen
   - Tapping "Decline" dismisses notification

### Debugging Push Issues:

Check logs:
```bash
# Android
adb logcat | grep -i "firebase\|notifee\|stream"

# iOS
# In Xcode: Window > Devices and Simulators > View Device Logs
```

---

## Step 9: Update Firebase Cloud Functions

If you have custom Firebase Cloud Functions for sending push notifications, update them to include Stream's required format:

```javascript
// Firebase Cloud Function example
const sendCallNotification = async (userId, callData) => {
  const message = {
    token: userPushToken,
    data: {
      call_cid: callData.cid,
      call_id: callData.id,
      type: 'call.ring',
      sender_id: callData.created_by.id,
      sender_name: callData.created_by.name,
    },
    android: {
      priority: 'high',
      ttl: 60000,
    },
    apns: {
      headers: {
        'apns-priority': '10',
        'apns-expiration': '60',
      },
      payload: {
        aps: {
          alert: {
            title: `Incoming call from ${callData.created_by.name}`,
            body: 'Tap to answer',
          },
          sound: 'default',
        },
      },
    },
  };
  
  await admin.messaging().send(message);
};
```

---

## Step 10: Verify Everything Works

**Checklist:**

- [ ] App.json updated with plugins
- [ ] `npx expo prebuild --clean` executed
- [ ] index.js calls setupVideoPushConfig() and setFirebaseListeners()
- [ ] Permissions requested after login
- [ ] Tab bar hides in chat detail screens
- [ ] Counselor approval check added to video calls
- [ ] Video client uses getOrCreateInstance()
- [ ] Push notifications tested on physical device
- [ ] Both Android and iOS tested
- [ ] Incoming calls work in foreground/background/killed states

---

## Common Issues & Solutions

### Issue: "Push notifications not appearing"
**Solution:** Ensure you've:
1. Set up Firebase Cloud Messaging in Firebase Console
2. Added google-services.json (Android) or GoogleService-Info.plist (iOS)
3. Called setupVideoPushConfig() and setFirebaseListeners() in index.js
4. Requested notification permissions
5. Testing on physical device (not emulator)

### Issue: "Tab bar still showing in chat"
**Solution:** Make sure you're using `navigation.getParent()?.setOptions()` and not just `navigation.setOptions()`

### Issue: "Video client initialization fails"
**Solution:** Check that:
1. Stream API key is correct
2. Token generation URL is working
3. User is authenticated before creating client
4. Using getOrCreateInstance() instead of new StreamVideoClient()

### Issue: "Counselor approval check not working"
**Solution:** Verify that:
1. CounsellorProfileData type includes isApproved field
2. getUserProfile() returns complete profile data
3. Firestore rules allow reading user profiles

---

## Performance Tips

1. **Lazy load Stream SDK:**
   ```typescript
   const { StreamVideoClient } = await import('@stream-io/video-react-native-sdk');
   ```

2. **Debounce tab bar style changes:**
   ```typescript
   const debouncedSetTabBarStyle = useMemo(
     () => debounce((style) => navigation.setOptions({ tabBarStyle: style }), 100),
     [navigation]
   );
   ```

3. **Memoize expensive computations:**
   ```typescript
   const tabBarStyle = useMemo(() => ({
     backgroundColor: colors.surfaceContainer,
     height: Platform.OS === 'ios' ? 52 + insets.bottom : 60 + insets.bottom,
   }), [colors.surfaceContainer, insets.bottom]);
   ```

---

## Next Steps

After implementing these critical fixes:

1. ✅ Test thoroughly on physical devices
2. ✅ Monitor crash analytics (Sentry/Firebase Crashlytics)
3. ✅ Add call quality monitoring
4. ✅ Implement call recording feature
5. ✅ Add call history/logs
6. ✅ Set up analytics for call metrics

---

**Need Help?**
- Stream.io Docs: https://getstream.io/video/docs/react-native/
- Expo Docs: https://docs.expo.dev/
- Firebase Docs: https://firebase.google.com/docs
