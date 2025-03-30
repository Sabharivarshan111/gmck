import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/hooks/use-toast";
import { ChatMessage, Reference } from "@/models/ChatMessage";
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
  console.log(`Getting important questions for subject: ${subject}, topic: ${topic || 'all topics'}`);
  
  // Normalize subject to match our data structure
  const normalizedSubject = subject.toLowerCase().trim();
  
  // Find the subject in our question bank data
  const subjectData = QUESTION_BANK_DATA[normalizedSubject as keyof typeof QUESTION_BANK_DATA];
  if (!subjectData) {
    return `Could not find information about "${subject}" in our question bank. Please check the spelling or try a different subject.`;
  }

  // Helper function to check if a topic matches the requested topic using word boundaries
  const isTopicMatch = (topicName: string, searchTopic: string): boolean => {
    if (!topicName || !searchTopic) return false;
    
    // Convert both to lowercase for case-insensitive comparison
    const normalizedTopicName = topicName.toLowerCase().trim();
    const normalizedSearchTopic = searchTopic.toLowerCase().trim();
    
    console.log(`Comparing topic: "${normalizedTopicName}" with search: "${normalizedSearchTopic}"`);
    
    // Direct match
    if (normalizedTopicName === normalizedSearchTopic) {
      console.log(`-> Direct match found`);
      return true;
    }
    
    // For stricter matching in pathology and microbiology
    if (normalizedSubject === 'pathology' || normalizedSubject === 'microbiology') {
      // Key phrases for pathology and microbiology need to be exact matches
      if (normalizedTopicName === normalizedSearchTopic || 
          normalizedTopicName.replace(/\s+/g, '-') === normalizedSearchTopic.replace(/\s+/g, '-') ||
          normalizedTopicName.replace(/-/g, ' ') === normalizedSearchTopic.replace(/-/g, ' ')) {
        console.log(`-> Exact match for ${normalizedSubject} topic`);
        return true;
      }
      
      // Check if search topic is in the name as a full word
      const topicWords = normalizedTopicName.split(/\s+|-/);
      const searchWords = normalizedSearchTopic.split(/\s+|-/);
      
      // For single word searches, be strict
      if (searchWords.length === 1) {
        const isContained = topicWords.includes(searchWords[0]);
        if (isContained) console.log(`-> Single word match found in ${normalizedSubject} topic`);
        return isContained;
      }
      
      // For multi-word searches, require most words to match
      const matchCount = searchWords.filter(searchWord => 
        topicWords.includes(searchWord)
      ).length;
      
      // At least 70% of words must match for multi-word topics
      const matchRatio = matchCount / searchWords.length;
      const isGoodMatch = matchRatio >= 0.7;
      
      if (isGoodMatch) console.log(`-> ${Math.round(matchRatio * 100)}% word match for ${normalizedSubject} topic`);
      return isGoodMatch;
    }
    
    // Less strict matching for other subjects
    // Check if the search topic is contained in the topic name
    if (normalizedTopicName.includes(normalizedSearchTopic)) {
      console.log(`-> Substring match found`);
      return true;
    }
    
    // Check for word boundary matches
    const wordsInTopicName = normalizedTopicName.split(/\s+|-/);
    const wordsInSearchTopic = normalizedSearchTopic.split(/\s+|-/);
    
    const matchesAllWords = wordsInSearchTopic.every(searchWord => 
      wordsInTopicName.some(topicWord => topicWord.includes(searchWord))
    );
    
    if (matchesAllWords) console.log(`-> Word boundary match found`);
    return matchesAllWords;
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
    const questionsAdded = new Set<string>(); // To track duplicate questions
    
    // Special handling for microbiology which has a different structure
    if (normalizedSubject === 'microbiology') {
      console.log(`Processing microbiology structure for ${questionType} questions`);
      
      // First level: paper-1, paper-2
      Object.values(data.subtopics).forEach((paper: any) => {
        if (!paper || typeof paper !== 'object' || !paper.subtopics) return;
        
        // Second level: topics like "general-microbiology", "immunology", etc.
        Object.entries(paper.subtopics).forEach(([topicKey, topicData]: [string, any]) => {
          if (!topicData || typeof topicData !== 'object' || !topicData.subtopics) return;
          
          // If a specific topic is requested, check if this topic matches
          const shouldIncludeTopic = !topic || isTopicMatch(topicData.name, topic) || isTopicMatch(topicKey, topic);
          
          console.log(`Topic: ${topicData.name || topicKey} - Include? ${shouldIncludeTopic}`);
          
          // Skip if a specific topic is requested and this doesn't match
          if (topic && !shouldIncludeTopic) {
            return;
          }
          
          // Third level: essay, short-note, etc.
          const targetQuestionType = questionType === 'short-notes' ? 'short-note' : questionType;
          
          if (topicData.subtopics[targetQuestionType] && 
              topicData.subtopics[targetQuestionType].questions) {
            
            const topicQuestions = extractQuestions(topicData.subtopics[targetQuestionType].questions);
            
            // Add questions that aren't duplicates
            topicQuestions.forEach(q => {
              if (!questionsAdded.has(q.text)) {
                questions.push(q);
                questionsAdded.add(q.text);
                console.log(`Added question from ${topicData.name || topicKey}: ${q.text.substring(0, 30)}...`);
              }
            });
          }
        });
      });
      
      return questions;
    }
    
    // Original handling for pharmacology and pathology
    console.log(`Processing ${normalizedSubject} structure for ${questionType} questions`);
    
    // Helper to navigate the nested structure
    const processSubtopics = (node: any, nodePath: string = "") => {
      if (!node) return;
      
      // If a specific topic is requested, check if current node matches
      const currentNodeName = node.name?.toLowerCase() || "";
      const shouldProcessNode = !topic || isTopicMatch(currentNodeName, topic) || isTopicMatch(nodePath, topic);
      
      // Log to debug topic matching
      if (topic && (node.name || nodePath)) {
        console.log(`Node: ${node.name || nodePath} - Match with "${topic}"? ${shouldProcessNode}`);
      }
      
      // Check if this node has the specific question type and matches topic filter
      if (shouldProcessNode && node.subtopics) {
        // Determine which question type to look for (handling short-note vs short-notes)
        const targetQuestionType = questionType === 'short-notes' 
          ? (node.subtopics['short-note'] ? 'short-note' : 'short-notes')
          : questionType;
          
        if (node.subtopics[targetQuestionType] && node.subtopics[targetQuestionType].questions) {
          const nodeQuestions = extractQuestions(node.subtopics[targetQuestionType].questions);
          
          // Add questions that aren't duplicates
          nodeQuestions.forEach(q => {
            if (!questionsAdded.has(q.text)) {
              questions.push(q);
              questionsAdded.add(q.text);
              console.log(`Added question from ${node.name || nodePath}: ${q.text.substring(0, 30)}...`);
            }
          });
        }
      }
      
      // Only recurse into subtopics if we don't have a topic match yet, or if this node matches the topic
      if (!topic || shouldProcessNode) {
        // Recursively process all subtopics
        if (node.subtopics) {
          Object.entries(node.subtopics).forEach(([key, subtopic]) => {
            if (key !== 'essay' && key !== 'short-note' && key !== 'short-notes' && 
                typeof subtopic === 'object' && subtopic !== null) {
              processSubtopics(subtopic, nodePath ? `${nodePath}.${key}` : key);
            }
          });
        }
      }
    };
    
    // Start processing from the subtopics of the subject
    if (data.subtopics) {
      Object.entries(data.subtopics).forEach(([key, subtopic]) => {
        processSubtopics(subtopic, key);
      });
    }
    
    return questions;
  };
  
  // Get all essay and short note questions
  const essayQuestions = processQuestionType(subjectData, 'essay');
  const shortNoteQuestions = processQuestionType(subjectData, 'short-note');
  
  console.log(`Found ${essayQuestions.length} essay questions and ${shortNoteQuestions.length} short note questions`);
  
  // Sort questions by their asterisk count (frequency)
  const sortedEssayQuestions = essayQuestions.sort((a, b) => b.count - a.count);
  const sortedShortNoteQuestions = shortNoteQuestions.sort((a, b) => b.count - a.count);
  
  // Build the response
  let result = `# Important Questions for ${subject.toUpperCase()}${topic ? ` - ${topic.toUpperCase()}` : ''}\n\n`;
  
  // Add essay questions
  result += "## ESSAY QUESTIONS\n\n";
  if (sortedEssayQuestions.length > 0) {
    sortedEssayQuestions.forEach((q, i) => {
      const asterisks = q.count > 0 ? '*'.repeat(q.count) : '';
      result += `${i+1}. ${q.text}\n\n`;
    });
  } else {
    result += "No essay questions found for this topic.\n\n";
  }
  
  // Add short note questions
  result += "## SHORT NOTE QUESTIONS\n\n";
  if (sortedShortNoteQuestions.length > 0) {
    sortedShortNoteQuestions.forEach((q, i) => {
      const asterisks = q.count > 0 ? '*'.repeat(q.count) : '';
      result += `${i+1}. ${q.text}\n\n`;
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
  
  // Enhanced topic extraction with more specific patterns
  const topicPatterns = [
    /(?:in|about|for|on|regarding)\s+([a-z\s-]+?)(?:\.|\?|$)/i,
    /([a-z\s-]+?)\s+(?:topic|section|chapter)/i,
    /topic\s+(?:of|on|about)\s+([a-z\s-]+)/i,
    /(?:the|a)\s+([a-z\s-]+?)\s+(?:topic|section)/i,
    /questions\s+(?:in|about|on)\s+([a-z\s-]+)/i,
  ];
  
  for (const pattern of topicPatterns) {
    const match = lowerPrompt.match(pattern);
    if (match && match[1] && match[1].length > 3) {
      topic = match[1].trim();
      // Don't include the subject name in the topic
      if (topic.includes(detectedSubject)) {
        topic = topic.replace(detectedSubject, '').trim();
      }
      // Remove common filler words
      topic = topic.replace(/^(the|a|an)\s+/i, '').trim();
      break;
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
        console.log(`Detected request for important questions in ${importantQuestionsRequest.subject}${importantQuestionsRequest.topic ? ` - ${importantQuestionsRequest.topic}` : ''}`);
        
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
      
      // Use Supabase edge function - ask-gemini now uses Gemini 2.0 Flash
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
        console.error("Error calling ask-gemini edge function:", error);
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
        console.error("Error from Gemini API:", data.error);
        throw new Error(data.error);
      }
      
      if (data.queueStats) {
        setQueueStats(data.queueStats);
      }
      
      // Create the AI message, now properly handling references from the API response
      const aiMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        references: data.references || [], // Include references from Gemini response
      };
      
      // Log references to help with debugging
      if (data.references && data.references.length > 0) {
        console.log("References received:", data.references);
      }
      
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
