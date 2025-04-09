
import { FileText } from "lucide-react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import QuestionSection from "./QuestionSection";
import { SubTopicContent } from "./QuestionBank";

interface TypeAccordionProps {
  typeKey: string;
  type: SubTopicContent;
  isExpanded?: boolean;
  activeTab: "essay" | "short-notes";
}

const TypeAccordion = ({ typeKey, type, isExpanded = false, activeTab }: TypeAccordionProps) => {
  // Check if type is null or undefined
  if (!type || !type.subtopics) return null;
  
  // Check if this type has essay or short-notes based on activeTab
  const hasRelevantQuestions = () => {
    if (!type.subtopics) return false;
    
    return Object.entries(type.subtopics).some(([key, subItem]) => {
      if (subItem && typeof subItem === 'object' && 'questions' in subItem) {
        if (activeTab === "essay" && key === "essay") return true;
        if (activeTab === "short-notes" && (key === "short-note" || key === "short-notes")) return true;
      }
      return false;
    });
  };

  if (!hasRelevantQuestions()) {
    return null;
  }

  return (
    <AccordionItem 
      value={typeKey}
      className="animate-fade-in transition-all duration-300 text-gray-800 dark:text-gray-200"
    >
      <AccordionTrigger className="hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-lg px-4">
        <div className="flex items-center space-x-3">
          <FileText className="h-4 w-4 text-indigo-500 dark:text-indigo-300" />
          <h5 className="text-lg font-medium">{type.name}</h5>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4 px-4">
          <QuestionSection 
            subtopics={type.subtopics} 
            activeTab={activeTab} 
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default TypeAccordion;
