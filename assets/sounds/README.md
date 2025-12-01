# Sound Assets for MindHeal

This folder contains audio files for the MindHeal wellness app.

## Required Sound Files

Add the following audio files to this folder:

### Meditation Sounds (Ambient/Looping)
- `meditation-calm.mp3` - Soft, peaceful ambient for stress relief
- `meditation-gratitude.mp3` - Warm, uplifting background
- `meditation-focus.mp3` - Concentration-enhancing ambient
- `meditation-sleep-prep.mp3` - Deeply relaxing pre-sleep ambient
- `meditation-body-scan.mp3` - Gentle waves for body awareness
- `meditation-morning.mp3` - Bright, awakening sounds
- `meditation-complete.mp3` - Completion chime (short, one-shot)

### Breathing Sounds (Short cues)
- `breathing-inhale.mp3` - Audio cue for inhaling (1-2 sec)
- `breathing-exhale.mp3` - Audio cue for exhaling (1-2 sec)
- `breathing-hold.mp3` - Audio cue for breath holding (1 sec)
- `breathing-bell.mp3` - Tibetan bell for transitions (2-3 sec)
- `breathing-ambient.mp3` - Soft background for exercises (looping)
- `breathing-complete.mp3` - Completion sound (2-3 sec)

### Sleep Sounds (Looping ambient)
- `sleep-rain.mp3` - Gentle rainfall (loop-able)
- `sleep-ocean.mp3` - Ocean waves (loop-able)
- `sleep-forest.mp3` - Forest night ambiance (loop-able)
- `sleep-white-noise.mp3` - White noise (loop-able)
- `sleep-thunderstorm.mp3` - Distant thunder with rain (loop-able)
- `sleep-piano.mp3` - Soft piano melodies (loop-able)

### UI Sounds (Minimal - use haptics for taps/typing)
- `ui-notification.mp3` - New notification alert
- `ui-message-received.mp3` - New chat message notification

**Note:** Button taps, typing, and success/error feedback use haptic feedback (`expo-haptics`) instead of audio files for a better native feel.

### Call Sounds
- `call-ringtone.mp3` - Incoming call ringtone (loop-able)
- `call-outgoing.mp3` - Outgoing call tone (loop-able)
- `call-connected.wav` - Call connection confirmation
- `call-ended.wav` - Call disconnection sound

### Session Sounds
- `session-start.mp3` - Therapy session beginning chime
- `session-end.mp3` - Therapy session ending chime
- `session-reminder.mp3` - Upcoming session reminder

### Achievement Sounds
- `goal-achieved.mp3` - Celebratory sound for achievements

## Recommended Sources for Royalty-Free Sounds

1. **Freesound.org** - Creative Commons licensed sounds
   - https://freesound.org

2. **Pixabay Sound Effects** - Free for commercial use
   - https://pixabay.com/sound-effects

3. **Mixkit** - Free license sounds
   - https://mixkit.co/free-sound-effects

4. **ZapSplat** - Royalty-free sound effects
   - https://www.zapsplat.com

## Audio Format Recommendations

### For Ambient/Background Sounds (meditation, sleep)
- Format: MP3
- Bitrate: 128-192 kbps
- Sample Rate: 44.1 kHz
- Channels: Stereo
- Duration: 3-5 minutes (will loop)

### For UI Sounds (taps, notifications)
- Format: WAV or MP3
- Bitrate: 128 kbps
- Duration: < 1 second
- Keep file size under 100KB

### For Bell/Chime Sounds
- Format: MP3 or WAV
- Duration: 2-5 seconds
- Clear attack, natural decay

## Integration

After adding sound files, update the `getSoundSource` function in:
`lib/soundAssets.ts`

Example:
```typescript
export function getSoundSource(id: SoundId): AVPlaybackSource | null {
  const soundPaths: Partial<Record<SoundId, AVPlaybackSource>> = {
    [SOUND_IDS.MEDITATION_CALM]: require('@/assets/sounds/meditation-calm.mp3'),
    [SOUND_IDS.SLEEP_RAIN]: require('@/assets/sounds/sleep-rain.mp3'),
    // Add more sounds...
  };

  return soundPaths[id] ?? null;
}
```

## Testing

After adding sounds, test in the following screens:
1. Meditation (`/(resources)/meditation`)
2. Breathing (`/(resources)/breathing`)
3. Sleep (`/(resources)/sleep`)

Each screen has a sound toggle button in the active session header.
