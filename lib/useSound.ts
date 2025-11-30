/**
 * useSound - Custom hook for sound playback in React components
 * 
 * This hook provides a simple interface for playing sounds in React Native components
 * with proper cleanup on unmount.
 */

import { AVPlaybackSource } from 'expo-av';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    fadeIn,
    fadeOut,
    getPlaybackState,
    loadSound,
    pauseSound,
    playAmbient,
    playSound,
    playUISound,
    seekTo,
    setVolume,
    stopAmbient,
    stopSound,
    unloadSound,
} from './SoundService';
import { getSoundSource, SOUND_META, SoundId } from './soundAssets';

interface UseSoundOptions {
  loop?: boolean;
  volume?: number;
  autoPlay?: boolean;
}

interface UseSoundReturn {
  play: (fromStart?: boolean) => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  seekTo: (positionMs: number) => Promise<void>;
  fadeIn: (targetVolume?: number, durationMs?: number) => Promise<void>;
  fadeOut: (durationMs?: number) => Promise<void>;
  isPlaying: boolean;
  isLoaded: boolean;
  duration: number;
  position: number;
  error: Error | null;
}

/**
 * Hook for playing a single sound
 */
export function useSound(
  source: AVPlaybackSource | null,
  options: UseSoundOptions = {}
): UseSoundReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  
  const soundId = useRef(`sound-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const isMounted = useRef(true);

  // Initialize and optionally autoplay
  useEffect(() => {
    isMounted.current = true;

    const initSound = async () => {
      if (!source) {
        setIsLoaded(false);
        return;
      }

      try {
        await loadSound(soundId.current, source, {
          loop: options.loop ?? false,
          volume: options.volume ?? 1,
        });
        
        if (isMounted.current) {
          setIsLoaded(true);
          setError(null);
          
          if (options.autoPlay) {
            await playSound(soundId.current);
            setIsPlaying(true);
          }
        }
      } catch (err) {
        if (isMounted.current) {
          setError(err as Error);
          setIsLoaded(false);
        }
      }
    };

    initSound();

    // Capture current ref value for cleanup
    const currentSoundId = soundId.current;
    return () => {
      isMounted.current = false;
      unloadSound(currentSoundId);
    };
  }, [source, options.loop, options.volume, options.autoPlay]);

  // Update playback state periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const state = getPlaybackState(soundId.current);
      if (state && isMounted.current) {
        setIsPlaying(state.isPlaying);
        setDuration(state.duration);
        setPosition(state.position);
      }
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const play = useCallback(async (fromStart = false) => {
    try {
      await playSound(soundId.current, { fromStart });
      setIsPlaying(true);
    } catch (err) {
      setError(err as Error);
    }
  }, []);

  const pause = useCallback(async () => {
    try {
      await pauseSound(soundId.current);
      setIsPlaying(false);
    } catch (err) {
      setError(err as Error);
    }
  }, []);

  const stop = useCallback(async () => {
    try {
      await stopSound(soundId.current);
      setIsPlaying(false);
      setPosition(0);
    } catch (err) {
      setError(err as Error);
    }
  }, []);

  const setVol = useCallback(async (volume: number) => {
    try {
      await setVolume(soundId.current, volume);
    } catch (err) {
      setError(err as Error);
    }
  }, []);

  const seek = useCallback(async (positionMs: number) => {
    try {
      await seekTo(soundId.current, positionMs);
      setPosition(positionMs);
    } catch (err) {
      setError(err as Error);
    }
  }, []);

  const fadeInSound = useCallback(async (targetVolume = 1, durationMs = 1000) => {
    try {
      await fadeIn(soundId.current, targetVolume, durationMs);
    } catch (err) {
      setError(err as Error);
    }
  }, []);

  const fadeOutSound = useCallback(async (durationMs = 1000) => {
    try {
      await fadeOut(soundId.current, durationMs);
    } catch (err) {
      setError(err as Error);
    }
  }, []);

  return {
    play,
    pause,
    stop,
    setVolume: setVol,
    seekTo: seek,
    fadeIn: fadeInSound,
    fadeOut: fadeOutSound,
    isPlaying,
    isLoaded,
    duration,
    position,
    error,
  };
}

/**
 * Hook for playing a sound by its ID from the sound assets
 */
export function useSoundById(
  soundId: SoundId,
  options: UseSoundOptions = {}
): UseSoundReturn & { isAvailable: boolean } {
  const source = getSoundSource(soundId);
  const meta = SOUND_META[soundId];
  
  const sound = useSound(source, {
    loop: options.loop ?? meta?.loop ?? false,
    volume: options.volume ?? meta?.defaultVolume ?? 1,
    autoPlay: options.autoPlay,
  });

  return {
    ...sound,
    isAvailable: source !== null,
  };
}

/**
 * Hook for ambient sounds (looping background audio)
 */
export function useAmbientSound(
  source: AVPlaybackSource | null,
  options: { volume?: number; fadeOnChange?: boolean } = {}
) {
  const [isPlaying, setIsPlaying] = useState(false);
  const isMounted = useRef(true);
  const ambientId = useRef(`ambient-${Date.now()}`);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      stopAmbient({ fadeOut: true });
    };
  }, []);

  const play = useCallback(async () => {
    if (!source) return;
    
    try {
      await playAmbient(ambientId.current, source, {
        fadeIn: options.fadeOnChange ?? true,
        volume: options.volume ?? 0.7,
      });
      if (isMounted.current) {
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Failed to play ambient sound:', error);
    }
  }, [source, options.fadeOnChange, options.volume]);

  const stop = useCallback(async () => {
    try {
      await stopAmbient({ fadeOut: options.fadeOnChange ?? true });
      if (isMounted.current) {
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Failed to stop ambient sound:', error);
    }
  }, [options.fadeOnChange]);

  const toggle = useCallback(async () => {
    if (isPlaying) {
      await stop();
    } else {
      await play();
    }
  }, [isPlaying, play, stop]);

  return {
    play,
    stop,
    toggle,
    isPlaying,
    isAvailable: source !== null,
  };
}

/**
 * Hook for UI sounds (one-shot, non-blocking)
 */
export function useUISound() {
  const playTap = useCallback(async () => {
    const source = getSoundSource('ui-button-tap' as SoundId);
    if (source) {
      await playUISound(source, 0.3);
    }
  }, []);

  const playSuccess = useCallback(async () => {
    const source = getSoundSource('ui-success' as SoundId);
    if (source) {
      await playUISound(source, 0.5);
    }
  }, []);

  const playError = useCallback(async () => {
    const source = getSoundSource('ui-error' as SoundId);
    if (source) {
      await playUISound(source, 0.4);
    }
  }, []);

  const playNotification = useCallback(async () => {
    const source = getSoundSource('ui-notification' as SoundId);
    if (source) {
      await playUISound(source, 0.6);
    }
  }, []);

  const playMessageSent = useCallback(async () => {
    const source = getSoundSource('ui-message-sent' as SoundId);
    if (source) {
      await playUISound(source, 0.4);
    }
  }, []);

  const playMessageReceived = useCallback(async () => {
    const source = getSoundSource('ui-message-received' as SoundId);
    if (source) {
      await playUISound(source, 0.5);
    }
  }, []);

  const playCustom = useCallback(async (source: AVPlaybackSource, volume = 0.5) => {
    await playUISound(source, volume);
  }, []);

  return {
    playTap,
    playSuccess,
    playError,
    playNotification,
    playMessageSent,
    playMessageReceived,
    playCustom,
  };
}

/**
 * Hook for meditation sounds with session tracking
 */
export function useMeditationSound(sessionType: string) {
  const [isActive, setIsActive] = useState(false);
  const [currentSound, setCurrentSound] = useState<string | null>(null);
  const sessionIdRef = useRef(`meditation-${sessionType}-${Date.now()}`);

  // Map session types to sound IDs
  const soundMap: Record<string, SoundId> = {
    'calm': 'meditation-calm' as SoundId,
    'gratitude': 'meditation-gratitude' as SoundId,
    'focus': 'meditation-focus' as SoundId,
    'sleep': 'meditation-sleep-prep' as SoundId,
    'body-scan': 'meditation-body-scan' as SoundId,
    'morning': 'meditation-morning' as SoundId,
  };

  const soundId = soundMap[sessionType] ?? ('meditation-calm' as SoundId);
  const source = getSoundSource(soundId);

  useEffect(() => {
    return () => {
      if (currentSound) {
        stopAmbient({ fadeOut: true });
      }
    };
  }, [currentSound]);

  const startSession = useCallback(async () => {
    if (!source) {
      console.warn('Sound not available for session type:', sessionType);
      setIsActive(true); // Still allow session without sound
      return;
    }

    try {
      await playAmbient(sessionIdRef.current, source, {
        fadeIn: true,
        volume: SOUND_META[soundId]?.defaultVolume ?? 0.5,
      });
      setCurrentSound(sessionIdRef.current);
      setIsActive(true);
    } catch (error) {
      console.error('Failed to start meditation sound:', error);
      setIsActive(true); // Allow session without sound
    }
  }, [source, sessionType, soundId]);

  const endSession = useCallback(async () => {
    try {
      await stopAmbient({ fadeOut: true });
      
      // Play completion sound
      const completionSource = getSoundSource('meditation-complete' as SoundId);
      if (completionSource) {
        await playUISound(completionSource, 0.7);
      }
      
      setCurrentSound(null);
      setIsActive(false);
    } catch (error) {
      console.error('Failed to end meditation sound:', error);
      setIsActive(false);
    }
  }, []);

  const pauseSession = useCallback(async () => {
    if (currentSound) {
      await fadeOut(sessionIdRef.current, 500);
    }
  }, [currentSound]);

  const resumeSession = useCallback(async () => {
    if (currentSound && source) {
      await fadeIn(sessionIdRef.current, SOUND_META[soundId]?.defaultVolume ?? 0.5, 500);
    }
  }, [currentSound, source, soundId]);

  return {
    startSession,
    endSession,
    pauseSession,
    resumeSession,
    isActive,
    isSoundAvailable: source !== null,
  };
}

/**
 * Hook for breathing exercise sounds
 */
export function useBreathingSound() {
  const playInhale = useCallback(async () => {
    const source = getSoundSource('breathing-inhale' as SoundId);
    if (source) {
      await playUISound(source, 0.6);
    }
  }, []);

  const playExhale = useCallback(async () => {
    const source = getSoundSource('breathing-exhale' as SoundId);
    if (source) {
      await playUISound(source, 0.6);
    }
  }, []);

  const playHold = useCallback(async () => {
    const source = getSoundSource('breathing-hold' as SoundId);
    if (source) {
      await playUISound(source, 0.5);
    }
  }, []);

  const playBell = useCallback(async () => {
    const source = getSoundSource('breathing-bell' as SoundId);
    if (source) {
      await playUISound(source, 0.7);
    }
  }, []);

  const playComplete = useCallback(async () => {
    const source = getSoundSource('breathing-complete' as SoundId);
    if (source) {
      await playUISound(source, 0.7);
    }
  }, []);

  return {
    playInhale,
    playExhale,
    playHold,
    playBell,
    playComplete,
  };
}

/**
 * Hook for sleep sounds
 */
export function useSleepSound(soundType: string) {
  const soundMap: Record<string, SoundId> = {
    'rain': 'sleep-rain' as SoundId,
    'ocean': 'sleep-ocean' as SoundId,
    'forest': 'sleep-forest' as SoundId,
    'white-noise': 'sleep-white-noise' as SoundId,
    'thunderstorm': 'sleep-thunderstorm' as SoundId,
    'piano': 'sleep-piano' as SoundId,
  };

  const soundId = soundMap[soundType] ?? ('sleep-rain' as SoundId);
  const source = getSoundSource(soundId);

  return useAmbientSound(source, {
    volume: SOUND_META[soundId]?.defaultVolume ?? 0.6,
    fadeOnChange: true,
  });
}
