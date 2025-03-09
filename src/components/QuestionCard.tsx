
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
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="relative"
    >
      <Card 
        className={`bg-gray-900/50 border-gray-800/50 hover:bg-gray-900/70 transition-all duration-300 mb-2 relative overflow-hidden ${
          showAnimation ? 'ring-2 ring-blue-400/50' : ''
        }`}
        onClick={handleTouch}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0 mt-1">
              <Checkbox
                checked={isCompleted}
                onCheckedChange={(checked) => handleCheckedChange(checked as boolean)}
                className="h-5 w-5 border-gray-600 data-[state=checked]:border-gray-400"
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className={`text-base font-medium break-words pr-2 ${
                isCompleted ? 'text-gray-500' : 'text-gray-200'
              }`}>
                {cleanedQuestionText}
              </p>
              
              {isLoadingAI && (
                <p className="text-xs text-blue-400 mt-1 animate-pulse">
                  Getting answer... (may take up to 30 seconds)
                </p>
              )}
              
              {isRateLimited ? (
                <p className="text-xs text-amber-400 mt-1">
                  Rate limit reached. Please wait before trying again.
                </p>
              ) : (
                <p className="text-xs text-gray-400 mt-1">
                  Triple tap to get AI explanation
                </p>
              )}
            </div>
            
            <div className="flex-shrink-0">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-800 text-gray-300 text-sm">
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
