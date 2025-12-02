# 🚨 CRITICAL BUGS & FIXES REPORT
**Date:** December 1, 2025  
**MindHeal Application - Complete Analysis**

---

## 📋 EXECUTIVE SUMMARY

After deep analysis of all files and folders, I've identified **9 CRITICAL BUGS** that need immediate fixing:

### Issues Found:
1. ❌ Call "declined" message shows when caller ends call normally
2. ❌ No incoming/outgoing call sounds (silent calls)
3. ❌ Counsellor approval system unclear and inconsistent
4. ❌ Resources sound system unprofessional (requires full audio files)
5. ❌ Google Sign-In not working (should be removed)
6. ❌ Tab bar visibility in chat screens
7. ❌ iOS compatibility issues
8. ❌ Push notification system not initialized
9. ❌ Multiple error conditions throughout app

---

## 🔴 BUG #1: Call Shows "Declined" When Normally Ended

### Problem:
When a caller ends their own call, the app shows "Call Declined" alert to the callee. This is confusing and incorrect.

**Current Flow:**
- Caller presses "End Call" → `call.endCall()` → Callee sees "Call Declined" alert
- This makes it seem like someone rejected the call when it was just normally ended

### Location:
- `app/call/[callId].tsx` lines 109-117

### Root Cause:
The `handleCallRejected` event fires even when call is ended normally. The code doesn't distinguish between:
1. **Active rejection** (user pressed decline button)
2. **Normal ending** (user pressed end call button)

### Fix:
```typescript
// BEFORE (lines 109-117):
const handleCallRejected = () => {
  console.log("Call was rejected");
  if (!isEndingCall.current) {
    Alert.alert("Call Declined", "The call was declined.");
  }
  router.back();
};

// AFTER:
const handleCallRejected = (event: any) => {
  console.log("Call was rejected", event);
  // Only show "declined" if explicitly rejected (not ended normally)
  if (!isEndingCall.current && event?.call?.state?.endedBy) {
    const endReason = event?.call?.state?.endedReason;
    // Only show alert for actual rejection (decline/busy/timeout)
    if (endReason === 'decline' || endReason === 'busy' || endReason === 'timeout') {
      Alert.alert("Call Declined", "The other person declined the call.");
    }
    // For normal endings, just navigate back silently
  }
  router.back();
};
```

---

## 🔴 BUG #2: No Incoming/Outgoing Call Sounds

### Problem:
Calls are **completely silent**. No ringtone for incoming calls, no ringback for outgoing calls.

**User Experience:**
- Incoming call: User has no audio cue someone is calling
- Outgoing call: Caller hears silence (should hear ringback tone)

### Location:
- `context/VideoContext.tsx` lines 444-530 (`RingingSound` component)

### Root Cause:
1. **Outgoing calls:** Intentionally silenced (line 488: "NO SOUND for outgoing")
2. **Incoming calls:** Uses `InCallManager.startRingtone("_DEFAULT_")` but this doesn't work reliably

### Current Code Issues:
```typescript
// Lines 488-495 - Outgoing is SILENT
if (isCallCreatedByMe) {
  console.log("🔊 OUTGOING call - Playing silent ringback (no sound)");
  InCallManager.start({
    media: "audio",
    auto: true,
    // No ringback parameter = silent outgoing call
  });
```

```typescript
// Lines 497-506 - Incoming uses system default (doesn't work)
InCallManager.startRingtone(
  "_DEFAULT_", // System default ringtone
  [500, 1000, 500], 
  "ringtone",
  30000,
);
```

### Fix Required:
```typescript
// BETTER SOLUTION - Use expo-av Audio for reliable sounds

import { Audio } from 'expo-av';

const RingingSound = () => {
  const call = useCall();
  const { user } = useAuth();
  const callCreator = call?.state?.custom?.createdBy;
  const isCallCreatedByMe = call?.isCreatedByMe || callCreator === user?.uid;
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    if (callingState !== CallingState.RINGING) return;

    const playRingingSound = async () => {
      try {
        // Set audio mode for ringtone
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });

        if (isCallCreatedByMe) {
          // OUTGOING CALL - Play ringback tone
          console.log("🔊 Playing OUTGOING ringback tone");
          const { sound: ringbackSound } = await Audio.Sound.createAsync(
            require('@/assets/sounds/ringback.mp3'), // Ringback tone (boop...boop...)
            { 
              shouldPlay: true, 
              isLooping: true,
              volume: 0.8,
            }
          );
          setSound(ringbackSound);
        } else {
          // INCOMING CALL - Play ringtone
          console.log("📞 Playing INCOMING ringtone");
          const { sound: ringtoneSound } = await Audio.Sound.createAsync(
            require('@/assets/sounds/ringtone.mp3'), // Actual ringtone
            { 
              shouldPlay: true, 
              isLooping: true,
              volume: 1.0,
            }
          );
          setSound(ringtoneSound);
        }
      } catch (error) {
        console.error("Error playing ringtone:", error);
      }
    };

    playRingingSound();

    return () => {
      // Cleanup sound
      if (sound) {
        sound.stopAsync().then(() => sound.unloadAsync()).catch(console.error);
      }
    };
  }, [callingState, isCallCreatedByMe]);

  return null;
};
```

### Required Audio Files:
Need to add to `assets/sounds/`:
1. **`ringtone.mp3`** - Incoming call ringtone (15-30 seconds, loopable)
2. **`ringback.mp3`** - Outgoing call ringback tone (2-3 second loop)

**Free sources:**
- https://freesound.org/search/?q=phone+ringtone
- https://pixabay.com/sound-effects/search/ringtone/
- https://mixkit.co/free-sound-effects/phone/

---

## 🔴 BUG #3: Counsellor Approval System Unclear

### Problem:
Multiple overlapping approval fields causing confusion:
- `isApproved` (boolean)
- `verificationStatus` ("pending" | "verified" | "rejected")
- Inconsistent checks across codebase

### Locations Affected:
1. `app/(session)/book-session.tsx` - Lines 109-110, 125-126
2. `services/userService.ts` - Lines 187-188, 240-241, 320-328
3. `types/user.ts` - Lines 33, 105

### Current Issues:

**In book-session.tsx (lines 109-126):**
```typescript
// Checks ONLY isApproved === true
if (counsellorProfile && 
    counsellorProfile.role === "counsellor" &&
    (counsellorProfile as CounsellorProfileData).isApproved === true) {
  // Allow booking
}
```

**In userService.ts (lines 320-328):**
```typescript
// Checks BOTH verificationStatus AND isApproved
const isVerified = counsellorData.verificationStatus === "verified";
const isApproved = c.isApproved === true;
return isVerified || isApproved; // Either one works?
```

### Fix - Single Source of Truth:

**DECISION:** Use **`verificationStatus`** as the single source of truth.

```typescript
// UPDATE types/user.ts
export interface CounsellorProfileData extends UserProfile {
  role: "counsellor";
  
  // REMOVE: isApproved?: boolean; // DEPRECATED
  
  // USE THIS ONLY:
  verificationStatus: "pending" | "verified" | "rejected";
  
  // Other fields...
  hourlyRate: number;
  specialization: string[];
  certifications?: Certification[];
}

// Helper function for checking approval
export const isCounsellorApproved = (counsellor: CounsellorProfileData): boolean => {
  return counsellor.verificationStatus === "verified";
};
```

**Update all checks to:**
```typescript
// EVERYWHERE in codebase, replace:
if (counsellor.isApproved === true)

// WITH:
if (counsellor.verificationStatus === "verified")
```

---

## 🔴 BUG #4: Resources Sound System Unprofessional

### Problem:
The sound system (`lib/soundAssets.ts`) defines 30+ sounds but **NONE exist**. Comments say "you need to add actual audio files."

**Current State:**
```typescript
// lib/soundAssets.ts line 252+
[SOUND_IDS.CALL_RINGTONE]: {
  id: SOUND_IDS.CALL_RINGTONE,
  name: 'Call Ringtone',
  // FILE DOESN'T EXIST!
}
```

### Issues:
1. ❌ No actual audio files in `assets/sounds/` folder
2. ❌ 30+ sound IDs defined but 0 implemented
3. ❌ App tries to play sounds that don't exist → crashes/errors
4. ❌ Meditation/breathing exercises are silent
5. ❌ Sleep sounds don't work
6. ❌ UI feedback sounds missing

### Fix Strategy:

**Option A: Remove Unused Sounds (RECOMMENDED)**
Keep ONLY essential sounds that enhance UX:

```typescript
// MINIMAL SOUND SYSTEM
export const SOUND_IDS = {
  // Core sounds only
  CALL_RINGTONE: 'call-ringtone',      // Incoming call
  CALL_RINGBACK: 'call-ringback',      // Outgoing call
  MESSAGE_RECEIVED: 'message-received', // New chat message
  NOTIFICATION: 'notification',         // Generic notification
} as const;
```

**Option B: Use Haptic Feedback Instead**
For UI sounds (button clicks, typing), use **haptics** instead:

```typescript
// Replace sound with haptic
import * as Haptics from 'expo-haptics';

// Instead of: playSound('ui-tap')
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
```

**Option C: Implement All Sounds (Time-consuming)**
If you want all meditation/sleep sounds:
1. Download 30+ audio files from free sources
2. Add to `assets/sounds/` folder
3. Update `getSoundSource()` to return actual `require()` statements
4. Test each sound works
5. Ensure licensing is correct

**RECOMMENDATION:** Go with **Option A + Option B**
- Keep 4 essential sounds (calls + notifications)
- Use haptics for all UI feedback
- Remove meditation/sleep sounds (users can use Spotify/Apple Music)

---

## 🔴 BUG #5: Google Sign-In Not Working

### Problem:
Google Sign-In implemented but **does not work** and user wants it **REMOVED**.

### Location:
`app/(auth)/sign-in.tsx` lines 103-161

### Current Issues:
1. Wrong client IDs (same ID used for all platforms)
2. `@react-native-google-signin/google-signin` package installed but not properly configured
3. Conflicts with expo-auth-session Google implementation
4. User doesn't want this feature

### Fix: REMOVE Google Sign-In Completely

```typescript
// 1. REMOVE from package.json
"@react-native-google-signin/google-signin": "^14.0.1", // DELETE THIS LINE

// 2. DELETE from sign-in.tsx (lines 103-161)
// Remove:
// - useAuthRequest hook
// - handleGoogleSignInResponse function  
// - handleGoogleSignIn function
// - Google sign-in button UI

// 3. REMOVE button from UI (around line 531)
// Delete the entire Google sign-in button pressable

// 4. Keep ONLY:
// - Email/Password sign-in
// - Apple Sign-In (for iOS)
```

### Apple Sign-In Status:
✅ **Apple Sign-In WORKS** - Keep this!
- Properly configured in `app.json`
- `expo-apple-authentication` installed
- Required for App Store (if offering social sign-in)

---

## 🔴 BUG #6: Tab Bar Visible in Chat Screens

### Problem:
When user opens a chat conversation, the bottom tab bar remains visible. This is bad UX.

**Expected:** Tabs hidden in chat detail view  
**Actual:** Tabs always visible

### Location:
`app/(main)/chat/[channelId].tsx`

### Fix:
```typescript
// Add to chat/[channelId].tsx - around line 50

import { useNavigation } from '@react-navigation/native';

export default function ChannelScreen() {
  const navigation = useNavigation();
  const { channelId } = useLocalSearchParams();
  const { isDarkColorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();

  // Hide tab bar when chat screen is active
  useEffect(() => {
    const parent = navigation.getParent();
    if (parent) {
      parent.setOptions({
        tabBarStyle: { display: 'none' },
      });
    }

    // Restore tab bar when leaving chat screen
    return () => {
      if (parent) {
        parent.setOptions({
          tabBarStyle: {
            display: 'flex',
            backgroundColor: isDarkColorScheme ? '#1C2128' : '#FFFFFF',
            borderTopColor: isDarkColorScheme ? '#30363D' : '#E5E7EB',
            borderTopWidth: 1,
            height: Platform.OS === 'ios' ? 52 + insets.bottom : 60 + insets.bottom,
          },
        });
      }
    };
  }, [navigation, isDarkColorScheme, insets.bottom]);

  // Rest of component...
}
```

---

## 🔴 BUG #7: iOS Compatibility

### Question: Will App Work on Apple/iOS?

**Answer: YES, but with conditions:**

✅ **What Works:**
- Basic app functionality
- Firebase Auth (Email + Apple Sign-In)
- Stream Video SDK
- Stream Chat SDK
- Push notifications (with proper APNs certificates)
- Navigation (Expo Router)
- UI components

⚠️ **What Needs Configuration:**

**1. Apple Developer Account Required:**
- Enrollment: $99/year
- Need for TestFlight and App Store

**2. APNs Certificates:**
```json
// app.json already configured:
"ios": {
  "bundleIdentifier": "com.akashmahlax.streams",
  "entitlements": {
    "aps-environment": "production" ✅
  }
}
```

You need to:
1. Create APNs certificate in Apple Developer Console
2. Upload to Firebase Console (Cloud Messaging → iOS config)
3. Update `STREAM_VIDEO_IOS_PUSH_NAME` in `lib/videoPushConfig.ts`

**3. CallKit Configuration:**
Already configured in `app.json`:
```json
"plugins": [
  "@config-plugins/react-native-callkeep" ✅
]
```

**4. Camera/Mic Permissions:**
Already configured:
```json
"NSCameraUsageDescription": "This app needs access to camera for video calls" ✅
"NSMicrophoneUsageDescription": "This app needs access to microphone..." ✅
```

**5. App Store Review Considerations:**
- ✅ Privacy Policy (already have: PRIVACY_POLICY.md)
- ✅ Terms of Service (already have: TERMS_OF_SERVICE.md)
- ⚠️ Need to explain why app needs camera/microphone in review notes
- ⚠️ Must demonstrate mental health professional verification process
- ⚠️ May need health data disclaimer

### iOS Build Commands:
```bash
# Development build
npx expo run:ios

# Production build
eas build --platform ios --profile production
```

**VERDICT:** ✅ **App WILL work on iOS** with proper Apple Developer account and certificates.

---

## 🔴 BUG #8: Push Notifications Not Initialized

### Problem:
Push notification configuration exists but **NEVER CALLED** at app startup.

### Location:
`lib/videoPushConfig.ts` - Function `setupVideoPushConfig()` defined but never invoked

### Fix:
Create `index.js` at project root:

```javascript
// index.js
import 'expo-router/entry';
import { setupVideoPushConfig } from './lib/videoPushConfig';
import { setFirebaseListeners } from './lib/setFirebaseListeners';

// Initialize push notifications BEFORE app renders
setupVideoPushConfig();
setFirebaseListeners();
```

---

## 🔴 BUG #9: TypeScript Errors

### Current Errors:
1. `TAB_BAR_HIDING_SOLUTION.tsx` - Missing imports
2. `tsconfig.json` - Deprecated baseUrl warning
3. Admin panel - Tailwind class warning

### Fixes:
```json
// tsconfig.json - Add:
{
  "compilerOptions": {
    "ignoreDeprecations": "6.0" // Suppress baseUrl warning
  }
}
```

---

## 📊 TESTING CHECKLIST

After implementing all fixes:

### Call System:
- [ ] Incoming call plays ringtone (audio)
- [ ] Outgoing call plays ringback tone (audio)
- [ ] Ending call doesn't show "declined" message
- [ ] Call rejection shows proper message
- [ ] Call cleanup happens properly

### Authentication:
- [ ] Google Sign-In removed
- [ ] Email/Password sign-in works
- [ ] Apple Sign-In works (iOS only)

### Counsellor System:
- [ ] Only `verificationStatus === "verified"` counsellors show in bookings
- [ ] Pending counsellors don't show
- [ ] Rejected counsellors don't show
- [ ] Consistent checks across all pages

### UI/UX:
- [ ] Tab bar hides in chat conversations
- [ ] Tab bar shows on main screens
- [ ] No sound errors in console
- [ ] Haptic feedback works for UI interactions

### iOS:
- [ ] App builds for iOS
- [ ] Push notifications work on iOS (with APNs)
- [ ] Video calls work on iOS
- [ ] CallKit integration works

---

## 🎯 PRIORITY ORDER

1. **CRITICAL (Fix Immediately):**
   - Bug #2: Call sounds (user can't hear calls)
   - Bug #3: Counsellor approval (security issue)
   - Bug #8: Push notifications (calls won't ring in background)

2. **HIGH (Fix Soon):**
   - Bug #1: Call declined message (UX confusion)
   - Bug #5: Remove Google Sign-In (user request)
   - Bug #6: Tab bar hiding (UX polish)

3. **MEDIUM (Fix When Possible):**
   - Bug #4: Sound system cleanup (code quality)
   - Bug #7: iOS configuration (deployment blocker)
   - Bug #9: TypeScript errors (warnings)

---

## 📦 IMPLEMENTATION TIME ESTIMATES

| Bug | Fix Time | Testing Time |
|-----|----------|--------------|
| #1 Call declined | 15 min | 10 min |
| #2 Call sounds | 2 hours | 30 min |
| #3 Approval system | 1 hour | 20 min |
| #4 Sound cleanup | 3 hours | 1 hour |
| #5 Remove Google | 20 min | 10 min |
| #6 Tab bar hiding | 15 min | 5 min |
| #7 iOS config | 1 hour | 2 hours* |
| #8 Push init | 10 min | 30 min |
| #9 TS errors | 10 min | 5 min |

**Total:** ~8.5 hours development + 5 hours testing  
*iOS testing requires physical device + Apple Developer account

---

## 🔧 NEXT STEPS

1. Review this report
2. Prioritize which bugs to fix first
3. I can implement all fixes using `multi_replace_string_in_file`
4. Create audio files for ringtones
5. Test on both Android and iOS devices

**Ready to fix all bugs?** Let me know which ones to start with!
