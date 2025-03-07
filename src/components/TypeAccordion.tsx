
import { FileText } from "lucide-react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import QuestionCard from "./QuestionCard";
import { SubTopicContent } from "./QuestionBank";

interface TypeAccordionProps {
  typeKey: string;
  type: SubTopicContent;
  isExpanded?: boolean;
  activeTab: "essay" | "short-notes";
}

const TypeAccordion = ({ typeKey, type, isExpanded = false, activeTab }: TypeAccordionProps) => {
  return (
    <AccordionItem 
      value={typeKey}
      className="animate-fade-in transition-all duration-300"
    >
      <AccordionTrigger className="hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg px-4">
        <div className="flex items-center space-x-3">
          <FileText className="h-4 w-4 text-indigo-500 dark:text-indigo-300" />
          <h5 className="text-lg font-medium">{type.name}</h5>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4 px-4">
          {Object.entries(type.subtopics).map(([questionTypeKey, questionType]) => {
            // Only render if the questionTypeKey matches the activeTab
            // Make sure to handle both 'short-note' and 'short-notes' cases
            const shouldRender = 
              (activeTab === "essay" && questionTypeKey === "essay") || 
              (activeTab === "short-notes" && (questionTypeKey === "short-note" || questionTypeKey === "short-notes"));
            
            if (!shouldRender) return null;
            
            return (
              <div key={questionTypeKey}>
                <h6 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  {questionType.name}
                </h6>
                {questionType.questions.map((question, index) => (
                  <QuestionCard
                    key={index}
                    question={question}
                    index={index}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default TypeAccordion;
