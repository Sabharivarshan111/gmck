import React, { useState, useEffect } from 'react';
import { Timer, Pause, Play, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from './ui/use-toast';

const PomodoroTimer = () => {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [inputMinutes, setInputMinutes] = useState(25);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning) {
      interval = setInterval(() => {
        if (seconds > 0) {
          setSeconds(seconds - 1);
        } else if (minutes > 0) {
          setMinutes(minutes - 1);
          setSeconds(59);
        } else {
          clearInterval(interval);
          setIsRunning(false);
          toast({
            title: "Time's up!",
            description: "Your Pomodoro session has ended.",
          });
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, minutes, seconds]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setMinutes(inputMinutes);
    setSeconds(0);
  };

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 0 && value <= 99) {
      setInputMinutes(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMinutes(inputMinutes);
    setSeconds(0);
    setIsEditing(false);
  };

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-black border border-white rounded-full px-6 py-3 shadow-lg min-w-[280px] z-50">
      <div className="flex items-center justify-between gap-4">
        <Timer className="w-5 h-5 text-white" />
        
        {isEditing ? (
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Input
              type="number"
              value={inputMinutes}
              onChange={handleMinutesChange}
              className="w-16 h-8 text-center bg-transparent text-white border-white"
              min="1"
              max="99"
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsEditing(false)}
              className="h-8 text-white border-white hover:bg-white hover:text-black"
            >
              Set
            </Button>
          </form>
        ) : (
          <div 
            className="text-2xl font-mono text-white cursor-pointer"
            onClick={() => setIsEditing(true)}
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
          >
            {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={resetTimer}
            className="h-8 w-8 rounded-full border-white text-white hover:bg-white hover:text-black"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PomodoroTimer;