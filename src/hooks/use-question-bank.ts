
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

  // Recursive function to search through nested topics
  const filterNestedTopic = useCallback((topic: Topic, type: "essay" | "short-notes", query: string): Topic | null => {
    if (!query.trim()) return topic;
    
    let hasContent = false;
    const filteredSubtopics: { [key: string]: any } = {};

    // Process each subtopic in the current topic
    for (const [subtopicKey, subtopic] of Object.entries(topic.subtopics || {})) {
      // If it has own subtopics, recursively filter
      if (subtopic && typeof subtopic === 'object' && 'subtopics' in subtopic) {
        const filteredSubtopic = filterNestedTopic(subtopic as Topic, type, query);
        if (filteredSubtopic) {
          filteredSubtopics[subtopicKey] = filteredSubtopic;
          hasContent = true;
        }
      }
    }

    return hasContent ? { ...topic, subtopics: filteredSubtopics } : null;
  }, []);

  // Main function to filter questions based on search query
  const filterQuestions = useCallback((topic: any, type: "essay" | "short-notes", query: string): Topic | null => {
    if (!query.trim()) return topic as Topic;
    
    let hasContent = false;
    const filteredSubtopics: { [key: string]: any } = {};

    // Process the subtopics (e.g., paper-1, paper-2)
    for (const [subtopicKey, subtopic] of Object.entries(topic.subtopics || {})) {
      if (subtopic && typeof subtopic === 'object' && 'subtopics' in subtopic) {
        const nestedFilteredSubtopics: { [key: string]: any } = {};
        let hasSubtopicContent = false;

        // Process the nested subtopics (e.g., general-pharmacology, respiratory-system)
        for (const [nestedKey, nestedSubtopic] of Object.entries(subtopic.subtopics || {})) {
          if (nestedSubtopic && typeof nestedSubtopic === 'object' && 'subtopics' in nestedSubtopic) {
            const filteredContent: { [key: string]: any } = {};
            let hasNestedContent = false;

            // Check if it has essay or short-notes
            for (const [typeKey, questions] of Object.entries(nestedSubtopic.subtopics || {})) {
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
                    hasNestedContent = true;
                    hasSubtopicContent = true;
                    hasContent = true;
                  }
                }
              }
            }

            if (hasNestedContent) {
              nestedFilteredSubtopics[nestedKey] = {
                name: (nestedSubtopic as any).name,
                subtopics: filteredContent
              };
            }
          }
        }

        if (hasSubtopicContent) {
          filteredSubtopics[subtopicKey] = {
            name: (subtopic as any).name,
            subtopics: nestedFilteredSubtopics
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
    
    // Process the top-level categories (e.g., "second-year")
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
