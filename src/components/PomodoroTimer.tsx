
import React, { useState, useEffect } from 'react';
import { Timer, X } from 'lucide-react';
import { usePomodoroTimer } from '@/hooks/use-pomodoro-timer';
import { TimerControls } from './pomodoro/TimerControls';
import { TimerDisplay } from './pomodoro/TimerDisplay';
import { TimerProgress } from './pomodoro/TimerProgress';
import { useTheme } from './theme/ThemeProvider';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const PomodoroTimer = () => {
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(true);
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

  // Load visibility preference from localStorage on component mount
  useEffect(() => {
    const savedVisibility = localStorage.getItem('pomodoroVisible');
    if (savedVisibility !== null) {
      setIsVisible(savedVisibility === 'true');
    }
  }, []);

  // Save visibility preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('pomodoroVisible', isVisible.toString());
  }, [isVisible]);

  const toggleVisibility = () => {
    setIsVisible(prev => !prev);
  };

  return (
    <AnimatePresence mode="wait">
      {isVisible ? (
        <motion.div 
          key="timer"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={`fixed bottom-10 left-1/2 transform -translate-x-1/2 ${
            theme === "dark" 
              ? "bg-black border border-white/20" 
              : "bg-white border border-gray-300"
            } rounded-full px-8 py-4 shadow-lg w-[80%] max-w-[400px] z-50 mx-auto flex justify-center`}>
          <div className="w-full space-y-2">
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

              <div className="flex items-center gap-2">
                <TimerControls 
                  isRunning={isRunning}
                  toggleTimer={toggleTimer}
                  resetTimer={resetTimer}
                  waterCount={waterCount}
                  setWaterCount={setWaterCount}
                  theme={theme}
                />
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleVisibility}
                  className={`h-8 w-8 rounded-full ${
                    theme === "dark"
                      ? "border-white/70 text-white hover:bg-white/10 hover:text-white"
                      : "border-gray-900 text-gray-900 hover:bg-gray-100 hover:text-black"
                  } transition-all duration-300`}
                  aria-label="Hide Pomodoro Timer"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <TimerProgress 
              progressPercentage={progressPercentage}
              totalTime={totalTime}
              waterCount={waterCount}
              theme={theme}
            />
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="toggle-button"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-50"
        >
          <Button
            onClick={toggleVisibility}
            className={`rounded-full p-3 shadow-lg transition-all duration-300 hover:scale-105 ${
              theme === "dark"
                ? "bg-black border border-white/30 text-white hover:bg-gray-900"
                : "bg-white border border-gray-300 text-gray-900 hover:bg-gray-100"
            }`}
            size="icon"
            variant="outline"
            aria-label="Show Pomodoro Timer"
          >
            <Timer className="w-5 h-5" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PomodoroTimer;
