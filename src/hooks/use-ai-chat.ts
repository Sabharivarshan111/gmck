
import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/hooks/use-toast";
import { ChatMessage } from "@/models/ChatMessage";
import { supabase } from "@/integrations/supabase/client";

interface QueueStats {
  isQueueActive: boolean;
  queueLength: number;
  estimatedWaitTime: number;
}

interface UseAiChatProps {
  initialQuestion?: string;
}

// Note: This hook now uses the ask-gemini Supabase function
// The previous ask-ai function was replaced with a more advanced Gemini-based implementation
// that supports features like MCQs generation, important questions identification, etc.
export const useAiChat = ({ initialQuestion }: UseAiChatProps = {}) => {
  const [prompt, setPrompt] = useState<string>(initialQuestion || "");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRateLimited, setIsRateLimited] = useState<boolean>(false);
  const [queueStats, setQueueStats] = useState<QueueStats>({
    isQueueActive: false,
    queueLength: 0,
    estimatedWaitTime: 0,
  });
  const { toast } = useToast();
  
  const handleError = (error: unknown) => {
    console.error("AI Chat Error:", error);
    setIsLoading(false);
    
    // Fix TypeScript error by properly checking if error.message exists and is a string
    const errorMessage = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' 
      ? error.message 
      : "An unexpected error occurred. Please try again later.";
    
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
  };
  
  // Load chat history from localStorage on component mount
  useEffect(() => {
    try {
      const storedMessages = localStorage.getItem('chatHistory');
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      }
    } catch (error) {
      console.error("Error loading chat history from localStorage:", error);
    }
  }, []);
  
  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    try {
      localStorage.setItem('chatHistory', JSON.stringify(messages));
    } catch (error) {
      console.error("Error saving chat history to localStorage:", error);
    }
  }, [messages]);

  const handleSubmitQuestion = useCallback(async (question: string) => {
    if (!question.trim()) return;
    
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: question,
      timestamp: new Date(),
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setIsLoading(true);
    setPrompt(""); // Clear the input immediately when processing starts
    
    try {
      // Convert previous messages to history format for context
      const conversationHistory = messages.slice(-6).map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Check if this is a triple tap (special handling)
      const isTripleTap = question.startsWith("Triple-tapped:") || question.startsWith("triple-tapped:");
      
      // Use Supabase edge function - Now using ask-gemini which supports all the advanced features
      // Features supported: MCQs generation, important questions identification, etc.
      const { data, error } = await supabase.functions.invoke('ask-gemini', {
        body: { 
          prompt: question,
          conversationHistory,
          isTripleTap
        },
      });
      
      if (error) {
        throw new Error(`Error calling AI service: ${error.message}`);
      }
      
      if (data.isRateLimit) {
        setIsRateLimited(true);
        setIsLoading(false);
        toast({
          title: "Rate limit reached",
          description: data.error || "Please wait a moment before sending another message.",
          variant: "destructive",
        });
        return;
      }
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (data.queueStats) {
        setQueueStats(data.queueStats);
      }
      
      const aiMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };
      
      setMessages(prevMessages => [...prevMessages, aiMessage]);
    } catch (error) {
      handleError(error);
      
      // Add a system message about the error
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        role: 'system',
        content: "I'm sorry, but I encountered an error while processing your request. Please try again later.",
        timestamp: new Date(),
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, toast]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmitQuestion(prompt);
  }, [prompt, handleSubmitQuestion]);

  const handleClearChat = useCallback(() => {
    setMessages([]);
    localStorage.removeItem('chatHistory');
    toast({
      title: "Chat cleared!",
      description: "All messages have been cleared from the chat history.",
    });
  }, [toast]);

  const handleCopyResponse = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Response copied!",
      description: "The AI response has been copied to your clipboard.",
    });
  }, [toast]);

  useEffect(() => {
    if (isRateLimited) {
      const timer = setTimeout(() => {
        setIsRateLimited(false);
      }, 60000); // Reset after 60 seconds
      return () => clearTimeout(timer);
    }
  }, [isRateLimited]);

  return {
    prompt,
    setPrompt,
    isLoading,
    messages,
    setMessages,
    isRateLimited,
    queueStats,
    handleSubmit,
    handleClearChat,
    handleCopyResponse,
    handleSubmitQuestion
  };
};
