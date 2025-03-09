
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useAiAnswer = (question: string) => {
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const { toast } = useToast();
  
  const rateLimitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const requestTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    return () => {
      if (rateLimitTimeoutRef.current) {
        clearTimeout(rateLimitTimeoutRef.current);
      }
      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current);
      }
    };
  }, []);
  
  const handleGetAnswer = async () => {
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
  
  return {
    isLoadingAI,
    isRateLimited,
    handleGetAnswer
  };
};
