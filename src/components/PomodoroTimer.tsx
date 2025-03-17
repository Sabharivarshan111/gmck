import React, { useState, useEffect } from 'react';
import { useTheme } from "@/components/theme/ThemeProvider";

interface PomodoroTimerProps {
  workTime?: number;
  breakTime?: number;
}

const PomodoroTimer = ({ workTime = 25, breakTime = 5 }: PomodoroTimerProps = {}) => {
  const [timeLeft, setTimeLeft] = useState(workTime * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const { theme } = useTheme();

  const bgColor = theme === "dark" 
    ? "bg-gray-900" 
    : theme === "light" 
      ? "bg-white" 
      : "bg-black"; // blackpink theme

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isActive) {
      intervalId = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    }

    return () => clearInterval(intervalId);
  }, [isActive]);

  useEffect(() => {
    if (timeLeft === 0) {
      setIsActive(false);
      if (isBreak) {
        setTimeLeft(workTime * 60);
        setIsBreak(false);
      } else {
        setTimeLeft(breakTime * 60);
        setIsBreak(true);
      }
    }
  }, [timeLeft, workTime, breakTime, isBreak]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(workTime * 60);
    setIsBreak(false);
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`${bgColor} transition-colors duration-300 rounded-lg p-6 shadow-lg`}>
      <h2 className={`text-2xl font-semibold mb-4 text-center ${
        theme === "dark" 
          ? "text-white" 
          : theme === "light" 
            ? "text-gray-800" 
            : "text-pink-500" // blackpink theme
      }`}>
        {isBreak ? 'Break Time!' : 'Work Time!'}
      </h2>
      <div className={`text-4xl font-bold mb-6 text-center ${
        theme === "dark" 
          ? "text-white" 
          : theme === "light" 
            ? "text-gray-800" 
            : "text-pink-500" // blackpink theme
      }`}>
        {formatTime(timeLeft)}
      </div>
      <div className="flex justify-center gap-4">
        <button 
          onClick={toggleTimer}
          className={`px-4 py-2 rounded-md font-semibold ${
            theme === "dark" 
              ? "bg-gray-700 text-white hover:bg-gray-600" 
              : theme === "light" 
                ? "bg-gray-200 text-gray-800 hover:bg-gray-300" 
                : "bg-pink-700 text-white hover:bg-pink-600" // blackpink theme
          } transition-colors duration-200`}
        >
          {isActive ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={resetTimer}
          className={`px-4 py-2 rounded-md font-semibold ${
            theme === "dark" 
              ? "bg-gray-700 text-white hover:bg-gray-600" 
              : theme === "light" 
                ? "bg-gray-200 text-gray-800 hover:bg-gray-300" 
                : "bg-pink-700 text-white hover:bg-pink-600" // blackpink theme
          } transition-colors duration-200`}
        >
          Reset
        </button>
      </div>
      <div className={`mt-4 text-sm ${
        theme === "dark" 
          ? "text-gray-400" 
          : theme === "light" 
            ? "text-gray-600" 
            : "text-pink-300" // blackpink theme
      }`}>
        {isActive 
          ? isBreak 
            ? 'Enjoy your break!' 
            : 'Keep working hard!' 
          : 'Timer is paused. Click Start to begin.'}
      </div>
    </div>
  );
};

export default PomodoroTimer;
