import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/hooks/use-toast";
import { ChatMessage } from "@/models/ChatMessage";
import { supabase } from "@/integrations/supabase/client";
import { QUESTION_BANK_DATA } from "@/data/questionBankData";

interface QueueStats {
  isQueueActive: boolean;
  queueLength: number;
  estimatedWaitTime: number;
}

interface UseAiChatProps {
  initialQuestion?: string;
}

// Function to get important questions from the question bank data without using API
function getImportantQuestions(subject: string, topic?: string): string {
  // Normalize subject to match our data structure
  const normalizedSubject = subject.toLowerCase().trim();
  
  // Find the subject in our question bank data
  const subjectData = QUESTION_BANK_DATA[normalizedSubject as keyof typeof QUESTION_BANK_DATA];
  if (!subjectData) {
    return `Could not find information about "${subject}" in our question bank. Please check the spelling or try a different subject.`;
  }

  // Helper function to check if a topic matches the requested topic
  const isTopicMatch = (topicName: string, searchTopic: string): boolean => {
    if (!topicName || !searchTopic) return false;
    
    // Convert both to lowercase for case-insensitive comparison
    const normalizedTopicName = topicName.toLowerCase().trim();
    const normalizedSearchTopic = searchTopic.toLowerCase().trim();
    
    // Direct match
    if (normalizedTopicName === normalizedSearchTopic) return true;
    
    // Word boundary check for more precise matching
    return normalizedTopicName.includes(normalizedSearchTopic) || 
           searchTopic.includes(normalizedTopicName);
  };
  
  // Helper function to extract questions with their asterisk counts
  const extractQuestions = (questions: string[]): {text: string, count: number}[] => {
    return questions.map(question => {
      // Extract the asterisk pattern if present
      const asteriskMatch = question.match(/\*+/);
      const count = asteriskMatch ? asteriskMatch[0].length : 0;
      return { text: question, count };
    });
  };
  
  // Function to process essay or short note questions from a subtopic
  const processQuestionType = (data: any, questionType: 'essay' | 'short-note' | 'short-notes') => {
    const questions: {text: string, count: number}[] = [];
    
    // Special handling for pathology and different structure
    if (normalizedSubject === 'pathology') {
      // Find all pathology topics that match the search topic
      Object.entries(data.subtopics).forEach(([topicKey, topicData]: [string, any]) => {
        // Skip if a specific topic is requested and this isn't it
        if (topic && !isTopicMatch(topicData.name, topic) && !isTopicMatch(topicKey, topic)) {
          return;
        }
        
        // Check if this topic has the specific question type
        if (topicData.subtopics && 
            ((questionType === 'essay' && topicData.subtopics.essay) || 
             (questionType === 'short-note' && topicData.subtopics['short-note']) || 
             (questionType === 'short-notes' && topicData.subtopics['short-note']))) {
          
          const questionData = questionType === 'essay' ? 
            topicData.subtopics.essay : 
            topicData.subtopics['short-note'];
          
          if (questionData && questionData.questions) {
            questions.push(...extractQuestions(questionData.questions));
          }
        }
      });
      
      return questions;
    }
    
    // Handling for pharmacology and microbiology
    const processSubtopics = (node: any) => {
      if (!node) return;
      
      // Check if this node has the specific question type
      if (node.subtopics && 
          ((questionType === 'essay' && node.subtopics.essay) || 
           (questionType === 'short-note' && node.subtopics['short-note']) || 
           (questionType === 'short-notes' && node.subtopics['short-note']))) {
        
        const questionData = questionType === 'essay' ? 
          node.subtopics.essay : 
          node.subtopics['short-note'];
        
        if (questionData && questionData.questions) {
          questions.push(...extractQuestions(questionData.questions));
        }
      }
      
      // If this node has a name property, check if it matches the topic
      if (topic && node.name && !isTopicMatch(node.name, topic)) {
        return;
      }
      
      // Recursively process all subtopics
      if (node.subtopics) {
        Object.entries(node.subtopics).forEach(([key, subtopic]) => {
          if (typeof subtopic === 'object' && subtopic !== null) {
            // If a topic is specified, only process matching topics
            if (!topic || isTopicMatch((subtopic as any).name || key, topic)) {
              processSubtopics(subtopic);
            }
          }
        });
      }
    };
    
    // Start processing from the subject data
    processSubtopics(data);
    
    return questions;
  };
  
  // Get all essay and short note questions
  const essayQuestions = processQuestionType(subjectData, 'essay');
  const shortNoteQuestions = processQuestionType(subjectData, 'short-note');
  
  // Sort questions by their asterisk count (frequency)
  const sortedEssayQuestions = essayQuestions.sort((a, b) => b.count - a.count);
  const sortedShortNoteQuestions = shortNoteQuestions.sort((a, b) => b.count - a.count);
  
  // Build the response
  let result = `# Important Questions for ${subject.toUpperCase()}${topic ? ` - ${topic.toUpperCase()}` : ''}\n\n`;
  
  // Add essay questions
  result += "## ESSAY QUESTIONS\n\n";
  if (sortedEssayQuestions.length > 0) {
    sortedEssayQuestions.forEach((q, i) => {
      const asterisks = q.count > 0 ? ' ' + '*'.repeat(q.count) : '';
      result += `${i+1}. ${q.text.split('\n')[0]}${asterisks}\n\n`;
    });
  } else {
    result += "No essay questions found for this topic.\n\n";
  }
  
  // Add short note questions
  result += "## SHORT NOTE QUESTIONS\n\n";
  if (sortedShortNoteQuestions.length > 0) {
    sortedShortNoteQuestions.forEach((q, i) => {
      const asterisks = q.count > 0 ? ' ' + '*'.repeat(q.count) : '';
      result += `${i+1}. ${q.text.split('\n')[0]}${asterisks}\n\n`;
    });
  } else {
    result += "No short note questions found for this topic.\n\n";
  }
  
  return result;
}

// Helper to check if a prompt is requesting important questions about a subject
function detectSubjectImportantQuestionsRequest(prompt: string): { isRequest: boolean, subject: string, topic?: string } {
  const lowerPrompt = prompt.toLowerCase();
  
  // Check for "important questions" type requests
  const isImportantQuestionsRequest = /important question|important topics|high yield|frequently asked|commonly asked|repeated questions/i.test(lowerPrompt);
  
  if (!isImportantQuestionsRequest) {
    return { isRequest: false, subject: '' };
  }
  
  // Look for subject mentions
  const subjects = [
    { name: "pharmacology", aliases: ["pharma", "pharmacodynamics", "pharmacokinetics"] },
    { name: "microbiology", aliases: ["micro", "bacteria", "virus", "fungi", "parasites"] },
    { name: "pathology", aliases: ["patho", "histology", "cytology"] }
  ];
  
  let detectedSubject = '';
  
  // Try to detect subject
  for (const subject of subjects) {
    if (lowerPrompt.includes(subject.name) || subject.aliases.some(alias => lowerPrompt.includes(alias))) {
      detectedSubject = subject.name;
      break;
    }
  }
  
  if (!detectedSubject) {
    return { isRequest: false, subject: '' };
  }
  
  // If a subject is detected, try to extract any specific topic
  let topic: string | undefined;
  
  // Extract topic from the prompt
  const topicRegex = new RegExp(`${detectedSubject}\\s+(?:in|about|for|on|of|-)\\s+([\\w\\s-]+)`, 'i');
  const match = lowerPrompt.match(topicRegex);
  
  if (match && match[1]) {
    topic = match[1].trim();
  } else {
    // Try other patterns to extract topic
    const words = lowerPrompt.split(/\s+/);
    const subjectIndex = words.findIndex(word => 
      word === detectedSubject || 
      subjects.find(s => s.name === detectedSubject)?.aliases.includes(word)
    );
    
    if (subjectIndex > -1 && words.length > subjectIndex + 1) {
      // Look for standalone topics after the subject mention
      const possibleTopics = ['neoplasia', 'inflammation', 'immunology', 'infectious', 'kidney', 'heart', 'shock', 'edema', 'gangrene'];
      
      for (const possibleTopic of possibleTopics) {
        if (lowerPrompt.includes(possibleTopic)) {
          topic = possibleTopic;
          break;
        }
      }
    }
  }
  
  return { 
    isRequest: true, 
    subject: detectedSubject,
    topic
  };
}

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
      // First, check if this is a request for important questions that we can handle locally
      const importantQuestionsRequest = detectSubjectImportantQuestionsRequest(question);
      
      if (importantQuestionsRequest.isRequest && importantQuestionsRequest.subject) {
        // Handle locally without API call
        const response = getImportantQuestions(
          importantQuestionsRequest.subject, 
          importantQuestionsRequest.topic
        );
        
        const aiMessage: ChatMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: response,
          timestamp: new Date(),
        };
        
        setMessages(prevMessages => [...prevMessages, aiMessage]);
        setIsLoading(false);
        return;
      }
      
      // If not a local request, proceed with API call
      
      // Convert previous messages to history format for context
      const conversationHistory = messages.slice(-6).map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Check if this is a triple tap (special handling)
      const isTripleTap = question.startsWith("Triple-tapped:") || question.startsWith("triple-tapped:");
      
      // Check if the user is requesting MCQs
      const isMCQRequest = /generate\s+(?:10|ten)\s+mcqs?|create\s+(?:10|ten)\s+mcqs?|make\s+(?:10|ten)\s+mcqs?|ten\s+mcqs?|10\s+mcqs?|generate\s+mcqs?/i.test(question);
      
      // Check if the user is asking for important questions
      const isImportantQuestionsRequest = /important question|important topics|high yield|frequently asked|commonly asked|repeated questions/i.test(question);
      
      // Check if the user is asking for clarification
      const isNeedingClarification = /i don't understand|can't understand|explain|similar|more detail/i.test(question.toLowerCase());
      
      console.log("Request type:", { isTripleTap, isMCQRequest, isImportantQuestionsRequest, isNeedingClarification });
      
      // Use Supabase edge function - using ask-gemini which supports all the advanced features
      const { data, error } = await supabase.functions.invoke('ask-gemini', {
        body: { 
          prompt: question,
          conversationHistory,
          isTripleTap,
          isMCQRequest,
          isImportantQuestionsRequest,
          isNeedingClarification
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
        references: data.references // Include the references if any
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
