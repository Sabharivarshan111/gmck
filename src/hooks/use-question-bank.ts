
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

  // Updated recursive function to filter questions at any nesting level
  const filterQuestions = useCallback((
    topic: any, 
    type: "essay" | "short-notes", 
    query: string
  ): any => {
    if (!query.trim()) return topic;

    // Helper function to search recursively through the nested structure
    const searchRecursively = (obj: any): any => {
      // Base case: if this object has a 'questions' array, filter it
      if (obj && typeof obj === 'object' && 'questions' in obj) {
        const filteredQuestions = searchInQuestions(obj.questions, query);
        if (filteredQuestions.length > 0) {
          return {
            ...obj,
            questions: filteredQuestions
          };
        }
        return null;
      }

      // If object has subtopics, recursively search through them
      if (obj && typeof obj === 'object' && 'subtopics' in obj) {
        const filteredSubtopics: { [key: string]: any } = {};
        let hasContent = false;

        for (const [key, subtopic] of Object.entries(obj.subtopics || {})) {
          // Check if we should filter by type (essay or short-notes)
          if ((key === "essay" && type === "essay") || 
              ((key === "short-note" || key === "short-notes") && type === "short-notes")) {
            const filteredContent = searchRecursively(subtopic);
            if (filteredContent) {
              filteredSubtopics[key] = filteredContent;
              hasContent = true;
            }
          } else {
            // For other keys, continue recursive search
            const filteredContent = searchRecursively(subtopic);
            if (filteredContent) {
              filteredSubtopics[key] = filteredContent;
              hasContent = true;
            }
          }
        }

        if (hasContent) {
          return {
            ...obj,
            subtopics: filteredSubtopics
          };
        }
      }

      return null;
    };

    const filteredTopic = searchRecursively(topic);
    return filteredTopic;
  }, [searchInQuestions]);

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
      const filteredTopic = filterQuestions(topic, type, query);
      if (filteredTopic) {
        filteredData[key] = filteredTopic;
        hasResults = true;
      }
    }
    
    setHasSearchResults(hasResults);
    return filteredData;
  }, [filterQuestions]);

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
