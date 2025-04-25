import React from 'react';
import { GameGridProps } from '../types';
import clsx from 'clsx';

const GameGrid: React.FC<Omit<GameGridProps, 'feedback'>> = ({ activePosition }) => {
  const gridCells = Array.from({ length: 9 });

  return (
    <div className={`grid grid-cols-3 grid-rows-3 gap-2 w-80 h-80 md:w-96 md:h-96 lg:w-112 lg:h-112 p-4 bg-gray-800 rounded-lg shadow-lg border-2 border-blue-700`}> 
      {gridCells.map((_, index) => {
        const isActive = index === activePosition;
        
        return (
          <div
            key={index}
            className={clsx(
              'w-full h-full border border-gray-700 rounded-md flex items-center justify-center transition-all duration-300',
              { 
                'bg-red-600 scale-105 shadow-md transform': isActive,
                'bg-gray-700 hover:bg-gray-600': !isActive, 
              }
            )}
          >
            {/* Optionally display index for debugging: */}
            {/* <span className="text-xs text-gray-400">{index}</span> */}
          </div>
        );
      })}
    </div>
  );
};

export default GameGrid;
