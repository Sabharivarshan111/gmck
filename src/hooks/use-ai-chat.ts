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

function getImportantQuestions(subject: string, topic?: string): string {
  const normalizedSubject = subject.toLowerCase().trim();
  
  const subjectData = QUESTION_BANK_DATA[normalizedSubject as keyof typeof QUESTION_BANK_DATA];
  if (!subjectData) {
    return `Could not find information about "${subject}" in our question bank. Please check the spelling or try a different subject.`;
  }

  const isTopicMatch = (topicName: string, searchTopic: string): boolean => {
    if (!topicName || !searchTopic) return false;
    
    const normalizedTopicName = topicName.toLowerCase().trim();
    const normalizedSearchTopic = searchTopic.toLowerCase().trim();
    
    if (normalizedTopicName === normalizedSearchTopic) return true;
    
    if (normalizedSubject === 'microbiology' && normalizedSearchTopic === 'infections') {
      return normalizedTopicName === 'infectious-diseases' || 
             normalizedTopicName === 'infections' ||
             normalizedTopicName === 'infectious diseases';
    }
    
    const wordsInTopicName = normalizedTopicName.split(/\s+|-/);
    const wordsInSearchTopic = normalizedSearchTopic.split(/\s+|-/);
    
    if (normalizedSubject === 'microbiology') {
      if (normalizedTopicName.includes(normalizedSearchTopic)) {
        return true;
      }
      
      if (wordsInSearchTopic.length > 1) {
        const matchCount = wordsInSearchTopic.filter(searchWord => 
          wordsInTopicName.some(topicWord => topicWord === searchWord)
        ).length;
        
        return matchCount >= Math.ceil(wordsInSearchTopic.length * 0.8);
      }
      
      return wordsInTopicName.some(word => word === normalizedSearchTopic);
    }
    
    return wordsInSearchTopic.every(searchWord => 
      wordsInTopicName.some(topicWord => 
        topicWord === searchWord || topicWord.includes(searchWord)
      )
    );
  };

  const extractQuestions = (questions: string[]): {text: string, count: number}[] => {
    return questions.map(question => {
      const asteriskMatch = question.match(/\*+/);
      const count = asteriskMatch ? asteriskMatch[0].length : 0;
      return { text: question, count };
    });
  };

  const processQuestionType = (data: any, questionType: 'essay' | 'short-note' | 'short-notes') => {
    const questions: {text: string, count: number}[] = [];
    
    if (normalizedSubject === 'microbiology') {
      Object.values(data.subtopics).forEach((paper: any) => {
        if (!paper || typeof paper !== 'object' || !paper.subtopics) return;
        
        Object.entries(paper.subtopics).forEach(([topicKey, topicData]: [string, any]) => {
          if (!topicData || typeof topicData !== 'object' || !topicData.subtopics) return;
          
          if (topic && topicData.name) {
            const topicName = topicData.name.toLowerCase();
            const searchTopic = topic.toLowerCase();
            
            if (!isTopicMatch(topicName, searchTopic) && !isTopicMatch(topicKey, searchTopic)) {
              return;
            }
          }
          
          if (topicData.subtopics[questionType] && 
              topicData.subtopics[questionType].questions) {
            const topicQuestions = extractQuestions(topicData.subtopics[questionType].questions);
            questions.push(...topicQuestions);
          } else if (questionType === 'short-notes' && 
                    topicData.subtopics['short-note'] && 
                    topicData.subtopics['short-note'].questions) {
            const topicQuestions = extractQuestions(topicData.subtopics['short-note'].questions);
            questions.push(...topicQuestions);
          }
        });
      });
      
      return questions;
    }
    
    const processSubtopics = (node: any) => {
      if (!node) return;
      
      if (node.subtopics && 
          ((questionType === 'essay' && node.subtopics.essay) || 
           (questionType === 'short-note' && (node.subtopics['short-note'] || node.subtopics['short-notes'])) ||
           (questionType === 'short-notes' && (node.subtopics['short-note'] || node.subtopics['short-notes'])))) {
        
        const questionData = questionType === 'essay' ? 
          node.subtopics.essay : 
          (node.subtopics['short-note'] || node.subtopics['short-notes']);
        
        if (questionData && questionData.questions) {
          questions.push(...extractQuestions(questionData.questions));
        }
      }
      
      if (node.subtopics) {
        Object.values(node.subtopics).forEach(subtopic => {
          if (typeof subtopic === 'object' && subtopic !== null) {
            processSubtopics(subtopic);
          }
        });
      }
    };
    
    if (data.subtopics) {
      Object.values(data.subtopics).forEach(paper => {
        if (topic && paper && typeof paper === 'object' && 'subtopics' in paper) {
          Object.entries((paper as any).subtopics || {}).forEach(([key, subtopic]) => {
            const subtopicObj = subtopic as any;
            const subtopicName = subtopicObj.name?.toLowerCase() || '';
            
            if (isTopicMatch(subtopicName, topic.toLowerCase()) || isTopicMatch(key, topic.toLowerCase())) {
              processSubtopics(subtopic);
            }
          });
        } else if (paper && typeof paper === 'object') {
          processSubtopics(paper);
        }
      });
    }
    
    return questions;
  };

  const essayQuestions = processQuestionType(subjectData, 'essay');
  const shortNoteQuestions = processQuestionType(subjectData, 'short-note');
  
  const sortedEssayQuestions = essayQuestions.sort((a, b) => b.count - a.count);
  const sortedShortNoteQuestions = shortNoteQuestions.sort((a, b) => b.count - a.count);
  
  let result = `# Important Questions for ${subject.toUpperCase()}${topic ? ` - ${topic.toUpperCase()}` : ''}\n\n`;
  
  result += "## ESSAY QUESTIONS\n\n";
  if (sortedEssayQuestions.length > 0) {
    sortedEssayQuestions.forEach((q, i) => {
      const asterisks = q.count > 0 ? '*'.repeat(q.count) : '';
      result += `${i+1}. ${q.text}\n\n`;
    });
  } else {
    result += "No essay questions found for this topic.\n\n";
  }
  
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

function detectSubjectImportantQuestionsRequest(prompt: string): { isRequest: boolean, subject: string, topic?: string } {
  const lowerPrompt = prompt.toLowerCase();
  
  const isImportantQuestionsRequest = /important question|important topics|high yield|frequently asked|commonly asked|repeated questions/i.test(lowerPrompt);
  
  if (!isImportantQuestionsRequest) {
    return { isRequest: false, subject: '' };
  }
  
  const subjects = [
    { name: "pharmacology", aliases: ["pharma", "pharmacodynamics", "pharmacokinetics"] },
    { name: "microbiology", aliases: ["micro", "bacteria", "virus", "fungi", "parasites"] },
    { name: "pathology", aliases: ["patho", "histology", "cytology"] }
  ];
  
  let detectedSubject = '';
  
  for (const subject of subjects) {
    if (lowerPrompt.includes(subject.name) || subject.aliases.some(alias => lowerPrompt.includes(alias))) {
      detectedSubject = subject.name;
      break;
    }
  }
  
  if (!detectedSubject) {
    return { isRequest: false, subject: '' };
  }
  
  let topic: string | undefined;
  
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
      if (topic.includes(detectedSubject)) {
        topic = topic.replace(detectedSubject, '').trim();
      }
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
    
    const errorMessage = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' 
      ? error.message 
      : "An unexpected error occurred. Please try again later.";
    
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
  };
  
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
      const importantQuestionsRequest = detectSubjectImportantQuestionsRequest(question);
      
      if (importantQuestionsRequest.isRequest && importantQuestionsRequest.subject) {
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
      
      const conversationHistory = messages.slice(-6).map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      const isTripleTap = question.startsWith("Triple-tapped:") || question.startsWith("triple-tapped:");
      
      const isMCQRequest = /generate\s+(?:10|ten)\s+mcqs?|create\s+(?:10|ten)\s+mcqs?|make\s+(?:10|ten)\s+mcqs?|ten\s+mcqs?|10\s+mcqs?|generate\s+mcqs?/i.test(question);
      
      const isImportantQuestionsRequest = /important question|important topics|high yield|frequently asked|commonly asked|repeated questions/i.test(question);
      
      const isNeedingClarification = /i don't understand|can't understand|explain|similar|more detail/i.test(question.toLowerCase());
      
      console.log("Request type:", { isTripleTap, isMCQRequest, isImportantQuestionsRequest, isNeedingClarification });
      
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
        references: data.references,
      };
      
      setMessages(prevMessages => [...prevMessages, aiMessage]);
    } catch (error) {
      handleError(error);
      
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
      }, 60000);
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
