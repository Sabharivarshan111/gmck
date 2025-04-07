
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

  const filterQuestions = useCallback((topic: any, type: "essay" | "short-notes", query: string): Topic | null => {
    if (!query.trim()) return topic as Topic;
    
    let hasContent = false;
    const filteredSubtopics: { [key: string]: any } = {};

    // Process the academic year level structures 
    for (const [subtopicKey, subtopic] of Object.entries(topic.subtopics || {})) {
      if (subtopic && typeof subtopic === 'object') {
        // This handles both direct subtopics with questions and nested structures
        const filteredTopic = processSubtopic(subtopic, type, query);
        
        if (filteredTopic) {
          filteredSubtopics[subtopicKey] = filteredTopic;
          hasContent = true;
        }
      }
    }

    return hasContent ? {
      name: topic.name,
      subtopics: filteredSubtopics
    } as Topic : null;
  }, [searchInQuestions]);

  // Helper function to recursively process subtopics at any nesting level
  const processSubtopic = useCallback((subtopic: any, type: "essay" | "short-notes", query: string): any => {
    if (!subtopic || typeof subtopic !== 'object') return null;
    
    // Check if this object has a 'name' and 'subtopics'
    if ('name' in subtopic && 'subtopics' in subtopic) {
      const filteredSubtopics: { [key: string]: any } = {};
      let hasContent = false;

      // Process all subtopics
      for (const [key, innerSubtopic] of Object.entries(subtopic.subtopics)) {
        // Skip processing if the key is "essay" or "short-note"/"short-notes" as these are handled separately
        if (key !== "essay" && key !== "short-note" && key !== "short-notes") {
          // Recursive call for nested structures
          const filteredInner = processSubtopic(innerSubtopic, type, query);
          
          if (filteredInner) {
            filteredSubtopics[key] = filteredInner;
            hasContent = true;
          }
        }
      }

      // Check if this level has direct questions matching the type
      if (subtopic.subtopics.essay && type === 'essay') {
        const questions = subtopic.subtopics.essay?.questions;
        if (Array.isArray(questions)) {
          const filteredQuestions = searchInQuestions(questions, query);
          if (filteredQuestions.length > 0) {
            filteredSubtopics.essay = {
              name: subtopic.subtopics.essay.name,
              questions: filteredQuestions
            };
            hasContent = true;
          }
        }
      }

      // Check for short notes questions - normalize the key name
      const shortNotesKey = type === 'short-notes' ? 
        (subtopic.subtopics['short-notes'] ? 'short-notes' : 
         (subtopic.subtopics['short-note'] ? 'short-note' : null)) : null;
      
      if (shortNotesKey && shortNotesKey in subtopic.subtopics) {
        const questions = subtopic.subtopics[shortNotesKey]?.questions;
        if (Array.isArray(questions)) {
          const filteredQuestions = searchInQuestions(questions, query);
          if (filteredQuestions.length > 0) {
            filteredSubtopics[shortNotesKey] = {
              name: subtopic.subtopics[shortNotesKey].name,
              questions: filteredQuestions
            };
            hasContent = true;
          }
        }
      }

      return hasContent ? {
        name: subtopic.name,
        subtopics: filteredSubtopics
      } : null;
    }
    
    // Check if this is a direct question container
    if ('questions' in subtopic) {
      const questions = subtopic.questions;
      if (Array.isArray(questions)) {
        const filteredQuestions = searchInQuestions(questions, query);
        if (filteredQuestions.length > 0) {
          return {
            name: subtopic.name,
            questions: filteredQuestions
          };
        }
      }
    }
    
    return null;
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
    
    // Process academic year level first
    for (const [yearKey, yearData] of Object.entries(QUESTION_BANK_DATA)) {
      const filteredYearData: any = { name: yearData.name, subtopics: {} };
      let hasYearContent = false;
      
      // Process subjects within year
      for (const [subjectKey, subject] of Object.entries(yearData.subtopics)) {
        const filteredTopic = filterQuestions(subject, type, query);
        if (filteredTopic) {
          filteredYearData.subtopics[subjectKey] = filteredTopic;
          hasYearContent = true;
          hasResults = true;
        }
      }
      
      if (hasYearContent) {
        filteredData[yearKey] = filteredYearData;
      }
    }
    
    setHasSearchResults(hasResults);
    return filteredData;
  }, [filterQuestions]);

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
      // Expand all academic year items when searching
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
