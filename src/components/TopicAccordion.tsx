
import { Book } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import SubtopicAccordion from "./SubtopicAccordion";
import { Topic } from "./QuestionBank";

interface TopicAccordionProps {
  topicKey: string;
  topic: Topic;
  questionType: "essay" | "short-note";
  onTopicChange?: (topicKey: string) => void;
}

const TopicAccordion = ({ topicKey, topic, questionType, onTopicChange }: TopicAccordionProps) => {
  return (
    <AccordionItem 
      value={topicKey}
      className="animate-fade-in transition-all duration-300"
    >
      <AccordionTrigger 
        className="px-4 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-all duration-200"
        onClick={() => onTopicChange?.(topicKey)}
      >
        <div className="flex items-center space-x-3">
          <Book className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h3 className="text-xl font-semibold">{topic.name}</h3>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <ScrollArea className="h-full px-4">
          <Accordion type="single" collapsible className="w-full">
            {Object.entries(topic.subtopics).map(([subtopicKey, subtopic]) => (
              <SubtopicAccordion 
                key={subtopicKey}
                subtopicKey={subtopicKey}
                subtopic={subtopic}
                questionType={questionType}
              />
            ))}
          </Accordion>
        </ScrollArea>
      </AccordionContent>
    </AccordionItem>
  );
};

export default TopicAccordion;
