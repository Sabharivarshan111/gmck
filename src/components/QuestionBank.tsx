
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";
import { useSwipeable } from "react-swipeable";
import { QUESTION_BANK_DATA } from "@/data/questionBankData";
import TopicAccordion from "./TopicAccordion";
import { Accordion } from "@/components/ui/accordion";

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
  const [activeEssayTopic, setActiveEssayTopic] = useState("");
  const [activeShortNoteTopic, setActiveShortNoteTopic] = useState("");

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
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-[1400px] mx-auto" {...handlers}>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-white">
            MBBS QBANK-ACEV
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Essays Section */}
          <div className="bg-gray-950 rounded-lg p-4">
            <h3 className="text-xl font-semibold text-white mb-4">Essays</h3>
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="pr-4">
                <Accordion type="single" collapsible>
                  {Object.entries(QUESTION_BANK_DATA).map(([topicKey, topic]) => (
                    <TopicAccordion 
                      key={topicKey}
                      topicKey={topicKey}
                      topic={topic as Topic}
                      questionType="essay"
                      onTopicChange={setActiveEssayTopic}
                    />
                  ))}
                </Accordion>
              </div>
            </ScrollArea>
          </div>

          {/* Short Notes Section */}
          <div className="bg-gray-950 rounded-lg p-4">
            <h3 className="text-xl font-semibold text-white mb-4">Short Notes</h3>
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="pr-4">
                <Accordion type="single" collapsible>
                  {Object.entries(QUESTION_BANK_DATA).map(([topicKey, topic]) => (
                    <TopicAccordion 
                      key={topicKey}
                      topicKey={topicKey}
                      topic={topic as Topic}
                      questionType="short-note"
                      onTopicChange={setActiveShortNoteTopic}
                    />
                  ))}
                </Accordion>
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionBank;
