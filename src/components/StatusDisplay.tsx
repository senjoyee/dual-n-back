import React from 'react';
import { StatusDisplayProps } from '../types';

const StatusDisplay: React.FC<StatusDisplayProps> = ({ 
  status, 
  trial, 
  totalTrials 
}) => {

  // Only render if the game is running or paused
  if (status !== 'running' && status !== 'paused') {
    return null; // Don't show during idle, finished, or settings
  }

  // Ensure totalTrials is valid before displaying
  const displayTotalTrials = totalTrials > 0 ? totalTrials : '?';

  return (
    <div className="text-center mb-4 bg-gray-900 text-white">
      {/* Display current trial number / total trials */}
      <span className="text-lg font-semibold">
        {/* Add 1 to trial for 1-based indexing for display */}
        {trial + 1} of {displayTotalTrials} 
      </span>
    </div>
  );
};

export default StatusDisplay;
