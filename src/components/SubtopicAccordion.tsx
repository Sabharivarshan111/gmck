
import { BookOpen, BookText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
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
        <div className="flex flex-col space-y-2 px-4 py-2">
          {/* Essays Section */}
          {subtopic.essay && (
            <button
              onClick={() => setActiveSection(activeSection === "essay" ? null : "essay")}
              className={`w-full text-left p-4 rounded-lg transition-all duration-200 
                ${activeSection === "essay" 
                  ? "bg-blue-500/20 ring-2 ring-blue-500" 
                  : "bg-gray-900/50 hover:bg-gray-800/50"}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-400" />
                  <h5 className="text-lg font-semibold text-white">
                    {subtopic.essay.name}
                  </h5>
                </div>
                <span className="text-sm text-gray-400">
                  {subtopic.essay.questions.length} questions
                </span>
              </div>
              
              {activeSection === "essay" && (
                <div className="mt-4">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {subtopic.essay.questions.map((question, index) => (
                        <QuestionCard
                          key={index}
                          question={question}
                          index={index}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </button>
          )}

          {/* Short Notes Section */}
          {subtopic["short-note"] && (
            <button
              onClick={() => setActiveSection(activeSection === "short-note" ? null : "short-note")}
              className={`w-full text-left p-4 rounded-lg transition-all duration-200 
                ${activeSection === "short-note" 
                  ? "bg-blue-500/20 ring-2 ring-blue-500" 
                  : "bg-gray-900/50 hover:bg-gray-800/50"}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookText className="h-5 w-5 text-blue-400" />
                  <h5 className="text-lg font-semibold text-white">
                    {subtopic["short-note"].name}
                  </h5>
                </div>
                <span className="text-sm text-gray-400">
                  {subtopic["short-note"].questions.length} questions
                </span>
              </div>
              
              {activeSection === "short-note" && (
                <div className="mt-4">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {subtopic["short-note"].questions.map((question, index) => (
                        <QuestionCard
                          key={index}
                          question={question}
                          index={index}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </button>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default SubtopicAccordion;
