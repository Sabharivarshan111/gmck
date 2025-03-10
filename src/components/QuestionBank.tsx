
import React, { useState } from "react";
import { Accordion } from "@/components/ui/accordion";
import TopicAccordion from "./TopicAccordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SearchBar from "./question-bank/SearchBar";
import NoResultsMessage from "./question-bank/NoResultsMessage";
import { useQuestionBank } from "@/hooks/use-question-bank";
import { QUESTION_BANK_DATA } from "@/data/questionBankData";

export interface Question {
  question: string;
}

export interface McqOption {
  text: string;
  isCorrect: boolean;
}

export interface McqQuestion extends Question {
  options: McqOption[];
}

export interface QuestionType {
  name: string;
  questions: Question[];
}

export interface McqType {
  name: string;
  questions: McqQuestion[];
}

export interface Chapter {
  [key: string]: {
    name: string;
    questions: Question[];
  };
}

export interface Type {
  name: string;
  subtopics?: {
    [key: string]: QuestionType | McqType;
  };
  questions?: Question[] | McqQuestion[];
}

export interface SubTopic {
  name: string;
  subtopics: {
    [key: string]: Type;
  };
}

export interface Topic {
  name: string;
  subtopics: {
    [key: string]: SubTopic;
  };
}

export interface Subject {
  name: string;
  subtopics: {
    [key: string]: Topic;
  };
}

const QuestionBank = () => {
  const { 
    searchResults, 
    searchTerm, 
    setSearchTerm, 
    activeTab, 
    setActiveTab, 
    expandedAccordionItems,
    setExpandedAccordionItems
  } = useQuestionBank();
  
  const questionBankData = QUESTION_BANK_DATA as {
    [key: string]: Subject;
  };
  
  const hasSearchResults = searchResults && 
    Object.keys(searchResults).length > 0 && 
    Object.values(searchResults).some(subject => 
      Object.keys(subject.subtopics).length > 0
    );
  
  const resetSearch = () => {
    setSearchTerm("");
    setExpandedAccordionItems([]);
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-4 px-4 md:px-0">
      <div className="mb-6">
        <SearchBar 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
          resetSearch={resetSearch}
        />
      </div>
      
      <Tabs defaultValue="essay" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="essay">Essay</TabsTrigger>
          <TabsTrigger value="short-notes">Short Notes</TabsTrigger>
          <TabsTrigger value="mcqs">MCQs</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-0">
          {searchTerm && !hasSearchResults ? (
            <NoResultsMessage resetSearch={resetSearch} />
          ) : (
            <Accordion 
              type="multiple" 
              value={expandedAccordionItems}
              onValueChange={setExpandedAccordionItems}
              className="w-full space-y-4"
            >
              {Object.entries(searchTerm ? searchResults : questionBankData).map(([subjectKey, subject]) => (
                <React.Fragment key={subjectKey}>
                  {Object.keys(subject.subtopics).length > 0 && (
                    <Accordion 
                      type="multiple" 
                      className="border rounded-lg shadow-sm p-4 space-y-4"
                    >
                      <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900 dark:text-gray-50">
                        {subject.name}
                      </h2>
                      
                      {Object.entries(subject.subtopics).map(([topicKey, topic]) => (
                        <TopicAccordion 
                          key={topicKey}
                          topicKey={topicKey}
                          topic={topic}
                          activeTab={activeTab as "essay" | "short-notes" | "mcqs"}
                        />
                      ))}
                    </Accordion>
                  )}
                </React.Fragment>
              ))}
            </Accordion>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QuestionBank;
