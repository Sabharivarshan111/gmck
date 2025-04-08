
import { BookOpen } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import TypeAccordion from "./TypeAccordion";
import { SubTopic } from "./QuestionBank";
import { useState, useEffect } from "react";

interface SubtopicAccordionProps {
  subtopicKey: string;
  subtopic: SubTopic;
  isExpanded?: boolean;
  activeTab: "essay" | "short-notes";
}

const SubtopicAccordion = ({ subtopicKey, subtopic, isExpanded = false, activeTab }: SubtopicAccordionProps) => {
  const typeKeys = Object.keys(subtopic.subtopics);
  const [localExpandedItems, setLocalExpandedItems] = useState<string[]>(
    isExpanded ? typeKeys : []
  );

  useEffect(() => {
    if (isExpanded) {
      setLocalExpandedItems(typeKeys);
    }
  }, [isExpanded, typeKeys]);

  const handleAccordionValueChange = (value: string[]) => {
    setLocalExpandedItems(value);
    console.log("Subtopic expanded items:", value);
  };

  return (
    <AccordionItem 
      value={subtopicKey}
      className="animate-fade-in transition-all duration-300 text-gray-800 dark:text-gray-200"
    >
      <AccordionTrigger className="hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-lg px-4">
        <div className="flex items-center space-x-3">
          <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h4 className="text-lg md:text-xl font-medium">{subtopic.name}</h4>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <ScrollArea className="h-full px-4">
          <Accordion 
            type="multiple" 
            value={localExpandedItems}
            onValueChange={handleAccordionValueChange}
            className="w-full"
          >
            {Object.entries(subtopic.subtopics).map(([typeKey, type]) => (
              <TypeAccordion 
                key={typeKey}
                typeKey={typeKey}
                type={type}
                isExpanded={isExpanded}
                activeTab={activeTab}
              />
            ))}
          </Accordion>
        </ScrollArea>
      </AccordionContent>
    </AccordionItem>
  );
};

export default SubtopicAccordion;
