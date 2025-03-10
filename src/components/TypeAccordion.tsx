
import { File } from "lucide-react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import QuestionSection from "./QuestionSection";
import { Question } from "./QuestionBank";

interface TypeAccordionProps {
  typeKey: string;
  type: {
    name: string;
    questions?: Question[];
    subtopics?: {
      [key: string]: any;
    };
  };
  isExpanded?: boolean;
  activeTab: "essay" | "short-notes" | "mcqs";
}

const TypeAccordion = ({ typeKey, type, isExpanded = false, activeTab }: TypeAccordionProps) => {
  return (
    <AccordionItem 
      value={typeKey}
      className="animate-fade-in transition-all duration-300 text-gray-800 dark:text-gray-200"
    >
      <AccordionTrigger className="hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-lg px-4">
        <div className="flex items-center space-x-3">
          <File className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <h5 className="text-md md:text-lg font-medium">{type.name}</h5>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="mt-3 px-4">
          {/* If the type has questions directly, display them */}
          {type.questions && type.questions.length > 0 && (
            <QuestionSection 
              subtopics={{ [typeKey]: type }} 
              activeTab={activeTab} 
            />
          )}
          
          {/* If the type has subtopics, pass them to QuestionSection */}
          {type.subtopics && Object.keys(type.subtopics).length > 0 && (
            <QuestionSection 
              subtopics={type.subtopics} 
              activeTab={activeTab} 
            />
          )}
          
          {/* If neither are present, show a placeholder */}
          {(!type.questions || type.questions.length === 0) && 
           (!type.subtopics || Object.keys(type.subtopics).length === 0) && (
            <p className="text-gray-500 dark:text-gray-400 text-sm italic">
              No questions available in this section.
            </p>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default TypeAccordion;
