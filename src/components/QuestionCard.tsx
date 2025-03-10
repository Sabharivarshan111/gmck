
import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const [isRateLimited, setIsRateLimited] = useState(false);
  const { toast } = useToast();
  
  const touchCount = useRef(0);
  const lastTouchTime = useRef(0);
  const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rateLimitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const requestTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const getAsteriskCount = (text: string) => {
    const asteriskMatch = text.match(/\*+/);
    return asteriskMatch ? asteriskMatch[0].length : 0;
  };
  
  const hasExamDate = (text: string) => {
    // Check for pattern like (Feb 14;Aug 13;Feb 12)
    const datePattern = /\((?:[^()]*?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[^()]*?)\)/;
    return datePattern.test(text);
  };
  
  const getExamDateCount = (text: string) => {
    // Check for pattern like (Feb 14;Aug 13;Feb 12)
    const datePattern = /\(((?:[^()]*?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[^()]*?;)*(?:[^()]*?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[^()]*?))\)/;
    const dateMatch = text.match(datePattern);
    
    if (dateMatch && dateMatch[1]) {
      // Count the number of dates by counting semicolons + 1
      const semicolonCount = (dateMatch[1].match(/;/g) || []).length;
      return semicolonCount + 1;
    }
    return 0;
  };
  
  const hasPageNumber = (text: string) => {
    return text.includes("(Pg.No:");
  };
  
  const asteriskCount = getAsteriskCount(question);
  const examDateCount = asteriskCount === 0 ? getExamDateCount(question) : 0;
  
  const displayNumber = asteriskCount > 0 ? 
    asteriskCount : 
    hasExamDate(question) ? 
      examDateCount : 
      1;  // Always show "1" for regular questions
  
  useEffect(() => {
    const savedState = localStorage.getItem(questionId);
    if (savedState !== null) {
      setIsCompleted(savedState === 'true');
    }
  }, [questionId]);
  
  useEffect(() => {
    return () => {
      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current);
      }
      if (rateLimitTimeoutRef.current) {
        clearTimeout(rateLimitTimeoutRef.current);
      }
      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current);
      }
    };
  }, []);
  
  const handleCheckedChange = (checked: boolean) => {
    setIsCompleted(checked);
    localStorage.setItem(questionId, checked.toString());
    
    setShowAnimation(true);
    setTimeout(() => setShowAnimation(false), 800);
  };
  
  const handleTripleTap = async () => {
    if (isLoadingAI || isRateLimited) {
      if (isRateLimited) {
        toast({
          title: "Please wait",
          description: "Please wait before requesting another explanation",
          variant: "destructive",
        });
      }
      return;
    }
    
    let cleanQuestion = "";
    let contextualQuestion = "";
    
    try {
      cleanQuestion = question
        .replace(/\*+/g, '')
        .replace(/\(Pg\.No: [^)]+\)/, '')
        .replace(/\([^)]*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[^)]*\)/, '')
        .trim();
      
      cleanQuestion = cleanQuestion.replace(/^\d+\.\s*/, '');
      
      const currentPath = window.location.pathname;
      const isPathologyQuestion = currentPath.includes('pathology');
      
      contextualQuestion = cleanQuestion;
      if (isPathologyQuestion) {
        contextualQuestion = `Pathology question: ${cleanQuestion}`;
      }
      
      toast({
        title: "Asking ACEV...",
        description: "Getting an answer for this question",
      });
      
      setIsLoadingAI(true);
      
      console.log("Sending triple-tapped question to Supabase function:", contextualQuestion);
      
      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current);
      }
      
      const timeoutPromise = new Promise<{data: null, error: Error}>((resolve) => {
        requestTimeoutRef.current = setTimeout(() => {
          resolve({
            data: null,
            error: new Error("Request took too long to complete. The AI service might be busy.")
          });
        }, 35000);
      });
      
      const apiPromise = supabase.functions.invoke('ask-gemini', {
        body: { prompt: `Triple-tapped: ${contextualQuestion}` }
      });
      
      const { data, error } = await Promise.race([apiPromise, timeoutPromise]);
      
      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current);
        requestTimeoutRef.current = null;
      }
      
      console.log("Response received:", data ? "Data received" : "No data", error ? "Error received" : "No error");
      
      if (error) {
        console.error("Error or timeout:", error);
        throw new Error(error.message || "Failed to get answer");
      }
      
      if (!data) {
        console.error("No data received from AI service");
        throw new Error("No response received");
      }
      
      if (data.error) {
        console.error("AI service error:", data.error);
        
        if (data.isRateLimit) {
          setIsRateLimited(true);
          
          if (rateLimitTimeoutRef.current) {
            clearTimeout(rateLimitTimeoutRef.current);
          }
          
          rateLimitTimeoutRef.current = setTimeout(() => {
            setIsRateLimited(false);
            rateLimitTimeoutRef.current = null;
          }, 30000);
          
          throw new Error("Rate limit exceeded. Please try again in 30 seconds.");
        }
        
        throw new Error(data.error || "Error getting answer");
      }
      
      if (!data.response) {
        console.error("Empty response received");
        throw new Error("Empty response received");
      }
      
      toast({
        title: "Answer ready!",
        description: "Check the AI chat panel for your answer",
      });
      
      const event = new CustomEvent('ai-triple-tap-answer', { 
        detail: { question: `Triple-tapped: ${contextualQuestion}`, answer: data.response } 
      });
      window.dispatchEvent(event);
    } catch (apiError: any) {
      console.error("API request error:", apiError);
      
      toast({
        title: "Error getting answer",
        description: apiError.message.includes("Rate limit") 
          ? "Rate limit reached. Please wait 30 seconds before trying again."
          : apiError.message.includes("took too long") || apiError.message.includes("timed out")
            ? "The AI service is taking too long to respond. Please try a simpler question or try again later."
            : "See the chat for details",
        variant: "destructive"
      });
      
      if (apiError.message.includes("took too long") || apiError.message.includes("timed out")) {
        const errorEvent = new CustomEvent('ai-triple-tap-answer', { 
          detail: { 
            question: `Triple-tapped: ${contextualQuestion}`, 
            answer: "I'm sorry, but your question is taking longer than expected to process. This could be because it's complex or the AI service is busy. Try asking a more specific question or try again in a few moments." 
          } 
        });
        window.dispatchEvent(errorEvent);
      }
      else if (!apiError.message.includes("Rate limit")) {
        const errorEvent = new CustomEvent('ai-triple-tap-answer', { 
          detail: { 
            question: `Triple-tapped: ${contextualQuestion}`, 
            answer: "I'm sorry, I couldn't generate an answer for this question at the moment. Please try again later." 
          } 
        });
        window.dispatchEvent(errorEvent);
      }
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

  const cleanQuestionText = question.replace(/\(Pg\.No: [^)]+\)/, '');

  // Check if we have a double-digit number
  const isDoubleDigit = displayNumber >= 10;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="relative"
    >
      <Card 
        className={`bg-gray-900/50 border-gray-800/50 hover:bg-gray-900/70 transition-all duration-300 mb-3 relative overflow-hidden ${
          showAnimation ? 'ring-2 ring-blue-400/50' : ''
        }`}
        onClick={handleTouch}
      >
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <Checkbox
                checked={isCompleted}
                onCheckedChange={(checked) => handleCheckedChange(checked as boolean)}
                className="h-5 w-5 border-gray-600 data-[state=checked]:border-gray-400"
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className={`text-lg font-medium ${
                isCompleted ? 'text-gray-500' : 'text-gray-200'
              }`}>
                {cleanQuestionText}
              </p>
              
              {isLoadingAI && (
                <p className="text-sm text-blue-400 mt-2 animate-pulse">
                  Getting answer... (may take up to 30 seconds)
                </p>
              )}
              
              {isRateLimited ? (
                <p className="text-sm text-amber-400 mt-2">
                  Rate limit reached. Please wait before trying again.
                </p>
              ) : (
                <p className="text-sm text-gray-400 mt-2">
                  Triple tap to get AI explanation
                </p>
              )}
            </div>
            
            <div className="flex-shrink-0 ml-2">
              <span className={`inline-flex items-center justify-center ${isDoubleDigit ? 'w-12 h-12' : 'w-10 h-10'} rounded-full bg-gray-800 text-gray-300 text-base`}>
                {displayNumber}
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
