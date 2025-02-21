
import { BookText } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type QuestionType } from "./QuestionBank";
import QuestionCard from "./QuestionCard";

interface TypeAccordionProps {
  type: QuestionType;
  typeKey: "essay" | "short-note";
}

const TypeAccordion = ({ type, typeKey }: TypeAccordionProps) => {
  return (
    <AccordionItem value={typeKey} className="border-b border-gray-800">
      <AccordionTrigger className="px-4 hover:bg-gray-800/50 rounded-lg">
        <div className="flex items-center space-x-3">
          <BookText className="h-5 w-5 text-blue-400" />
          <span className="text-lg font-medium text-white">
            {type.name}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3 p-4">
            {type.questions.map((question, index) => (
              <QuestionCard
                key={`${typeKey}-${index}`}
                question={question}
                index={index}
              />
            ))}
          </div>
        </ScrollArea>
      </AccordionContent>
    </AccordionItem>
  );
};

export default TypeAccordion;
