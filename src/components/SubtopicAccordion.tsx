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
  const hasNestedSubtopics = subtopic.subtopics && Object.keys(subtopic.subtopics).length > 0;
  
  const typeKeys = hasNestedSubtopics ? Object.keys(subtopic.subtopics) : [];
  
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

  const hasQuestionsForTab = () => {
    if (!hasNestedSubtopics) return false;
    
    if (activeTab === "essay" && subtopic.subtopics["essay"]) {
      return true;
    }
    
    if (activeTab === "short-notes" && (subtopic.subtopics["short-note"] || subtopic.subtopics["short-notes"])) {
      return true;
    }
    
    return Object.values(subtopic.subtopics).some(subItem => {
      return (
        subItem && 
        typeof subItem === 'object' && 
        'subtopics' in subItem &&
        ((activeTab === "essay" && subItem.subtopics["essay"]) || 
         (activeTab === "short-notes" && (subItem.subtopics["short-note"] || subItem.subtopics["short-notes"])))
      );
    });
  };

  if (!hasNestedSubtopics && !hasQuestionsForTab()) {
    return null;
  }

  return (
    <AccordionItem 
      value={subtopicKey}
      className="animate-fade-in transition-all duration-300 text-gray-800 dark:text-gray-200"
    >
      <AccordionTrigger className="hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-lg px-4">
        <div className="flex items-center space-x-3">
          <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h4 className="text-lg md:text-xl font-medium">{subtopic.name}</h4>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <ScrollArea className="h-full px-4">
          {hasNestedSubtopics ? (
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
          ) : (
            <div className="space-y-4">
              <QuestionSection 
                subtopics={{
                  essay: subtopic.subtopics.essay,
                  "short-note": subtopic.subtopics["short-note"] || subtopic.subtopics["short-notes"]
                }} 
                activeTab={activeTab} 
              />
            </div>
          )}
        </ScrollArea>
      </AccordionContent>
    </AccordionItem>
  );
};

export default SubtopicAccordion;
