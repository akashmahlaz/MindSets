# 🎥 COMPREHENSIVE VIDEO & CALL SYSTEM ANALYSIS - MindHeal App

**Analysis Date:** December 1, 2025  
**App Version:** 1.0.0  
**Stream SDK Version:** @stream-io/video-react-native-sdk ^1.17.0

---

## 📋 EXECUTIVE SUMMARY

### Critical Issues Found: 7
### Major Issues Found: 12
### Minor Issues Found: 8
### Recommendations: 15

---

## 🚨 CRITICAL ISSUES

### 1. ❌ **MISSING PUSH NOTIFICATION SETUP**
**Severity:** CRITICAL  
**Impact:** Users will NOT receive incoming call notifications when app is in background/killed

**Problem:**
- Push notification config is defined in `lib/videoPushConfig.ts` but **NEVER CALLED**
- The `setupVideoPushConfig()` function is never invoked in the app lifecycle
- No firebase listeners are set up for ringing calls
- Missing push notification permissions request

**Required Files Missing:**
```
❌ lib/setFirebaseListeners.ts (referenced but doesn't exist)
❌ index.js initialization (push config setup)
```

**Fix Required:**
```typescript
// In index.js or app/_layout.tsx (before app renders)
import { setupVideoPushConfig } from './lib/videoPushConfig';
import { setFirebaseListeners } from './lib/setFirebaseListeners';
import { requestNotificationPermissions } from './lib/pushNotificationHelpers';

// Call BEFORE app initialization
setupVideoPushConfig();
setFirebaseListeners();

// Call at appropriate time (after user login)
requestNotificationPermissions();
```

---

### 2. ❌ **APP.JSON MISSING CRITICAL PUSH CONFIG**
**Severity:** CRITICAL  
**Impact:** Push notifications won't work on Android/iOS

**Current app.json issues:**
```json
{
  "plugins": [
    "@stream-io/video-react-native-sdk"  // ❌ Missing configuration
  ]
}
```

**Required Configuration:**
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

---

### 3. ❌ **MISSING FIREBASE MESSAGE HANDLERS**
**Severity:** CRITICAL  
**Impact:** Incoming calls won't trigger notifications

**Required Implementation:**
Create `lib/setFirebaseListeners.ts`:
```typescript
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';
import {
  isFirebaseStreamVideoMessage,
  firebaseDataHandler,
  onAndroidNotifeeEvent,
  isNotifeeStreamVideoEvent,
} from '@stream-io/video-react-native-sdk';

export const setFirebaseListeners = () => {
  // Background message handler for Android
  messaging().setBackgroundMessageHandler(async (msg) => {
    if (isFirebaseStreamVideoMessage(msg)) {
      await firebaseDataHandler(msg.data);
    }
  });

  // Foreground message handler
  messaging().onMessage((msg) => {
    if (isFirebaseStreamVideoMessage(msg)) {
      firebaseDataHandler(msg.data);
    }
  });

  // Background notification press handler
  notifee.onBackgroundEvent(async (event) => {
    if (isNotifeeStreamVideoEvent(event)) {
      await onAndroidNotifeeEvent({ event, isBackground: true });
    }
  });

  // Foreground notification press handler
  notifee.onForegroundEvent((event) => {
    if (isNotifeeStreamVideoEvent(event)) {
      onAndroidNotifeeEvent({ event, isBackground: false });
    }
  });
};
```

---

### 4. ❌ **NO TAB BAR HIDING IN CHAT SCREEN**
**Severity:** MAJOR  
**Impact:** Tab bar remains visible during chat conversations (bad UX)

**Current Issue:**
- Tab bar shows when viewing individual chats
- Takes up valuable screen space
- Standard messaging app behavior is to hide tabs

**Fix Required:**
Update `app/(main)/_layout.tsx`:
```typescript
<Tabs.Screen
  name="chat"
  options={{
    title: "Chat",
    tabBarIcon: ({ color, focused }) => (
      <Ionicons 
        size={24} 
        name={focused ? "chatbubbles" : "chatbubbles-outline"} 
        color={color}
      />
    ),
  }}
  listeners={({ navigation, route }) => ({
    tabPress: (e) => {
      const state = navigation.getState();
      const chatRoute = state.routes.find((r) => r.name === 'chat');
      
      // Hide tab bar when in specific chat
      if (chatRoute?.state?.routes?.length > 1) {
        navigation.setOptions({
          tabBarStyle: { display: 'none' }
        });
      } else {
        navigation.setOptions({
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
    },
  })}
/>
```

Better approach - use navigation state listener:
```typescript
// In app/(main)/_layout.tsx
import { useNavigation } from '@react-navigation/native';

export default function TabLayout() {
  const navigation = useNavigation();
  const segments = useSegments();
  
  // Hide tab bar when in chat detail screen
  React.useEffect(() => {
    const isInChatDetail = segments[1] === 'chat' && segments[2] === '[channelId]';
    
    navigation.setOptions({
      tabBarStyle: isInChatDetail 
        ? { display: 'none' } 
        : { 
            backgroundColor: colors.surfaceContainer,
            borderTopWidth: 0,
            height: Platform.OS === 'ios' ? 52 + insets.bottom : 60 + insets.bottom,
          }
    });
  }, [segments]);
  
  // ... rest of code
}
```

---

### 5. ❌ **STREAM VIDEO CLIENT NOT PROPERLY INITIALIZED**
**Severity:** CRITICAL  
**Impact:** Video calls may fail, memory leaks, duplicate clients

**Current Issues in `context/VideoContext.tsx`:**
```typescript
// ❌ Problem: Creates client but doesn't check if one exists
const client = createVideoClient(currentUser, token);

// ❌ Problem: No cleanup of old clients
// ❌ Problem: Token refresh not handled
```

**Required Fix:**
```typescript
// In services/stream.ts
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
      // ✅ Implement token refresh
      const currentUser = getAuth().currentUser;
      if (!currentUser) throw new Error('No user');
      
      const response = await fetch(GENERATE_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await currentUser.getIdToken()}`,
        },
        body: JSON.stringify({ userId: currentUser.uid }),
      });
      
      const data = await response.json();
      return data.token;
    },
  });
};
```

---

### 6. ❌ **NO CALL CLEANUP ON COMPONENT UNMOUNT**
**Severity:** MAJOR  
**Impact:** Memory leaks, zombie calls, app crashes

**Problem in `context/VideoContext.tsx`:**
```typescript
// ❌ Missing cleanup
useEffect(() => {
  initVideoClient();
  // ❌ No return cleanup function
}, [user]);
```

**Required Fix:**
```typescript
useEffect(() => {
  let mounted = true;
  let client: StreamVideoClient | null = null;
  
  const initVideoClient = async () => {
    if (!user || !mounted) return;
    
    try {
      client = await createVideoClient(user, token);
      if (mounted) {
        setVideoClient(client);
        setIsVideoConnected(true);
      }
    } catch (error) {
      console.error('Failed to init video client:', error);
    }
  };
  
  initVideoClient();
  
  // ✅ Cleanup function
  return () => {
    mounted = false;
    if (currentCall) {
      currentCall.leave().catch(console.error);
    }
    // Don't disconnect client - it's a singleton
    // But do clear local state
    setCurrentCall(null);
  };
}, [user]);
```

---

### 7. ❌ **MISSING PERMISSION REQUESTS**
**Severity:** CRITICAL  
**Impact:** Calls will fail without camera/mic permissions

**Current State:**
- Permissions declared in app.json ✅
- **NO CODE TO REQUEST PERMISSIONS** ❌

**Required Implementation:**
Create `lib/requestPermissions.ts`:
```typescript
import { PermissionsAndroid, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export const requestAllPermissions = async () => {
  try {
    if (Platform.OS === 'android') {
      const results = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      ]);
      
      const allGranted = Object.values(results).every(
        result => result === PermissionsAndroid.RESULTS.GRANTED
      );
      
      if (!allGranted) {
        console.warn('Some permissions were denied');
      }
      
      return allGranted;
    } else if (Platform.OS === 'ios') {
      // iOS permissions are requested automatically on first use
      // But we can request notification permissions explicitly
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    }
  } catch (error) {
    console.error('Permission request failed:', error);
    return false;
  }
};

export const requestNotificationPermissions = async () => {
  if (Platform.OS === 'android') {
    return await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
  } else {
    const { status } = await Notifications.requestPermissionsAsync();
    return status;
  }
};
```

Call in `app/_layout.tsx`:
```typescript
useEffect(() => {
  requestAllPermissions();
}, []);
```

---

## ⚠️ MAJOR ISSUES

### 8. **RINGING SOUND NOT PROPERLY MANAGED**
**Problem:** `RingingSound` component in `VideoContext.tsx` but implementation unclear

**Fix:**
```typescript
const RingingSound = () => {
  const call = useCall();
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  
  useEffect(() => {
    let mounted = true;
    
    const setupSound = async () => {
      if (callingState === CallingState.RINGING && call?.isCreatedByMe) {
        // Play outgoing call sound
        const { sound: ringSound } = await Audio.Sound.createAsync(
          require('../assets/sounds/outgoing-call.mp3'),
          { isLooping: true, volume: 0.5 }
        );
        if (mounted) {
          setSound(ringSound);
          await ringSound.playAsync();
        }
      }
    };
    
    setupSound();
    
    return () => {
      mounted = false;
      sound?.stopAsync().then(() => sound.unloadAsync());
    };
  }, [callingState]);
  
  return null;
};
```

---

### 9. **CALL STATE NOT PERSISTED**
**Problem:** No handling of app restart during active call

**Recommendation:**
```typescript
// Store active call ID in AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

const persistCallState = async (callId: string | null) => {
  if (callId) {
    await AsyncStorage.setItem('@active_call_id', callId);
  } else {
    await AsyncStorage.removeItem('@active_call_id');
  }
};

const restoreCallState = async () => {
  const callId = await AsyncStorage.getItem('@active_call_id');
  if (callId && videoClient) {
    // Attempt to rejoin
    const call = videoClient.call('default', callId);
    try {
      await call.join();
      return call;
    } catch (error) {
      // Call ended, clear storage
      await AsyncStorage.removeItem('@active_call_id');
    }
  }
  return null;
};
```

---

### 10. **NO ERROR BOUNDARY FOR CALL FAILURES**
**Problem:** Call failures crash the app

**Fix:**
```typescript
// components/call/CallErrorBoundary.tsx
import React from 'react';

class CallErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Call error:', error, errorInfo);
    // Log to analytics
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text>Call failed. Please try again.</Text>
          <Button title="Retry" onPress={() => this.setState({ hasError: false })} />
        </View>
      );
    }

    return this.props.children;
  }
}
```

---

### 11. **MISSING NETWORK STATE HANDLING**
**Problem:** No handling of network loss during calls

**Recommendation:**
```typescript
import NetInfo from '@react-native-community/netinfo';
import { CallingState } from '@stream-io/video-react-native-sdk';

const CallNetworkMonitor = () => {
  const call = useCall();
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const [isOnline, setIsOnline] = useState(true);
  
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
      
      if (!state.isConnected && callingState === CallingState.JOINED) {
        Alert.alert(
          'Connection Lost',
          'Your internet connection was lost. Attempting to reconnect...'
        );
      }
    });
    
    return () => unsubscribe();
  }, [callingState]);
  
  if (!isOnline && callingState !== CallingState.IDLE) {
    return (
      <View style={styles.networkBanner}>
        <Text>Reconnecting...</Text>
      </View>
    );
  }
  
  return null;
};
```

---

### 12. **CALL LOGS NOT SAVED**
**Problem:** No call history tracking in Firestore

**Recommendation:**
```typescript
// services/callHistoryService.ts
import { db } from '@/firebaseConfig';
import { collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';

export interface CallLog {
  callId: string;
  callType: 'video' | 'audio';
  participants: string[];
  initiatedBy: string;
  startedAt: Date;
  endedAt?: Date;
  duration?: number;
  status: 'completed' | 'missed' | 'declined' | 'failed';
}

export const saveCallLog = async (log: CallLog) => {
  try {
    await addDoc(collection(db, 'callLogs'), {
      ...log,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to save call log:', error);
  }
};

export const getUserCallHistory = async (userId: string) => {
  const q = query(
    collection(db, 'callLogs'),
    where('participants', 'array-contains', userId),
    orderBy('startedAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
```

---

### 13. **MISSING CALL QUALITY INDICATORS**
**Problem:** Users can't see their connection quality

**Recommendation:**
```typescript
const CallQualityIndicator = () => {
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();
  const localParticipant = participants.find(p => p.isLocalParticipant);
  
  const quality = localParticipant?.connectionQuality;
  
  const getQualityColor = () => {
    switch (quality) {
      case 'excellent': return '#10B981';
      case 'good': return '#F59E0B';
      case 'poor': return '#EF4444';
      default: return '#6B7280';
    }
  };
  
  return (
    <View style={styles.qualityIndicator}>
      <View style={[styles.dot, { backgroundColor: getQualityColor() }]} />
      <Text style={styles.qualityText}>{quality || 'Unknown'}</Text>
    </View>
  );
};
```

---

### 14. **NO BACKGROUND CALL HANDLING (iOS)**
**Problem:** iOS background mode not configured for VoIP

**Fix in app.json:**
```json
{
  "ios": {
    "infoPlist": {
      "UIBackgroundModes": [
        "audio",
        "voip"
      ]
    }
  }
}
```

---

### 15. **COUNSELOR APPROVAL CHECK MISSING IN VIDEO CALLS**
**Problem:** Unapproved counselors can receive video calls

**Fix:**
```typescript
// In VideoContext.tsx createCall function
const createCall = async (callId: string, members: string[], isVideo = true) => {
  // ✅ Check if calling a counselor
  const otherUserId = members.find(m => m !== user?.uid);
  if (otherUserId) {
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
  }
  
  // ... rest of create call logic
};
```

---

### 16. **CHAT KEYBOARD COVERS MESSAGE INPUT**
**Problem:** Already fixed with `KeyboardAvoidingView` in chat screen ✅

**Current Implementation (Good):**
```typescript
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  style={{ flex: 1 }}
  keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
>
  <Channel channel={channel}>
    <MessageList />
    <MessageInput />
  </Channel>
</KeyboardAvoidingView>
```

---

### 17. **NO CALL RECORDING FEATURE**
**Recommendation:** Implement call recording for therapy sessions

```typescript
const startRecording = async () => {
  if (!call) return;
  
  try {
    await call.startRecording();
    Alert.alert('Recording Started', 'This call is now being recorded.');
  } catch (error) {
    Alert.alert('Recording Failed', 'Could not start recording.');
  }
};
```

---

### 18. **MISSING CALL ANALYTICS**
**Recommendation:** Track call metrics

```typescript
import analytics from '@react-native-firebase/analytics';

const logCallEvent = async (event: string, params: any) => {
  await analytics().logEvent(event, {
    ...params,
    timestamp: Date.now(),
  });
};

// Usage
await logCallEvent('call_started', {
  call_id: call.id,
  call_type: 'video',
  duration: 0,
});
```

---

### 19. **NO SCREEN SHARE FEATURE**
**Recommendation:** Add screen sharing for counselors

```typescript
const { useScreenShareState } = useCallStateHooks();
const { screenShareState, screenShare } = useScreenShareState();

const toggleScreenShare = async () => {
  if (screenShareState.status === 'enabled') {
    await screenShare.disable();
  } else {
    await screenShare.enable();
  }
};
```

---

## 📝 MINOR ISSUES & IMPROVEMENTS

### 20. **Add Call Mute/Unmute Indicators**
```typescript
const MuteIndicator = ({ participant }) => {
  const hasAudio = participant.publishedTracks.includes('audio');
  
  return !hasAudio ? (
    <View style={styles.mutedBadge}>
      <Ionicons name="mic-off" size={16} color="#EF4444" />
    </View>
  ) : null;
};
```

---

### 21. **Add Video On/Off Toggle**
```typescript
const { useCameraState } = useCallStateHooks();
const { camera, isMute } = useCameraState();

const toggleCamera = async () => {
  await camera.toggle();
};
```

---

### 22. **Add Speaker Toggle**
```typescript
import { callManager } from '@stream-io/video-react-native-sdk';

const toggleSpeaker = () => {
  callManager.speaker.setForceSpeakerphoneOn(!isSpeakerOn);
  setIsSpeakerOn(!isSpeakerOn);
};
```

---

### 23. **Add Participant Count Display**
```typescript
const { useParticipantCount } = useCallStateHooks();
const participantCount = useParticipantCount();

return (
  <Text>{participantCount} participant{participantCount !== 1 ? 's' : ''}</Text>
);
```

---

### 24. **Add Call Duration Timer**
```typescript
const CallDurationTimer = () => {
  const { useCallStartedAt } = useCallStateHooks();
  const startedAt = useCallStartedAt();
  const [duration, setDuration] = useState(0);
  
  useEffect(() => {
    if (!startedAt) return;
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - new Date(startedAt).getTime();
      setDuration(Math.floor(elapsed / 1000));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [startedAt]);
  
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return <Text>{formatDuration(duration)}</Text>;
};
```

---

### 25. **Add Reaction Emojis**
```typescript
const sendReaction = async (emoji: string) => {
  if (!call) return;
  
  await call.sendReaction({
    type: 'reaction',
    emoji_code: emoji,
  });
};
```

---

### 26. **Add Picture-in-Picture Mode**
```typescript
// For iOS PiP support
import { usePictureInPicture } from '@stream-io/video-react-native-sdk';

const { enterPiP, exitPiP, isPiPAvailable } = usePictureInPicture();

const handlePiP = async () => {
  if (isPiPAvailable) {
    await enterPiP();
  }
};
```

---

### 27. **Add Noise Cancellation**
```typescript
import { NoiseCancellationProvider, useNoiseCancellation } from '@stream-io/video-react-native-sdk';

const NoiseToggle = () => {
  const { isEnabled, setEnabled, isSupported } = useNoiseCancellation();
  
  if (!isSupported) return null;
  
  return (
    <TouchableOpacity onPress={() => setEnabled(!isEnabled)}>
      <Text>{isEnabled ? 'Disable' : 'Enable'} Noise Cancellation</Text>
    </TouchableOpacity>
  );
};
```

---

## 🎯 IMPLEMENTATION PRIORITY

### Phase 1 (IMMEDIATE - This Week):
1. ✅ Set up push notification configuration
2. ✅ Create Firebase message handlers
3. ✅ Update app.json with required plugins
4. ✅ Request permissions on app start
5. ✅ Fix tab bar hiding in chat screens
6. ✅ Fix video client initialization

### Phase 2 (This Month):
7. ✅ Add call error boundary
8. ✅ Implement call logs
9. ✅ Add network monitoring
10. ✅ Add counselor approval checks
11. ✅ Add call quality indicators

### Phase 3 (Next Month):
12. ✅ Add screen sharing
13. ✅ Add call recording
14. ✅ Add analytics
15. ✅ Add PiP mode

---

## 📦 REQUIRED PACKAGE UPDATES

```json
{
  "dependencies": {
    "@stream-io/video-react-native-sdk": "^1.17.0", // ✅ Already correct
    "@react-native-firebase/app": "^22.2.1", // ✅ Already installed
    "@react-native-firebase/messaging": "^22.2.1", // ✅ Already installed
    "@notifee/react-native": "^9.1.8", // ✅ Already installed
    "react-native-voip-push-notification": "NEEDED", // ❌ Missing for iOS VoIP
    "react-native-callkeep": "NEEDED", // ❌ Missing for iOS CallKit
    "@react-native-community/netinfo": "11.4.1" // ✅ Already installed
  }
}
```

**Install missing packages:**
```bash
npx expo install react-native-voip-push-notification react-native-callkeep
```

---

## 🔧 FIRESTORE RULES NEEDED

```javascript
// Add to firestore.rules
match /callLogs/{logId} {
  allow read: if request.auth != null && 
    request.auth.uid in resource.data.participants;
  allow create: if request.auth != null && 
    request.auth.uid in request.resource.data.participants;
}
```

---

## 📱 TAB BAR HIDING SOLUTION (DETAILED)

### Option 1: Using Navigation Options (Recommended)
```typescript
// In app/(main)/chat/[channelId].tsx
import { useNavigation } from '@react-navigation/native';

export default function ChatScreen() {
  const navigation = useNavigation();
  
  useEffect(() => {
    // Hide tab bar when entering chat detail
    navigation.getParent()?.setOptions({
      tabBarStyle: { display: 'none' }
    });
    
    return () => {
      // Restore tab bar when leaving
      navigation.getParent()?.setOptions({
        tabBarStyle: {
          backgroundColor: colors.surfaceContainer,
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 52 + insets.bottom : 60 + insets.bottom,
        }
      });
    };
  }, [navigation]);
  
  // ... rest of component
}
```

### Option 2: Using Expo Router Screen Options
```typescript
// In app/(main)/chat/[channelId].tsx
export const unstable_settings = {
  tabBarStyle: { display: 'none' }
};
```

### Option 3: Conditional Tab Bar (Most Robust)
```typescript
// In app/(main)/_layout.tsx
import { usePathname } from 'expo-router';

export default function TabLayout() {
  const pathname = usePathname();
  const isChatDetail = pathname.includes('/chat/') && pathname !== '/(main)/chat';
  
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: isChatDetail 
          ? { display: 'none' }
          : {
              backgroundColor: colors.surfaceContainer,
              borderTopWidth: 0,
              height: Platform.OS === 'ios' ? 52 + insets.bottom : 60 + insets.bottom,
            }
      }}
    >
      {/* tabs */}
    </Tabs>
  );
}
```

---

## 🚀 QUICK START CHECKLIST

- [ ] Run `npx expo install react-native-voip-push-notification react-native-callkeep`
- [ ] Create `lib/setFirebaseListeners.ts` file
- [ ] Create `lib/requestPermissions.ts` file  
- [ ] Update `app.json` with plugin configurations
- [ ] Call `setupVideoPushConfig()` in `index.js`
- [ ] Call `setFirebaseListeners()` in `index.js`
- [ ] Request permissions after user login
- [ ] Hide tab bar in chat detail screens
- [ ] Test push notifications on physical device
- [ ] Test video calls between two devices
- [ ] Test background call handling
- [ ] Test permission flows
- [ ] Run `npx expo prebuild --clean` after app.json changes

---

## 📞 CONTACT & SUPPORT

For Stream.io support:
- Documentation: https://getstream.io/video/docs/react-native/
- Support: support@getstream.io
- Community: https://github.com/GetStream/stream-video-react-native

---

**End of Analysis Report**
