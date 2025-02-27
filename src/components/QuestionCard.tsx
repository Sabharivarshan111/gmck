
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
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card 
        className="bg-gray-900/50 border-gray-800/50 hover:bg-gray-900/70 transition-all duration-300 mb-2"
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              <Checkbox
                checked={isCompleted}
                onCheckedChange={(checked) => setIsCompleted(checked as boolean)}
                className="h-5 w-5 border-gray-600 data-[state=checked]:border-gray-400"
              />
            </div>
            <div className="flex-1">
              <p className={`text-base font-medium whitespace-pre-wrap ${
                isCompleted ? 'text-gray-500' : 'text-gray-200'
              }`}>
                {question.replace(/\(Pg\.No: [^)]+\)/, '')}
              </p>
            </div>
            <div className="flex-shrink-0 ml-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-800 text-gray-300 text-sm">
                1
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default QuestionCard;
