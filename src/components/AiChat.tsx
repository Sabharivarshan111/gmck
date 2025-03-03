
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Send, RefreshCw, RotateCcw, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const AiChat = () => {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load previous messages from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem("aiChatMessages");
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        setMessages(parsedMessages);
      } catch (error) {
        console.error("Failed to parse saved messages:", error);
      }
    }
  }, []);

  // Save messages to localStorage when they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("aiChatMessages", JSON.stringify(messages));
    }
  }, [messages]);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full h-full flex flex-col mt-0" // Removed margin-top
    >
      <Card className="backdrop-blur-sm bg-gray-950/70 border-gray-800 flex flex-col h-[420px]"> {/* Reduced height further */}
        <CardHeader className="px-4 py-2 border-b border-gray-800"> {/* Reduced padding */}
          <CardTitle className="text-lg flex items-center justify-between text-white">
            <span>Medical Assistant</span>
            {messages.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClearChat}
                className="h-8 px-2 text-gray-400 hover:text-white"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-0 flex-grow overflow-hidden flex flex-col">
          <div className="flex-grow overflow-y-auto p-4 space-y-4">
            <AnimatePresence initial={false}>
              {messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-gray-500 py-6" // Reduced padding
                >
                  <div className="mb-2">
                    <RefreshCw className="h-7 w-7 mx-auto opacity-50" /> {/* Slightly smaller icon */}
                  </div>
                  <p>Ask me any medical question!</p>
                  <p className="text-sm mt-1">I'm ACEV, your personal medical assistant</p>
                </motion.div>
              ) : (
                messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      "rounded-lg p-3",
                      message.role === 'user' 
                        ? "bg-gray-800/50 text-white ml-4" 
                        : "bg-gray-900/50 text-gray-100 mr-4 border-l-2 border-white/20"
                    )}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-xs font-medium text-gray-400">
                        {message.role === 'user' ? 'You' : 'ACEV'}
                      </p>
                      {message.role === 'assistant' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                          onClick={() => handleCopyResponse(message.content)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    <div className="whitespace-pre-wrap text-sm">
                      {message.content}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
        
        <CardFooter className="p-3 pt-2 border-t border-gray-800">
          <form onSubmit={handleSubmit} className="w-full">
            <div className="flex gap-2">
              <Textarea
                ref={textareaRef}
                placeholder="Ask a medical question..."
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  adjustTextareaHeight();
                }}
                onKeyDown={handleKeyDown}
                className="min-h-[36px] max-h-[80px] bg-gray-900 border-gray-700 focus:ring-gray-600 resize-none text-sm flex-grow" // Reduced min and max height
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                className="bg-white text-black hover:bg-gray-200 transition-colors duration-200 h-9 w-9 p-0 flex items-center justify-center" // Smaller button
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
