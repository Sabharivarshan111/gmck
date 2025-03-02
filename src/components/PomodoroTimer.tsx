
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Timer, Pause, Play, RotateCcw, Droplets } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from './ui/use-toast';
import { Progress } from './ui/progress';

const PomodoroTimer = () => {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('25');
  const [waterCount, setWaterCount] = useState(0);
  const [totalTime, setTotalTime] = useState(25 * 60); // Total time in seconds
  const [remainingTime, setRemainingTime] = useState(25 * 60); // Remaining time in seconds
  const inputRef = useRef<HTMLInputElement>(null);

  // Recalculate remaining time when minutes/seconds change
  useEffect(() => {
    setRemainingTime(minutes * 60 + seconds);
  }, [minutes, seconds]);
  
  // Timer logic
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    if (isRunning) {
      intervalId = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            // Timer finished
            clearInterval(intervalId as NodeJS.Timeout);
            setIsRunning(false);
            setMinutes(0);
            setSeconds(0);
            toast({
              title: "Time's up!",
              description: "Your Pomodoro session has ended.",
            });
            return 0;
          }
          
          const newRemaining = prev - 1;
          setMinutes(Math.floor(newRemaining / 60));
          setSeconds(newRemaining % 60);
          return newRemaining;
        });
      }, 1000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRunning]);
  
  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const toggleTimer = useCallback(() => {
    setIsRunning(prev => !prev);
  }, []);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    const mins = parseInt(inputValue, 10) || 25;
    setMinutes(mins);
    setSeconds(0);
    setTotalTime(mins * 60);
    setRemainingTime(mins * 60);
  }, [inputValue]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string or numbers
    if (value === '' || /^\d+$/.test(value)) {
      setInputValue(value);
    }
  }, []);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Default to 25 if empty or invalid
    const newMinutes = inputValue === '' ? 25 : parseInt(inputValue, 10);
    
    // Validate min/max values
    const validMinutes = Math.min(Math.max(1, newMinutes), 99);
    
    setMinutes(validMinutes);
    setSeconds(0);
    setTotalTime(validMinutes * 60);
    setRemainingTime(validMinutes * 60);
    setInputValue(validMinutes.toString());
    setIsEditing(false);
  }, [inputValue]);

  const startEditing = useCallback(() => {
    if (!isRunning) {
      setIsEditing(true);
      setInputValue(minutes.toString());
    }
  }, [isRunning, minutes]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setInputValue(minutes.toString());
    }
  }, [handleSubmit, minutes]);

  const drinkWater = useCallback(() => {
    setWaterCount(prev => prev + 1);
    toast({
      title: "Water break!",
      description: `You've had ${waterCount + 1} glasses of water today. Stay hydrated!`,
    });
  }, [waterCount]);

  const progressPercentage = Math.max(0, Math.min(100, (remainingTime / totalTime) * 100));

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-black border border-white rounded-full px-8 py-3 shadow-lg min-w-[300px] z-50 animate-fade-in">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <Timer className="w-5 h-5 text-white" />
          
          {isEditing ? (
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <Input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onBlur={handleSubmit}
                className="w-16 h-8 text-center bg-transparent text-white border-white focus:ring-2 focus:ring-white"
                maxLength={2}
                aria-label="Set minutes"
              />
              <Button 
                type="submit"
                variant="outline" 
                size="sm"
                className="h-8 text-white border-white hover:bg-white hover:text-black rounded-full"
              >
                Set
              </Button>
            </form>
          ) : (
            <div 
              className="text-2xl font-mono text-white cursor-pointer"
              onClick={startEditing}
            >
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTimer}
              className="h-8 w-8 rounded-full border-white text-white hover:bg-white hover:text-black"
              aria-label={isRunning ? "Pause timer" : "Start timer"}
            >
              {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={resetTimer}
              className="h-8 w-8 rounded-full border-white text-white hover:bg-white hover:text-black"
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
        </div>
        
        <div className="w-full px-2">
          <Progress value={progressPercentage} className="h-1.5 bg-gray-800" indicatorClassName="bg-white" />
        </div>
        
        <div className="flex justify-between items-center text-xs text-gray-400 px-2">
          <div>Session: {inputValue} min</div>
          <div>Water: {waterCount} glasses</div>
        </div>
      </div>
    </div>
  );
};

export default PomodoroTimer;
