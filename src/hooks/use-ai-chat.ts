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
  console.log(`Finding important questions for subject: "${subject}" and topic: "${topic}"`);
  
  // Normalize subject to match our data structure
  const normalizedSubject = subject.toLowerCase().trim();
  
  // Find the subject in our question bank data
  const subjectData = QUESTION_BANK_DATA[normalizedSubject as keyof typeof QUESTION_BANK_DATA];
  if (!subjectData) {
    console.log(`Subject not found: "${normalizedSubject}"`);
    return `Could not find information about "${subject}" in our question bank. Please check the spelling or try a different subject.`;
  }

  console.log(`Found subject data for "${normalizedSubject}"`);
  
  // Helper function to normalize a string for comparison
  const normalizeString = (str: string): string => {
    return str.toLowerCase().trim().replace(/-/g, ' ');
  };
  
  // Helper function to check if a topic matches the requested topic
  const isTopicMatch = (topicName: string, searchTopic: string): boolean => {
    if (!topicName || !searchTopic) return false;
    
    // Normalize both strings for case-insensitive and format-agnostic comparison
    const normalizedTopicName = normalizeString(topicName);
    const normalizedSearchTopic = normalizeString(searchTopic);
    
    // Direct match
    if (normalizedTopicName === normalizedSearchTopic) return true;
    
    // Partial match - only if the search topic is at least 4 characters long to avoid false positives
    if (normalizedSearchTopic.length >= 4 && normalizedTopicName.includes(normalizedSearchTopic)) return true;
    
    // Check if search topic includes the topic name
    if (normalizedTopicName.length >= 4 && normalizedSearchTopic.includes(normalizedTopicName)) return true;
    
    return false;
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
  
  // Function to recursively process question data
  const processQuestionData = (node: any, currentPath: string[] = []): { essay: {text: string, count: number}[], shortNote: {text: string, count: number}[] } => {
    if (!node) return { essay: [], shortNote: [] };
    
    const result = { essay: [] as {text: string, count: number}[], shortNote: [] as {text: string, count: number}[] };
    
    console.log(`Processing node: ${node.name || 'unnamed'} at path: ${currentPath.join(' > ')}`);
    
    // If we're searching for a specific topic and this node has a name, check if it matches
    if (topic && node.name && !isTopicMatch(node.name, topic) && currentPath.length > 0) {
      // Check the path/key as well before skipping
      const lastPathSegment = currentPath[currentPath.length - 1];
      if (!isTopicMatch(lastPathSegment, topic)) {
        console.log(`Skipping node: ${node.name} - doesn't match topic: ${topic}`);
        return result;
      }
    }
    
    // Check if this node has essay or short note questions directly
    if (node.subtopics) {
      if (node.subtopics.essay && node.subtopics.essay.questions) {
        console.log(`Found ${node.subtopics.essay.questions.length} essay questions at ${currentPath.join(' > ')} > ${node.name || 'unnamed'}`);
        result.essay.push(...extractQuestions(node.subtopics.essay.questions));
      }
      
      // Check both "short-note" and "short-notes" formats
      if (node.subtopics['short-note'] && node.subtopics['short-note'].questions) {
        console.log(`Found ${node.subtopics['short-note'].questions.length} short note questions at ${currentPath.join(' > ')} > ${node.name || 'unnamed'}`);
        result.shortNote.push(...extractQuestions(node.subtopics['short-note'].questions));
      }
      
      if (node.subtopics['short-notes'] && node.subtopics['short-notes'].questions) {
        console.log(`Found ${node.subtopics['short-notes'].questions.length} short notes questions at ${currentPath.join(' > ')} > ${node.name || 'unnamed'}`);
        result.shortNote.push(...extractQuestions(node.subtopics['short-notes'].questions));
      }
      
      // Recursively process all subtopics
      Object.entries(node.subtopics).forEach(([key, subtopic]) => {
        // Skip the already processed question subtopics
        if (key === 'essay' || key === 'short-note' || key === 'short-notes') return;
        
        if (typeof subtopic === 'object' && subtopic !== null) {
          const newPath = [...currentPath, key];
          
          // If we're looking for a specific topic, check if this subtopic's key matches
          if (topic && !isTopicMatch(key, topic) && (subtopic as any).name && !isTopicMatch((subtopic as any).name, topic)) {
            console.log(`Skipping subtopic: ${key} - doesn't match topic: ${topic}`);
            return;
          }
          
          const subResults = processQuestionData(subtopic, newPath);
          result.essay.push(...subResults.essay);
          result.shortNote.push(...subResults.shortNote);
        }
      });
    }
    
    return result;
  };
  
  // Process the subject data
  const allQuestions = processQuestionData(subjectData, [normalizedSubject]);
  console.log(`Total questions found - Essay: ${allQuestions.essay.length}, Short Note: ${allQuestions.shortNote.length}`);
  
  // Sort questions by their asterisk count (frequency)
  const sortedEssayQuestions = allQuestions.essay.sort((a, b) => b.count - a.count);
  const sortedShortNoteQuestions = allQuestions.shortNote.sort((a, b) => b.count - a.count);
  
  // Format the topic name for display
  let displayTopic = topic ? topic.replace(/-/g, ' ') : '';
  if (displayTopic) {
    displayTopic = displayTopic.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }
  
  // Format the subject name for display
  const displaySubject = normalizedSubject.charAt(0).toUpperCase() + normalizedSubject.slice(1);
  
  // Build the response
  let result = `# Important Questions for ${displaySubject}${displayTopic ? ` - ${displayTopic}` : ''}\n\n`;
  
  // Add essay questions
  result += "## ESSAY QUESTIONS\n\n";
  if (sortedEssayQuestions.length > 0) {
    sortedEssayQuestions.forEach((q, i) => {
      // Clean up the question text (remove page numbers, etc.)
      let cleanText = q.text
        .replace(/\(Pg\.No:[^)]+\)/g, '')  // Remove page numbers
        .replace(/\([^)]*\d{2};\d{2}[^)]*\)/g, '')  // Remove date patterns
        .replace(/\*+/, '')  // Remove asterisks
        .trim();
      
      // Format the frequency indicator
      const frequencyText = q.count > 0 ? ` 🔥 Frequency: ${q.count}` : '';
      
      result += `${i+1}. ${cleanText}${frequencyText}\n\n`;
    });
  } else {
    result += "No essay questions found for this topic.\n\n";
  }
  
  // Add short note questions
  result += "## SHORT NOTE QUESTIONS\n\n";
  if (sortedShortNoteQuestions.length > 0) {
    sortedShortNoteQuestions.forEach((q, i) => {
      // Clean up the question text
      let cleanText = q.text
        .replace(/\(Pg\.No:[^)]+\)/g, '')  // Remove page numbers
        .replace(/\([^)]*\d{2};\d{2}[^)]*\)/g, '')  // Remove date patterns
        .replace(/\*+/, '')  // Remove asterisks
        .trim();
      
      // Format the frequency indicator
      const frequencyText = q.count > 0 ? ` 🔥 Frequency: ${q.count}` : '';
      
      result += `${i+1}. ${cleanText}${frequencyText}\n\n`;
    });
  } else {
    result += "No short note questions found for this topic.\n\n";
  }
  
  // Add a note if no questions were found at all
  if (sortedEssayQuestions.length === 0 && sortedShortNoteQuestions.length === 0) {
    result += "No questions found for the specified subject and topic combination. Please try a different search or check the spelling.\n\n";
    result += "Available topics for this subject include:\n";
    
    // List available topics to help the user
    const listAvailableTopics = (node: any, currentPath: string[] = [], topicsList: string[] = []): string[] => {
      if (!node || !node.subtopics) return topicsList;
      
      Object.entries(node.subtopics).forEach(([key, subtopic]) => {
        if (key !== 'essay' && key !== 'short-note' && key !== 'short-notes' && typeof subtopic === 'object' && subtopic !== null) {
          const topicName = (subtopic as any).name || key.replace(/-/g, ' ');
          topicsList.push(topicName);
          listAvailableTopics(subtopic, [...currentPath, key], topicsList);
        }
      });
      
      return topicsList;
    };
    
    const topics = listAvailableTopics(subjectData);
    const uniqueTopics = [...new Set(topics)].sort();
    
    uniqueTopics.slice(0, 15).forEach(topic => {
      result += `- ${topic}\n`;
    });
    
    if (uniqueTopics.length > 15) {
      result += `- And ${uniqueTopics.length - 15} more topics...\n`;
    }
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
      const possibleTopics = [
        'neoplasia', 'inflammation', 'immunology', 'infectious', 'kidney', 'heart', 
        'shock', 'edema', 'gangrene', 'cell injury', 'respiratory', 'gastrointestinal',
        'liver', 'central nervous', 'cns', 'cardiovascular', 'cvs', 'platelets', 'skin',
        'bone', 'autacoids', 'hormones', 'antibiotics', 'antimicrobial'
      ];
      
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
        console.log("Processing important questions request locally:", importantQuestionsRequest);
        
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
