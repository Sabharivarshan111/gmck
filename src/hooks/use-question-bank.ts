
import { useState, useEffect, useCallback, useMemo } from "react";
import { QUESTION_BANK_DATA } from "@/data/questionBankData";
import { Topic, QuestionBankData } from "@/components/QuestionBank";

export const useQuestionBank = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<"extras" | "essay" | "short-notes">("essay");
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [hasSearchResults, setHasSearchResults] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    setIsRendered(true);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const searchInQuestions = useCallback((questions: string[], query: string): string[] => {
    if (!query.trim()) return questions;
    const lowerQuery = query.toLowerCase();
    return questions.filter(question => 
      question.toLowerCase().includes(lowerQuery)
    );
  }, []);

  // Recursive function to search for questions
  const findQuestionsInTree = useCallback(
    (node: any, type: "essay" | "short-notes", query: string): any => {
      // Base case 1: If node is null or not an object
      if (!node || typeof node !== 'object') return null;
      
      // Base case 2: We found a question array that matches our type
      if ('questions' in node) {
        const isEssayType = type === "essay" && node.name?.toLowerCase() === "essay";
        const isShortNotesType = type === "short-notes" && 
          (node.name?.toLowerCase() === "short notes" || 
           node.name?.toLowerCase() === "short note" || 
           node.name?.toLowerCase() === "short-notes");
        
        if (isEssayType || isShortNotesType) {
          const filteredQuestions = searchInQuestions(node.questions, query);
          if (filteredQuestions.length > 0) {
            return {
              ...node,
              questions: filteredQuestions
            };
          }
        }
        return null;
      }
      
      // Recursive case: Check subtopics
      if ('subtopics' in node) {
        const filteredSubtopics: Record<string, any> = {};
        let hasMatchingContent = false;
        
        for (const [key, subtopic] of Object.entries(node.subtopics || {})) {
          // Special case: direct match by key name
          if ((type === "essay" && key === "essay") || 
              (type === "short-notes" && (key === "short-note" || key === "short-notes"))) {
            if (subtopic && 'questions' in subtopic) {
              const filteredQuestions = searchInQuestions(subtopic.questions, query);
              if (filteredQuestions.length > 0) {
                filteredSubtopics[key] = {
                  ...subtopic,
                  questions: filteredQuestions
                };
                hasMatchingContent = true;
                continue;
              }
            }
          }
          
          // Regular recursive search
          const filteredSubtopic = findQuestionsInTree(subtopic, type, query);
          if (filteredSubtopic) {
            filteredSubtopics[key] = filteredSubtopic;
            hasMatchingContent = true;
          }
        }
        
        if (hasMatchingContent) {
          return {
            ...node,
            subtopics: filteredSubtopics
          };
        }
      }
      
      return null;
    },
    [searchInQuestions]
  );

  const getFilteredData = useCallback((type: "essay" | "short-notes", query: string): QuestionBankData => {
    const filteredData: QuestionBankData = {};
    let hasResults = false;
    
    if (!query.trim()) {
      setHasSearchResults(true);
      setIsSearching(false);
      return QUESTION_BANK_DATA as unknown as QuestionBankData;
    }
    
    setIsSearching(true);
    
    for (const [key, topic] of Object.entries(QUESTION_BANK_DATA)) {
      const filteredTopic = findQuestionsInTree(topic, type, query);
      if (filteredTopic) {
        filteredData[key] = filteredTopic;
        hasResults = true;
      }
    }
    
    setHasSearchResults(hasResults);
    return filteredData;
  }, [findQuestionsInTree]);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log("Search value:", value);
    setSearchQuery(value);
    
    if (!value.trim()) {
      setHasSearchResults(true);
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (searchQuery.trim() !== "") {
      const topicKeys = Object.keys(QUESTION_BANK_DATA);
      setExpandedItems(topicKeys);
    } else {
      setExpandedItems([]);
    }
  }, [searchQuery]);

  const essayFilteredData = useMemo(() => 
    getFilteredData("essay", searchQuery), 
    [getFilteredData, searchQuery]
  );
  
  const shortNotesFilteredData = useMemo(() => 
    getFilteredData("short-notes", searchQuery), 
    [getFilteredData, searchQuery]
  );

  const hasContentToDisplay = !isSearching || 
                             Object.keys(essayFilteredData).length > 0 || 
                             Object.keys(shortNotesFilteredData).length > 0;

  return {
    searchQuery,
    isMobile,
    activeTab,
    expandedItems,
    hasSearchResults,
    isSearching,
    isRendered,
    essayFilteredData,
    shortNotesFilteredData,
    hasContentToDisplay,
    setActiveTab,
    setExpandedItems,
    handleSearch
  };
};
