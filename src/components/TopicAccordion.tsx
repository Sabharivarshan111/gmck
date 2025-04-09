
import { Book } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import SubtopicAccordion from "./SubtopicAccordion";
import { Topic } from "./QuestionBank";
import { useState, useEffect } from "react";

interface TopicAccordionProps {
  topicKey: string;
  topic: Topic;
  isExpanded?: boolean;
  activeTab: "essay" | "short-notes";
}

const TopicAccordion = ({ topicKey, topic, isExpanded = false, activeTab }: TopicAccordionProps) => {
  const subtopicKeys = Object.keys(topic.subtopics || {});
  const [localExpandedItems, setLocalExpandedItems] = useState<string[]>(
    isExpanded ? subtopicKeys : []
  );

  useEffect(() => {
    if (isExpanded) {
      setLocalExpandedItems(subtopicKeys);
    }
  }, [isExpanded, subtopicKeys]);

  const handleAccordionValueChange = (value: string[]) => {
    setLocalExpandedItems(value);
    console.log("Topic expanded items:", value);
  };

  return (
    <AccordionItem 
      value={topicKey} 
      key={topicKey}
      className="animate-fade-in transition-all duration-300 text-gray-800 dark:text-gray-200"
    >
      <AccordionTrigger className="px-4 hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-lg transition-all duration-200">
        <div className="flex items-center space-x-3">
          <Book className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h3 className="text-xl md:text-2xl font-semibold">{topic.name}</h3>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="px-4">
          <Accordion 
            type="multiple" 
            value={localExpandedItems}
            onValueChange={handleAccordionValueChange} 
            className="w-full"
          >
            {Object.entries(topic.subtopics || {}).map(([subtopicKey, subtopic]) => (
              <SubtopicAccordion 
                key={subtopicKey}
                subtopicKey={subtopicKey}
                subtopic={subtopic}
                isExpanded={isExpanded}
                activeTab={activeTab}
              />
            ))}
          </Accordion>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default TopicAccordion;
