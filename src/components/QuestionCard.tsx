
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
  
  const questionId = `question-${question.slice(0, 50).replace(/\s+/g, '-')}`;
  const pageNumber = extractPageNumber(question);
  
  useEffect(() => {
    const savedStatus = localStorage.getItem(questionId);
    if (savedStatus) {
      setIsCompleted(savedStatus === 'true');
    }
  }, [questionId]);
  
  useEffect(() => {
    localStorage.setItem(questionId, isCompleted.toString());
  }, [isCompleted, questionId]);
  
  const handleTripleTap = useTripleTap(() => {
    const cleanedQuestion = getCleanQuestionText(question);
    setTapStatus('processing');
    const event = new CustomEvent('ai-triple-tap-answer', {
      detail: { question: cleanedQuestion }
    });
    window.dispatchEvent(event);
    setTimeout(() => {
      const chatSection = document.querySelector('.ai-chat-section');
      chatSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        setTapStatus('idle');
      }, 3000);
    }, 100);
  });
  
  const handleCheckboxChange = (checked: boolean) => {
    setIsCompleted(checked);
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const getCardBgClass = () => {
    if (theme === "blackpink") {
      return "bg-black border-[#FFDEE2] border-2 shadow-[0_0_10px_rgba(255,222,226,0.2)]"; 
    }
    return "bg-background border-gray-800 hover:border-gray-700";
  };

  const getTextClass = () => {
    if (theme === "blackpink") {
      return "text-[#FFDEE2]";
    }
    return "";
  };

  const getCheckboxClass = () => {
    if (theme === "blackpink") {
      return "!bg-transparent !border-[#FFDEE2] shadow-[0_0_5px_rgba(255,222,226,0.5)] relative z-40";
    }
    return "";
  };

  const getBadgeClass = () => {
    if (theme === "blackpink") {
      return "!bg-transparent !border-[#FFDEE2] !text-[#FFDEE2] shadow-[0_0_5px_rgba(255,222,226,0.5)] relative z-40";
    }
    return "bg-gray-800 text-white border-gray-700";
  };

  const getPageNumberClass = () => {
    if (theme === "blackpink") {
      return "text-[#B3DEFF] ml-2";
    }
    return "text-blue-300 ml-2";
  };

  return (
    <div id={`question-${index}`}>
      <Card 
        className={`mb-2 ${getCardBgClass()} transition-colors cursor-pointer question-card relative`}
        onClick={handleTripleTap}
      >
        <CardContent className="p-3 text-left text-sm flex items-start justify-between">
          <div className="flex items-start gap-2">
            <div 
              className="mt-0.5 flex-shrink-0 relative cursor-pointer"
              onClick={handleCheckboxClick}
            >
              <Checkbox 
                id={`checkbox-${index}`}
                checked={isCompleted}
                onCheckedChange={handleCheckboxChange}
                className={getCheckboxClass()}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center mb-1">
                <span className={`text-[10px] ${theme === "blackpink" ? "text-[#FFDEE2]" : "text-blue-500"}`}>
                  {tapStatus === 'idle' ? (
                    <span className="flex items-center">
                      Triple tap to ask AI
                      {pageNumber && (
                        <span className={getPageNumberClass()}>
                          Pg. {pageNumber}
                        </span>
                      )}
                    </span>
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
              className={`rounded-full h-6 w-6 flex-shrink-0 p-0 flex items-center justify-center ${getBadgeClass()} ml-2 text-xs badge`}
              onClick={(e) => e.stopPropagation()}
            >
              {asteriskCount}
            </Badge>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

function countAsterisks(question: string): number {
  // Count explicit asterisks in the format "****" at the beginning of the text
  const explicitAsterisks = question.match(/\*+\s*\(/);
  if (explicitAsterisks) {
    return explicitAsterisks[0].replace(/[^*]/g, '').length;
  }
  
  // Count asterisks that appear right after the question text
  const asteriskPattern = /\s(\*+)\s/;
  const asteriskMatch = question.match(asteriskPattern);
  if (asteriskMatch && asteriskMatch[1]) {
    return asteriskMatch[1].length;
  }
  
  // Count the number of exam dates in parentheses
  const datePattern = /\(((?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Jul)\s\d{2}(?:;)?)+)\)/;
  const dateMatch = question.match(datePattern);
  
  if (dateMatch && dateMatch[1]) {
    // Count the number of dates by counting the semicolons and adding 1
    const dates = dateMatch[1].split(';');
    return dates.length;
  }
  
  // If no asterisks or dates found, return 0 or 1 based on your requirements
  return question.includes('(') ? 1 : 0;
}

function extractPageNumber(question: string): string | null {
  // Extract page number(s) from the format "Pg.No: X" or "Pg.No: X;AP3-Pg.No: Y"
  const pageMatch = question.match(/\(Pg\.No:\s*(\d+)(?:;AP3-Pg\.No:\s*\d+)?\)/);
  if (pageMatch && pageMatch[1]) {
    return pageMatch[1];
  }
  return null;
}

function getCleanQuestionText(question: string): string {
  // Don't remove any of the important details
  // Just remove the numbering at the beginning if present
  let cleaned = question.replace(/^\d+\.\s/, '');
  return cleaned;
}

export default QuestionCard;
