/**
 * Sound Assets Configuration
 * 
 * This file defines all sound assets used in the MindHeal app.
 * 
 * IMPORTANT: You need to add the actual audio files to the assets/sounds folder.
 * Recommended sources for royalty-free sounds:
 * - https://freesound.org (Creative Commons)
 * - https://pixabay.com/sound-effects (Free for commercial use)
 * - https://mixkit.co/free-sound-effects (Free license)
 * - https://www.zapsplat.com (Royalty-free)
 * 
 * Recommended audio formats:
 * - MP3: Good compression, widely supported
 * - M4A/AAC: Better quality at same file size
 * - WAV: Lossless but larger files (best for short UI sounds)
 * 
 * For meditation/sleep sounds: MP3 at 128-192kbps is ideal
 * For UI sounds: WAV or MP3 at 128kbps, keep files under 100KB
 */

import { AVPlaybackSource } from 'expo-av';

// Sound asset IDs - use these to reference sounds throughout the app
export const SOUND_IDS = {
  // === MEDITATION SOUNDS ===
  MEDITATION_CALM: 'meditation-calm',
  MEDITATION_GRATITUDE: 'meditation-gratitude',
  MEDITATION_FOCUS: 'meditation-focus',
  MEDITATION_SLEEP_PREP: 'meditation-sleep-prep',
  MEDITATION_BODY_SCAN: 'meditation-body-scan',
  MEDITATION_MORNING: 'meditation-morning',
  
  // === BREATHING SOUNDS ===
  BREATHING_INHALE: 'breathing-inhale',
  BREATHING_EXHALE: 'breathing-exhale',
  BREATHING_HOLD: 'breathing-hold',
  BREATHING_BELL: 'breathing-bell',
  BREATHING_AMBIENT: 'breathing-ambient',
  
  // === SLEEP SOUNDS ===
  SLEEP_RAIN: 'sleep-rain',
  SLEEP_OCEAN: 'sleep-ocean',
  SLEEP_FOREST: 'sleep-forest',
  SLEEP_WHITE_NOISE: 'sleep-white-noise',
  SLEEP_THUNDERSTORM: 'sleep-thunderstorm',
  SLEEP_PIANO: 'sleep-piano',
  
  // === UI SOUNDS ===
  UI_BUTTON_TAP: 'ui-button-tap',
  UI_SUCCESS: 'ui-success',
  UI_ERROR: 'ui-error',
  UI_NOTIFICATION: 'ui-notification',
  UI_MESSAGE_SENT: 'ui-message-sent',
  UI_MESSAGE_RECEIVED: 'ui-message-received',
  
  // === CALL SOUNDS ===
  CALL_RINGTONE: 'call-ringtone',
  CALL_OUTGOING: 'call-outgoing',
  CALL_CONNECTED: 'call-connected',
  CALL_ENDED: 'call-ended',
  
  // === SESSION SOUNDS ===
  SESSION_START: 'session-start',
  SESSION_END: 'session-end',
  SESSION_REMINDER: 'session-reminder',
  
  // === COMPLETION SOUNDS ===
  MEDITATION_COMPLETE: 'meditation-complete',
  BREATHING_COMPLETE: 'breathing-complete',
  GOAL_ACHIEVED: 'goal-achieved',
} as const;

export type SoundId = typeof SOUND_IDS[keyof typeof SOUND_IDS];

// Sound metadata for UI display
export interface SoundMeta {
  id: SoundId;
  name: string;
  description: string;
  category: 'meditation' | 'breathing' | 'sleep' | 'ui' | 'call' | 'session';
  duration?: number; // in seconds, for ambient sounds
  loop: boolean;
  defaultVolume: number;
}

// Define sound metadata
export const SOUND_META: Record<SoundId, SoundMeta> = {
  // Meditation
  [SOUND_IDS.MEDITATION_CALM]: {
    id: SOUND_IDS.MEDITATION_CALM,
    name: 'Calm Ambient',
    description: 'Soft, peaceful background for meditation',
    category: 'meditation',
    loop: true,
    defaultVolume: 0.5,
  },
  [SOUND_IDS.MEDITATION_GRATITUDE]: {
    id: SOUND_IDS.MEDITATION_GRATITUDE,
    name: 'Gratitude Melody',
    description: 'Warm, uplifting background',
    category: 'meditation',
    loop: true,
    defaultVolume: 0.5,
  },
  [SOUND_IDS.MEDITATION_FOCUS]: {
    id: SOUND_IDS.MEDITATION_FOCUS,
    name: 'Focus Drone',
    description: 'Concentration-enhancing ambient',
    category: 'meditation',
    loop: true,
    defaultVolume: 0.4,
  },
  [SOUND_IDS.MEDITATION_SLEEP_PREP]: {
    id: SOUND_IDS.MEDITATION_SLEEP_PREP,
    name: 'Sleep Preparation',
    description: 'Deeply relaxing pre-sleep ambient',
    category: 'meditation',
    loop: true,
    defaultVolume: 0.5,
  },
  [SOUND_IDS.MEDITATION_BODY_SCAN]: {
    id: SOUND_IDS.MEDITATION_BODY_SCAN,
    name: 'Body Scan',
    description: 'Gentle waves for body awareness',
    category: 'meditation',
    loop: true,
    defaultVolume: 0.4,
  },
  [SOUND_IDS.MEDITATION_MORNING]: {
    id: SOUND_IDS.MEDITATION_MORNING,
    name: 'Morning Energy',
    description: 'Bright, awakening sounds',
    category: 'meditation',
    loop: true,
    defaultVolume: 0.5,
  },

  // Breathing
  [SOUND_IDS.BREATHING_INHALE]: {
    id: SOUND_IDS.BREATHING_INHALE,
    name: 'Inhale Cue',
    description: 'Audio cue for inhaling',
    category: 'breathing',
    loop: false,
    defaultVolume: 0.6,
  },
  [SOUND_IDS.BREATHING_EXHALE]: {
    id: SOUND_IDS.BREATHING_EXHALE,
    name: 'Exhale Cue',
    description: 'Audio cue for exhaling',
    category: 'breathing',
    loop: false,
    defaultVolume: 0.6,
  },
  [SOUND_IDS.BREATHING_HOLD]: {
    id: SOUND_IDS.BREATHING_HOLD,
    name: 'Hold Cue',
    description: 'Audio cue for breath holding',
    category: 'breathing',
    loop: false,
    defaultVolume: 0.5,
  },
  [SOUND_IDS.BREATHING_BELL]: {
    id: SOUND_IDS.BREATHING_BELL,
    name: 'Tibetan Bell',
    description: 'Meditation bell for transitions',
    category: 'breathing',
    loop: false,
    defaultVolume: 0.7,
  },
  [SOUND_IDS.BREATHING_AMBIENT]: {
    id: SOUND_IDS.BREATHING_AMBIENT,
    name: 'Breathing Ambient',
    description: 'Soft background for breathing exercises',
    category: 'breathing',
    loop: true,
    defaultVolume: 0.3,
  },

  // Sleep sounds
  [SOUND_IDS.SLEEP_RAIN]: {
    id: SOUND_IDS.SLEEP_RAIN,
    name: 'Gentle Rain',
    description: 'Soft rainfall for peaceful sleep',
    category: 'sleep',
    duration: 3600,
    loop: true,
    defaultVolume: 0.6,
  },
  [SOUND_IDS.SLEEP_OCEAN]: {
    id: SOUND_IDS.SLEEP_OCEAN,
    name: 'Ocean Waves',
    description: 'Calming waves on a peaceful shore',
    category: 'sleep',
    duration: 3600,
    loop: true,
    defaultVolume: 0.6,
  },
  [SOUND_IDS.SLEEP_FOREST]: {
    id: SOUND_IDS.SLEEP_FOREST,
    name: 'Forest Night',
    description: 'Crickets and gentle forest ambiance',
    category: 'sleep',
    duration: 3600,
    loop: true,
    defaultVolume: 0.5,
  },
  [SOUND_IDS.SLEEP_WHITE_NOISE]: {
    id: SOUND_IDS.SLEEP_WHITE_NOISE,
    name: 'White Noise',
    description: 'Constant calming background noise',
    category: 'sleep',
    duration: 3600,
    loop: true,
    defaultVolume: 0.5,
  },
  [SOUND_IDS.SLEEP_THUNDERSTORM]: {
    id: SOUND_IDS.SLEEP_THUNDERSTORM,
    name: 'Distant Thunder',
    description: 'Far-away storm with gentle rain',
    category: 'sleep',
    duration: 3600,
    loop: true,
    defaultVolume: 0.5,
  },
  [SOUND_IDS.SLEEP_PIANO]: {
    id: SOUND_IDS.SLEEP_PIANO,
    name: 'Soft Piano',
    description: 'Gentle piano melodies for rest',
    category: 'sleep',
    duration: 2700,
    loop: true,
    defaultVolume: 0.5,
  },

  // UI sounds
  [SOUND_IDS.UI_BUTTON_TAP]: {
    id: SOUND_IDS.UI_BUTTON_TAP,
    name: 'Button Tap',
    description: 'Soft tap feedback',
    category: 'ui',
    loop: false,
    defaultVolume: 0.3,
  },
  [SOUND_IDS.UI_SUCCESS]: {
    id: SOUND_IDS.UI_SUCCESS,
    name: 'Success',
    description: 'Positive confirmation sound',
    category: 'ui',
    loop: false,
    defaultVolume: 0.5,
  },
  [SOUND_IDS.UI_ERROR]: {
    id: SOUND_IDS.UI_ERROR,
    name: 'Error',
    description: 'Gentle error notification',
    category: 'ui',
    loop: false,
    defaultVolume: 0.4,
  },
  [SOUND_IDS.UI_NOTIFICATION]: {
    id: SOUND_IDS.UI_NOTIFICATION,
    name: 'Notification',
    description: 'New notification alert',
    category: 'ui',
    loop: false,
    defaultVolume: 0.6,
  },
  [SOUND_IDS.UI_MESSAGE_SENT]: {
    id: SOUND_IDS.UI_MESSAGE_SENT,
    name: 'Message Sent',
    description: 'Chat message sent confirmation',
    category: 'ui',
    loop: false,
    defaultVolume: 0.4,
  },
  [SOUND_IDS.UI_MESSAGE_RECEIVED]: {
    id: SOUND_IDS.UI_MESSAGE_RECEIVED,
    name: 'Message Received',
    description: 'New chat message notification',
    category: 'ui',
    loop: false,
    defaultVolume: 0.5,
  },

  // Call sounds
  [SOUND_IDS.CALL_RINGTONE]: {
    id: SOUND_IDS.CALL_RINGTONE,
    name: 'Incoming Call',
    description: 'Gentle ringtone for incoming calls',
    category: 'call',
    loop: true,
    defaultVolume: 0.8,
  },
  [SOUND_IDS.CALL_OUTGOING]: {
    id: SOUND_IDS.CALL_OUTGOING,
    name: 'Calling',
    description: 'Outgoing call ring tone',
    category: 'call',
    loop: true,
    defaultVolume: 0.6,
  },
  [SOUND_IDS.CALL_CONNECTED]: {
    id: SOUND_IDS.CALL_CONNECTED,
    name: 'Call Connected',
    description: 'Call connection confirmation',
    category: 'call',
    loop: false,
    defaultVolume: 0.5,
  },
  [SOUND_IDS.CALL_ENDED]: {
    id: SOUND_IDS.CALL_ENDED,
    name: 'Call Ended',
    description: 'Call disconnection sound',
    category: 'call',
    loop: false,
    defaultVolume: 0.5,
  },

  // Session sounds
  [SOUND_IDS.SESSION_START]: {
    id: SOUND_IDS.SESSION_START,
    name: 'Session Start',
    description: 'Therapy session beginning chime',
    category: 'session',
    loop: false,
    defaultVolume: 0.6,
  },
  [SOUND_IDS.SESSION_END]: {
    id: SOUND_IDS.SESSION_END,
    name: 'Session End',
    description: 'Therapy session ending chime',
    category: 'session',
    loop: false,
    defaultVolume: 0.6,
  },
  [SOUND_IDS.SESSION_REMINDER]: {
    id: SOUND_IDS.SESSION_REMINDER,
    name: 'Session Reminder',
    description: 'Upcoming session reminder',
    category: 'session',
    loop: false,
    defaultVolume: 0.7,
  },

  // Completion sounds
  [SOUND_IDS.MEDITATION_COMPLETE]: {
    id: SOUND_IDS.MEDITATION_COMPLETE,
    name: 'Meditation Complete',
    description: 'Gentle chime for meditation completion',
    category: 'meditation',
    loop: false,
    defaultVolume: 0.7,
  },
  [SOUND_IDS.BREATHING_COMPLETE]: {
    id: SOUND_IDS.BREATHING_COMPLETE,
    name: 'Breathing Complete',
    description: 'Completion sound for breathing exercises',
    category: 'breathing',
    loop: false,
    defaultVolume: 0.7,
  },
  [SOUND_IDS.GOAL_ACHIEVED]: {
    id: SOUND_IDS.GOAL_ACHIEVED,
    name: 'Goal Achieved',
    description: 'Celebratory sound for achievements',
    category: 'ui',
    loop: false,
    defaultVolume: 0.6,
  },
};

/**
 * Get sound source by ID
 * 
 * NOTE: This function will return the actual sound source once audio files are added.
 * For now, it returns placeholder paths. Replace these with actual require() statements
 * once you add the audio files to assets/sounds/
 * 
 * Example:
 * return require('@/assets/sounds/meditation-calm.mp3');
 */
export function getSoundSource(id: SoundId): AVPlaybackSource | null {
  // Placeholder - replace with actual sound files when added
  const soundPaths: Partial<Record<SoundId, AVPlaybackSource>> = {
    // Uncomment and add your sound files:
    // [SOUND_IDS.MEDITATION_CALM]: require('@/assets/sounds/meditation-calm.mp3'),
    // [SOUND_IDS.SLEEP_RAIN]: require('@/assets/sounds/rain.mp3'),
    // [SOUND_IDS.SLEEP_OCEAN]: require('@/assets/sounds/ocean-waves.mp3'),
    // [SOUND_IDS.UI_BUTTON_TAP]: require('@/assets/sounds/button-tap.wav'),
    // [SOUND_IDS.CALL_RINGTONE]: require('@/assets/sounds/ringtone.mp3'),
  };

  return soundPaths[id] ?? null;
}

/**
 * Check if a sound file exists
 */
export function isSoundAvailable(id: SoundId): boolean {
  return getSoundSource(id) !== null;
}

/**
 * Get all sounds in a category
 */
export function getSoundsByCategory(category: SoundMeta['category']): SoundMeta[] {
  return Object.values(SOUND_META).filter(sound => sound.category === category);
}

/**
 * File naming convention for sound assets:
 * 
 * Meditation:
 * - meditation-calm.mp3
 * - meditation-gratitude.mp3
 * - meditation-focus.mp3
 * - meditation-sleep-prep.mp3
 * - meditation-body-scan.mp3
 * - meditation-morning.mp3
 * - meditation-complete.mp3
 * 
 * Breathing:
 * - breathing-inhale.mp3
 * - breathing-exhale.mp3
 * - breathing-hold.mp3
 * - breathing-bell.mp3
 * - breathing-ambient.mp3
 * - breathing-complete.mp3
 * 
 * Sleep:
 * - sleep-rain.mp3
 * - sleep-ocean.mp3
 * - sleep-forest.mp3
 * - sleep-white-noise.mp3
 * - sleep-thunderstorm.mp3
 * - sleep-piano.mp3
 * 
 * UI:
 * - ui-button-tap.wav
 * - ui-success.wav
 * - ui-error.wav
 * - ui-notification.mp3
 * - ui-message-sent.wav
 * - ui-message-received.wav
 * 
 * Call:
 * - call-ringtone.mp3
 * - call-outgoing.mp3
 * - call-connected.wav
 * - call-ended.wav
 * 
 * Session:
 * - session-start.mp3
 * - session-end.mp3
 * - session-reminder.mp3
 * 
 * Completion:
 * - goal-achieved.mp3
 */
