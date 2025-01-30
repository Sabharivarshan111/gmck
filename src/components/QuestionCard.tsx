import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import AIChatWindow from "./AIChatWindow";

interface QuestionCardProps {
  question: string;
  index: number;
}

const QuestionCard = ({ question, index }: QuestionCardProps) => {
  const [isCompleted, setIsCompleted] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [chatPosition, setChatPosition] = useState<{ top: number; left: number } | undefined>();
  const cardRef = useRef<HTMLDivElement>(null);
  
  const pageNumberMatch = question.match(/\(Pg\.No: ([^)]+)\)/);
  const pageNumbers = pageNumberMatch ? pageNumberMatch[1] : "";

  const handleQuestionClick = () => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setChatPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left
      });
    }
    setIsAIChatOpen(true);
  };

  return (
    <div ref={cardRef} className="relative">
      <Card className="transition-all duration-200 hover:shadow-md cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <Checkbox
                checked={isCompleted}
                onCheckedChange={(checked) => setIsCompleted(checked as boolean)}
                className="h-5 w-5"
              />
            </div>
            <div className="flex-1" onClick={handleQuestionClick}>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {question.replace(/\(Pg\.No: [^)]+\)/, '')}
              </p>
              {pageNumbers && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Page: {pageNumbers}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      <AIChatWindow 
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        question={question}
        position={chatPosition}
      />
    </div>
  );
};

export default QuestionCard;