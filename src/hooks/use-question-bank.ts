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

  const filterNestedContent = useCallback((content: any, type: "essay" | "short-notes", query: string): any | null => {
    if (!query.trim()) return content;
    
    if (content && typeof content === 'object' && 'questions' in content) {
      const questions = content.questions as string[];
      const filteredQuestions = searchInQuestions(questions, query);
      
      if (filteredQuestions.length > 0) {
        return {
          ...content,
          questions: filteredQuestions
        };
      }
      return null;
    }
    
    if (content && typeof content === 'object' && 'subtopics' in content) {
      const filteredSubtopics: { [key: string]: any } = {};
      let hasContent = false;
      
      for (const [key, subtopic] of Object.entries(content.subtopics || {})) {
        if ((key === "essay" && type === "essay") || 
            ((key === "short-note" || key === "short-notes") && type === "short-notes")) {
          const filteredType = filterNestedContent(subtopic, type, query);
          if (filteredType) {
            filteredSubtopics[key] = filteredType;
            hasContent = true;
          }
        } 
        else {
          const filteredSubtopic = filterNestedContent(subtopic, type, query);
          if (filteredSubtopic) {
            filteredSubtopics[key] = filteredSubtopic;
            hasContent = true;
          }
        }
      }
      
      if (hasContent) {
        return {
          ...content,
          subtopics: filteredSubtopics
        };
      }
    }
    
    return null;
  }, [searchInQuestions]);

  const getFilteredData = useCallback((type: "essay" | "short-notes", query: string): QuestionBankData => {
    if (!query.trim()) {
      setHasSearchResults(true);
      setIsSearching(false);
      return QUESTION_BANK_DATA as unknown as QuestionBankData;
    }
    
    setIsSearching(true);
    
    const filteredData: QuestionBankData = {};
    let hasResults = false;
    
    for (const [key, topic] of Object.entries(QUESTION_BANK_DATA)) {
      const filteredTopic = filterNestedContent(topic, type, query);
      if (filteredTopic) {
        filteredData[key] = filteredTopic;
        hasResults = true;
      }
    }
    
    setHasSearchResults(hasResults);
    return filteredData;
  }, [filterNestedContent]);

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
