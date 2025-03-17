
import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { RotateCcw, AlertCircle, Clock } from "lucide-react";
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
    isRateLimited,
    queueStats,
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
    const handleTripleTapAnswer = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.question) {
        const question = customEvent.detail.question;
        
        // Set the question text in the input field
        setPrompt(question);
        
        // Submit the question automatically
        handleSubmitQuestion(question);
      }
    };
    
    window.addEventListener('ai-triple-tap-answer', handleTripleTapAnswer);
    
    // Clean up
    return () => {
      window.removeEventListener('ai-triple-tap-answer', handleTripleTapAnswer);
    };
  }, [handleSubmitQuestion, setPrompt]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full h-full flex flex-col ai-chat-section"
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
            {isRateLimited && (
              <div className="bg-amber-900/30 border border-amber-800 rounded-md p-3 flex items-start">
                <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-amber-300">
                    Too many requests. Please wait a moment before trying again.
                  </p>
                  <p className="text-xs text-amber-400/70 mt-1">
                    The AI service is currently experiencing high demand.
                  </p>
                </div>
              </div>
            )}
            
            {/* Display queue status if items are queued */}
            {queueStats.isQueueActive && !isRateLimited && (
              <div className="bg-blue-900/30 border border-blue-800 rounded-md p-3 flex items-start animate-pulse">
                <Clock className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-blue-300">
                    Request{queueStats.queueLength > 1 ? 's' : ''} queued ({queueStats.queueLength})
                  </p>
                  <p className="text-xs text-blue-400/70 mt-1">
                    Estimated wait: ~{queueStats.estimatedWaitTime} seconds
                  </p>
                </div>
              </div>
            )}
            
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
            isDisabled={isRateLimited && queueStats.queueLength >= 10} // Disable if rate limited AND queue is full
          />
        </CardFooter>
      </Card>
    </motion.div>
  );
};
