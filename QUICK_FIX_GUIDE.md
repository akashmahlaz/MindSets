# Quick Fix Guide - Critical Issues

This guide provides immediate fixes for the most critical bugs identified in the analysis.

## 🔴 CRITICAL FIXES (Do First)

### 1. Fix Memory Leak in Call Screen

**File:** `app/call/[callId].tsx`

**Current Code (Lines 35-78):**
```typescript
useEffect(() => {
  // ... setup code
  return () => {
    if (call) {
      call.leave().catch(console.error);
    }
  };
}, [client, callId, callType, user?.uid]); // ❌ Missing 'call' dependency
```

**Fixed Code:**
```typescript
useEffect(() => {
  if (!client || !callId || !user) {
    setError("Missing client, call ID, or user");
    setIsLoading(false);
    return;
  }

  let mounted = true;
  const setupCall = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const callToSetup = client.call(callType, callId);
      await callToSetup.get();
      
      if (mounted) {
        setCall(callToSetup);
      }
    } catch (error) {
      if (mounted) {
        setError(error instanceof Error ? error.message : "Failed to setup call");
      }
    } finally {
      if (mounted) {
        setIsLoading(false);
      }
    }
  };

  setupCall();

  return () => {
    mounted = false;
    // Cleanup will be handled by the call event listeners
  };
}, [client, callId, callType, user?.uid]);
```

### 2. Fix ChatContext Memory Leak

**File:** `context/ChatContext.tsx`

**Current Code (Lines 133-141):**
```typescript
useEffect(() => {
  if (user && !isChatConnected && !isConnecting) {
    connectToChat().catch((error) => {
      console.error("Auto-connect to chat failed:", error);
    });
  } else if (!user && isChatConnected) {
    disconnectFromChat();
  }
}, [user?.uid]); // ❌ Missing dependencies
```

**Fixed Code:**
```typescript
useEffect(() => {
  if (user && !isChatConnected && !isConnecting) {
    connectToChat().catch((error) => {
      console.error("Auto-connect to chat failed:", error);
    });
  } else if (!user && isChatConnected) {
    disconnectFromChat();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [user?.uid, isChatConnected, isConnecting]);
```

### 3. Move API Keys to Environment Variables

**File:** `context/ChatContext.tsx`

**Current Code (Line 18):**
```typescript
const STREAM_API_KEY = "egq2n55kb4yn"; // ❌ Hardcoded
```

**Fixed Code:**
1. Create `.env` file:
```
EXPO_PUBLIC_STREAM_API_KEY=egq2n55kb4yn
EXPO_PUBLIC_GOOGLE_CLIENT_ID=84524660788-3unj4cgjivvh4jqj39o8aeae6tu41anm.apps.googleusercontent.com
```

2. Update code:
```typescript
const STREAM_API_KEY = process.env.EXPO_PUBLIC_STREAM_API_KEY || "";
if (!STREAM_API_KEY) {
  throw new Error("STREAM_API_KEY is not configured");
}
```

**File:** `app/(auth)/sign-in.tsx` (Line 48)
```typescript
const [_, __, promptAsync] = Google.useAuthRequest({
  clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "",
});
```

### 4. Fix Navigation Loop

**File:** `app/_layout.tsx`

**Current Code (Lines 139-145):**
```typescript
if (userProfile && !userProfile.isProfileComplete) {
  router.replace("/"); // ❌ Same route
} else {
  router.replace("/"); // ❌ Same route
}
```

**Fixed Code:**
```typescript
if (userProfile && !userProfile.isProfileComplete) {
  router.replace("/(main)/profile"); // Navigate to profile completion
} else if (user) {
  router.replace("/(main)"); // Navigate to main app
}
```

### 5. Add Error Handling to API Calls

**File:** `app/(main)/index.tsx`

**Current Code (Lines 43-57):**
```typescript
const fetchUsers = async () => {
  try {
    setLoading(true);
    if (!user?.uid) return;
    const allUsers = await getAllUsers(user.uid);
    const otherUsers = allUsers.filter((u) => u.uid !== user?.uid);
    setUsers(otherUsers);
    setFilteredUsers(otherUsers);
  } catch (fetchError) {
    console.error("Error fetching users:", fetchError);
    // ❌ No user feedback
  } finally {
    setLoading(false);
  }
};
```

**Fixed Code:**
```typescript
const fetchUsers = async () => {
  try {
    setLoading(true);
    if (!user?.uid) return;
    const allUsers = await getAllUsers(user.uid);
    const otherUsers = allUsers.filter((u) => u.uid !== user?.uid);
    setUsers(otherUsers);
    setFilteredUsers(otherUsers);
  } catch (fetchError) {
    console.error("Error fetching users:", fetchError);
    Alert.alert(
      "Error",
      "Failed to load users. Please check your connection and try again.",
      [{ text: "Retry", onPress: fetchUsers }, { text: "OK" }]
    );
  } finally {
    setLoading(false);
  }
};
```

### 6. Fix Type Safety Issues

**File:** `app/(main)/Counselors.tsx`

**Current Code (Line 34):**
```typescript
const userProfileData = userProfile as UserProfileData; // ❌ Unsafe cast
```

**Fixed Code:**
```typescript
const userProfileData = userProfile && 'primaryConcerns' in userProfile
  ? (userProfile as UserProfileData)
  : null;

// Then add null checks:
const filters = userProfileData?.primaryConcerns
  ? { specializations: userProfileData.primaryConcerns }
  : undefined;
```

### 7. Remove Debug Code

**File:** `app/(main)/index.tsx`

**Current Code (Lines 342-347):**
```typescript
<TouchableOpacity
  onPress={() => router.push("/(admin)")}
  className="p-2 rounded-full bg-blue-100 dark:bg-blue-900"
>
  <AntDesign name="user" size={20} color="#3B82F6" />
  <Text>admin</Text> {/* ❌ Debug text */}
</TouchableOpacity>
```

**Fixed Code:**
```typescript
{userProfile?.role === 'admin' && (
  <TouchableOpacity
    onPress={() => router.push("/(admin)")}
    className="p-2 rounded-full bg-blue-100 dark:bg-blue-900"
  >
    <Ionicons name="shield-checkmark" size={20} color="#3B82F6" />
  </TouchableOpacity>
)}
```

### 8. Add Performance Optimizations

**File:** `app/(main)/index.tsx`

**Add useMemo for filtering:**
```typescript
import { useMemo } from 'react';

// Replace useEffect with useMemo
const filteredUsers = useMemo(() => {
  if (!searchQuery.trim()) return users;
  return users.filter(
    (u) =>
      u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  );
}, [searchQuery, users]);
```

**Add React.memo for list items:**
```typescript
const UserItem = React.memo(({ item, onPress, onChat, onCall, onVideoCall }: Props) => (
  <TouchableOpacity onPress={() => onPress(item)} className="active:opacity-70">
    {/* ... component code */}
  </TouchableOpacity>
));
```

**Optimize FlatList:**
```typescript
<FlatList
  data={filteredUsers}
  renderItem={({ item }) => <UserItem item={item} {...handlers} />}
  keyExtractor={(item) => item.uid}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  initialNumToRender={10}
  windowSize={10}
/>
```

### 9. Create Logger Utility

**File:** `lib/logger.ts` (NEW FILE)
```typescript
const isDev = __DEV__;

export const logger = {
  log: (...args: any[]) => {
    if (isDev) console.log(...args);
  },
  error: (...args: any[]) => {
    console.error(...args);
    // In production, send to error tracking service
  },
  warn: (...args: any[]) => {
    if (isDev) console.warn(...args);
  },
  info: (...args: any[]) => {
    if (isDev) console.info(...args);
  },
};
```

**Then replace all console.log with logger.log:**
```typescript
// Before
console.log("Setting up call:", callId);

// After
import { logger } from "@/lib/logger";
logger.log("Setting up call:", callId);
```

### 10. Fix Session Join Implementation

**File:** `app/(main)/sessions.tsx`

**Current Code (Lines 119-128):**
```typescript
{
  text: "Video Call",
  onPress: () => {
    // TODO: Navigate to video call
    console.log("Starting video call for session:", session.id);
  },
},
```

**Fixed Code:**
```typescript
{
  text: "Video Call",
  onPress: () => {
    const callId = `session-${session.id}-${Date.now()}`;
    router.push({
      pathname: "/call/[callId]",
      params: {
        callId,
        callType: "default",
        isVideo: "true",
      },
    });
  },
},
{
  text: "Voice Call",
  onPress: () => {
    const callId = `session-${session.id}-${Date.now()}`;
    router.push({
      pathname: "/call/[callId]",
      params: {
        callId,
        callType: "default",
        isVideo: "false",
      },
    });
  },
},
```

---

## 🟡 HIGH PRIORITY FIXES

### 11. Add Constants File

**File:** `lib/constants.ts` (NEW FILE)
```typescript
// Timeouts
export const CONNECTION_TIMEOUT_MS = 2000;
export const SESSION_JOIN_BUFFER_MINUTES = 15;
export const CALL_AUTO_CANCEL_TIMEOUT_MS = 30000;
export const SEARCH_DEBOUNCE_MS = 300;

// Limits
export const MAX_RETRY_ATTEMPTS = 3;
export const LIST_PAGE_SIZE = 20;
```

**Then use in code:**
```typescript
import { CONNECTION_TIMEOUT_MS } from "@/lib/constants";

await new Promise((resolve) => setTimeout(resolve, CONNECTION_TIMEOUT_MS));
```

### 12. Add Shared Utilities

**File:** `lib/utils/statusColors.ts` (NEW FILE)
```typescript
export const getStatusColor = (status: string): string => {
  switch (status) {
    case "online":
      return "bg-green-500";
    case "away":
      return "bg-yellow-500";
    case "offline":
    default:
      return "bg-gray-400";
  }
};
```

**File:** `lib/utils/dateFormatting.ts` (NEW FILE)
```typescript
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
```

### 13. Add Error Boundary

**File:** `components/ErrorBoundary.tsx` (NEW FILE)
```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, Button } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    // Send to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
            Something went wrong
          </Text>
          <Text style={{ marginBottom: 20, textAlign: 'center' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <Button
            title="Try Again"
            onPress={() => this.setState({ hasError: false, error: null })}
          />
        </View>
      );
    }

    return this.props.children;
  }
}
```

**Add to `app/_layout.tsx`:**
```typescript
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* ... existing code */}
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
```

---

## ✅ Testing Checklist

After applying fixes, test:

- [ ] Memory leaks fixed (check with React DevTools Profiler)
- [ ] No console errors in production build
- [ ] Navigation works correctly
- [ ] Error messages display properly
- [ ] Performance improved (check render counts)
- [ ] TypeScript compiles without errors
- [ ] App doesn't crash on network errors
- [ ] Environment variables loaded correctly

---

## 📝 Notes

- Test each fix individually
- Create a feature branch for fixes
- Write tests for critical paths
- Monitor performance after changes
- Update documentation as needed

