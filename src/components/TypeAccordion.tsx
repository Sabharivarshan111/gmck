
import { FileText, BookOpen, BookText } from "lucide-react";
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
  displayType: "essay" | "short-note";
}

const TypeAccordion = ({ typeKey, type, displayType }: TypeAccordionProps) => {
  // Only render content for the selected display type
  const relevantContent = Object.entries(type.subtopics).filter(([key]) => 
    key === displayType
  );

  if (relevantContent.length === 0) return null;

  return (
    <AccordionItem 
      value={typeKey}
      className="animate-fade-in transition-all duration-300"
    >
      <AccordionTrigger className="hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg px-4">
        <div className="flex items-center space-x-3">
          {displayType === "essay" ? (
            <BookOpen className="h-5 w-5 text-indigo-500 dark:text-indigo-300" />
          ) : (
            <BookText className="h-5 w-5 text-indigo-500 dark:text-indigo-300" />
          )}
          <h5 className="text-lg font-medium">{type.name}</h5>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4 px-4">
          {relevantContent.map(([questionTypeKey, questionType]) => (
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
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default TypeAccordion;
