
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useTripleTap } from '@/hooks/use-triple-tap';

interface QuestionCardEnhancedProps {
  question: string;
  index: number;
}

const QuestionCardEnhanced: React.FC<QuestionCardEnhancedProps> = ({ question, index }) => {
  const [isCompleted, setIsCompleted] = useState(false);
  
  // Generate a unique ID for the question for localStorage
  const questionId = `question-enhanced-${index}`;
  
  // Load completion status from localStorage on mount
  useEffect(() => {
    const savedStatus = localStorage.getItem(questionId);
    if (savedStatus) {
      setIsCompleted(savedStatus === 'true');
    }
  }, [questionId]);
  
  // Save completion status to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(questionId, isCompleted.toString());
  }, [isCompleted, questionId]);
  
  const handleTripleTap = useTripleTap(() => {
    // Create a custom event to notify the AiChat component
    const event = new CustomEvent('ai-triple-tap-answer', {
      detail: { question }
    });
    
    // Dispatch the event
    window.dispatchEvent(event);
    
    // Add a small delay to ensure the chat section is in view
    setTimeout(() => {
      const chatSection = document.querySelector('.ai-chat-section');
      chatSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  });
  
  const handleCheckboxChange = (checked: boolean) => {
    setIsCompleted(checked);
  };

  return (
    <div id={`question-enhanced-${index}`}>
      <Card 
        className="mb-2 border-gray-800 hover:border-gray-700 transition-colors cursor-pointer question-card" 
        onClick={handleTripleTap}
      >
        <CardContent className="p-3 text-left text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox 
              id={`checkbox-enhanced-${index}`}
              checked={isCompleted}
              onCheckedChange={handleCheckboxChange}
              onClick={(e) => e.stopPropagation()} // Prevent triple tap when clicking the checkbox
              className="mr-1"
            />
            <p className="whitespace-pre-wrap">{index + 1}. {question}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuestionCardEnhanced;
