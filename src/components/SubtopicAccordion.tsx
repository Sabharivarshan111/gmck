
import { BookOpen, BookText } from "lucide-react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import QuestionCard from "./QuestionCard";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  return (
    <AccordionItem value={subtopicKey}>
      <AccordionTrigger className="hover:bg-gray-800/50 rounded-lg px-4">
        <div className="flex items-center space-x-3">
          <BookOpen className="h-5 w-5 text-indigo-400" />
          <h4 className="text-lg font-medium">{subtopic.name}</h4>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4 p-4">
          {/* Essays Section */}
          {subtopic.essay && (
            <div className="rounded-lg bg-gray-900/50 p-4">
              <div className="flex items-center justify-between mb-4">
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
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
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

          {/* Short Notes Section */}
          {subtopic["short-note"] && (
            <div className="rounded-lg bg-gray-900/50 p-4">
              <div className="flex items-center justify-between mb-4">
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
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
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
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default SubtopicAccordion;
