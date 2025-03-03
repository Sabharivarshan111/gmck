
import React from "react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import QuestionCardEnhanced from "./QuestionCardEnhanced";
import { Question } from "./QuestionBank";

interface TypeAccordionProps {
  activeTabType: string;
  type: string;
  questionType: {
    name: string;
    questions: string[];
  };
}

const TypeAccordion: React.FC<TypeAccordionProps> = ({ activeTabType, type, questionType }) => {
  if (
    (activeTabType === "essay" && type !== "essay") ||
    (activeTabType === "short-notes" && type !== "short-note")
  ) {
    return null;
  }

  return (
    <AccordionItem value={type} className="border border-gray-800 rounded-md mb-3">
      <AccordionTrigger className="p-3 font-normal text-gray-200 hover:text-white">
        {questionType.name}
        <span className="text-xs text-gray-400 font-normal ml-2">
          ({questionType.questions.length})
        </span>
      </AccordionTrigger>
      <AccordionContent className="p-3">
        <div className="flex flex-col gap-1">
          {questionType.questions.map((question, index) => (
            <QuestionCardEnhanced
              key={`${type}-${index}`}
              question={question}
              index={index}
            />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default TypeAccordion;
