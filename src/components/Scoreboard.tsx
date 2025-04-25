import React from 'react';
import { GameResults, GameMode } from '../types';

interface ScoreboardProps {
  results: GameResults;
  onPlayAgain: () => void;
}

const Scoreboard: React.FC<ScoreboardProps> = ({ results, onPlayAgain }) => {
  const { settings, totalTrials, visual, audio, overallAccuracy } = results;

  const formatPercent = (value: number | undefined) => {
    return value !== undefined ? `${value.toFixed(1)}%` : 'N/A';
  };

  return (
    <div className="w-full max-w-xl p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md text-center">
      <h2 className="text-2xl font-bold mb-6">Session Results</h2>

      {/* Display Settings Used */}
      <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded">
        <h3 className="text-lg font-semibold mb-2">Settings Used</h3>
        <p className="text-sm">Mode: {settings.gameMode}, N-Level: {settings.nLevel}</p>
        <p className="text-sm">Duration: {settings.sessionDuration}s, Stimulus: {settings.stimulusDuration}ms, ISI: {settings.interStimulusInterval}ms</p>
        <p className="text-sm">Total Trials: {totalTrials}</p>
      </div>

      {/* Overall Accuracy */}
       {(settings.gameMode === GameMode.Dual) && (
          <div className="mb-4">
             <p className="text-xl font-semibold">Overall Accuracy: <span className="text-blue-500">{formatPercent(overallAccuracy)}</span></p>
          </div>
       )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Visual Results */}
        {visual && (
          <div className="border border-gray-300 dark:border-gray-600 p-4 rounded">
            <h4 className="text-lg font-semibold mb-2 text-blue-400">Visual ({settings.visualMatchKey.toUpperCase()})</h4>
            <p>Matches: <span className="text-green-500 font-medium">{visual.hits}</span> / {visual.totalMatches}</p>
          </div>
        )}

        {/* Audio Results */}
        {audio && (
          <div className="border border-gray-300 dark:border-gray-600 p-4 rounded">
            <h4 className="text-lg font-semibold mb-2 text-purple-400">Audio ({settings.audioMatchKey.toUpperCase()})</h4>
            <p>Matches: <span className="text-green-500 font-medium">{audio.hits}</span> / {audio.totalMatches}</p>
          </div>
        )}
      </div>

      {/* Play Again Button */}
      <button
        onClick={onPlayAgain}
        className="mt-4 px-8 py-3 bg-button-primary text-white font-bold rounded-lg hover:bg-button-primary-hover focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-150"
      >
        Play Again
      </button>
    </div>
  );
};

export default Scoreboard;
