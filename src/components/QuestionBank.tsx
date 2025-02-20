
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion } from "@/components/ui/accordion";
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
  essay?: QuestionType;
  "short-note"?: QuestionType;
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
  return (
    <div className="min-h-screen bg-black">
      <div className="flex-1 p-4 pt-6 max-w-[1800px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-white">
            MBBS QBANK-ACEV
          </h2>
        </div>
        
        <div className="bg-gray-950 rounded-lg p-4">
          <ScrollArea className="h-[calc(100vh-200px)]">
            <Accordion type="single" collapsible>
              {Object.entries(QUESTION_BANK_DATA).map(([topicKey, topic]) => (
                <TopicAccordion 
                  key={topicKey}
                  topicKey={topicKey}
                  topic={topic as Topic}
                />
              ))}
            </Accordion>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default QuestionBank;
