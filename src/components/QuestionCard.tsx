
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

interface QuestionCardProps {
  question: string;
  index: number;
}

const QuestionCard = ({ question, index }: QuestionCardProps) => {
  const [isCompleted, setIsCompleted] = useState(false);
  
  const pageNumberMatch = question.match(/\(Pg\.No: ([^)]+)\)/);
  const pageNumbers = pageNumberMatch ? pageNumberMatch[1] : "";

  return (
    <Card className="transition-all duration-200 hover:bg-gray-800 bg-gray-900 border-gray-800">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <Checkbox
              checked={isCompleted}
              onCheckedChange={(checked) => setIsCompleted(checked as boolean)}
              className="border-gray-600"
            />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-300 whitespace-pre-wrap">
              {question.replace(/\(Pg\.No: [^)]+\)/, '')}
            </p>
            {pageNumbers && (
              <p className="text-xs text-gray-500 mt-2">
                Page: {pageNumbers}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionCard;
