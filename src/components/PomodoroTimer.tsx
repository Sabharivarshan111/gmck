
import React from 'react';
import { Timer } from 'lucide-react';
import { usePomodoroTimer } from '@/hooks/use-pomodoro-timer';
import { TimerControls } from './pomodoro/TimerControls';
import { TimerDisplay } from './pomodoro/TimerDisplay';
import { TimerProgress } from './pomodoro/TimerProgress';
import { useTheme } from './theme/ThemeProvider';

const PomodoroTimer = () => {
  const { theme } = useTheme();
  const {
    minutes,
    seconds,
    isRunning,
    isEditing,
    inputValue,
    setInputValue,
    waterCount,
    progressPercentage,
    totalTime,
    inputRef,
    setWaterCount,
    toggleTimer,
    resetTimer,
    handleInputChange,
    handleSubmit,
    startEditing,
    handleKeyDown
  } = usePomodoroTimer();

  return (
    <div className={`fixed bottom-10 left-1/2 transform -translate-x-1/2 ${
      theme === "dark" 
        ? "bg-black border border-white" 
        : "bg-white border border-gray-300"
      } rounded-full px-8 py-3 shadow-lg min-w-[300px] z-50 animate-fade-in`}>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <Timer className={`w-5 h-5 ${theme === "dark" ? "text-white" : "text-gray-900"}`} />
          
          <TimerDisplay 
            isEditing={isEditing}
            isRunning={isRunning}
            minutes={minutes}
            seconds={seconds}
            inputValue={inputValue}
            setInputValue={setInputValue}
            startEditing={startEditing}
            handleInputChange={handleInputChange}
            handleKeyDown={handleKeyDown}
            handleSubmit={handleSubmit}
            inputRef={inputRef}
            theme={theme}
          />

          <TimerControls 
            isRunning={isRunning}
            toggleTimer={toggleTimer}
            resetTimer={resetTimer}
            waterCount={waterCount}
            setWaterCount={setWaterCount}
            theme={theme}
          />
        </div>
        
        <TimerProgress 
          progressPercentage={progressPercentage}
          totalTime={totalTime}
          waterCount={waterCount}
          theme={theme}
        />
      </div>
    </div>
  );
};

export default PomodoroTimer;
