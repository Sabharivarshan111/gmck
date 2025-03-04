
import { useState, useEffect } from "react";
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
  const { toast } = useToast();

  // This useEffect will trigger the AI to answer the initialQuestion automatically
  useEffect(() => {
    if (initialQuestion && initialQuestion.trim().length > 0) {
      handleSubmitQuestion(initialQuestion);
    }
    // We only want this to run once when the component mounts with an initialQuestion
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear messages on page refresh/reload
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.removeItem("aiChatMessages");
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const handleSubmitQuestion = async (questionText: string) => {
    if (!questionText.trim()) {
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
      const { data, error: supabaseError } = await supabase.functions.invoke('ask-gemini', {
        body: { prompt: questionText.trim() }
      });

      if (supabaseError) {
        console.error("Supabase function error:", supabaseError);
        throw new Error(supabaseError.message || "Error communicating with AI service");
      }

      if (data?.error) {
        console.error("AI service error:", data.error);
        throw new Error(data.error || "Error generating response");
      }

      if (data?.response) {
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
        };
        
        setMessages((prev) => [...prev, assistantMessage]);
        
        toast({
          title: "Response generated successfully",
        });
      } else {
        throw new Error("No response received from AI");
      }
    } catch (error: any) {
      console.error('Error:', error);
      const errorMessage = error.message || "Error generating response";
      setError(errorMessage);
      
      // Create a more user-friendly error message for the toast
      const userFriendlyError = errorMessage.includes("API key") 
        ? "There's an issue with the AI service configuration."
        : errorMessage.includes("network") 
          ? "Network error. Please check your connection."
          : "Error generating response. Please try again later.";
      
      toast({
        title: "Error",
        description: userFriendlyError,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSubmitQuestion(prompt);
  };

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
    localStorage.removeItem("aiChatMessages");
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
    error,
    handleSubmit,
    handleSubmitQuestion,
    handleClearChat,
    handleCopyResponse
  };
};
