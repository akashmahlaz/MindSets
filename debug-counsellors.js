// Debug script to check and fix counsellor verification status
// Run this in your app console or create a test file

import { debugCounsellorsVerification, fixTestCounsellors } from './services/userService';

export const runCounsellorDebug = async () => {
  console.log("🔍 Starting counsellor verification debug...");
  
  // First, check current status
  await debugCounsellorsVerification();
  
  // Ask if you want to fix test counsellors
  console.log("📝 To fix auto-approved test counsellors, run: fixTestCounsellors()");
};

export const fixAllTestCounsellors = async () => {
  console.log("🔧 Fixing auto-approved test counsellors...");
  await fixTestCounsellors();
  
  // Check status again
  console.log("🔍 Checking status after fix...");
  await debugCounsellorsVerification();
};

// Instructions:
// 1. Call runCounsellorDebug() to see current counsellors
// 2. Call fixAllTestCounsellors() to fix any auto-approved test counsellors
// 3. Counsellors should now require admin approval to appear in the app
