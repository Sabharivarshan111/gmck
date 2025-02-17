
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  return (
    <div className="min-h-screen bg-black">
      <div className="flex-1 p-4 pt-6 max-w-4xl mx-auto" {...handlers}>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-white">
            MBBS QBANK-ACEV
          </h2>
        </div>
        <Tabs defaultValue="essay" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="essay">Essays</TabsTrigger>
            <TabsTrigger value="short-note">Short Notes</TabsTrigger>
          </TabsList>
          <TabsContent value="essay">
            <div className="grid gap-4">
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="pr-4">
                  {Object.entries(QUESTION_BANK_DATA).map(([topicKey, topic]) => (
                    <TopicAccordion 
                      key={topicKey}
                      topicKey={topicKey}
                      topic={topic as Topic}
                      questionType="essay"
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
          <TabsContent value="short-note">
            <div className="grid gap-4">
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="pr-4">
                  {Object.entries(QUESTION_BANK_DATA).map(([topicKey, topic]) => (
                    <TopicAccordion 
                      key={topicKey}
                      topicKey={topicKey}
                      topic={topic as Topic}
                      questionType="short-note"
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default QuestionBank;
