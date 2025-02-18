
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
  const getQuestions = (type: "essay" | "short-note") => {
    const questions: { sectionName: string; questions: string[] }[] = [];
    
    Object.entries(subtopic.subtopics).forEach(([_, content]) => {
      const questionType = content.subtopics[type];
      if (questionType) {
        questions.push({
          sectionName: content.name,
          questions: questionType.questions
        });
      }
    });
    
    return questions;
  };

  const essayQuestions = getQuestions("essay");
  const shortNoteQuestions = getQuestions("short-note");

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
              {essayQuestions.map((section, sectionIndex) => (
                <div key={sectionIndex} className="space-y-4 mb-6">
                  <h6 className="text-sm font-medium text-gray-400">
                    {section.sectionName}
                  </h6>
                  {section.questions.map((question, index) => (
                    <QuestionCard
                      key={`${sectionIndex}-${index}`}
                      question={question}
                      index={index}
                    />
                  ))}
                </div>
              ))}
            </ScrollArea>
          </div>

          {/* Short Notes Column */}
          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <BookText className="h-5 w-5 text-blue-400" />
              <h5 className="text-lg font-semibold text-white">Short Notes</h5>
            </div>
            <ScrollArea className="h-[400px]">
              {shortNoteQuestions.map((section, sectionIndex) => (
                <div key={sectionIndex} className="space-y-4 mb-6">
                  <h6 className="text-sm font-medium text-gray-400">
                    {section.sectionName}
                  </h6>
                  {section.questions.map((question, index) => (
                    <QuestionCard
                      key={`${sectionIndex}-${index}`}
                      question={question}
                      index={index}
                    />
                  ))}
                </div>
              ))}
            </ScrollArea>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default SubtopicAccordion;
