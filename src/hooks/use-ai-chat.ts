
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage } from "@/models/ChatMessage";

interface UseAiChatProps {
  initialQuestion?: string;
}

export const useAiChat = ({ initialQuestion }: UseAiChatProps = {}) => {
  const [prompt, setPrompt] = useState(initialQuestion || "");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();

  // This useEffect will trigger the AI to answer the initialQuestion automatically
  useEffect(() => {
    if (initialQuestion && initialQuestion.trim().length > 0) {
      handleSubmitQuestion(initialQuestion);
    }
    // We only want this to run once when the component mounts with an initialQuestion
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load messages from sessionStorage (not localStorage) on mount
  useEffect(() => {
    try {
      const savedMessages = sessionStorage.getItem("aiChatMessages");
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        if (Array.isArray(parsedMessages)) {
          setMessages(parsedMessages);
        }
      }
    } catch (e) {
      console.error("Error loading saved messages:", e);
    }
  }, []);

  // Save messages to sessionStorage (not localStorage) when they change
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem("aiChatMessages", JSON.stringify(messages));
    } else {
      // Clear sessionStorage when messages are empty
      sessionStorage.removeItem("aiChatMessages");
    }
  }, [messages]);

  const handleSubmitQuestion = useCallback(async (questionText: string) => {
    if (!questionText || !questionText.trim()) {
      toast({
        title: "Please enter a question",
        variant: "destructive",
      });
      return;
    }

    setError(null);
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: questionText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setPrompt("");
    setIsLoading(true);

    try {
      // Check network connection before making request
      if (!navigator.onLine) {
        throw new Error("You're offline. Please check your internet connection.");
      }

      console.log("Calling Supabase function with prompt:", questionText.trim().substring(0, 50) + "...");
      
      const { data, error: supabaseError } = await supabase.functions.invoke('ask-gemini', {
        body: { prompt: questionText.trim() }
      });

      console.log("Response from function:", data ? "data received" : "no data", supabaseError ? "error received" : "no error");

      if (supabaseError) {
        console.error("Supabase function error:", supabaseError);
        throw new Error(supabaseError.message || "Error communicating with AI service");
      }

      if (!data) {
        throw new Error("No response received from AI service");
      }

      if (data.error) {
        console.error("AI service error:", data.error);
        
        // Check if this is a rate limit error
        if (data.isRateLimit) {
          throw new Error("Rate limit exceeded. Please try again in a few moments.");
        }
        
        throw new Error(data.error || "Error generating response");
      }

      if (data.response === undefined) {
        throw new Error("Empty response received from AI");
      }

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        isError: false
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      
      toast({
        title: "Response generated successfully",
      });
      
      // Reset retry count on successful response
      setRetryCount(0);
    } catch (error: any) {
      console.error('Error:', error);
      const errorMessage = error.message || "Error generating response";
      setError(errorMessage);
      
      // Create a more user-friendly error message for the chat
      let userFriendlyErrorMessage = "I'm sorry, I'm having trouble processing your request right now. Please try again later or check your connection.";
      
      // Special handling for rate limit errors
      if (errorMessage.includes("Rate limit") || errorMessage.includes("429")) {
        userFriendlyErrorMessage = "I'm currently handling too many requests. Please wait a moment and try again.";
        
        // Increment retry count for rate limit errors
        setRetryCount(prev => prev + 1);
        
        // If multiple rate limit errors occur, provide more specific guidance
        if (retryCount >= 2) {
          userFriendlyErrorMessage = "It seems our AI service is very busy right now. Please try again in a few minutes, or try asking a different question.";
        }
      }
      
      const assistantErrorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: userFriendlyErrorMessage,
        timestamp: new Date(),
        isError: true
      };
      
      setMessages((prev) => [...prev, assistantErrorMessage]);
      
      // Create a more user-friendly error message for the toast
      const toastErrorMessage = errorMessage.includes("API key") 
        ? "There's an issue with the AI service configuration."
        : errorMessage.includes("Rate limit") || errorMessage.includes("429")
          ? "AI service is busy. Please try again in a moment."
          : errorMessage.includes("network") || errorMessage.includes("offline")
            ? "Network error. Please check your connection."
            : errorMessage.includes("timeout") || errorMessage.includes("timed out")
              ? "Request timed out. The service might be busy, please try again."
              : "Error generating response. Please try again later.";
      
      toast({
        title: "Error",
        description: toastErrorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, retryCount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSubmitQuestion(prompt);
  };

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
    sessionStorage.removeItem("aiChatMessages");
    toast({
      title: "Chat history cleared",
    });
  };

  const handleCopyResponse = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied to clipboard",
    });
  };

  return {
    prompt,
    setPrompt,
    isLoading,
    messages,
    setMessages,
    error,
    handleSubmit,
    handleSubmitQuestion,
    handleClearChat,
    handleCopyResponse
  };
};
