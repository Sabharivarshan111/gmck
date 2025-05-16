
import React from 'react';
import { Progress } from '../ui/progress';

interface TimerProgressProps {
  progressPercentage: number;
  totalTime: number;
  waterCount: number;
  theme: "dark" | "light" | "blackpink";
}

export const TimerProgress: React.FC<TimerProgressProps> = ({
  progressPercentage,
  totalTime,
  waterCount,
  theme
}) => {
  const totalMinutes = Math.floor(totalTime / 60);
  
  // Get theme-specific styles
  const getProgressStyles = () => {
    if (theme === "blackpink") {
      return {
        bg: "bg-black",
        text: "text-pink-400"
      };
    } else if (theme === "dark") {
      return {
        bg: "bg-gray-800",
        text: "text-gray-400"
      };
    } else {
      return {
        bg: "bg-gray-200",
        text: "text-gray-600"
      };
    }
  };
  
  const styles = getProgressStyles();
  
  return (
    <>
      <div className="w-full px-2">
        <Progress 
          value={progressPercentage} 
          className={`h-1.5 ${styles.bg}`} 
        />
      </div>
      
      <div className={`flex justify-between items-center text-xs ${styles.text} px-2`}>
        <div>Session: {totalMinutes} min</div>
        <div>Water: {waterCount} glasses</div>
      </div>
    </>
  );
};
