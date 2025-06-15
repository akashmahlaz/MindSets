// Initialize push notifications for Stream Video
import { setPushConfig } from './setPushConfig';
import { setFirebaseListeners } from './setFirebaseListeners';

// Set up push notifications configuration
setPushConfig();

// Set up Firebase message listeners
setFirebaseListeners();

console.log('Push notifications initialized');
