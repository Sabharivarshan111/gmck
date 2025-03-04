
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage } from "@/models/ChatMessage";

export const useAiChat = () => {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
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
      content: prompt.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setPrompt("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ask-gemini', {
        body: { prompt: prompt.trim() }
      });

      if (error) {
        console.error("Supabase function error:", error);
        throw new Error(error.message || "Error communicating with AI service");
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
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || "Error generating response");
      toast({
        title: "Error generating response",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
    handleClearChat,
    handleCopyResponse
  };
};
