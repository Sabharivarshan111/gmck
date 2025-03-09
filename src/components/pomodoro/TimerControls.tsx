
import React from 'react';
import { Pause, Play, RotateCcw, Droplets } from 'lucide-react';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';

interface TimerControlsProps {
  isRunning: boolean;
  toggleTimer: () => void;
  resetTimer: () => void;
  waterCount: number;
  setWaterCount: React.Dispatch<React.SetStateAction<number>>;
  theme: "dark" | "light";
}

export const TimerControls: React.FC<TimerControlsProps> = ({
  isRunning,
  toggleTimer,
  resetTimer,
  waterCount,
  setWaterCount,
  theme
}) => {
  const { toast } = useToast();

  const drinkWater = () => {
    setWaterCount(prev => prev + 1);
    toast({
      title: "Water break!",
      description: `You've had ${waterCount + 1} glasses of water today. Stay hydrated!`,
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={toggleTimer}
        className={`h-8 w-8 rounded-full ${
          theme === "dark"
            ? "border-white text-white hover:bg-white hover:text-black"
            : "border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white"
        }`}
        aria-label={isRunning ? "Pause timer" : "Start timer"}
      >
        {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={resetTimer}
        className={`h-8 w-8 rounded-full ${
          theme === "dark"
            ? "border-white text-white hover:bg-white hover:text-black"
            : "border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white"
        }`}
        aria-label="Reset timer"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={drinkWater}
        className="h-8 w-8 rounded-full border-blue-500 bg-blue-500/20 text-blue-500 hover:bg-blue-500 hover:text-white"
        aria-label="Track water intake"
      >
        <Droplets className="h-4 w-4" />
      </Button>
    </div>
  );
};
