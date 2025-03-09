
import { QuestionType } from "./QuestionBank";
import QuestionCard from "./QuestionCard";

interface QuestionSectionProps {
  subtopics: {
    [key: string]: QuestionType;
  };
  activeTab: "essay" | "short-notes";
}

const QuestionSection = ({ subtopics, activeTab }: QuestionSectionProps) => {
  return (
    <>
      {Object.entries(subtopics).map(([questionTypeKey, questionType]) => {
        // Check if we should render this question type based on the active tab
        const shouldRender = 
          (activeTab === "essay" && questionTypeKey === "essay") || 
          (activeTab === "short-notes" && (questionTypeKey === "short-note" || questionTypeKey === "short-notes"));
        
        if (!shouldRender) return null;
        
        return (
          <div key={questionTypeKey} className="w-full">
            <h6 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              {questionType.name}
            </h6>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 w-full">
              {questionType.questions.map((question, index) => (
                <QuestionCard
                  key={index}
                  question={question}
                  index={index}
                />
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
};

export default QuestionSection;
