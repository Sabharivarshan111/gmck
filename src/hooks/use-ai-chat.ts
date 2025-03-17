
import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage } from "@/models/ChatMessage";
import { QUESTION_BANK_DATA } from "@/data/questionBankData";

interface UseAiChatProps {
  initialQuestion?: string;
}

// Queue system for handling requests
interface QueuedRequest {
  question: string;
  conversationHistory: ChatMessage[];
  isTripleTap?: boolean;
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

  // Enhanced prompt for generating MCQs or handling specialized requests
  const enhancePromptForSpecializedRequests = (originalPrompt: string, conversationHistory: ChatMessage[]): {
    enhancedPrompt: string,
    isSpecializedRequest: boolean,
    requestType: string
  } => {
    // Check if the prompt is asking for MCQs - updated to detect "10 MCQs"
    const isMcqRequest = /create\s+(?:10|ten)\s+mcqs?|generate\s+(?:10|ten)\s+mcqs?|make\s+(?:10|ten)\s+mcqs?|ten\s+mcqs?|10\s+mcqs?/i.test(originalPrompt);
    
    // Check if asking for important questions in a subject
    const isImportantQuestionsRequest = /important question|high yield|frequently asked|commonly asked|repeated questions/i.test(originalPrompt) &&
                                    (/pharmacology|microbiology|pathology/i.test(originalPrompt) || 
                                     /tomorrow|exam|test|study/i.test(originalPrompt));
    
    // Check if asking for clarification or doesn't understand something
    const isRequestingClarification = /explain|clarify|elaborate|i don't understand|can't understand|more detail|explain again/i.test(originalPrompt);
    
    // Get the last few messages to provide context
    const recentMessages = conversationHistory.slice(-6);
    const contextMessages = recentMessages
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join("\n\n");
    
    if (isMcqRequest) {
      // Construct an enhanced prompt for 10 MCQs
      return {
        enhancedPrompt: originalPrompt, // The edge function will handle this case
        isSpecializedRequest: true,
        requestType: 'mcq'
      };
    } else if (isImportantQuestionsRequest) {
      // Construct an enhanced prompt for important questions by subject
      return {
        enhancedPrompt: originalPrompt, // The edge function will handle this case
        isSpecializedRequest: true,
        requestType: 'important-questions'
      };
    } else if (isRequestingClarification && contextMessages) {
      // Keep original prompt but pass conversation context in the request
      return {
        enhancedPrompt: originalPrompt,
        isSpecializedRequest: true,
        requestType: 'clarification'
      };
    }
    
    // No special handling needed
    return {
      enhancedPrompt: originalPrompt,
      isSpecializedRequest: false,
      requestType: 'standard'
    };
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
            body: { 
              prompt: nextRequest.question,
              conversationHistory: nextRequest.conversationHistory, // Pass conversation history
              isTripleTap: nextRequest.isTripleTap || false // Indicate if this was from triple tap
            }
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
  const queueRequest = useCallback((question: string, isTripleTap?: boolean): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Check if queue is too full
      if (requestQueue.current.length >= MAX_QUEUE_SIZE) {
        reject(new Error("Request queue is full. Please try again later."));
        return;
      }
      
      // Process the prompt with specialized handling
      const { enhancedPrompt, isSpecializedRequest } = enhancePromptForSpecializedRequests(question, messages);
      
      // For specialized requests, log the type
      if (isSpecializedRequest) {
        console.log(`Processing specialized request: ${isSpecializedRequest ? "Yes" : "No"}`);
      }
      
      // Add the request to the queue with conversation history
      requestQueue.current.push({
        question: enhancedPrompt,
        conversationHistory: messages, // Pass the current conversation history
        isTripleTap: isTripleTap || false,
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

  // Helper function to check if a query is about important questions in the question bank
  const extractQuestionsFromQuestionBank = useCallback((query: string): string | null => {
    // Extract subject and possibly topic from the query
    const subjectMatch = /(?:tomorrow\s+|for\s+|about\s+)(\w+)/.exec(query);
    if (!subjectMatch) return null;
    
    const subject = subjectMatch[1].toLowerCase();
    
    // Try to match subject to our data
    const validSubjects = ["pharmacology", "pathology", "microbiology"];
    const matchedSubject = validSubjects.find(s => subject.includes(s) || s.includes(subject));
    
    if (!matchedSubject) return null;
    
    // Format questions from the matched subject
    try {
      // Extract essay and short note questions
      const data = QUESTION_BANK_DATA;
      let essayQuestions: string[] = [];
      let shortNoteQuestions: string[] = [];
      
      // Function to recursively extract questions
      const extractQuestions = (obj: any, path: string[] = []) => {
        // If this is a leaf node with questions
        if (obj.questions && Array.isArray(obj.questions)) {
          const topic = path.join(" > ");
          obj.questions.forEach(q => {
            if (typeof q === 'string') {
              // Assume this section is from the currently active tab
              if (path[0]?.toLowerCase().includes('essay')) {
                essayQuestions.push(`${q} (${topic})`);
              } else {
                shortNoteQuestions.push(`${q} (${topic})`);
              }
            }
          });
          return;
        }
        
        // Otherwise, explore children
        if (obj.subtopics) {
          Object.entries(obj.subtopics).forEach(([key, value]) => {
            // Add the name to the path if available
            const newPath = path.slice();
            if (value && typeof value === 'object' && 'name' in value) {
              newPath.push(value.name);
            } else {
              newPath.push(key);
            }
            extractQuestions(value, newPath);
          });
        }
      };
      
      // Extract questions for the matched subject
      if (data[matchedSubject]) {
        extractQuestions(data[matchedSubject]);
      }
      
      // Format the result
      if (essayQuestions.length === 0 && shortNoteQuestions.length === 0) {
        return null;
      }
      
      // Count frequencies and add asterisks
      const frequencyMap = new Map<string, number>();
      
      // Count duplicates in essay questions
      essayQuestions.forEach(q => {
        const baseQuestion = q.split('(')[0].trim();
        frequencyMap.set(baseQuestion, (frequencyMap.get(baseQuestion) || 0) + 1);
      });
      
      // Count duplicates in short note questions
      shortNoteQuestions.forEach(q => {
        const baseQuestion = q.split('(')[0].trim();
        frequencyMap.set(baseQuestion, (frequencyMap.get(baseQuestion) || 0) + 1);
      });
      
      // Deduplicate and format with asterisks
      const deduplicatedEssay = Array.from(new Set(essayQuestions.map(q => q.split('(')[0].trim())))
        .map(q => {
          const count = frequencyMap.get(q) || 0;
          const asterisks = count > 2 ? '***' : count > 1 ? '**' : '*';
          return `${q} ${asterisks}`;
        })
        .sort((a, b) => {
          // Sort by asterisk count (descending)
          const aCount = (a.match(/\*/g) || []).length;
          const bCount = (b.match(/\*/g) || []).length;
          return bCount - aCount;
        });
      
      const deduplicatedShortNotes = Array.from(new Set(shortNoteQuestions.map(q => q.split('(')[0].trim())))
        .map(q => {
          const count = frequencyMap.get(q) || 0;
          const asterisks = count > 2 ? '***' : count > 1 ? '**' : '*';
          return `${q} ${asterisks}`;
        })
        .sort((a, b) => {
          // Sort by asterisk count (descending)
          const aCount = (a.match(/\*/g) || []).length;
          const bCount = (b.match(/\*/g) || []).length;
          return bCount - aCount;
        });
      
      // Format the final result
      return `# Important Questions in ${matchedSubject.charAt(0).toUpperCase() + matchedSubject.slice(1)}

## Essay Questions (in order of frequency)
${deduplicatedEssay.map((q, i) => `${i+1}. ${q}`).join('\n')}

## Short Notes Questions (in order of frequency)
${deduplicatedShortNotes.map((q, i) => `${i+1}. ${q}`).join('\n')}

*Note: More asterisks (***) indicate higher frequency questions that appear more often in exams.*`;
    } catch (err) {
      console.error("Error extracting questions from question bank:", err);
      return null;
    }
  }, []);

  const handleSubmitQuestion = useCallback(async (questionText: string, isTripleTap?: boolean) => {
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
    
    // Format for triple-tapped questions
    const formattedQuestion = isTripleTap 
      ? `Triple-tapped: ${questionText.trim()}`
      : questionText.trim();
      
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: formattedQuestion,
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

      console.log("Queuing prompt:", formattedQuestion.substring(0, 50) + "...");
      
      if (isRateLimited) {
        toast({
          title: "Request queued",
          description: "Your request has been queued and will process when the rate limit expires.",
        });
      }
      
      // Check if the question is asking for important questions from the question bank
      const importantQuestionsText = extractQuestionsFromQuestionBank(questionText);
      
      if (importantQuestionsText) {
        // If we found matching questions in the question bank, use those instead of calling the AI
        console.log("Using questions from question bank");
        
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: importantQuestionsText,
          timestamp: new Date(),
          isError: false
        };
        
        setMessages((prev) => [...prev, assistantMessage]);
        
        toast({
          title: "Questions retrieved from database",
        });
        
        // Reset retry count on successful response
        setRetryCount(0);
      } else {
        // Queue the request instead of sending it directly
        const response = await queueRequest(questionText, isTripleTap);
        
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
      }
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
  }, [toast, retryCount, isRateLimited, queueRequest, extractQuestionsFromQuestionBank, setRateLimit]);

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
