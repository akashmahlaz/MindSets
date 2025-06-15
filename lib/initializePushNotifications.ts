// Initialize push notifications for Stream Video
import { setFirebaseListeners } from './setFirebaseListeners';
import { setPushConfig } from './setPushConfig';

// Set up push notifications configuration
setPushConfig();

// Set up Firebase message listeners
setFirebaseListeners();

console.log('Push notifications initialized');
