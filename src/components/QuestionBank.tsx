
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useSwipeable } from "react-swipeable";
import { QUESTION_BANK_DATA } from "@/data/questionBankData";
import TopicAccordion from "./TopicAccordion";

export interface Question {
  question: string;
  index: number;
}

export interface QuestionType {
  name: string;
  questions: string[];
}

export interface SubTopicContent {
  name: string;
  subtopics: {
    [key: string]: QuestionType;
  };
}

export interface SubTopic {
  name: string;
  subtopics: {
    [key: string]: SubTopicContent;
  };
}

export interface Topic {
  name: string;
  subtopics: {
    [key: string]: SubTopic;
  };
}

const QuestionBank = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState("essay");

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handlers = useSwipeable({
    onSwipedLeft: () => console.log("Swiped left"),
    onSwipedRight: () => console.log("Swiped right"),
    trackMouse: true
  });

  const searchInQuestions = (questions: string[], query: string): string[] => {
    if (!query) return questions;
    return questions.filter(question => 
      question.toLowerCase().includes(query.toLowerCase())
    );
  };

  const filterQuestions = (topic: Topic, type: "essay" | "short-notes"): Topic | null => {
    let hasContent = false;
    const filteredSubtopics: { [key: string]: SubTopic } = {};

    for (const [subtopicKey, subtopic] of Object.entries(topic.subtopics)) {
      const filteredInnerSubtopics: { [key: string]: SubTopicContent } = {};
      let hasSubtopicContent = false;

      for (const [innerKey, innerSubtopic] of Object.entries(subtopic.subtopics)) {
        const filteredContent: { [key: string]: QuestionType } = {};
        let hasInnerContent = false;

        for (const [typeKey, questions] of Object.entries(innerSubtopic.subtopics)) {
          // Check if this is the correct type (essay or short-note)
          if (typeKey === (type === "essay" ? "essay" : "short-note")) {
            const filteredQuestions = searchInQuestions(questions.questions, searchQuery);
            
            if (filteredQuestions.length > 0) {
              filteredContent[typeKey] = {
                name: questions.name,
                questions: filteredQuestions
              };
              hasInnerContent = true;
              hasSubtopicContent = true;
              hasContent = true;
            }
          }
        }

        if (hasInnerContent) {
          filteredInnerSubtopics[innerKey] = {
            name: innerSubtopic.name,
            subtopics: filteredContent
          };
        }
      }

      if (hasSubtopicContent) {
        filteredSubtopics[subtopicKey] = {
          name: subtopic.name,
          subtopics: filteredInnerSubtopics
        };
      }
    }

    return hasContent ? {
      name: topic.name,
      subtopics: filteredSubtopics
    } : null;
  };

  const getFilteredData = (type: "essay" | "short-notes") => {
    const filteredData: { [key: string]: Topic } = {};
    
    for (const [key, topic] of Object.entries(QUESTION_BANK_DATA)) {
      const filteredTopic = filterQuestions(topic as Topic, type);
      if (filteredTopic) {
        filteredData[key] = filteredTopic;
      }
    }
    
    return filteredData;
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log("Searching for:", value); // Debug log
    setSearchQuery(value);
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="flex-1 p-4 max-w-4xl mx-auto space-y-4" {...handlers}>
        <Tabs 
          defaultValue="essay" 
          className="w-full"
          onValueChange={(value) => setActiveTab(value as "essay" | "short-notes")}
        >
          <TabsList className="w-full grid grid-cols-2 h-12 bg-gray-950 rounded-lg mb-4">
            <TabsTrigger 
              value="essay" 
              className="text-lg font-medium data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:bottom-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-white relative"
            >
              Essay
            </TabsTrigger>
            <TabsTrigger 
              value="short-notes"
              className="text-lg font-medium data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:bottom-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-white relative"
            >
              Short notes
            </TabsTrigger>
          </TabsList>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search questions here"
              value={searchQuery}
              onChange={handleSearch}
              className="w-full bg-gray-800/50 border-none pl-10 h-12 rounded-full text-gray-300 placeholder:text-gray-400"
            />
          </div>

          <ScrollArea className="h-[calc(100vh-12rem)]">
            <TabsContent value="essay" className="mt-0">
              <div className="grid gap-4">
                <Accordion type="single" collapsible className="w-full">
                  {Object.entries(getFilteredData("essay")).map(([topicKey, topic]) => (
                    <TopicAccordion 
                      key={topicKey}
                      topicKey={topicKey}
                      topic={topic as Topic}
                    />
                  ))}
                </Accordion>
              </div>
            </TabsContent>

            <TabsContent value="short-notes" className="mt-0">
              <div className="grid gap-4">
                <Accordion type="single" collapsible className="w-full">
                  {Object.entries(getFilteredData("short-notes")).map(([topicKey, topic]) => (
                    <TopicAccordion 
                      key={topicKey}
                      topicKey={topicKey}
                      topic={topic as Topic}
                    />
                  ))}
                </Accordion>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  );
};

export default QuestionBank;
