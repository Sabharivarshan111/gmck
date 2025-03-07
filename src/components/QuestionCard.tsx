import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface QuestionCardProps {
  question: string;
  index: number;
}

const QuestionCard = ({ question, index }: QuestionCardProps) => {
  const generateQuestionId = (text: string) => {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `question-${Math.abs(hash)}`;
  };
  
  const questionId = generateQuestionId(question);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const { toast } = useToast();
  
  const touchCount = useRef(0);
  const lastTouchTime = useRef(0);
  const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const getAsteriskCount = (text: string) => {
    const asteriskMatch = text.match(/\*+/);
    return asteriskMatch ? asteriskMatch[0].length : 0;
  };
  
  const getExamDateCount = (text: string) => {
    const datePattern = /\(([^)]*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[^)]*)\)/;
    const dateMatch = text.match(datePattern);
    
    if (dateMatch && dateMatch[1]) {
      return dateMatch[1].split(';').length;
    }
    return 0;
  };
  
  const asteriskCount = getAsteriskCount(question);
  const examDateCount = asteriskCount === 0 ? getExamDateCount(question) : 0;
  
  useEffect(() => {
    const savedState = localStorage.getItem(questionId);
    if (savedState !== null) {
      setIsCompleted(savedState === 'true');
    }
  }, [questionId]);
  
  const handleCheckedChange = (checked: boolean) => {
    setIsCompleted(checked);
    localStorage.setItem(questionId, checked.toString());
    
    setShowAnimation(true);
    setTimeout(() => setShowAnimation(false), 800);
  };
  
  const handleTripleTap = async () => {
    try {
      let cleanQuestion = question
        .replace(/\*+/g, '')
        .replace(/\(Pg\.No: [^)]+\)/, '')
        .replace(/\([^)]*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[^)]*\)/, '')
        .trim();
      
      cleanQuestion = cleanQuestion.replace(/^\d+\.\s*/, '');
      
      const currentPath = window.location.pathname;
      const isPathologyQuestion = currentPath.includes('pathology');
      
      let contextualQuestion = cleanQuestion;
      if (isPathologyQuestion) {
        contextualQuestion = `Pathology question: ${cleanQuestion}`;
      }
      
      toast({
        title: "Asking ACEV...",
        description: "Getting an answer for this question",
      });
      
      setIsLoadingAI(true);
      
      const { data, error } = await supabase.functions.invoke('ask-gemini', {
        body: { prompt: `Triple-tapped: ${contextualQuestion}` }
      });
      
      if (error) {
        throw new Error(error.message || "Failed to get answer");
      }
      
      if (!data || !data.response) {
        throw new Error("No response received");
      }
      
      toast({
        title: "Answer ready!",
        description: "Check the AI chat panel for your answer",
      });
      
      const event = new CustomEvent('ai-triple-tap-answer', { 
        detail: { question: `Triple-tapped: ${contextualQuestion}`, answer: data.response } 
      });
      window.dispatchEvent(event);
      
    } catch (error: any) {
      console.error("Error getting AI answer:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to get answer",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAI(false);
    }
  };
  
  const handleTouch = () => {
    const now = Date.now();
    const TOUCH_TIMEOUT = 500;
    
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
    }
    
    if (now - lastTouchTime.current > TOUCH_TIMEOUT) {
      touchCount.current = 1;
    } else {
      touchCount.current += 1;
    }
    
    lastTouchTime.current = now;
    
    touchTimeoutRef.current = setTimeout(() => {
      if (touchCount.current === 3) {
        handleTripleTap();
      }
      touchCount.current = 0;
    }, TOUCH_TIMEOUT);
  };
  
  useEffect(() => {
    return () => {
      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current);
      }
    };
  }, []);
  
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
              {isLoadingAI && (
                <p className="text-xs text-blue-400 mt-1 animate-pulse">
                  Getting answer...
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Triple tap to get AI explanation
              </p>
            </div>
            <div className="flex-shrink-0 ml-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-800 text-gray-300 text-sm">
                {asteriskCount > 0 ? asteriskCount : examDateCount > 0 ? examDateCount : index + 1}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <AnimatePresence>
        {showAnimation && (
          <>
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  opacity: 1,
                  scale: 0,
                  x: Math.random() * 100 - 50,
                  y: Math.random() * 100 - 50
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
