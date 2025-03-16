
import React from 'react';
import { Progress } from '../ui/progress';

interface TimerProgressProps {
  progressPercentage: number;
  totalTime: number;
  waterCount: number;
  theme: "dark" | "light";
}

export const TimerProgress: React.FC<TimerProgressProps> = ({
  progressPercentage,
  totalTime,
  waterCount,
  theme
}) => {
  const totalMinutes = Math.floor(totalTime / 60);
  
  return (
    <>
      <div className="w-full px-2">
        <Progress 
          value={progressPercentage} 
          className={`h-1.5 ${theme === "dark" ? "bg-gray-800" : "bg-gray-200"}`} 
          indicatorClassName={theme === "dark" ? "bg-white" : "bg-gray-900"} 
        />
      </div>
      
      <div className="flex justify-between items-center text-xs px-2 mt-1">
        <div className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
          Session: {totalMinutes} min
        </div>
        <div className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
          Water: {waterCount} glasses
        </div>
      </div>
    </>
  );
};
