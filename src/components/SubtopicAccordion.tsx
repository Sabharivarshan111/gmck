
import { BookOpen, BookText } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import QuestionCard from "./QuestionCard";
import { type SubTopicContent } from "./QuestionBank";

interface SubtopicAccordionProps {
  subtopicKey: string;
  subtopic: SubTopicContent;
}

const SubtopicAccordion = ({ subtopicKey, subtopic }: SubtopicAccordionProps) => {
  return (
    <AccordionItem value={subtopicKey} className="border-b border-gray-800">
      <AccordionTrigger className="px-4 hover:bg-gray-800/50 rounded-lg">
        <div className="flex items-center space-x-3">
          <BookOpen className="h-5 w-5 text-indigo-400" />
          <span className="text-lg font-medium text-white">{subtopic.name}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="pl-4">
          <Accordion type="single" collapsible className="space-y-4">
            {subtopic.essay && (
              <AccordionItem value="essay" className="border-b border-gray-800">
                <AccordionTrigger className="px-4 hover:bg-gray-800/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <BookText className="h-5 w-5 text-blue-400" />
                    <span className="text-lg font-medium text-white">
                      {subtopic.essay.name}
                    </span>
                  </div>
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

            {subtopic["short-note"] && (
              <AccordionItem value="short-note" className="border-b border-gray-800">
                <AccordionTrigger className="px-4 hover:bg-gray-800/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <BookText className="h-5 w-5 text-blue-400" />
                    <span className="text-lg font-medium text-white">
                      {subtopic["short-note"].name}
                    </span>
                  </div>
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
