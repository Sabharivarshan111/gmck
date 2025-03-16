
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
      
      <div className={`flex justify-between items-center text-xs ${
        theme === "dark" ? "text-gray-400" : "text-gray-600"
      } px-2`}>
        <div>Session: {totalMinutes} min</div>
        <div>Water: {waterCount} glasses</div>
      </div>
    </>
  );
};
