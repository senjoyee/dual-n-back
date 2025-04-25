import { useState, useEffect, useCallback } from 'react';
import Settings from './components/Settings';
import Game from './components/Game';
import Scoreboard from './components/Scoreboard';
import { GameSettings, GameResults } from './types';
import { DEFAULT_SETTINGS, LOCAL_STORAGE_KEY } from './constants';

function App() {
  // View state now primarily toggles between main layout ('settings') and 'scoreboard'
  const [view, setView] = useState<'settings' | 'scoreboard'>('settings');
  const [settings, setSettings] = useState<GameSettings>(() => {
    // Load settings from localStorage or use defaults
    try {
      const savedSettings = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        // Basic validation to ensure loaded settings have expected keys
        const hasAllKeys = Object.keys(DEFAULT_SETTINGS).every(key => key in parsed);
        if (hasAllKeys) {
          return parsed as GameSettings;
        }
      }
    } catch (error) {
      console.error('Failed to load settings from localStorage:', error);
    }
    return DEFAULT_SETTINGS;
  });
  const [lastResults, setLastResults] = useState<GameResults | null>(null);
  // Add state for settings panel collapse
  const [isSettingsCollapsed, setIsSettingsCollapsed] = useState(false);
  // isPlaying now controls if the Game component's internal loop is active
  const [isPlaying, setIsPlaying] = useState(false);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
    }
  }, [settings]);

  // Called by Settings 'Start Game' button and spacebar key
  const handleStartGame = useCallback((gameSettings: GameSettings) => {
    // Apply potentially changed settings before starting
    setSettings(gameSettings);
    setIsPlaying(true); // Set game to active
    // Ensure view is 'settings' (main game view)
    if (view !== 'settings') {
        setView('settings');
    }
  }, [view]); // Depend on view to ensure correct view is set

  // Called by Game when it ends naturally (e.g., time runs out)
  const handleGameEnd = useCallback((results: GameResults) => {
    setLastResults(results);
    setIsPlaying(false); // Set game to inactive
    setView('scoreboard'); // Switch view to show results
  }, []);

  // Called by Game's 'Cancel' button or Scoreboard's 'Play Again'
  const handleReturnToSettings = useCallback(() => {
    setLastResults(null); // Clear results if coming from scoreboard
    setIsPlaying(false); // Set game to inactive
    setView('settings'); // Ensure view is the main game/settings layout
  }, []);

  // Add keyboard event listeners for game control (Escape to stop, Spacebar to start)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if the active element is an input or textarea (to avoid triggering when typing)
      const isTypingInField = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '');
      
      // Escape key - stop game
      if (event.key === 'Escape' && isPlaying) {
        // Directly set isPlaying to false, like Cancel button
        setIsPlaying(false);
        // Ensure the view is 'settings' if Escape is pressed
        if (view === 'scoreboard') {
            setView('settings');
        }
      }
      
      // Spacebar - start game when not playing, in settings view, and no key conflicts
      if (event.code === 'Space' && !isPlaying && view === 'settings' && !isTypingInField) {
        // Only start if there's no key conflict
        const hasKeyConflict = settings.visualMatchKey.toLowerCase() === settings.audioMatchKey.toLowerCase();
        if (!hasKeyConflict) {
          // Prevent page scrolling
          event.preventDefault();
          handleStartGame(settings);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
    // Depends on settings, isPlaying, and view to update the listener accordingly
  }, [isPlaying, view, settings, handleStartGame]);

  const handleSettingsChange = useCallback((newSettings: GameSettings) => {
    // Only update settings if the game is not currently playing
    // to prevent mid-game changes potentially causing issues.
    // If changes should be allowed mid-game, this check can be removed,
    // but the Game component would need to handle settings updates robustly.
    if (!isPlaying) {
        setSettings(newSettings);
    }
  }, [isPlaying]);



  // Toggle settings panel visibility
  const toggleSettingsCollapse = useCallback(() => {
    setIsSettingsCollapsed(prev => !prev);
  }, []);

  return (
    // Use items-start for the grid layout
    <div className="px-4 flex flex-col justify-start items-center min-h-screen pt-8">
      <h1 className="text-3xl font-bold mb-12 text-center">N-Back Training</h1>

      {view === 'scoreboard' && lastResults ? (
        // Render Scoreboard view
        <Scoreboard
          results={lastResults}
          onPlayAgain={handleReturnToSettings} // 'Play Again' stops game and returns to settings view
        />
      ) : (
        // Render GAME + SETTINGS view
        // Increase gap to push Settings further right
        <div className="grid grid-cols-3 items-start w-full gap-24 self-stretch">
          {/* Column 1: Implicitly Empty */}
          {/* Column 2: Game Component (Centered) with Start button above */}
          <div className="col-start-2 justify-self-center flex flex-col items-center">
            {/* Start Button above the game */}
            <div className="mb-4 self-center">
              <button
                onClick={() => handleStartGame(settings)}
                disabled={isPlaying || settings.visualMatchKey.toLowerCase() === settings.audioMatchKey.toLowerCase()}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold rounded-lg 
                 hover:from-blue-700 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-blue-500 
                 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed
                 shadow-md transition-all duration-300 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445z"/>
                </svg>
                Start
              </button>
            </div>
            <Game
              settings={settings}
              onGameEnd={handleGameEnd}
              onResetGame={handleReturnToSettings} // Passed to Controls 'Cancel' button
              isActive={isPlaying} // Control active state
            />
          </div>
          {/* Column 3: Settings Component (Right-Aligned) */}
          {/* Add max-w-md to make it slimmer */}
          <div className="col-start-3 justify-self-end max-w-md">
            <Settings
              initialSettings={settings} // Pass current settings
              onSettingsChange={handleSettingsChange}
              isCollapsed={isSettingsCollapsed}
              onToggleCollapse={toggleSettingsCollapse}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
