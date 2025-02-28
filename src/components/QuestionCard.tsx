
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";

interface QuestionCardProps {
  question: string;
  index: number;
}

const QuestionCard = ({ question, index }: QuestionCardProps) => {
  // Generate a unique ID for this question based on its content
  const questionId = `question-${btoa(question).substring(0, 24)}`;
  const [isCompleted, setIsCompleted] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  
  // Load saved state from localStorage on component mount
  useEffect(() => {
    const savedState = localStorage.getItem(questionId);
    if (savedState !== null) {
      setIsCompleted(savedState === 'true');
    }
  }, [questionId]);
  
  // Save to localStorage when state changes
  const handleCheckedChange = (checked: boolean) => {
    setIsCompleted(checked);
    localStorage.setItem(questionId, checked.toString());
    
    // Trigger animation
    setShowAnimation(true);
    setTimeout(() => setShowAnimation(false), 800); // Animation lasts less than 1 second
  };
  
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
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              <Checkbox
                checked={isCompleted}
                onCheckedChange={(checked) => handleCheckedChange(checked as boolean)}
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
      
      {/* Snow/Sparkle Animation */}
      <AnimatePresence>
        {showAnimation && (
          <>
            {/* Create multiple particles for snow/sparkle effect */}
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  opacity: 1,
                  scale: 0,
                  x: Math.random() * 100 - 50, // Random horizontal position
                  y: Math.random() * 100 - 50  // Random vertical position
                }}
                animate={{ 
                  opacity: 0,
                  scale: Math.random() * 0.5 + 0.5,
                  x: (Math.random() * 200 - 100),
                  y: (Math.random() * 200 - 100)
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-blue-400/70 pointer-events-none"
              />
            ))}
            
            {/* Overlay glow effect */}
            <motion.div
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 bg-blue-400/20 pointer-events-none rounded-lg"
            />
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default QuestionCard;
