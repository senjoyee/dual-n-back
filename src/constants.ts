import { GameMode, GameSettings } from './types';

// Default settings for the game when first loaded or reset
export const DEFAULT_SETTINGS: GameSettings = {
  gameMode: GameMode.Dual,    // Start with Dual mode
  nLevel: 2,                  // Default to 2-back
  stimulusDuration: 1500,     // 1.5 seconds presentation time
  interStimulusInterval: 2500, // 2.5 seconds between stimuli
  sessionDuration: 120,       // 2 minutes game duration
  visualMatchKey: 'a',       // Default key for visual match
  audioMatchKey: 'l',        // Default key for audio match
};

// The set of letters used for the audio stimuli
export const AUDIO_LETTERS: string[] = ['C', 'H', 'K', 'L', 'Q', 'R', 'S', 'T'];

// Grid dimensions
export const GRID_SIZE = 3; // 3x3 grid
export const GRID_CELL_COUNT = GRID_SIZE * GRID_SIZE; // 9 cells total

// Local storage key for persisting settings
export const LOCAL_STORAGE_KEY = 'nBackSettings';

// Minimum and Maximum configurable values
export const MIN_N_LEVEL = 1;
export const MAX_N_LEVEL = 5;
export const MIN_STIMULUS_DURATION = 500; // ms
export const MAX_STIMULUS_DURATION = 3000; // ms
export const MIN_ISI = 500; // ms
export const MAX_ISI = 5000; // ms
export const MIN_SESSION_DURATION = 30; // seconds
export const MAX_SESSION_DURATION = 600; // seconds (10 minutes)

// Feedback display duration
export const FEEDBACK_DURATION_MS = 500; // How long visual feedback (color flash) stays visible
