/**
 * Patch script for stream-chat-react-native-core MessageInput.tsx
 * This fixes the keyboard overlap issue when edgeToEdgeEnabled is true
 * 
 * Run this after `bun install` via postinstall script
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(
  __dirname,
  '../node_modules/stream-chat-react-native-core/src/components/MessageInput/MessageInput.tsx'
);

console.log('🔧 Patching stream-chat-react-native-core for keyboard handling...');

if (!fs.existsSync(filePath)) {
  console.log('⚠️ MessageInput.tsx not found, skipping patch');
  process.exit(0);
}

let content = fs.readFileSync(filePath, 'utf8');

// Check if already patched
if (content.includes('KeyboardAvoidingView,')) {
  console.log('✅ Already patched, skipping');
  process.exit(0);
}

// 1. Add KeyboardAvoidingView and Platform to imports
content = content.replace(
  `import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  NativeSyntheticEvent,
  SafeAreaView,
  StyleSheet,
  TextInputFocusEventData,
  View,
} from 'react-native';`,
  `import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  NativeSyntheticEvent,
  Platform,
  SafeAreaView,
  StyleSheet,
  TextInputFocusEventData,
  View,
} from 'react-native';`
);

// 2. Change container padding
content = content.replace(
  `  container: {
    borderTopWidth: 1,
    padding: 10,
  },`,
  `  container: {
    borderTopWidth: 1,
    paddingTop: 10,
    paddingHorizontal: 10,
    paddingBottom: 0,
  },`
);

// 3. Wrap View in KeyboardAvoidingView (opening)
content = content.replace(
  `  return (
    <>
      <View
        onLayout={({`,
  `  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <View
          onLayout={({`
);

// 4. Close KeyboardAvoidingView before poll dialog
content = content.replace(
  `        </View>
      )}
      {showPollCreationDialog ? (`,
  `        </View>
      )}
      </KeyboardAvoidingView>
      {showPollCreationDialog ? (`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Patched stream-chat-react-native-core successfully!');

