// Defines the different game modes available
export enum GameMode {
  Visual = 'Visual',
  Audio = 'Audio',
  Dual = 'Dual',
}

// Represents the settings configurable by the user
export interface GameSettings {
  gameMode: GameMode;
  nLevel: number;         // The 'N' in N-Back
  stimulusDuration: number; // milliseconds
  interStimulusInterval: number; // milliseconds
  sessionDuration: number;  // seconds
  visualMatchKey: string;
  audioMatchKey: string;
}

// Represents a single stimulus presented to the user
export interface Stimulus {
  visualPosition: number | null; // 0-8 for the grid, null if not applicable
  audioLetter: string | null;   // Letter spoken, null if not applicable
}

// Represents the state of the game at any point in time
export interface GameState {
  status: 'idle' | 'settings' | 'running' | 'paused' | 'finished';
  score: number; 
  currentTrial: number;
  elapsedTime: number; // seconds
  stimulusSequence: Stimulus[];
  userResponses: { visual: boolean | null; audio: boolean | null }[]; // true=match, false=no-match, null=no response
  activeVisualStimulus: { visualPosition: number } | null; 
  activeAudioStimulus: string | null; // Currently spoken letter
  feedback: { visual: FeedbackType | null; audio: FeedbackType | null };
  showFeedbackUntil: number; // Timestamp (Date.now()) until feedback should be shown
}

// Type for visual feedback messages
export type FeedbackType = 'correct' | 'miss' | 'false-alarm';

// Results details for a specific mode (Visual or Audio)
export interface ModeResultMetrics {
  hits: number;
  misses: number;
  falseAlarms: number;
  errors: number; 
  totalMatches: number;
  rate: number; 
}

// Structure for storing game results
export interface GameResults {
  settings: GameSettings;
  totalTrials: number;
  visual: ModeResultMetrics | null; 
  audio: ModeResultMetrics | null; 
  overallSuccessRate: number; 
}

// Type for the game logic reducer actions
export type GameAction = 
  | { type: 'START_GAME'; settings: GameSettings; sequence: Stimulus[] }
  | { type: 'RUN_GAME' }
  | { type: 'STOP_GAME' }
  | { type: 'PAUSE_GAME' }
  | { type: 'RESUME_GAME' }
  | { type: 'NEXT_TRIAL'; currentTime: number; settings: GameSettings }
  | { type: 'REGISTER_RESPONSE'; responseType: 'visual' | 'audio'; currentTime: number; settings: GameSettings }
  | { type: 'SHOW_FEEDBACK'; feedback: { visual: FeedbackType | null; audio: FeedbackType | null }; duration: number }
  | { type: 'CLEAR_FEEDBACK' }
  | { type: 'UPDATE_ELAPSED_TIME'; payload: number }
  | { type: 'END_SESSION' }
  | { type: 'CLEAR_VISUAL_STIMULUS' };

// Represents the state managed by the game logic reducer
export interface GameReducerState {
  status: 'idle' | 'settings' | 'running' | 'paused' | 'finished';
  settings: GameSettings | null; // Store settings used for the session
  stimulusSequence: Stimulus[];
  userResponses: { [key: number]: { visual: boolean | null, audio: boolean | null } };
  currentTrial: number;
  activeVisualStimulus: { visualPosition: number } | null;
  activeAudioStimulus: { audioLetter: string } | null;
  feedback: { visual: FeedbackType | null; audio: FeedbackType | null };
  score: number;
  elapsedTime: number; // Time elapsed in the current session
  results: GameResults | null; // Add field to store results
  showFeedbackUntil: number; // Add missing field for feedback timing
}

// --- Component Prop Types ---

export interface SettingsFormProps {
  onSubmit: (settings: GameSettings) => void;
  initialSettings: GameSettings;
}

export interface GameProps {
  settings: GameSettings;
  onGameEnd: (results: GameResults) => void;
  onResetGame: () => void;
}

export interface StatusDisplayProps {
  status: 'idle' | 'running' | 'paused' | 'finished';
  trial: number;
  totalTrials: number;
}

export interface GameGridProps {
  activePosition: number | null; 
  feedback: FeedbackType | null; 
}

export interface ControlsProps {
  status: GameState['status']; 
  onExit: () => void;
}

export interface ResultsDisplayProps {
  results: GameResults | null;
  onPlayAgain: () => void;
  onExit: () => void;
}

export interface SettingsProps {
  initialSettings: GameSettings;
  onSettingsChange: (newSettings: GameSettings) => void;
  onStartGame: (settings: GameSettings) => void;
  isCollapsed: boolean; 
  onToggleCollapse: () => void; 
}
