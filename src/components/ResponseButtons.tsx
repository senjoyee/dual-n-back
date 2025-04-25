import React, { useState, useEffect, useRef } from 'react';
import { FeedbackType, GameMode } from '../types';
import { FEEDBACK_DURATION_MS } from '../constants'; // Reuse duration constant

interface FeedbackStateProp {
  visual: FeedbackType | null;
  audio: FeedbackType | null;
}

interface ResponseButtonsProps {
  gameMode: GameMode;
  feedback: FeedbackStateProp; 
  visualMatchKey: string;
  audioMatchKey: string;
}

type FlashType = 'green' | 'red' | null;

const ResponseButtons: React.FC<ResponseButtonsProps> = ({ 
  gameMode, 
  feedback, 
  visualMatchKey, 
  audioMatchKey 
}) => {
  const [visualFlash, setVisualFlash] = useState<FlashType>(null);
  const [audioFlash, setAudioFlash] = useState<FlashType>(null);
  const visualTimeoutRef = useRef<number | null>(null);
  const audioTimeoutRef = useRef<number | null>(null);

  // Handle feedback changes
  useEffect(() => {
    // Clear previous timeouts if feedback changes rapidly
    if (visualTimeoutRef.current) clearTimeout(visualTimeoutRef.current);
    if (audioTimeoutRef.current) clearTimeout(audioTimeoutRef.current);

    // Determine flash for visual button
    if (feedback.visual) {
      const flash = feedback.visual === 'correct' ? 'green' : 'red'; // red for false-alarm or miss
      setVisualFlash(flash);
      visualTimeoutRef.current = setTimeout(() => setVisualFlash(null), FEEDBACK_DURATION_MS);
    } else {
      setVisualFlash(null); // Clear flash if feedback is null
    }

    // Determine flash for audio button
    if (feedback.audio) {
      const flash = feedback.audio === 'correct' ? 'green' : 'red'; // red for false-alarm or miss
      setAudioFlash(flash);
      audioTimeoutRef.current = setTimeout(() => setAudioFlash(null), FEEDBACK_DURATION_MS);
    } else {
      setAudioFlash(null); // Clear flash if feedback is null
    }

    // Cleanup timeouts on unmount or if dependencies change before timeout fires
    return () => {
      if (visualTimeoutRef.current) clearTimeout(visualTimeoutRef.current);
      if (audioTimeoutRef.current) clearTimeout(audioTimeoutRef.current);
    };

  }, [feedback.visual, feedback.audio]); // Depend on the specific feedback values

  // Determine which buttons to show
  const showVisualButton = gameMode === GameMode.Visual || gameMode === GameMode.Dual;
  const showAudioButton = gameMode === GameMode.Audio || gameMode === GameMode.Dual;

  // Base button style (matches screenshot)
  const baseButtonStyle = "px-4 py-2 rounded border-2 border-cyan-400 text-cyan-400 font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-300 transition-all duration-150 flex items-center gap-2 w-44 justify-center";

  // Apply flash styles
  const getButtonStyle = (type: 'visual' | 'audio'): string => {
    const flash = type === 'visual' ? visualFlash : audioFlash;
    if (flash === 'green') {
      return "px-4 py-2 rounded border-2 border-green-400 bg-green-500 text-white font-semibold focus:outline-none transition-all duration-150 flex items-center gap-2 shadow-md w-44 justify-center";
    }
    if (flash === 'red') {
      return "px-4 py-2 rounded border-2 border-red-400 bg-red-500 text-white font-semibold focus:outline-none transition-all duration-150 flex items-center gap-2 shadow-md w-44 justify-center";
    }
    return baseButtonStyle;
  };

  return (
    <div className="flex justify-center items-center space-x-8 mt-4">
      {showVisualButton && (
        <button 
          className={getButtonStyle('visual')}
          disabled 
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M0 1.5A1.5 1.5 0 0 1 1.5 0h13A1.5 1.5 0 0 1 16 1.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 14.5v-13zM1.5 1a.5.5 0 0 0-.5.5V5h4V1H1.5zM5 6H1v4h4V6zm1 4h4V6H6v4zm-1 1H1v3.5a.5.5 0 0 0 .5.5H5v-4zm1 0v4h4v-4H6zm5 0v4h3.5a.5.5 0 0 0 .5-.5V11h-4zm0-1h4V6h-4v4zm0-5h4V1.5a.5.5 0 0 0-.5-.5H11v4zm-1 0V1H6v4h4z"/>
          </svg>
          {visualMatchKey.toUpperCase()}: Position
        </button>
      )}
      {showAudioButton && (
        <button 
          className={getButtonStyle('audio')}
          disabled
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M11.536 14.01A8.473 8.473 0 0 0 14.026 8a8.473 8.473 0 0 0-2.49-6.01l-.708.707A7.476 7.476 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303l.708.707z"/>
            <path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.483 5.483 0 0 1 11.025 8a5.483 5.483 0 0 1-1.61 3.89l.706.706z"/>
            <path d="M8.707 11.182A4.486 4.486 0 0 0 10.025 8a4.486 4.486 0 0 0-1.318-3.182L8 5.525A3.489 3.489 0 0 1 9.025 8 3.49 3.49 0 0 1 8 10.475l.707.707zM6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06z"/>
          </svg>
          {audioMatchKey.toUpperCase()}: Audio
        </button>
      )}
    </div>
  );
};

export default ResponseButtons;
