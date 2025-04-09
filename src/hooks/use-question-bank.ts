
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

  // Helper function to recursively search in nested data structure
  const filterQuestionsRecursive = useCallback((node: any, type: "essay" | "short-notes", query: string): any => {
    if (!node) return null;
    
    // Base case: If this is a question type with questions array
    if (node && typeof node === 'object' && 'questions' in node) {
      // This is a leaf node with questions
      if ((type === "essay" && node.name === "Essay") || 
          (type === "short-notes" && (node.name === "Short Note" || node.name === "Short Notes"))) {
        const filteredQuestions = searchInQuestions(node.questions, query);
        if (filteredQuestions.length > 0) {
          return {
            name: node.name,
            questions: filteredQuestions
          };
        }
      }
      return null;
    }
    
    // Recursive case: Check if node has subtopics
    if (node && typeof node === 'object' && 'subtopics' in node) {
      const filtered: any = {};
      let hasContent = false;
      
      for (const [key, subNode] of Object.entries(node.subtopics || {})) {
        const result = filterQuestionsRecursive(subNode, type, query);
        if (result) {
          filtered[key] = result;
          hasContent = true;
        }
      }
      
      if (hasContent) {
        return {
          name: node.name,
          subtopics: filtered
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
    
    // Start with the top level "second-year" node
    for (const [key, topicGroup] of Object.entries(QUESTION_BANK_DATA)) {
      const result = filterQuestionsRecursive(topicGroup, type, query);
      if (result) {
        filteredData[key] = result;
        hasResults = true;
      }
    }
    
    setHasSearchResults(hasResults);
    return filteredData;
  }, [filterQuestionsRecursive]);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
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
