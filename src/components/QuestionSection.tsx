
import { QuestionType } from "./QuestionBank";
import QuestionCard from "./QuestionCard";

interface QuestionSectionProps {
  subtopics: {
    [key: string]: QuestionType | { name: string; questions: string[] };
  };
  activeTab: "essay" | "short-notes";
}

const QuestionSection = ({ subtopics, activeTab }: QuestionSectionProps) => {
  return (
    <>
      {Object.entries(subtopics).map(([questionTypeKey, questionType]) => {
        // Check if we should render this question type based on the active tab
        const shouldRender = 
          (activeTab === "essay" && (questionTypeKey === "essay")) || 
          (activeTab === "short-notes" && (questionTypeKey === "short-note" || questionTypeKey === "short-notes"));
        
        if (!shouldRender) return null;
        
        // For essay and short notes questions
        if (questionType && typeof questionType === 'object' && 'questions' in questionType) {
          const questions = (questionType as QuestionType).questions;
          
          return (
            <div key={questionTypeKey} className="w-full">
              <h6 className="text-base font-medium text-gray-600 dark:text-gray-400 mb-3">
                {(questionType as QuestionType).name}
              </h6>
              <div className="space-y-4 max-w-full">
                {questions.map((question, index) => (
                  <QuestionCard
                    key={index}
                    question={question}
                    index={index}
                  />
                ))}
              </div>
            </div>
          );
        }
        
        return null;
      })}
    </>
  );
};

export default QuestionSection;
