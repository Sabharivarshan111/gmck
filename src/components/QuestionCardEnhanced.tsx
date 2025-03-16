
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
  const [tapStatus, setTapStatus] = useState<'idle' | 'processing'>('idle');
  
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
    // Show processing animation
    setTapStatus('processing');
    
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
      
      // Reset status after showing animation
      setTimeout(() => {
        setTapStatus('idle');
      }, 3000);
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
        <CardContent className="p-3 text-left text-sm flex items-start justify-between">
          <div className="flex items-start gap-2">
            <Checkbox 
              id={`checkbox-enhanced-${index}`}
              checked={isCompleted}
              onCheckedChange={handleCheckboxChange}
              onClick={(e) => e.stopPropagation()} // Prevent triple tap when clicking the checkbox
              className="mt-0.5 flex-shrink-0"
            />
            <div className="flex-1">
              <div className="flex items-center mb-1">
                <span className="text-[10px] text-blue-500">
                  {tapStatus === 'idle' ? (
                    "Triple tap to ask AI"
                  ) : (
                    <span className="animate-pulse">Getting answer...</span>
                  )}
                </span>
              </div>
              <p className="whitespace-pre-wrap">{index + 1}. {question}</p>
            </div>
          </div>
          
          <Badge 
            variant="outline" 
            className="rounded-full h-6 w-6 flex-shrink-0 p-0 flex items-center justify-center bg-gray-800 text-white text-xs border-gray-700 ml-2"
            onClick={(e) => e.stopPropagation()} // Prevent triple tap when clicking the badge
          >
            1
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuestionCardEnhanced;
