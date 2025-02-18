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

interface SubtopicAccordionProps {
  subtopicKey: string;
  subtopic: SubTopic;
}

const SubtopicAccordion = ({ subtopicKey, subtopic }: SubtopicAccordionProps) => {
  console.log("SubtopicAccordion rendering with subtopic:", subtopic); // Debug log

  return (
    <AccordionItem 
      value={subtopicKey}
      className="animate-fade-in transition-all duration-300"
    >
      <AccordionTrigger className="hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg px-4">
        <div className="flex items-center space-x-3">
          <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h4 className="text-lg md:text-xl font-medium">{subtopic.name}</h4>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <ScrollArea className="h-full px-4">
          <Accordion type="single" collapsible className="w-full">
            {Object.entries(subtopic.subtopics).map(([typeKey, type]) => (
              <TypeAccordion 
                key={typeKey}
                typeKey={typeKey}
                type={type}
              />
            ))}
          </Accordion>
        </ScrollArea>
      </AccordionContent>
    </AccordionItem>
  );
};

export default SubtopicAccordion;