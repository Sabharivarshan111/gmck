
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { generateQuestionId, getDisplayNumber, cleanQuestionText } from "@/utils/questionUtils";
import { useTripleTap } from "@/hooks/use-triple-tap";
import { useAiAnswer } from "@/hooks/use-ai-answer";
import { useQuestionCompletion } from "@/hooks/use-question-completion";
import CompletionAnimation from "./question-card/CompletionAnimation";

interface QuestionCardProps {
  question: string;
  index: number;
}

const QuestionCard = ({ question, index }: QuestionCardProps) => {
  const questionId = generateQuestionId(question);
  const { isCompleted, showAnimation, handleCheckedChange } = useQuestionCompletion(questionId);
  const { isLoadingAI, isRateLimited, handleGetAnswer } = useAiAnswer(question);
  const { handleTouch } = useTripleTap({ onTripleTap: handleGetAnswer });
  
  const cleanedQuestionText = cleanQuestionText(question);
  const displayNumber = getDisplayNumber(question);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="relative w-full h-full"
    >
      <Card 
        className={`bg-gray-900/50 border-gray-800/50 hover:bg-gray-900/70 transition-all duration-300 h-full ${
          showAnimation ? 'ring-2 ring-blue-400/50' : ''
        }`}
        onClick={handleTouch}
      >
        <CardContent className="p-1.5 sm:p-2 h-full">
          <div className="flex gap-1.5 items-start h-full">
            <div className="flex-shrink-0 pt-0.5">
              <Checkbox
                checked={isCompleted}
                onCheckedChange={(checked) => handleCheckedChange(checked as boolean)}
                className="h-3.5 w-3.5 border-gray-600 data-[state=checked]:border-gray-400"
              />
            </div>
            
            <div className="flex-grow pr-1 min-w-0">
              <p className={`text-xs sm:text-sm font-medium break-words line-clamp-3 ${
                isCompleted ? 'text-gray-500' : 'text-gray-200'
              }`}>
                {cleanedQuestionText}
              </p>
              
              {isLoadingAI && (
                <p className="text-xs text-blue-400 mt-0.5 animate-pulse">
                  Getting answer...
                </p>
              )}
              
              {isRateLimited ? (
                <p className="text-[10px] text-amber-400 mt-0.5">
                  Rate limited
                </p>
              ) : (
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Triple tap for AI
                </p>
              )}
            </div>
            
            <div className="flex-shrink-0">
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-800 text-gray-300 text-[10px]">
                {displayNumber}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <CompletionAnimation show={showAnimation} />
    </motion.div>
  );
};

export default QuestionCard;
