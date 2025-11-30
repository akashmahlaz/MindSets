/**
 * SoundService - Centralized audio management for MindHeal
 * 
 * This service handles all audio playback for:
 * - Meditation ambient sounds
 * - Breathing exercise audio cues
 * - Sleep sounds and music
 * - UI feedback sounds
 * - Notification sounds
 */

import { Audio, AVPlaybackSource, AVPlaybackStatus } from 'expo-av';

// Sound category types
export type SoundCategory = 
  | 'meditation'
  | 'breathing'
  | 'sleep'
  | 'notification'
  | 'ui';

// Individual sound definitions
export interface SoundDefinition {
  id: string;
  name: string;
  category: SoundCategory;
  source: AVPlaybackSource;
  loop: boolean;
  defaultVolume: number;
}

// Playback state
interface PlaybackState {
  sound: Audio.Sound | null;
  isPlaying: boolean;
  isLoaded: boolean;
  duration: number;
  position: number;
  volume: number;
}

class SoundService {
  private static instance: SoundService;
  private sounds: Map<string, Audio.Sound> = new Map();
  private playbackStates: Map<string, PlaybackState> = new Map();
  private currentAmbientSound: string | null = null;
  private isInitialized: boolean = false;
  private masterVolume: number = 1.0;
  private isMuted: boolean = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): SoundService {
    if (!SoundService.instance) {
      SoundService.instance = new SoundService();
    }
    return SoundService.instance;
  }

  /**
   * Initialize audio session with proper settings
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      this.isInitialized = true;
      console.log('[SoundService] Initialized successfully');
    } catch (error) {
      console.error('[SoundService] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Load a sound from a source
   */
  async loadSound(
    id: string, 
    source: AVPlaybackSource, 
    options: { loop?: boolean; volume?: number } = {}
  ): Promise<Audio.Sound | null> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Unload existing sound with same ID
      if (this.sounds.has(id)) {
        await this.unloadSound(id);
      }

      const { sound } = await Audio.Sound.createAsync(
        source,
        {
          shouldPlay: false,
          isLooping: options.loop ?? false,
          volume: (options.volume ?? 1.0) * this.masterVolume * (this.isMuted ? 0 : 1),
        },
        (status) => this.onPlaybackStatusUpdate(id, status)
      );

      this.sounds.set(id, sound);
      this.playbackStates.set(id, {
        sound,
        isPlaying: false,
        isLoaded: true,
        duration: 0,
        position: 0,
        volume: options.volume ?? 1.0,
      });

      console.log(`[SoundService] Loaded sound: ${id}`);
      return sound;
    } catch (error) {
      console.error(`[SoundService] Failed to load sound ${id}:`, error);
      return null;
    }
  }

  /**
   * Handle playback status updates
   */
  private onPlaybackStatusUpdate(id: string, status: AVPlaybackStatus): void {
    const state = this.playbackStates.get(id);
    if (!state) return;

    if (status.isLoaded) {
      state.isPlaying = status.isPlaying;
      state.position = status.positionMillis;
      state.duration = status.durationMillis ?? 0;
      
      // Handle playback finished
      if (status.didJustFinish && !status.isLooping) {
        this.onSoundFinished(id);
      }
    }
  }

  /**
   * Handle sound finished playing
   */
  private onSoundFinished(id: string): void {
    console.log(`[SoundService] Sound finished: ${id}`);
    // Could emit an event here for UI updates
  }

  /**
   * Play a loaded sound
   */
  async play(id: string, options: { fromStart?: boolean } = {}): Promise<void> {
    const sound = this.sounds.get(id);
    if (!sound) {
      console.warn(`[SoundService] Sound not loaded: ${id}`);
      return;
    }

    try {
      if (options.fromStart) {
        await sound.setPositionAsync(0);
      }
      await sound.playAsync();
      console.log(`[SoundService] Playing: ${id}`);
    } catch (error) {
      console.error(`[SoundService] Failed to play ${id}:`, error);
    }
  }

  /**
   * Pause a sound
   */
  async pause(id: string): Promise<void> {
    const sound = this.sounds.get(id);
    if (!sound) return;

    try {
      await sound.pauseAsync();
      console.log(`[SoundService] Paused: ${id}`);
    } catch (error) {
      console.error(`[SoundService] Failed to pause ${id}:`, error);
    }
  }

  /**
   * Stop a sound and reset position
   */
  async stop(id: string): Promise<void> {
    const sound = this.sounds.get(id);
    if (!sound) return;

    try {
      await sound.stopAsync();
      await sound.setPositionAsync(0);
      console.log(`[SoundService] Stopped: ${id}`);
    } catch (error) {
      console.error(`[SoundService] Failed to stop ${id}:`, error);
    }
  }

  /**
   * Set volume for a specific sound
   */
  async setVolume(id: string, volume: number): Promise<void> {
    const sound = this.sounds.get(id);
    const state = this.playbackStates.get(id);
    if (!sound || !state) return;

    const clampedVolume = Math.max(0, Math.min(1, volume));
    state.volume = clampedVolume;

    try {
      await sound.setVolumeAsync(clampedVolume * this.masterVolume * (this.isMuted ? 0 : 1));
    } catch (error) {
      console.error(`[SoundService] Failed to set volume for ${id}:`, error);
    }
  }

  /**
   * Set master volume for all sounds
   */
  async setMasterVolume(volume: number): Promise<void> {
    this.masterVolume = Math.max(0, Math.min(1, volume));

    // Update all loaded sounds
    for (const [id, sound] of this.sounds) {
      const state = this.playbackStates.get(id);
      if (state) {
        try {
          await sound.setVolumeAsync(state.volume * this.masterVolume * (this.isMuted ? 0 : 1));
        } catch (error) {
          console.error(`[SoundService] Failed to update volume for ${id}:`, error);
        }
      }
    }
  }

  /**
   * Toggle mute for all sounds
   */
  async toggleMute(): Promise<boolean> {
    this.isMuted = !this.isMuted;

    // Update all loaded sounds
    for (const [id, sound] of this.sounds) {
      const state = this.playbackStates.get(id);
      if (state) {
        try {
          await sound.setVolumeAsync(state.volume * this.masterVolume * (this.isMuted ? 0 : 1));
        } catch (error) {
          console.error(`[SoundService] Failed to toggle mute for ${id}:`, error);
        }
      }
    }

    return this.isMuted;
  }

  /**
   * Get mute state
   */
  getMuteState(): boolean {
    return this.isMuted;
  }

  /**
   * Seek to position in sound
   */
  async seekTo(id: string, positionMillis: number): Promise<void> {
    const sound = this.sounds.get(id);
    if (!sound) return;

    try {
      await sound.setPositionAsync(positionMillis);
    } catch (error) {
      console.error(`[SoundService] Failed to seek ${id}:`, error);
    }
  }

  /**
   * Get playback state for a sound
   */
  getPlaybackState(id: string): PlaybackState | null {
    return this.playbackStates.get(id) ?? null;
  }

  /**
   * Check if a sound is currently playing
   */
  isPlaying(id: string): boolean {
    return this.playbackStates.get(id)?.isPlaying ?? false;
  }

  /**
   * Unload a specific sound
   */
  async unloadSound(id: string): Promise<void> {
    const sound = this.sounds.get(id);
    if (!sound) return;

    try {
      await sound.unloadAsync();
      this.sounds.delete(id);
      this.playbackStates.delete(id);
      
      if (this.currentAmbientSound === id) {
        this.currentAmbientSound = null;
      }
      
      console.log(`[SoundService] Unloaded: ${id}`);
    } catch (error) {
      console.error(`[SoundService] Failed to unload ${id}:`, error);
    }
  }

  /**
   * Unload all sounds
   */
  async unloadAll(): Promise<void> {
    for (const id of this.sounds.keys()) {
      await this.unloadSound(id);
    }
  }

  /**
   * Play ambient sound (stops any currently playing ambient)
   */
  async playAmbient(
    id: string, 
    source: AVPlaybackSource, 
    options: { fadeIn?: boolean; volume?: number } = {}
  ): Promise<void> {
    // Stop current ambient sound
    if (this.currentAmbientSound && this.currentAmbientSound !== id) {
      if (options.fadeIn) {
        await this.fadeOut(this.currentAmbientSound, 500);
      }
      await this.stop(this.currentAmbientSound);
    }

    // Load and play new ambient sound
    await this.loadSound(id, source, { loop: true, volume: options.volume ?? 0.7 });
    
    if (options.fadeIn) {
      await this.setVolume(id, 0);
      await this.play(id);
      await this.fadeIn(id, options.volume ?? 0.7, 1000);
    } else {
      await this.play(id);
    }

    this.currentAmbientSound = id;
  }

  /**
   * Stop ambient sound
   */
  async stopAmbient(options: { fadeOut?: boolean } = {}): Promise<void> {
    if (!this.currentAmbientSound) return;

    if (options.fadeOut) {
      await this.fadeOut(this.currentAmbientSound, 500);
    }
    await this.stop(this.currentAmbientSound);
    await this.unloadSound(this.currentAmbientSound);
    this.currentAmbientSound = null;
  }

  /**
   * Fade in a sound
   */
  async fadeIn(id: string, targetVolume: number = 1, durationMs: number = 1000): Promise<void> {
    const sound = this.sounds.get(id);
    if (!sound) return;

    const steps = 20;
    const stepDuration = durationMs / steps;
    const volumeStep = targetVolume / steps;

    for (let i = 0; i <= steps; i++) {
      await this.setVolume(id, volumeStep * i);
      await new Promise(resolve => setTimeout(resolve, stepDuration));
    }
  }

  /**
   * Fade out a sound
   */
  async fadeOut(id: string, durationMs: number = 1000): Promise<void> {
    const state = this.playbackStates.get(id);
    if (!state) return;

    const startVolume = state.volume;
    const steps = 20;
    const stepDuration = durationMs / steps;
    const volumeStep = startVolume / steps;

    for (let i = steps; i >= 0; i--) {
      await this.setVolume(id, volumeStep * i);
      await new Promise(resolve => setTimeout(resolve, stepDuration));
    }
  }

  /**
   * Play a one-shot UI sound
   */
  async playUISound(source: AVPlaybackSource, volume: number = 0.5): Promise<void> {
    try {
      const { sound } = await Audio.Sound.createAsync(
        source,
        { shouldPlay: true, volume: volume * this.masterVolume * (this.isMuted ? 0 : 1) }
      );
      
      // Auto-unload after playing
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error('[SoundService] Failed to play UI sound:', error);
    }
  }

  /**
   * Preload commonly used sounds for faster playback
   */
  async preloadCommonSounds(): Promise<void> {
    // This will be populated when sound assets are added
    // Example:
    // await this.loadSound('button-tap', require('@/assets/sounds/button-tap.mp3'));
    // await this.loadSound('success', require('@/assets/sounds/success.mp3'));
    console.log('[SoundService] Preloading common sounds...');
  }
}

// Export singleton instance
export const soundService = SoundService.getInstance();

// Export convenience functions
export const initializeSound = () => soundService.initialize();
export const loadSound = (id: string, source: AVPlaybackSource, options?: { loop?: boolean; volume?: number }) => 
  soundService.loadSound(id, source, options);
export const playSound = (id: string, options?: { fromStart?: boolean }) => 
  soundService.play(id, options);
export const pauseSound = (id: string) => soundService.pause(id);
export const stopSound = (id: string) => soundService.stop(id);
export const setVolume = (id: string, volume: number) => soundService.setVolume(id, volume);
export const setMasterVolume = (volume: number) => soundService.setMasterVolume(volume);
export const toggleMute = () => soundService.toggleMute();
export const getMuteState = () => soundService.getMuteState();
export const seekTo = (id: string, positionMillis: number) => soundService.seekTo(id, positionMillis);
export const getPlaybackState = (id: string) => soundService.getPlaybackState(id);
export const isPlaying = (id: string) => soundService.isPlaying(id);
export const unloadSound = (id: string) => soundService.unloadSound(id);
export const unloadAllSounds = () => soundService.unloadAll();
export const playAmbient = (id: string, source: AVPlaybackSource, options?: { fadeIn?: boolean; volume?: number }) => 
  soundService.playAmbient(id, source, options);
export const stopAmbient = (options?: { fadeOut?: boolean }) => soundService.stopAmbient(options);
export const fadeIn = (id: string, targetVolume?: number, durationMs?: number) => 
  soundService.fadeIn(id, targetVolume, durationMs);
export const fadeOut = (id: string, durationMs?: number) => soundService.fadeOut(id, durationMs);
export const playUISound = (source: AVPlaybackSource, volume?: number) => 
  soundService.playUISound(source, volume);
