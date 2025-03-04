
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';

export function usePomodoroTimer(initialMinutes: number = 25) {
  const [minutes, setMinutes] = useState(initialMinutes);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(initialMinutes.toString());
  const [waterCount, setWaterCount] = useState(0);
  const [totalTime, setTotalTime] = useState(initialMinutes * 60); // Total time in seconds
  const [remainingTime, setRemainingTime] = useState(initialMinutes * 60); // Remaining time in seconds
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRemainingTime(minutes * 60 + seconds);
  }, [minutes, seconds]);
  
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    if (isRunning) {
      intervalId = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
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
    if (value === '' || /^\d+$/.test(value)) {
      setInputValue(value);
    }
  }, []);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const newMinutes = inputValue === '' ? 25 : parseInt(inputValue, 10);
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

  const progressPercentage = Math.max(0, Math.min(100, (remainingTime / totalTime) * 100));

  return {
    minutes,
    seconds,
    isRunning,
    isEditing,
    inputValue,
    waterCount,
    totalTime,
    remainingTime,
    progressPercentage,
    inputRef,
    setWaterCount,
    toggleTimer,
    resetTimer,
    handleInputChange,
    handleSubmit,
    startEditing,
    handleKeyDown
  };
}
