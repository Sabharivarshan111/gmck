
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
  // Generate a unique ID for this question using a hash function instead of btoa
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
  
  // Touch tracking for triple tap detection
  const touchCount = useRef(0);
  const lastTouchTime = useRef(0);
  const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Extract asterisk count from the question
  const getAsteriskCount = (text: string) => {
    const asteriskMatch = text.match(/\*+/);
    return asteriskMatch ? asteriskMatch[0].length : 0;
  };
  
  // Extract exam date count from the question when no asterisks
  const getExamDateCount = (text: string) => {
    // Match exam dates pattern like "(Feb 22;Feb 11;Aug 06;Dec 90)"
    const datePattern = /\(([^)]*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[^)]*)\)/;
    const dateMatch = text.match(datePattern);
    
    if (dateMatch && dateMatch[1]) {
      // Count the number of dates by splitting on semicolons
      return dateMatch[1].split(';').length;
    }
    return 0;
  };
  
  const asteriskCount = getAsteriskCount(question);
  const examDateCount = asteriskCount === 0 ? getExamDateCount(question) : 0;
  
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
  
  // Handle triple tap to ask Gemini about this question
  const handleTripleTap = async () => {
    try {
      // Clean up the question text - remove asterisks and page numbers for better AI response
      let cleanQuestion = question
        .replace(/\*+/g, '')  // Remove asterisks
        .replace(/\(Pg\.No: [^)]+\)/, '')  // Remove page numbers
        .replace(/\([^)]*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[^)]*\)/, '') // Remove exam dates
        .trim();
      
      // Remove the question number prefix if it exists (like "1. " at the beginning)
      cleanQuestion = cleanQuestion.replace(/^\d+\.\s*/, '');
      
      // Get the current URL path to determine if we're in pathology section
      const currentPath = window.location.pathname;
      
      // Check if the question is from pathology section
      const isPathologyQuestion = currentPath.includes('pathology');
      
      // Add context about the subject area to help the AI provide better responses
      let contextualQuestion = cleanQuestion;
      if (isPathologyQuestion) {
        contextualQuestion = `Pathology question: ${cleanQuestion}`;
      }
      
      // Show loading toast
      toast({
        title: "Asking ACEV...",
        description: "Getting an answer for this question",
      });
      
      setIsLoadingAI(true);
      
      // Call the ask-gemini Supabase function
      const { data, error } = await supabase.functions.invoke('ask-gemini', {
        body: { prompt: `Triple-tapped: ${contextualQuestion}` }
      });
      
      if (error) {
        throw new Error(error.message || "Failed to get answer");
      }
      
      if (!data || !data.response) {
        throw new Error("No response received");
      }
      
      // Store the question and answer in sessionStorage for the AI chat to use
      sessionStorage.setItem('autoQuestion', `Triple-tapped: ${contextualQuestion}`);
      sessionStorage.setItem('autoAnswer', data.response);
      
      // Notify user that the answer is ready
      toast({
        title: "Answer ready!",
        description: "Check the AI chat panel for your answer",
      });
      
      // Dispatch a custom event that the AiChat component will listen for
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
  
  // Handle touch events for triple tap detection
  const handleTouch = () => {
    const now = Date.now();
    const TOUCH_TIMEOUT = 500; // milliseconds
    
    // Clear any existing timeout
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
    }
    
    // If it's been too long since the last touch, reset the count
    if (now - lastTouchTime.current > TOUCH_TIMEOUT) {
      touchCount.current = 1;
    } else {
      // Otherwise increment the count
      touchCount.current += 1;
    }
    
    // Update the last touch time
    lastTouchTime.current = now;
    
    // Set a timeout to reset the count
    touchTimeoutRef.current = setTimeout(() => {
      // If we've registered 3 taps, trigger the action
      if (touchCount.current === 3) {
        handleTripleTap();
      }
      touchCount.current = 0;
    }, TOUCH_TIMEOUT);
  };
  
  // Cleanup touch timeout on unmount
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
