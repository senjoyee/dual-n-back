import React, { useEffect, useRef, useCallback } from 'react';
import { GameSettings, GameResults, GameMode } from '../types';
import { useGameReducer } from '../hooks/useGameReducer';
import { generateSequence, calculateResults } from '../utils/gameLogic';
import GameGrid from './GameGrid';
import StatusDisplay from './StatusDisplay';
import Controls from './Controls';
import ResponseButtons from './ResponseButtons';

interface GameProps {
  settings: GameSettings;
  onGameEnd: (results: GameResults) => void;
  onResetGame: () => void; // Function to call when user stops the game via Cancel
  isActive: boolean; // Prop to control if the game loop runs
}

// Web Speech API Synthesis
const synth = window.speechSynthesis;
let utterance: SpeechSynthesisUtterance | null = null;

const Game: React.FC<GameProps> = ({ settings, onGameEnd, onResetGame, isActive }) => {
  // Pass settings directly to the hook
  const [state, dispatch] = useGameReducer();
  const gameLoopTimeoutRef = useRef<number | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);
  const elapsedTimeIntervalRef = useRef<number | null>(null);
  const responseWindowTimeoutRef = useRef<number | null>(null); // Timer for miss detection
  const lastTickTimeRef = useRef<number>(0);
  const visualStimulusTimeoutRef = useRef<number | null>(null); // Add ref for visual stimulus timeout
  const lastGameTickTimeRef = useRef<number>(0); // Ref to store timestamp of the last gameTick execution

  const { gameMode, stimulusDuration, interStimulusInterval, sessionDuration, visualMatchKey, audioMatchKey } = settings;
  const trialDuration = stimulusDuration + interStimulusInterval;

  // Clear all timeouts helper function
  const clearGameTimeouts = useCallback(() => {
    if (gameLoopTimeoutRef.current) clearTimeout(gameLoopTimeoutRef.current);
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    if (elapsedTimeIntervalRef.current) clearTimeout(elapsedTimeIntervalRef.current);
    if (responseWindowTimeoutRef.current) clearTimeout(responseWindowTimeoutRef.current);
    if (visualStimulusTimeoutRef.current) clearTimeout(visualStimulusTimeoutRef.current);
    gameLoopTimeoutRef.current = null;
    feedbackTimeoutRef.current = null;
    elapsedTimeIntervalRef.current = null;
    responseWindowTimeoutRef.current = null;
    visualStimulusTimeoutRef.current = null;
    if (synth && synth.speaking) {
        synth.cancel();
    }
    console.log("Cleared all game timeouts and cancelled speech.");
  }, []);

  // --- Audio Synthesis Setup ---
  useEffect(() => {
    if ('speechSynthesis' in window) {
        utterance = new SpeechSynthesisUtterance();
        utterance.lang = 'en-US';
        utterance.rate = 0.9; // Adjust rate as needed
        utterance.pitch = 1; // Adjust pitch as needed
        utterance.volume = 0.8; // Adjust volume as needed
        // Optional: Preload voices
        synth.getVoices(); 
    } else {
        console.warn('Web Speech API not supported in this browser.');
        // Consider disabling audio mode if not supported?
    }

    // Cancel speech on unmount
    return () => {
      if (synth && synth.speaking) {
        synth.cancel();
      }
      clearGameTimeouts(); // Clear all timeouts on unmount
    };
  }, []);

  const speakLetter = useCallback((letter: string | null) => {
    if (letter && utterance && synth && !synth.speaking) {
      utterance.text = letter;
      try {
           synth.speak(utterance);
      } catch (error) { 
          console.error("Speech synthesis error:", error); 
          // Handle potential errors, e.g., if speech is interrupted rapidly
          if (synth.speaking) synth.cancel(); // Try to clear queue
      }
    }
  }, []);

  // --- Game Loop Logic (only runs when state.status is 'running') ---
  const gameTick = useCallback(() => {
    if (state.status !== 'running') return; 

    const currentTime = Date.now();
    const timeSinceLastTick = currentTime - lastGameTickTimeRef.current;
    lastGameTickTimeRef.current = currentTime; // Update last tick time

    // Log the duration being used and the actual time elapsed
    if (state.currentTrial >= 0) { // Avoid logging before the first real tick completes
      console.log(`Game Tick: Trial ${state.currentTrial + 1}. Scheduled Delay: ${trialDuration}ms. Actual Time Since Last Tick: ${timeSinceLastTick}ms`);
    }

    dispatch({ type: 'NEXT_TRIAL', currentTime: currentTime, settings: settings });

    // Schedule the next tick
    gameLoopTimeoutRef.current = setTimeout(gameTick, trialDuration);

  }, [state.status, trialDuration, dispatch, settings]); // REMOVED state.currentTrial

  // --- Timer for Elapsed Time & Session End ---
  const updateElapsedTime = useCallback(() => {
    if (state.status !== 'running') return;

    const now = Date.now();
    const deltaSeconds = (now - lastTickTimeRef.current) / 1000;
    lastTickTimeRef.current = now;

    // Access previous state via functional update is safer here if needed,
    // but dispatching the new value directly is also fine.
    // We read state.elapsedTime just before dispatching anyway.
    const currentElapsedTime = state.elapsedTime; // Read latest state here
    const newElapsedTime = currentElapsedTime + deltaSeconds;
    
    // Dispatch action to update time
    dispatch({ type: 'UPDATE_ELAPSED_TIME', payload: newElapsedTime });

    if (newElapsedTime >= sessionDuration) {
        dispatch({ type: 'END_SESSION' });
    } else {
         elapsedTimeIntervalRef.current = setTimeout(updateElapsedTime, 1000); // Update every second
    }
  }, [state.status, sessionDuration, dispatch]); // REMOVED state.elapsedTime

  // --- Effect to Start/Stop Game based on isActive prop --- 
  useEffect(() => {
    if (isActive) {
      console.log("Game isActive = true. Starting game sequence and loop.");
      // Ensure sequence is generated with current settings
      const sequence = generateSequence(settings);
      dispatch({ type: 'START_GAME', settings, sequence }); // This sets status to 'idle' initially
      dispatch({ type: 'RUN_GAME' }); // This should set status to 'running'
    } else {
      // Only dispatch stop if the game was actually running or paused
      if (state.status === 'running' || state.status === 'paused') {
          console.log("Game isActive = false. Stopping game.");
          dispatch({ type: 'STOP_GAME' }); // This should set status to 'idle' and clear timers
      }
      // Always clear timeouts when becoming inactive, even if already idle
      clearGameTimeouts();
    }

    // Cleanup function - ensure timers are cleared if component unmounts while active
    return () => {
        if (isActive) { // Only clear if it was active when unmounting/re-rendering
             clearGameTimeouts();
        }
    };
  // Depend on isActive and settings (to regenerate sequence if settings change *before* starting)
  // Also depend on dispatch
  }, [isActive, settings, dispatch, clearGameTimeouts, state.status]);

  // --- Effect to Start/Stop Game Loop & Elapsed Time Timers based on internal state.status ---
  useEffect(() => {
    if (state.status === 'running') {
        // Start tick immediately after resuming or starting
        console.log('Internal state is running. Starting game loop and elapsed timer...');
        lastGameTickTimeRef.current = Date.now(); // Initialize timestamp when loop starts
        gameLoopTimeoutRef.current = setTimeout(gameTick, 0);
        lastTickTimeRef.current = Date.now();
        elapsedTimeIntervalRef.current = setTimeout(updateElapsedTime, 1000); // Start elapsed time counter
    } else {
        // This else might be redundant now due to isActive effect and clearGameTimeouts, but keep for safety?
        // Or remove it if clearGameTimeouts in isActive effect is sufficient.
        // Let's remove it for now to avoid potential double-clearing issues.
        // clearGameTimeouts(); 
    }
    // Cleanup function - relies on isActive effect now
    // return clearGameTimeouts; 
  }, [state.status, gameTick, updateElapsedTime]);

  // --- Effect to Handle Audio Stimulus --- 
  useEffect(() => {
      if (state.status === 'running' && (gameMode === GameMode.Audio || gameMode === GameMode.Dual) && state.activeAudioStimulus) {
          speakLetter(state.activeAudioStimulus.audioLetter); // Pass the letter string
      }
       // Cancel speech if paused or stopped
      if ((state.status === 'paused' || state.status === 'finished' || state.status === 'settings') && synth.speaking) {
            synth.cancel();
      }
  }, [state.status, state.activeAudioStimulus, gameMode, speakLetter]);

   // --- Effect to Handle Feedback Timeout ---
   useEffect(() => {
    if (state.showFeedbackUntil > 0) {
      const timeoutDuration = state.showFeedbackUntil - Date.now();
      if (timeoutDuration > 0) {
        feedbackTimeoutRef.current = setTimeout(() => {
          dispatch({ type: 'CLEAR_FEEDBACK' });
        }, timeoutDuration);
      } else {
        // If timeout already passed (e.g., due to pause), clear immediately
        dispatch({ type: 'CLEAR_FEEDBACK' });
      }
    } 
    // Cleanup previous timeout if feedback changes
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
        feedbackTimeoutRef.current = null;
      }
    };
  }, [state.showFeedbackUntil, dispatch]);

  // --- Effect to clear visual stimulus after its duration ---
  useEffect(() => {
    // Clear any lingering timeout first
    if (visualStimulusTimeoutRef.current) {
        clearTimeout(visualStimulusTimeoutRef.current);
        visualStimulusTimeoutRef.current = null;
    }

    // Only set a new timeout if the game is running and a visual stimulus is active
    if (state.status === 'running' && state.activeVisualStimulus !== null) {
        visualStimulusTimeoutRef.current = setTimeout(() => {
            dispatch({ type: 'CLEAR_VISUAL_STIMULUS' });
            visualStimulusTimeoutRef.current = null; // Clear ref after firing
        }, stimulusDuration);
    }

    // Cleanup function to clear timeout if component unmounts or dependencies change
    return () => {
        if (visualStimulusTimeoutRef.current) {
            clearTimeout(visualStimulusTimeoutRef.current);
            visualStimulusTimeoutRef.current = null;
        }
    };
  }, [state.status, state.activeVisualStimulus, stimulusDuration, dispatch]);

  // --- Start Game Effect (Now only prepares sequence, does not run) ---
  // This might be redundant now as sequence generation is in the isActive effect.
  // Let's comment it out.
  /*
  useEffect(() => {
    console.log("Settings changed, generating sequence...");
    const sequence = generateSequence(settings);
    // Pass settings again in START_GAME if needed, though reducer now stores it
    dispatch({ type: 'START_GAME', settings, sequence });
  }, [settings, dispatch]); // Run only when settings change (i.e., game starts)
  */

  // --- Effect to Handle End of Game --- 
  useEffect(() => {
    if (state.status === 'finished') {
        console.log("Game transitioning to 'finished'. Current state:", JSON.stringify(state, null, 2)); // Log the full state
        clearGameTimeouts();
        if (synth.speaking) synth.cancel(); // Ensure speech stops
        const results = calculateResults(settings, state);
        onGameEnd(results);
    }
  }, [state.status, settings, state, onGameEnd]);

  // --- Keyboard Input Handler ---
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (state.status !== 'running') return; // Only listen during active gameplay

    const key = event.key.toLowerCase();
    const currentTime = Date.now();

    let responseType: 'visual' | 'audio' | null = null;

    if ((gameMode === GameMode.Visual || gameMode === GameMode.Dual) && key === visualMatchKey.toLowerCase()) {
        responseType = 'visual';
    }
    if ((gameMode === GameMode.Audio || gameMode === GameMode.Dual) && key === audioMatchKey.toLowerCase()) {
        // If keys are same, prioritize visual if dual mode (or decide on a rule)
        if (responseType === 'visual' && gameMode === GameMode.Dual && visualMatchKey === audioMatchKey) {
            // Already handled as visual, maybe add logic for dual-key press?
            // For now, we just register the first match key hit
        } else {
             responseType = 'audio';
        }
    }

    if (responseType) {
        event.preventDefault(); // Prevent default browser actions for the key
        dispatch({ type: 'REGISTER_RESPONSE', responseType, currentTime, settings: settings });
    }

  }, [state.status, gameMode, visualMatchKey, audioMatchKey, dispatch, settings]);

  // --- Add/Remove Keyboard Listener ---
  useEffect(() => {
    if (state.status === 'running') {
      window.addEventListener('keydown', handleKeyDown);
    } else {
      window.removeEventListener('keydown', handleKeyDown);
    }
    // Cleanup listener
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [state.status, handleKeyDown]);

  // Even when sequence is not ready or settings aren't fully loaded, show the game panel
  // We'll just render the empty game grid with controls instead of a loading message
  if (!state.settings || (state.status === 'settings' || state.stimulusSequence.length === 0 && state.status !== 'finished')) {
      return (
        <div className="flex flex-col items-center justify-center p-6 bg-gray-950 text-white rounded-lg shadow-xl w-full">
          <GameGrid activePosition={null} />
          <ResponseButtons 
            gameMode={gameMode}
            feedback={{visual: null, audio: null}} 
            visualMatchKey={settings.visualMatchKey}
            audioMatchKey={settings.audioMatchKey}
          />
          <Controls 
            status="idle"
            onExit={onResetGame}
          />
        </div>
      );
  }

  // Show Results screen if status is 'finished'
  if (state.status === 'finished' && state.results) {
    const { results } = state;
    const { visual, audio, overallSuccessRate } = results;

    // Helper to format percentage
    const formatPercent = (value: number | undefined | null) => {
        if (typeof value !== 'number') return 'N/A';
        return `${value.toFixed(0)}%`; // Show as integer percentage
    }

    return (
      <div className="flex flex-col items-center justify-center p-6 bg-gray-800 text-white rounded-lg shadow-xl w-full max-w-lg mx-auto">
        <h2 className="text-2xl font-bold mb-6">Last Set</h2>
        
        <div className="w-full mb-6 p-4 bg-gray-700 rounded">
            <div className="flex justify-between items-center">
                <span className="text-xl font-semibold">Success Rate:</span>
                <span className="text-xl font-bold">{formatPercent(overallSuccessRate)}</span>
            </div>
        </div>

        <div className="w-full grid grid-cols-3 gap-x-4 gap-y-2 mb-8 text-lg">
            {/* Headers */} 
            <span className="font-semibold">Mode</span>
            <span className="font-semibold text-right">Total Matches</span>
            <span className="font-semibold text-right">Errors (Rate)</span>
            
            {/* Visual Results */} 
            {visual && (
                <>
                    <span>Position</span>
                    <span className="text-right">{visual.totalMatches}</span>
                    <span className="text-right">{visual.errors} ({formatPercent(visual.rate)})</span>
                </>
            )}

            {/* Audio Results */} 
            {audio && (
                <>
                    <span>Audio</span>
                    <span className="text-right">{audio.totalMatches}</span>
                    <span className="text-right">{audio.errors} ({formatPercent(audio.rate)})</span>
                </>
            )}
        </div>

        <div className="flex space-x-4">
          <button 
            onClick={() => dispatch({ type: 'STOP_GAME' })} // Use STOP_GAME to return to settings
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors duration-150"
          >
            Play Again
          </button>
          <button 
            onClick={onResetGame} 
            className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg transition-colors duration-150"
          >
            Exit
          </button>
        </div>
      </div>
    );
  }

  return (
    // Remove max-w-md and mx-auto to allow parent grid to control centering
    <div className="flex flex-col items-center justify-center p-6 bg-gray-950 text-white rounded-lg shadow-xl w-full"> 
      {/* Status Display */}
      <StatusDisplay
          status={state.status}
          trial={state.currentTrial} // Pass 0-based index
          totalTrials={state.stimulusSequence.length}
      />

      {/* Game Grid - Extract visualPosition number */}
      <GameGrid activePosition={state.activeVisualStimulus?.visualPosition ?? null} />

      <ResponseButtons 
        gameMode={gameMode}
        feedback={state.feedback} 
        visualMatchKey={settings.visualMatchKey}
        audioMatchKey={settings.audioMatchKey}
      />
      <Controls 
        status={state.status}
        onExit={onResetGame} // Pass onResetGame down to Controls' onExit prop
      />
    </div>
  );
};

export default Game;
