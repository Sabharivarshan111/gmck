
import { BookOpen, BookText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import QuestionCard from "./QuestionCard";
import { SubTopic } from "./QuestionBank";

interface SubtopicAccordionProps {
  subtopicKey: string;
  subtopic: SubTopic;
}

const SubtopicAccordion = ({ subtopicKey, subtopic }: SubtopicAccordionProps) => {
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4">
          {/* Essays Column */}
          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-blue-400" />
              <h5 className="text-lg font-semibold text-white">Essays</h5>
            </div>
            <ScrollArea className="h-[400px]">
              {Object.entries(subtopic.subtopics).map(([typeKey, type]) => {
                const essayContent = type.subtopics.essay;
                if (!essayContent) return null;
                
                return (
                  <div key={typeKey} className="space-y-4">
                    <h6 className="text-sm font-medium text-gray-400">
                      {type.name}
                    </h6>
                    {essayContent.questions.map((question, index) => (
                      <QuestionCard
                        key={index}
                        question={question}
                        index={index}
                      />
                    ))}
                  </div>
                );
              })}
            </ScrollArea>
          </div>

          {/* Short Notes Column */}
          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <BookText className="h-5 w-5 text-blue-400" />
              <h5 className="text-lg font-semibold text-white">Short Notes</h5>
            </div>
            <ScrollArea className="h-[400px]">
              {Object.entries(subtopic.subtopics).map(([typeKey, type]) => {
                const shortNoteContent = type.subtopics["short-note"];
                if (!shortNoteContent) return null;

                return (
                  <div key={typeKey} className="space-y-4">
                    <h6 className="text-sm font-medium text-gray-400">
                      {type.name}
                    </h6>
                    {shortNoteContent.questions.map((question, index) => (
                      <QuestionCard
                        key={index}
                        question={question}
                        index={index}
                      />
                    ))}
                  </div>
                );
              })}
            </ScrollArea>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default SubtopicAccordion;
