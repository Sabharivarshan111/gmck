
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
        className={`bg-gray-900/50 border-gray-800/50 hover:bg-gray-900/70 transition-all duration-300 h-full min-h-[120px] ${
          showAnimation ? 'ring-2 ring-blue-400/50' : ''
        }`}
        onClick={handleTouch}
      >
        <CardContent className="p-5 sm:p-6 h-full">
          <div className="flex gap-4 items-start h-full">
            <div className="flex-shrink-0 pt-1">
              <Checkbox
                checked={isCompleted}
                onCheckedChange={(checked) => handleCheckedChange(checked as boolean)}
                className="h-5 w-5 border-gray-600 data-[state=checked]:border-gray-400"
              />
            </div>
            
            <div className="flex-grow min-w-0">
              <p className={`text-base sm:text-lg font-medium break-words leading-relaxed ${
                isCompleted ? 'text-gray-500' : 'text-gray-200'
              }`}>
                {cleanedQuestionText}
              </p>
              
              {isLoadingAI && (
                <p className="text-sm sm:text-base text-blue-400 mt-3 animate-pulse">
                  Getting answer...
                </p>
              )}
              
              {isRateLimited ? (
                <p className="text-xs sm:text-sm text-amber-400 mt-3">
                  Rate limited
                </p>
              ) : (
                <p className="text-xs sm:text-sm text-gray-400 mt-3">
                  Triple tap for AI
                </p>
              )}
            </div>
            
            <div className="flex-shrink-0 ml-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-800 text-gray-300 text-sm sm:text-base font-medium">
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
