// index.js - App entry point with push notification initialization
import 'expo-router/entry';
import { setFirebaseListeners } from './lib/setFirebaseListeners';
import { setupVideoPushConfig } from './lib/videoPushConfig';

// Initialize push notifications BEFORE app renders
console.log('🔔 Initializing push notifications...');
try {
  setupVideoPushConfig();
  setFirebaseListeners();
  console.log('✅ Push notifications initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize push notifications:', error);
}
