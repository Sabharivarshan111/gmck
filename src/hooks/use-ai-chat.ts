
import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage } from "@/models/ChatMessage";

interface UseAiChatProps {
  initialQuestion?: string;
}

// Queue system for handling requests
interface QueuedRequest {
  question: string;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timestamp: number;
  retryCount: number;
}

export const useAiChat = ({ initialQuestion }: UseAiChatProps = {}) => {
  const [prompt, setPrompt] = useState(initialQuestion || "");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitTimeout, setRateLimitTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Request queue implementation
  const requestQueue = useRef<QueuedRequest[]>([]);
  const isProcessingQueue = useRef(false);
  const lastRequestTime = useRef<number>(0);
  const MIN_REQUEST_INTERVAL = 2000; // Minimum 2 seconds between requests
  const MAX_QUEUE_SIZE = 10; // Maximum number of requests to queue
  const MAX_RETRY_ATTEMPTS = 3; // Maximum number of retry attempts
  
  const { toast } = useToast();

  // Clear rate limit after 30 seconds
  const clearRateLimit = useCallback(() => {
    setIsRateLimited(false);
    if (rateLimitTimeout) {
      clearTimeout(rateLimitTimeout);
      setRateLimitTimeout(null);
    }
  }, [rateLimitTimeout]);

  // Set rate limit with automatic clearing after 30 seconds
  const setRateLimit = useCallback(() => {
    setIsRateLimited(true);
    
    // Clear any existing timeout
    if (rateLimitTimeout) {
      clearTimeout(rateLimitTimeout);
    }
    
    // Set new timeout to clear rate limit after 30 seconds
    const timeout = setTimeout(() => {
      setIsRateLimited(false);
      setRateLimitTimeout(null);
      // When rate limit clears, process the queue
      processQueue();
    }, 30000);
    
    setRateLimitTimeout(timeout);
  }, [rateLimitTimeout]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (rateLimitTimeout) {
        clearTimeout(rateLimitTimeout);
      }
    };
  }, [rateLimitTimeout]);

  // Enhanced prompt for generating MCQs or handling follow-up questions
  const enhancePromptWithContext = (originalPrompt: string): string => {
    // Get recent messages to provide context
    const recentMessages = messages.slice(-4);
    const contextMessages = recentMessages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join("\n\n");
    
    // Check if the prompt is asking for MCQs
    const isMcqRequest = /create\s+mcqs?|generate\s+mcqs?|make\s+mcqs?/i.test(originalPrompt);
    
    // Check if this is a follow-up question or asking for detailed explanation
    const isFollowUp = /explain\s+this|explain\s+more|i\s+(?:don't|cant|can't)\s+understand|more\s+details|elaborate|similar\s+questions/i.test(originalPrompt);
    
    if (isMcqRequest) {
      // Construct an enhanced prompt with specific instructions for MCQs
      return `Based on the following context and the user's request to create MCQs, please generate 5 high-quality multiple choice questions in the style of NEET PG or USMLE exams. 
      
Each MCQ should have 4 options (A, B, C, D) with one correct answer clearly marked. Ensure questions are clinically relevant and test application of knowledge. Include 2-3 case-based questions.

Context from previous conversation: 
${contextMessages}

User request: ${originalPrompt}

Format each question as:
Question 1: [Question text]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
Answer: [Correct option letter]
Explanation: [Brief explanation of why the answer is correct]`;
    } else if (isFollowUp) {
      // Construct an enhanced prompt for follow-up questions with context
      return `Based on our previous conversation, the user is asking for more information: "${originalPrompt}".

Previous context:
${contextMessages}

Please provide a clear, detailed explanation addressing the user's follow-up question. If they're asking for similar questions, generate questions that test the same concepts but in different ways, including some case-based scenarios.`;
    }
    
    // Add context for any question to maintain conversation flow
    if (messages.length > 0) {
      return `User's question: ${originalPrompt}

Previous context (if relevant to answering the question):
${contextMessages}`;
    }
    
    return originalPrompt;
  };

  // Process the request queue
  const processQueue = useCallback(async () => {
    // If already processing or queue is empty, return
    if (isProcessingQueue.current || requestQueue.current.length === 0 || isRateLimited) {
      return;
    }

    isProcessingQueue.current = true;
    
    try {
      // Process requests with throttling
      while (requestQueue.current.length > 0 && !isRateLimited) {
        const now = Date.now();
        const timeElapsed = now - lastRequestTime.current;
        
        // Apply throttling - wait if needed
        if (timeElapsed < MIN_REQUEST_INTERVAL) {
          await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeElapsed));
        }
        
        // Take the next request from the queue
        const nextRequest = requestQueue.current.shift();
        if (!nextRequest) continue;
        
        try {
          // Make the actual API call
          console.log(`Processing queued request: ${nextRequest.question.substring(0, 30)}...`);
          lastRequestTime.current = Date.now();
          
          const { data, error: supabaseError } = await supabase.functions.invoke('ask-gemini', {
            body: { prompt: nextRequest.question }
          });
          
          // Handle the response
          if (supabaseError) {
            console.error("Supabase function error:", supabaseError);
            throw new Error(supabaseError.message || "Error communicating with AI service");
          }
          
          if (!data) {
            throw new Error("No response received from AI service");
          }
          
          if (data.error) {
            console.error("AI service error:", data.error);
            
            // Handle rate limiting
            if (data.isRateLimit) {
              console.log("Rate limit detected, pausing queue processing");
              setRateLimit();
              
              // If we have retry attempts left, put it back in the queue
              if (nextRequest.retryCount < MAX_RETRY_ATTEMPTS) {
                console.log(`Requeueing with retry count ${nextRequest.retryCount + 1}`);
                requestQueue.current.unshift({
                  ...nextRequest,
                  retryCount: nextRequest.retryCount + 1,
                  timestamp: Date.now() // Update timestamp
                });
              } else {
                nextRequest.reject(new Error("Maximum retry attempts reached"));
              }
              
              // Break out of the loop when rate limited
              break;
            }
            
            throw new Error(data.error || "Error generating response");
          }
          
          // Resolve the promise with the response
          nextRequest.resolve(data.response);
          
        } catch (error: any) {
          console.error('Error processing request:', error);
          
          // For non-rate-limit errors or max retries reached, reject the promise
          if (!error.message.includes("Rate limit") || nextRequest.retryCount >= MAX_RETRY_ATTEMPTS) {
            nextRequest.reject(error);
          } else {
            // For rate-limit errors with retries left, requeue the request
            console.log(`Requeueing rate-limited request, retry ${nextRequest.retryCount + 1}`);
            requestQueue.current.unshift({
              ...nextRequest,
              retryCount: nextRequest.retryCount + 1,
              timestamp: Date.now() // Update timestamp
            });
          }
        }
      }
    } finally {
      // Always update the processing flag
      isProcessingQueue.current = false;
      
      // If we still have items and we're not rate limited, continue processing
      if (requestQueue.current.length > 0 && !isRateLimited) {
        setTimeout(processQueue, MIN_REQUEST_INTERVAL);
      }
    }
  }, [isRateLimited, setRateLimit]);
  
  // Queue a new request and return a promise
  const queueRequest = useCallback((question: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Check if queue is too full
      if (requestQueue.current.length >= MAX_QUEUE_SIZE) {
        reject(new Error("Request queue is full. Please try again later."));
        return;
      }
      
      // Enhance the prompt with context
      const enhancedPrompt = enhancePromptWithContext(question);
      
      // Add the request to the queue
      requestQueue.current.push({
        question: enhancedPrompt,
        resolve,
        reject,
        timestamp: Date.now(),
        retryCount: 0
      });
      
      console.log(`Request queued. Queue length: ${requestQueue.current.length}`);
      
      // Start processing the queue if not already processing
      if (!isProcessingQueue.current && !isRateLimited) {
        processQueue();
      }
    });
  }, [isRateLimited, processQueue, messages]);

  // This useEffect will trigger the AI to answer the initialQuestion automatically
  useEffect(() => {
    if (initialQuestion && initialQuestion.trim().length > 0) {
      handleSubmitQuestion(initialQuestion);
    }
    // We only want this to run once when the component mounts with an initialQuestion
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear localStorage on component mount to ensure chat history doesn't persist across refreshes
  useEffect(() => {
    localStorage.removeItem("aiChatMessages");
  }, []);

  const handleSubmitQuestion = useCallback(async (questionText: string) => {
    if (!questionText || !questionText.trim()) {
      toast({
        title: "Please enter a question",
        variant: "destructive",
      });
      return;
    }

    // Don't allow new requests if rate limited and not queueing
    if (isRateLimited && requestQueue.current.length >= MAX_QUEUE_SIZE) {
      toast({
        title: "Service busy",
        description: "Too many requests are already queued. Please try again later.",
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

      console.log("Queuing prompt:", questionText.trim().substring(0, 50) + "...");
      
      if (isRateLimited) {
        toast({
          title: "Request queued",
          description: "Your request has been queued and will process when the rate limit expires.",
        });
      }
      
      // Queue the request instead of sending it directly
      const response = await queueRequest(questionText.trim());
      
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
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
        userFriendlyErrorMessage = "I'm currently handling too many requests. Your message has been queued and will process when capacity is available.";
        
        // Increment retry count for rate limit errors
        setRetryCount(prev => prev + 1);
        
        // If multiple rate limit errors occur, provide more specific guidance
        if (retryCount >= 2) {
          userFriendlyErrorMessage = "The AI service is very busy right now. Your request has been queued, but you might want to try again in a few minutes or try asking a different question.";
        }
      } else if (errorMessage.includes("queue is full")) {
        userFriendlyErrorMessage = "We're experiencing high demand. The request queue is full. Please try again in a few minutes.";
      } else if (errorMessage.includes("Maximum retry")) {
        userFriendlyErrorMessage = "After several attempts, I couldn't get a response from the AI service. Please try again with a different question or try later.";
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
        : errorMessage.includes("queue is full")
          ? "Request queue is full. Please try again later."
        : errorMessage.includes("Rate limit") || errorMessage.includes("429")
          ? "AI service is busy. Your request has been queued."
          : errorMessage.includes("network") || errorMessage.includes("offline")
            ? "Network error. Please check your connection."
            : errorMessage.includes("timeout") || errorMessage.includes("timed out")
              ? "Request timed out. The service might be busy, please try again."
              : "Error generating response. Please try again later.";
      
      toast({
        title: "Notice",
        description: toastErrorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, retryCount, isRateLimited, queueRequest, setRateLimit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSubmitQuestion(prompt);
  };

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
    clearRateLimit();
    // Also clear the request queue
    requestQueue.current = [];
    // No need to clear localStorage since we're not using it anymore
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

  // Return queue stats for UI display
  const queueStats = {
    queueLength: requestQueue.current.length,
    isQueueActive: requestQueue.current.length > 0,
    estimatedWaitTime: requestQueue.current.length * 2, // rough estimate: 2 seconds per request
  };

  return {
    prompt,
    setPrompt,
    isLoading,
    messages,
    setMessages,
    error,
    isRateLimited,
    queueStats,
    handleSubmit,
    handleSubmitQuestion,
    handleClearChat,
    handleCopyResponse
  };
};
