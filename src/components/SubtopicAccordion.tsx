
import { BookOpen } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import QuestionCard from "./QuestionCard";

interface QuestionType {
  name: string;
  questions: string[];
}

interface SubtopicContent {
  name: string;
  essay?: QuestionType;
  "short-note"?: QuestionType;
}

interface SubtopicAccordionProps {
  subtopicKey: string;
  subtopic: SubtopicContent;
}

const SubtopicAccordion = ({ subtopicKey, subtopic }: SubtopicAccordionProps) => {
  return (
    <AccordionItem value={subtopicKey}>
      <AccordionTrigger className="hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg px-4">
        <div className="flex items-center space-x-3">
          <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h4 className="text-lg md:text-xl font-medium">{subtopic.name}</h4>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="px-4">
          <Accordion type="single" collapsible className="space-y-4">
            {/* Essay Section */}
            {subtopic.essay && (
              <AccordionItem value="essay" className="border-gray-800">
                <AccordionTrigger className="hover:bg-gray-800/50 rounded-lg px-4">
                  <span className="text-lg font-medium">{subtopic.essay.name}</span>
                </AccordionTrigger>
                <AccordionContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3 p-4">
                      {subtopic.essay.questions.map((question, index) => (
                        <QuestionCard
                          key={`essay-${index}`}
                          question={question}
                          index={index}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Short Note Section */}
            {subtopic["short-note"] && (
              <AccordionItem value="short-note" className="border-gray-800">
                <AccordionTrigger className="hover:bg-gray-800/50 rounded-lg px-4">
                  <span className="text-lg font-medium">
                    {subtopic["short-note"].name}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3 p-4">
                      {subtopic["short-note"].questions.map((question, index) => (
                        <QuestionCard
                          key={`short-note-${index}`}
                          question={question}
                          index={index}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default SubtopicAccordion;
