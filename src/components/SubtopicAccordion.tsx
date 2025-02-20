
import { BookOpen, BookText } from "lucide-react";
import QuestionCard from "./QuestionCard";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

const SubtopicAccordion = ({ subtopicKey, subtopic }) => {
  return (
    <div className="mb-6 border-l-2 border-gray-800 pl-4">
      <div className="mb-4">
        <div className="flex items-center space-x-3">
          <BookOpen className="h-5 w-5 text-indigo-400" />
          <h4 className="text-lg font-medium text-white">{subtopic.name}</h4>
        </div>
      </div>

      <div className="space-y-6">
        {subtopic.essay && (
          <Card className="bg-gray-900 border-gray-800">
            <div className="p-4">
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
                <div className="space-y-3 pr-4">
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
          </Card>
        )}

        {subtopic["short-note"] && (
          <Card className="bg-gray-900 border-gray-800">
            <div className="p-4">
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
                <div className="space-y-3 pr-4">
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
          </Card>
        )}
      </div>
    </div>
  );
};

export default SubtopicAccordion;
