
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";

interface QuestionCardProps {
  question: string;
  index: number;
}

const QuestionCard = ({ question, index }: QuestionCardProps) => {
  const [isCompleted, setIsCompleted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const pageNumberMatch = question.match(/\(Pg\.No: ([^)]+)\)/);
  const pageNumbers = pageNumberMatch ? pageNumberMatch[1] : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card 
        className={`transition-all duration-300 ${
          isHovered ? 'transform scale-[1.02]' : ''
        } ${
          isCompleted ? 'bg-gray-900 border-gray-700' : 'bg-gray-950 border-gray-800'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <Checkbox
                checked={isCompleted}
                onCheckedChange={(checked) => setIsCompleted(checked as boolean)}
                className="h-5 w-5 border-gray-600 transition-colors duration-200"
              />
            </div>
            <div className="flex-1">
              <p className={`text-sm whitespace-pre-wrap transition-colors duration-200 ${
                isCompleted ? 'text-gray-500 line-through' : 'text-gray-300'
              }`}>
                {question.replace(/\(Pg\.No: [^)]+\)/, '')}
              </p>
              {pageNumbers && (
                <p className="text-xs text-gray-500 mt-2 transition-opacity duration-200">
                  Page: {pageNumbers}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default QuestionCard;
