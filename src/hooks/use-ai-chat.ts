import { useState, useCallback, useEffect } from "react";
import { getRandomId } from "@/lib/utils";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useToast } from "@/components/ui/use-toast";
import { useSettings } from "@/hooks/use-settings";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  references?: Array<{
    title: string;
    authors: string;
    journal?: string;
    year: string;
    url?: string;
  }>;
}

interface AIResponse {
  response: string;
  references?: Array<{
    title: string;
    authors: string;
    journal?: string;
    year: string;
    url?: string;
  }>;
  error?: string;
  isRateLimit?: boolean;
  retryAfter?: number;
}

export const useAiChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversation, setCurrentConversation] = useState<ChatMessage[]>([]);
  const [conversationHistory, setConversationHistory] = useLocalStorage<ChatMessage[]>("conversation-history", []);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const { toast } = useToast();
  const { settings } = useSettings();

  // Clear retry timer when component unmounts
  useEffect(() => {
    return () => {
      if (retryAfter !== null) {
        setRetryAfter(null);
      }
    };
  }, [retryAfter]);

  // Countdown timer for rate limiting
  useEffect(() => {
    if (retryAfter === null || retryAfter <= 0) return;

    const timer = setTimeout(() => {
      setRetryAfter(prev => (prev !== null && prev > 0 ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [retryAfter]);

  // Function to fetch AI response from Supabase Edge Function
  const fetchAIResponse = useCallback(
    async (
      prompt: string,
      history: ChatMessage[]
    ): Promise<AIResponse> => {
      try {
        // Prepare conversation history in the format expected by the API
        const formattedHistory = history.map(msg => ({
          role: msg.role,
          content: msg.content
        }));

        // Detect if this is a triple-tap (user tapped the same message 3 times)
        const isTripleTap = 
          history.length >= 5 && 
          history[history.length - 1].role === "assistant" &&
          history[history.length - 2].role === "user" &&
          history[history.length - 3].role === "assistant" &&
          history[history.length - 4].role === "user" &&
          prompt.toLowerCase() === history[history.length - 2].content.toLowerCase();

        // Detect if this is an MCQ request
        const isMCQRequest = 
          prompt.toLowerCase().includes("mcq") || 
          prompt.toLowerCase().includes("multiple choice") ||
          prompt.toLowerCase().includes("generate questions") ||
          prompt.toLowerCase().includes("create questions");

        // Detect if this is a request for important questions
        const isImportantQuestionsRequest = 
          prompt.toLowerCase().includes("important questions") ||
          prompt.toLowerCase().includes("important topics");

        // Detect if this is a clarification request
        const isNeedingClarification = 
          prompt.toLowerCase().includes("i don't understand") ||
          prompt.toLowerCase().includes("explain") ||
          prompt.toLowerCase().includes("clarify") ||
          prompt.toLowerCase().includes("what do you mean");

        // If triple-tapped, add a prefix to the prompt
        const finalPrompt = isTripleTap ? `Triple-tapped: ${prompt}` : prompt;

        // Make the API request
        const response = await fetch(
          "https://pmtgeydtqypwrypshhsx.supabase.co/functions/v1/ask-gemini",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prompt: finalPrompt,
              conversationHistory: formattedHistory,
              isTripleTap,
              isMCQRequest,
              isImportantQuestionsRequest,
              isNeedingClarification
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
          // Handle rate limiting
          if (data.isRateLimit && data.retryAfter) {
            setRetryAfter(data.retryAfter);
            toast({
              title: "Rate limit reached",
              description: `Please wait ${data.retryAfter} seconds before trying again.`,
              variant: "destructive",
            });
          }
          throw new Error(data.error);
        }

        return data;
      } catch (error) {
        console.error("Error fetching AI response:", error);
        return {
          response: "Sorry, I encountered an error while processing your request. Please try again in a moment.",
          error: error.message,
        };
      }
    },
    [toast]
  );

  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return;

      // Start loading
      setIsLoading(true);
      
      // Check if this is a request for important questions from the question bank
      const isImportantQuestionsRequest = 
        message.toLowerCase().includes("important questions") ||
        message.toLowerCase().includes("important topics") ||
        message.toLowerCase().includes("important essays") ||
        message.toLowerCase().includes("important notes");

      let topicMatch = null;
      let subjectMatch = null;
      
      // Extract potential subject and topic from the message
      if (isImportantQuestionsRequest) {
        // Check for subject mentions (pathology, pharmacology, microbiology)
        if (message.toLowerCase().includes("pathology")) {
          subjectMatch = "pathology";
        } else if (message.toLowerCase().includes("pharmacology")) {
          subjectMatch = "pharmacology";
        } else if (message.toLowerCase().includes("microbiology")) {
          subjectMatch = "microbiology";
        }
        
        // Check for topic mentions in the message by iterating through all topics
        // For Pathology topics
        const pathologyTopics = [
          { key: "neoplasia", keywords: ["neoplasia", "neoplasm", "cancer", "tumor", "tumour"] },
          { key: "cell-injury", keywords: ["cell injury", "cellular injury", "cell damage"] },
          { key: "inflammation-repair", keywords: ["inflammation", "inflammatory", "repair", "healing"] },
          { key: "hemodynamic-disorders", keywords: ["hemodynamic", "edema", "hyperemia", "congestion", "hemorrhage", "thrombosis", "embolism", "infarction", "shock"] },
          { key: "genetic-disorders", keywords: ["genetic", "genetics", "chromosome", "mutation"] },
          { key: "immunology", keywords: ["immunology", "immune", "immunity", "autoimmune"] },
          { key: "infectious-diseases", keywords: ["infection", "infectious", "bacteria", "viral", "fungal", "parasite"] },
          // Other pathology topics
        ];
        
        // For Pharmacology topics
        const pharmacologyTopics = [
          { key: "central-nervous-system", keywords: ["cns", "central nervous system", "brain", "spinal cord"] },
          { key: "autonomic-nervous-system", keywords: ["ans", "autonomic nervous system", "sympathetic", "parasympathetic"] },
          { key: "cardiovascular-system", keywords: ["cvs", "cardiovascular", "heart", "blood vessel"] },
          { key: "respiratory-system", keywords: ["respiratory", "lung", "breathing"] },
          { key: "autacoids", keywords: ["autacoid", "histamine", "serotonin", "prostaglandin"] },
          { key: "hormones", keywords: ["hormone", "endocrine", "thyroid", "insulin", "corticosteroids"] },
          { key: "neoplastic-drugs", keywords: ["anticancer", "antineoplastic", "chemotherapy", "neoplastic"] },
          { key: "gastrointestinal-system", keywords: ["gi", "gastrointestinal", "stomach", "intestine", "digestive"] },
          { key: "anti-microbial-drugs", keywords: ["antimicrobial", "antibiotic", "antibacterial", "antifungal", "antiviral"] },
          // Other pharmacology topics
        ];
        
        // Combined topics array based on detected subject
        let topicsToCheck = [];
        if (subjectMatch === "pathology") {
          topicsToCheck = pathologyTopics;
        } else if (subjectMatch === "pharmacology") {
          topicsToCheck = pharmacologyTopics;
        } else {
          // If no subject match, check all topics
          topicsToCheck = [...pathologyTopics, ...pharmacologyTopics];
        }
        
        // Find matching topic in message
        for (const topic of topicsToCheck) {
          const matched = topic.keywords.some(keyword => 
            message.toLowerCase().includes(keyword.toLowerCase())
          );
          if (matched) {
            topicMatch = topic.key;
            // If we didn't match a subject but matched a topic, try to determine subject
            if (!subjectMatch) {
              if (pathologyTopics.find(t => t.key === topicMatch)) {
                subjectMatch = "pathology";
              } else if (pharmacologyTopics.find(t => t.key === topicMatch)) {
                subjectMatch = "pharmacology";
              }
            }
            break;
          }
        }

        console.log("Search query:", { isImportantQuestionsRequest, subjectMatch, topicMatch });
      }
      
      // Create a user message object and add to chat
      const userMessageObj: ChatMessage = {
        id: getRandomId(),
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
      };
      
      // Add the message to the chat
      setMessages((prev) => [...prev, userMessageObj]);
      
      try {
        if (isImportantQuestionsRequest && (subjectMatch || topicMatch)) {
          // Get questions from question bank based on subject and topic
          const essayQuestions: string[] = [];
          const shortNoteQuestions: string[] = [];
          
          // Import QUESTION_BANK_DATA
          const { QUESTION_BANK_DATA } = await import("@/data/questionBankData");
          
          // Helper function to traverse the question bank and find matching topics
          const findQuestionsForTopic = (data: any, subject: string | null, topic: string | null) => {
            if (!data) return;
            
            // First level: subjects
            Object.entries(data).forEach(([subjectKey, subjectData]: [string, any]) => {
              // Only process if subject matches or no subject specified
              if (subject && subjectKey !== subject) return;
              
              // Second level: papers or topics
              if (subjectData.subtopics) {
                Object.entries(subjectData.subtopics).forEach(([paperKey, paperData]: [string, any]) => {
                  // Check if this is a paper (paper-1, paper-2) or direct topic
                  if (paperData.subtopics) {
                    // This is a paper, go one level deeper to topics
                    Object.entries(paperData.subtopics).forEach(([topicKey, topicData]: [string, any]) => {
                      // Only process if topic matches or no topic specified
                      if (topic && topicKey !== topic) return;
                      
                      // Process questions for this topic
                      processQuestionsFromTopic(topicData);
                    });
                  } else {
                    // This is directly a topic
                    // Only process if topic matches or no topic specified
                    if (topic && paperKey !== topic) return;
                    
                    // Process questions for this topic
                    processQuestionsFromTopic(paperData);
                  }
                });
              }
            });
          };
          
          // Helper function to extract questions from a topic
          const processQuestionsFromTopic = (topicData: any) => {
            if (!topicData || !topicData.subtopics) return;
            
            // Check for essay questions
            if (topicData.subtopics.essay && topicData.subtopics.essay.questions) {
              essayQuestions.push(...topicData.subtopics.essay.questions);
            }
            
            // Check for short note questions (can be either "short-note" or "short-notes")
            if (topicData.subtopics["short-note"] && topicData.subtopics["short-note"].questions) {
              shortNoteQuestions.push(...topicData.subtopics["short-note"].questions);
            }
            if (topicData.subtopics["short-notes"] && topicData.subtopics["short-notes"].questions) {
              shortNoteQuestions.push(...topicData.subtopics["short-notes"].questions);
            }
          };
          
          // Find questions
          findQuestionsForTopic(QUESTION_BANK_DATA, subjectMatch, topicMatch);
          
          console.log("Found questions:", { 
            essays: essayQuestions.length, 
            shortNotes: shortNoteQuestions.length 
          });
          
          // Construct response
          let responseContent = "";
          
          if (essayQuestions.length === 0 && shortNoteQuestions.length === 0) {
            // If no questions found, use the API
            responseContent = await fetchAIResponse(message, conversationHistory);
          } else {
            // Format the questions into a nice response
            responseContent = `# Important Questions on ${topicMatch ? topicMatch.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : ''} ${subjectMatch ? '(' + subjectMatch.charAt(0).toUpperCase() + subjectMatch.slice(1) + ')' : ''}\n\n`;
            
            if (essayQuestions.length > 0) {
              responseContent += "## Essay Questions\n\n";
              essayQuestions.forEach((q, i) => {
                // Clean up the question format - remove page numbers, etc.
                let cleanQuestion = q.replace(/\(Pg\.No:[^)]+\)/g, '').trim();
                // Extract frequency indicators (like *****)
                const starMatch = cleanQuestion.match(/\*+/);
                const frequency = starMatch ? starMatch[0].length : 0;
                
                // Remove the stars and add a frequency indicator if present
                cleanQuestion = cleanQuestion.replace(/\*+/, '').trim();
                
                // Add a frequency indicator in text form
                const frequencyText = frequency > 0 ? ` (High Frequency: ${frequency}/5)` : '';
                
                responseContent += `${i+1}. ${cleanQuestion}${frequencyText}\n\n`;
              });
            }
            
            if (shortNoteQuestions.length > 0) {
              responseContent += "## Short Notes\n\n";
              shortNoteQuestions.forEach((q, i) => {
                // Clean up the question format - remove page numbers, etc.
                let cleanQuestion = q.replace(/\(Pg\.No:[^)]+\)/g, '').trim();
                // Extract frequency indicators (like *****)
                const starMatch = cleanQuestion.match(/\*+/);
                const frequency = starMatch ? starMatch[0].length : 0;
                
                // Remove the stars and add a frequency indicator if present
                cleanQuestion = cleanQuestion.replace(/\*+/, '').trim();
                
                // Add a frequency indicator in text form
                const frequencyText = frequency > 0 ? ` (High Frequency: ${frequency}/5)` : '';
                
                responseContent += `${i+1}. ${cleanQuestion}${frequencyText}\n\n`;
              });
            }
            
            responseContent += "\nThese questions are directly from your question bank. Focus on the high frequency questions for best results.";
          }
          
          // Create the AI response message
          const aiResponseMessage: ChatMessage = {
            id: getRandomId(),
            role: "assistant",
            content: responseContent,
            timestamp: new Date().toISOString(),
          };
          
          // Add AI message to chat
          setMessages((prev) => [...prev, aiResponseMessage]);
          setCurrentConversation((prev) => [...prev, userMessageObj, aiResponseMessage]);
          
        } else {
          // Regular AI response via API
          const response = await fetchAIResponse(message, conversationHistory);
          
          // Create the AI response message
          const aiResponseMessage: ChatMessage = {
            id: getRandomId(),
            role: "assistant",
            content: response.response,
            timestamp: new Date().toISOString(),
            references: response.references,
          };
          
          // Add AI message to chat
          setMessages((prev) => [...prev, aiResponseMessage]);
          setCurrentConversation((prev) => [...prev, userMessageObj, aiResponseMessage]);
        }
      } catch (error) {
        console.error("Error in AI response:", error);
        
        // Create error message
        const errorMessage: ChatMessage = {
          id: getRandomId(),
          role: "assistant",
          content: "Sorry, I encountered an error while processing your request. Please try again in a moment.",
          timestamp: new Date().toISOString(),
        };
        
        // Add error message to chat
        setMessages((prev) => [...prev, errorMessage]);
        setCurrentConversation((prev) => [...prev, userMessageObj, errorMessage]);
      } finally {
        // End loading
        setIsLoading(false);
        
        // Scroll to bottom with animation
        setTimeout(() => {
          const chatContainer = document.querySelector(".chat-container");
          if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
          }
        }, 100);
      }
    },
    [conversationHistory]
  );

  const clearChat = useCallback(() => {
    // Save current conversation to history before clearing
    if (messages.length > 0) {
      setConversationHistory(prev => [...prev, ...currentConversation]);
    }
    
    // Clear current messages
    setMessages([]);
    setCurrentConversation([]);
  }, [messages, currentConversation, setConversationHistory]);

  const clearHistory = useCallback(() => {
    setConversationHistory([]);
  }, [setConversationHistory]);

  return {
    messages,
    isLoading,
    retryAfter,
    handleSendMessage,
    clearChat,
    clearHistory,
    conversationHistory,
  };
};
