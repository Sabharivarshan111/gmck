
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useTripleTap } from '@/hooks/use-triple-tap';
import { AiQuestionTab } from './AiQuestionTab';

interface QuestionCardEnhancedProps {
  question: string;
  index: number;
}

const QuestionCardEnhanced: React.FC<QuestionCardEnhancedProps> = ({ question, index }) => {
  const [showAiTab, setShowAiTab] = useState(false);
  
  const handleTripleTap = useTripleTap(() => {
    setShowAiTab(prevState => !prevState);
    if (!showAiTab) {
      // Add a small delay to ensure smooth transition
      setTimeout(() => {
        document.getElementById(`question-${index}`)?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'center'
        });
      }, 100);
    }
  });

  return (
    <div id={`question-${index}`}>
      <Card 
        className="mb-2 border-gray-800 hover:border-gray-700 transition-colors cursor-pointer" 
        onClick={handleTripleTap}
      >
        <CardContent className="p-3 text-left text-sm">
          <p className="whitespace-pre-wrap">{index + 1}. {question}</p>
        </CardContent>
      </Card>
      
      {showAiTab && (
        <AiQuestionTab question={question} />
      )}
    </div>
  );
};

export default QuestionCardEnhanced;
