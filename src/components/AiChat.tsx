
import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMessageItem } from "./chat/ChatMessageItem";
import { EmptyChatState } from "./chat/EmptyChatState";
import { ChatInput } from "./chat/ChatInput";
import { useAiChat } from "@/hooks/use-ai-chat";

interface AiChatProps {
  initialQuestion?: string;
}

export const AiChat = ({ initialQuestion }: AiChatProps = {}) => {
  const { 
    prompt, 
    setPrompt, 
    isLoading, 
    messages, 
    setMessages,
    handleSubmit, 
    handleClearChat, 
    handleCopyResponse,
    handleSubmitQuestion
  } = useAiChat({ initialQuestion });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Scroll to bottom when messages change, but not on first load
  useEffect(() => {
    if (!isFirstLoad && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isFirstLoad]);
  
  // Mark first load as complete after initial render
  useEffect(() => {
    setIsFirstLoad(false);
  }, []);
  
  // Listen for triple tap events
  useEffect(() => {
    // Add event listener for triple tap events
    const handleTripleTapAnswer = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.question) {
        const question = customEvent.detail.question;
        
        // If the answer was already fetched and passed in the event, use it directly
        // instead of making another request
        if (customEvent.detail.answer) {
          const userMessage = {
            id: crypto.randomUUID(),
            role: 'user' as const,
            content: question,
            timestamp: new Date(),
          };
          
          const assistantMessage = {
            id: crypto.randomUUID(),
            role: 'assistant' as const,
            content: customEvent.detail.answer,
            timestamp: new Date(),
            isError: customEvent.detail.answer.includes("I'm sorry, I couldn't generate")
          };
          
          // Add both messages to the chat
          setPrompt("");
          setMessages(prev => [...prev, userMessage, assistantMessage]);
        } else {
          // If no answer was provided, call the AI service
          handleSubmitQuestion(question);
        }
      }
    };
    
    window.addEventListener('ai-triple-tap-answer', handleTripleTapAnswer);
    
    // Clean up
    return () => {
      window.removeEventListener('ai-triple-tap-answer', handleTripleTapAnswer);
    };
  }, [handleSubmitQuestion, setMessages, setPrompt]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full h-full flex flex-col"
    >
      <Card className="backdrop-blur-sm bg-gray-950/70 border-gray-800 flex flex-col h-[390px] shadow-xl">
        <CardHeader className="px-4 py-2 border-b border-gray-800">
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
                <EmptyChatState />
              ) : (
                messages.map((message) => (
                  <ChatMessageItem 
                    key={message.id}
                    message={message}
                    onCopy={handleCopyResponse}
                  />
                ))
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
        
        <CardFooter className="p-3 pt-2 border-t border-gray-800">
          <ChatInput
            prompt={prompt}
            setPrompt={setPrompt}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </CardFooter>
      </Card>
    </motion.div>
  );
};
