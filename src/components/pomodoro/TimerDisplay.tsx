
import React, { useRef } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

interface TimerDisplayProps {
  isEditing: boolean;
  isRunning: boolean;
  minutes: number;
  seconds: number;
  inputValue: string;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  startEditing: () => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleSubmit: (e?: React.FormEvent) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  isEditing,
  isRunning,
  minutes,
  seconds,
  inputValue,
  setInputValue,
  startEditing,
  handleInputChange,
  handleKeyDown,
  handleSubmit,
  inputRef,
}) => {
  return (
    <>
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
    </>
  );
};
