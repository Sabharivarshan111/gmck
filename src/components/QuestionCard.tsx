
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useTripleTap } from '@/hooks/use-triple-tap';
import { useTheme } from '@/components/theme/ThemeProvider';

interface QuestionCardProps {
  question: string;
  index: number;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, index }) => {
  const [isCompleted, setIsCompleted] = useState(false);
  const [tapStatus, setTapStatus] = useState<'idle' | 'processing'>('idle');
  const asteriskCount = countAsterisks(question);
  const { theme } = useTheme();
  
  // Generate a unique ID for the question for localStorage
  const questionId = `question-${question.slice(0, 50).replace(/\s+/g, '-')}`;
  
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
    // Get the cleaned question text without asterisks, years, etc.
    const cleanedQuestion = getCleanQuestionText(question);
    
    // Show processing animation
    setTapStatus('processing');
    
    // Create a custom event to notify the AiChat component
    const event = new CustomEvent('ai-triple-tap-answer', {
      detail: { question: cleanedQuestion }
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

  // Enhanced card styling to ensure visibility in all themes
  const getCardBgClass = () => {
    if (theme === "blackpink") {
      return "bg-black border-[#FFDEE2] border-2 shadow-[0_0_10px_rgba(255,222,226,0.2)]"; 
    }
    return "bg-background border-gray-800 hover:border-gray-700";
  };

  // Enhanced text styling
  const getTextClass = () => {
    if (theme === "blackpink") {
      return "text-[#FFDEE2]";
    }
    return "";
  };

  return (
    <div id={`question-${index}`}>
      <Card 
        className={`mb-2 ${getCardBgClass()} transition-colors cursor-pointer question-card relative`}
        onClick={handleTripleTap}
      >
        <CardContent className="p-3 text-left text-sm flex items-start justify-between">
          <div className="flex items-start gap-2">
            <div className={`mt-0.5 flex-shrink-0 relative ${theme === "blackpink" ? "z-30" : ""}`}>
              <Checkbox 
                id={`checkbox-${index}`}
                checked={isCompleted}
                onCheckedChange={handleCheckboxChange}
                onClick={(e) => e.stopPropagation()} // Prevent triple tap when clicking the checkbox
                className={`${theme === "blackpink" ? "!border-[#FFDEE2] !border-2 !bg-black hover:!bg-black/80" : ""}`}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center mb-1">
                <span className={`text-[10px] ${theme === "blackpink" ? "text-[#FFDEE2]" : "text-blue-500"}`}>
                  {tapStatus === 'idle' ? (
                    "Triple tap to ask AI"
                  ) : (
                    <span className="animate-pulse">Getting answer...</span>
                  )}
                </span>
              </div>
              <p className={`whitespace-pre-wrap ${getTextClass()}`}>
                {getCleanQuestionText(question)}
              </p>
            </div>
          </div>
          
          {asteriskCount > 0 && (
            <Badge 
              variant="outline" 
              className={`rounded-full h-6 w-6 flex-shrink-0 p-0 flex items-center justify-center relative ${
                theme === "blackpink" ? "!bg-black !text-[#FFDEE2] !border-[#FFDEE2] !border-2 z-30" : "bg-gray-800 text-white border-gray-700"
              } ml-2 text-xs badge`}
              onClick={(e) => e.stopPropagation()} // Prevent triple tap when clicking the badge
            >
              {asteriskCount}
            </Badge>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Count asterisks in the question string
function countAsterisks(question: string): number {
  // Find the pattern of asterisks like ** or **** etc.
  const asteriskMatch = question.match(/\*+/);
  if (asteriskMatch) {
    return asteriskMatch[0].length;
  }
  
  // Count years in parentheses as a fallback
  const yearMatches = question.match(/\([A-Za-z]{3}\s\d{2}(?:;[A-Za-z]{3}\s\d{2})*\)/g);
  if (yearMatches && yearMatches.length > 0) {
    // Count the number of years (each separated by a semicolon)
    const firstMatch = yearMatches[0];
    const yearCount = (firstMatch.match(/;/g) || []).length + 1;
    return yearCount;
  }
  
  // If no asterisks or years found, return a default value
  return 1;
}

// Clean the question text for display and AI processing
function getCleanQuestionText(question: string): string {
  // Remove any number prefix like "1. " at the beginning
  let cleaned = question.replace(/^\d+\.\s/, '');
  
  // Remove the asterisk pattern and everything between it and the page number
  cleaned = cleaned.replace(/\*+\s*\([A-Za-z]{3}\s\d{2}(?:;[A-Za-z]{3}\s\d{2})*\)(?:\s*\(Pg\.No:\s*\d+(?:;\s*Pg\.No:\s*\d+)*\))?/, '');
  
  // If no asterisks were present, try to remove just the page number reference
  cleaned = cleaned.replace(/\s*\(Pg\.No:\s*\d+(?:;\s*Pg\.No:\s*\d+)*\)/, '');
  
  return cleaned;
}

export default QuestionCard;
