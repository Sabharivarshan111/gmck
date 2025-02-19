
import { BookOpen, BookText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import QuestionCard from "./QuestionCard";
import { useState } from "react";

interface SubtopicProps {
  name: string;
  essay?: {
    name: string;
    questions: string[];
  };
  "short-note"?: {
    name: string;
    questions: string[];
  };
}

interface SubtopicAccordionProps {
  subtopicKey: string;
  subtopic: SubtopicProps;
}

const SubtopicAccordion = ({ subtopicKey, subtopic }: SubtopicAccordionProps) => {
  const [activeSection, setActiveSection] = useState<"essay" | "short-note" | null>(null);

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
          {subtopic.essay && (
            <div 
              className={`bg-gray-900/50 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:bg-gray-800/50 ${
                activeSection === 'essay' ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setActiveSection(activeSection === 'essay' ? null : 'essay')}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-400" />
                <h5 className="text-lg font-semibold text-white">Essays</h5>
              </div>
              {activeSection === 'essay' && (
                <ScrollArea className="h-[400px] mt-4">
                  {subtopic.essay.questions.map((question, index) => (
                    <QuestionCard
                      key={index}
                      question={question}
                      index={index}
                    />
                  ))}
                </ScrollArea>
              )}
            </div>
          )}

          {/* Short Notes Column */}
          {subtopic["short-note"] && (
            <div 
              className={`bg-gray-900/50 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:bg-gray-800/50 ${
                activeSection === 'short-note' ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setActiveSection(activeSection === 'short-note' ? null : 'short-note')}
            >
              <div className="flex items-center gap-2">
                <BookText className="h-5 w-5 text-blue-400" />
                <h5 className="text-lg font-semibold text-white">Short Notes</h5>
              </div>
              {activeSection === 'short-note' && (
                <ScrollArea className="h-[400px] mt-4">
                  {subtopic["short-note"].questions.map((question, index) => (
                    <QuestionCard
                      key={index}
                      question={question}
                      index={index}
                    />
                  ))}
                </ScrollArea>
              )}
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default SubtopicAccordion;
