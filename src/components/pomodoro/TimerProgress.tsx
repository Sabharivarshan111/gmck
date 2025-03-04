
import React from 'react';
import { Progress } from '../ui/progress';

interface TimerProgressProps {
  progressPercentage: number;
  totalTime: number;
  waterCount: number;
}

export const TimerProgress: React.FC<TimerProgressProps> = ({
  progressPercentage,
  totalTime,
  waterCount,
}) => {
  const totalMinutes = Math.floor(totalTime / 60);
  
  return (
    <>
      <div className="w-full px-2">
        <Progress value={progressPercentage} className="h-1.5 bg-gray-800" indicatorClassName="bg-white" />
      </div>
      
      <div className="flex justify-between items-center text-xs text-gray-400 px-2">
        <div>Session: {totalMinutes} min</div>
        <div>Water: {waterCount} glasses</div>
      </div>
    </>
  );
};
