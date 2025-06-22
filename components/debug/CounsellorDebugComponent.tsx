// Temporary debug component to fix counsellor verification
// Add this to any screen temporarily to debug and fix counsellors

import { debugCounsellorsVerification, fixTestCounsellors, getCounsellors } from '@/services/userService';
import React from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';

export default function CounsellorDebugComponent() {
  const checkCounsellors = async () => {
    console.log("=== Checking Current Counsellors ===");
    await debugCounsellorsVerification();
    
    const visible = await getCounsellors();
    console.log(`📱 Visible counsellors in app: ${visible.length}`);
    Alert.alert('Debug', `Check console. Found ${visible.length} visible counsellors`);
  };

  const fixCounsellors = async () => {
    console.log("=== Fixing Auto-Approved Counsellors ===");
    await fixTestCounsellors();
    Alert.alert('Fixed', 'Test counsellors have been reset to pending status');
  };

  const verifyFix = async () => {
    console.log("=== Verifying Fix ===");
    await debugCounsellorsVerification();
    
    const visible = await getCounsellors();
    console.log(`📱 Visible counsellors after fix: ${visible.length}`);
    Alert.alert('Verified', `After fix: ${visible.length} visible counsellors`);
  };

  return (
    <View style={{ padding: 20, backgroundColor: '#f5f5f5', margin: 20, borderRadius: 10 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>
        🔧 Counsellor Debug Tools
      </Text>
      
      <TouchableOpacity 
        style={{ backgroundColor: '#007AFF', padding: 12, borderRadius: 8, marginBottom: 10 }}
        onPress={checkCounsellors}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          1. Check Current Counsellors
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={{ backgroundColor: '#FF9500', padding: 12, borderRadius: 8, marginBottom: 10 }}
        onPress={fixCounsellors}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          2. Fix Auto-Approved Counsellors
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={{ backgroundColor: '#34C759', padding: 12, borderRadius: 8 }}
        onPress={verifyFix}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          3. Verify Fix
        </Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 12, color: '#666', marginTop: 10 }}>
        Check console logs for detailed output. Remove this component after debugging.
      </Text>
    </View>
  );
}
