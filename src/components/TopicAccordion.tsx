
import { Book } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { type Topic } from "./QuestionBank";
import PaperAccordion from "./PaperAccordion";

interface TopicAccordionProps {
  topicKey: string;
  topic: Topic;
}

const TopicAccordion = ({ topicKey, topic }: TopicAccordionProps) => {
  return (
    <AccordionItem value={topicKey} className="border-b border-gray-800">
      <AccordionTrigger className="px-4 hover:bg-gray-800/50 rounded-lg">
        <div className="flex items-center space-x-3">
          <Book className="h-6 w-6 text-blue-400" />
          <h3 className="text-xl font-semibold text-white">{topic.name}</h3>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="pl-4">
          <Accordion type="single" collapsible>
            {Object.entries(topic.subtopics).map(([paperKey, paper]) => (
              <PaperAccordion 
                key={paperKey} 
                paperKey={paperKey} 
                paper={paper} 
              />
            ))}
          </Accordion>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default TopicAccordion;
