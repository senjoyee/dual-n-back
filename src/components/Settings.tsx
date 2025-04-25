import React, { useState, useEffect, useCallback } from 'react';
import { GameSettings, GameMode } from '../types';
import { 
    MIN_N_LEVEL, MAX_N_LEVEL, 
    MIN_STIMULUS_DURATION, MAX_STIMULUS_DURATION, 
    MIN_ISI, MAX_ISI, 
    MIN_SESSION_DURATION, MAX_SESSION_DURATION 
} from '../constants';

interface SettingsProps {
  initialSettings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  initialSettings, 
  onSettingsChange, 
  isCollapsed, 
  onToggleCollapse
}) => {
  const [currentSettings, setCurrentSettings] = useState<GameSettings>(initialSettings);
  const [keyConflict, setKeyConflict] = useState<boolean>(false);

  // Update local state if initialSettings prop changes (e.g., loaded from localStorage)
  useEffect(() => {
    setCurrentSettings(initialSettings);
  }, [initialSettings]);

  // Check for key conflicts
  useEffect(() => {
    setKeyConflict(currentSettings.visualMatchKey.toLowerCase() === currentSettings.audioMatchKey.toLowerCase() && 
                   currentSettings.visualMatchKey.length > 0);
  }, [currentSettings.visualMatchKey, currentSettings.audioMatchKey]);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = event.target;
    let processedValue: string | number | GameMode = value;

    if (type === 'number' || name === 'nLevel' || name === 'stimulusDuration' || name === 'interStimulusInterval' || name === 'sessionDuration') {
        processedValue = parseInt(value, 10);
        // Clamp values to their defined ranges
        if (name === 'nLevel') processedValue = Math.max(MIN_N_LEVEL, Math.min(MAX_N_LEVEL, processedValue));
        if (name === 'stimulusDuration') processedValue = Math.max(MIN_STIMULUS_DURATION, Math.min(MAX_STIMULUS_DURATION, processedValue));
        if (name === 'interStimulusInterval') processedValue = Math.max(MIN_ISI, Math.min(MAX_ISI, processedValue));
        if (name === 'sessionDuration') processedValue = Math.max(MIN_SESSION_DURATION, Math.min(MAX_SESSION_DURATION, processedValue));
    } else if (name === 'visualMatchKey' || name === 'audioMatchKey') {
        // Allow only single character input for keys, convert to lowercase for consistency
        processedValue = value.slice(-1).toLowerCase();
    } else if (name === 'gameMode') {
        processedValue = value as GameMode; // Cast to GameMode enum
    }

    const updatedSettings = { ...currentSettings, [name]: processedValue };
    setCurrentSettings(updatedSettings);
    onSettingsChange(updatedSettings); // Notify App component immediately
  }, [currentSettings, onSettingsChange]);



  return (
    <div className="w-full p-4 bg-gray-950 rounded-lg shadow-md text-white"> 
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold flex items-center">
          <span className="mr-2">⚙️</span> Game Settings
        </h2>
        {/* Improved Toggle Button with added spacing */}
        <button 
          onClick={onToggleCollapse}
          className="flex items-center justify-center p-1.5 rounded-full hover:bg-blue-600 bg-blue-500 text-white transition-all ml-4"
          aria-label={isCollapsed ? 'Expand Settings' : 'Collapse Settings'}
          aria-expanded={!isCollapsed ? 'true' : 'false'} // Accessibility attribute
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            {isCollapsed 
              ? <path d="M8 4a.5.5 0 0 1 .5.5v5.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L7.5 10.293V4.5A.5.5 0 0 1 8 4z"/>
              : <path d="M8 12a.5.5 0 0 0 .5-.5V5.707l2.146 2.147a.5.5 0 0 0 .708-.708l-3-3a.5.5 0 0 0-.708 0l-3 3a.5.5 0 1 0 .708.708L7.5 5.707V11.5a.5.5 0 0 0 .5.5z"/>}
          </svg>
        </button>
      </div>

      {/* Conditionally render the form based on isCollapsed state */}
      {!isCollapsed && (
        <div className="space-y-6">
          {/* Add subtle divider */}
          <div className="border-t border-gray-700 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Game Configuration Group */}
            <div className="md:col-span-2 mb-2">
              <h3 className="text-md font-semibold text-blue-400 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="mr-2">
                  <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
                  <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"/>
                </svg>
                Game Configuration
              </h3>
            </div>
            
            {/* Game Mode */}
            <div>
              <label htmlFor="gameMode" className="block text-sm font-medium mb-1">Game Mode</label>
              <select
                id="gameMode"
                name="gameMode"
                value={currentSettings.gameMode}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-600 rounded"
              >
                {Object.values(GameMode).map((mode) => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </select>
            </div>

            {/* N-Level */}
            <div>
              <label htmlFor="nLevel" className="block text-sm font-medium mb-1 flex items-center">
                N-Level (1-5)
                <span className="ml-1 text-xs text-gray-400 cursor-help" title="Higher N-Level = More Challenging">ℹ️</span>
              </label>
              <input
                type="number"
                id="nLevel"
                name="nLevel"
                min={MIN_N_LEVEL}
                max={MAX_N_LEVEL}
                value={currentSettings.nLevel}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-600 rounded"
              />
            </div>

            {/* Timing Group */}
            <div className="md:col-span-2 mb-2 mt-6">
              <h3 className="text-md font-semibold text-blue-400 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="mr-2">
                  <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                  <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
                </svg>
                Timing Configuration
              </h3>
            </div>

            {/* Stimulus Duration */}
            <div>
              <label htmlFor="stimulusDuration" className="block text-sm font-medium mb-1 flex items-center">
                Stimulus Duration (ms)
                <span className="ml-1 text-xs text-gray-400 cursor-help" title="How long each stimulus appears">ℹ️</span>
              </label>
              <input
                type="range"
                id="stimulusDuration"
                name="stimulusDuration"
                min={MIN_STIMULUS_DURATION}
                max={MAX_STIMULUS_DURATION}
                step="100"
                value={currentSettings.stimulusDuration}
                onChange={handleChange}
                className="w-full mb-1 accent-blue-500"
              />
              <span className="text-sm text-blue-300">{currentSettings.stimulusDuration} ms</span>
            </div>

            {/* Inter-Stimulus Interval (ISI) */}
            <div>
              <label htmlFor="interStimulusInterval" className="block text-sm font-medium mb-1 flex items-center">
                Transition Time (ms)
                <span className="ml-1 text-xs text-gray-400 cursor-help" title="Time between stimuli">ℹ️</span>
              </label>
              <input
                type="range"
                id="interStimulusInterval"
                name="interStimulusInterval"
                min={MIN_ISI}
                max={MAX_ISI}
                step="100"
                value={currentSettings.interStimulusInterval}
                onChange={handleChange}
                className="w-full mb-1 accent-blue-500"
              />
              <span className="text-sm text-blue-300">{currentSettings.interStimulusInterval} ms</span>
            </div>

            {/* Session Duration */}
            <div className="md:col-span-2">
              <label htmlFor="sessionDuration" className="block text-sm font-medium mb-1 flex items-center">
                Session Duration (seconds)
                <span className="ml-1 text-xs text-gray-400 cursor-help" title="Total length of training session">ℹ️</span>
              </label>
              <input
                type="range"
                id="sessionDuration"
                name="sessionDuration"
                min={MIN_SESSION_DURATION}
                max={MAX_SESSION_DURATION}
                step="10"
                value={currentSettings.sessionDuration}
                onChange={handleChange}
                className="w-full mb-1 accent-blue-500"
              />
               <span className="text-sm text-blue-300">{currentSettings.sessionDuration} s</span>
            </div>

            {/* Controls Group */}
            <div className="md:col-span-2 mb-2 mt-6">
              <h3 className="text-md font-semibold text-blue-400 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="mr-2">
                  <path d="M14 5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h12zM2 4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H2z"/>
                  <path d="M13 10.25a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25v-.5zm0-2a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25v-.5zm-5 0A.25.25 0 0 1 8.25 8h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 8 8.75v-.5zm2 0a.25.25 0 0 1 .25-.25h1.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-1.5a.25.25 0 0 1-.25-.25v-.5zm1 2a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25v-.5zm-5-2A.25.25 0 0 1 6.25 8h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 6 8.75v-.5zm-2 0A.25.25 0 0 1 4.25 8h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 4 8.75v-.5zm-2 0A.25.25 0 0 1 2.25 8h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 2 8.75v-.5zm11-2a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25v-.5zm-2 0a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25v-.5zm-2 0A.25.25 0 0 1 9.25 6h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 9 6.75v-.5zm-2 0A.25.25 0 0 1 7.25 6h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 7 6.75v-.5zm-2 0A.25.25 0 0 1 5.25 6h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 5 6.75v-.5zm-3 0A.25.25 0 0 1 2.25 6h1.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-1.5A.25.25 0 0 1 2 6.75v-.5zm0 4a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25v-.5zm2 0a.25.25 0 0 1 .25-.25h5.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-5.5a.25.25 0 0 1-.25-.25v-.5z"/>
                </svg>
                Keyboard Controls
              </h3>
            </div>

            {/* Visual Match Key */}
            <div>
              <label htmlFor="visualMatchKey" className="block text-sm font-medium mb-1 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" className="mr-1 text-cyan-400">
                  <path d="M0 1.5A1.5 1.5 0 0 1 1.5 0h13A1.5 1.5 0 0 1 16 1.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 14.5v-13zM1.5 1a.5.5 0 0 0-.5.5V5h4V1H1.5zM5 6H1v4h4V6zm1 4h4V6H6v4zm-1 1H1v3.5a.5.5 0 0 0 .5.5H5v-4zm1 0v4h4v-4H6zm5 0v4h3.5a.5.5 0 0 0 .5-.5V11h-4zm0-1h4V6h-4v4zm0-5h4V1.5a.5.5 0 0 0-.5-.5H11v4zm-1 0V1H6v4h4z"/>
                </svg>
                Visual Match Key
              </label>
              <div className="relative mt-1">
                <input
                  type="text"
                  id="visualMatchKey"
                  name="visualMatchKey"
                  value={currentSettings.visualMatchKey}
                  onChange={handleChange}
                  maxLength={1} // Ensure only one character visually, though handled in JS
                  className={`w-full uppercase text-center font-mono text-lg py-2 bg-gray-800 border ${keyConflict ? 'border-red-500 ring-1 ring-red-500' : 'border-cyan-600'} rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                  disabled={currentSettings.gameMode === GameMode.Audio}
                />
                {currentSettings.gameMode === GameMode.Audio && (
                  <div className="absolute inset-0 bg-gray-800 bg-opacity-60 flex items-center justify-center rounded">
                    <span className="text-gray-400 text-sm">Disabled in Audio mode</span>
                  </div>
                )}
              </div>
            </div>

            {/* Audio Match Key */}
            <div>
              <label htmlFor="audioMatchKey" className="block text-sm font-medium mb-1 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" className="mr-1 text-cyan-400">
                  <path d="M11.536 14.01A8.473 8.473 0 0 0 14.026 8a8.473 8.473 0 0 0-2.49-6.01l-.708.707A7.476 7.476 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303l.708.707z"/>
                  <path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.483 5.483 0 0 1 11.025 8a5.483 5.483 0 0 1-1.61 3.89l.706.706z"/>
                  <path d="M8.707 11.182A4.486 4.486 0 0 0 10.025 8a4.486 4.486 0 0 0-1.318-3.182L8 5.525A3.489 3.489 0 0 1 9.025 8 3.49 3.49 0 0 1 8 10.475l.707.707zM6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06z"/>
                </svg>
                Audio Match Key
              </label>
              <div className="relative mt-1">
                <input
                  type="text"
                  id="audioMatchKey"
                  name="audioMatchKey"
                  value={currentSettings.audioMatchKey}
                  onChange={handleChange}
                  maxLength={1}
                  className={`w-full uppercase text-center font-mono text-lg py-2 bg-gray-800 border ${keyConflict ? 'border-red-500 ring-1 ring-red-500' : 'border-cyan-600'} rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                  disabled={currentSettings.gameMode === GameMode.Visual}
                />
                {currentSettings.gameMode === GameMode.Visual && (
                  <div className="absolute inset-0 bg-gray-800 bg-opacity-60 flex items-center justify-center rounded">
                    <span className="text-gray-400 text-sm">Disabled in Visual mode</span>
                  </div>
                )}
              </div>
            </div>
            
            {keyConflict && (
                <div className="md:col-span-2 flex items-center text-sm text-red-400 mt-1 bg-red-900 bg-opacity-20 p-2 rounded border border-red-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="mr-1">
                    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                  </svg>
                  Visual and Audio keys cannot be the same
                </div>
            )}

          </div>
        </div>
      )} {/* End conditional wrapper */}
    </div>
  );
};

export default Settings;
