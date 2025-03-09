
import { useState, useEffect } from "react";

export const useQuestionCompletion = (questionId: string) => {
  const [isCompleted, setIsCompleted] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  
  useEffect(() => {
    const savedState = localStorage.getItem(questionId);
    if (savedState !== null) {
      setIsCompleted(savedState === 'true');
    }
  }, [questionId]);
  
  const handleCheckedChange = (checked: boolean) => {
    setIsCompleted(checked);
    localStorage.setItem(questionId, checked.toString());
    
    setShowAnimation(true);
    setTimeout(() => setShowAnimation(false), 800);
  };
  
  return {
    isCompleted,
    showAnimation,
    handleCheckedChange
  };
};
