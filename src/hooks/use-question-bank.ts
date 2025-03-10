import { useState, useEffect, useCallback, useMemo } from "react";
import { QUESTION_BANK_DATA } from "@/data/questionBankData";
import { Topic, QuestionBankData } from "@/components/QuestionBank";

export const useQuestionBank = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<"extras" | "mcqs" | "essay" | "short-notes">("essay");
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

    for (const [subtopicKey, subtopic] of Object.entries(topic.subtopics || {})) {
      const filteredInnerSubtopics: { [key: string]: any } = {};
      let hasSubtopicContent = false;

      if (subtopic && typeof subtopic === 'object' && 'subtopics' in subtopic) {
        const subtopicObj = subtopic as { name: string; subtopics: Record<string, any> };

        for (const [innerKey, innerSubtopic] of Object.entries(subtopicObj.subtopics || {})) {
          if (innerSubtopic && typeof innerSubtopic === 'object' && 'subtopics' in innerSubtopic) {
            const innerSubtopicObj = innerSubtopic as { name: string; subtopics: Record<string, any> };
            const filteredContent: { [key: string]: any } = {};
            let hasInnerContent = false;

            for (const [typeKey, questions] of Object.entries(innerSubtopicObj.subtopics || {})) {
              if ((typeKey === "essay" && type === "essay") || 
                  ((typeKey === "short-note" || typeKey === "short-notes") && type === "short-notes")) {
                if (questions && typeof questions === 'object' && 'questions' in questions) {
                  const questionsObj = questions as { name: string; questions: string[] };
                  const filteredQuestions = searchInQuestions(questionsObj.questions, query);
                  
                  if (filteredQuestions.length > 0) {
                    filteredContent[typeKey] = {
                      name: questionsObj.name,
                      questions: filteredQuestions
                    };
                    hasInnerContent = true;
                    hasSubtopicContent = true;
                    hasContent = true;
                  }
                }
              }
            }

            if (hasInnerContent) {
              filteredInnerSubtopics[innerKey] = {
                name: innerSubtopicObj.name,
                subtopics: filteredContent
              };
            }
          }
        }

        if (hasSubtopicContent) {
          filteredSubtopics[subtopicKey] = {
            name: subtopicObj.name,
            subtopics: filteredInnerSubtopics
          };
        }
      }
    }

    return hasContent ? {
      name: topic.name,
      subtopics: filteredSubtopics
    } as Topic : null;
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
