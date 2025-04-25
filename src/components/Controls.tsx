import React from 'react';
import { ControlsProps } from '../types';

const Controls: React.FC<ControlsProps> = ({ status, onExit }) => {

  return (
    <div className="flex justify-center items-center space-x-4 mt-6">
      {/* Exit Button (Always enabled?) */}
      <button
        className="px-4 py-2 bg-gray-700 text-white font-semibold rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-150"
        onClick={onExit}
        disabled={status === 'idle'} // Disable if game hasn't started
      >
        Cancel
      </button>
    </div>
  );
};

export default Controls;
