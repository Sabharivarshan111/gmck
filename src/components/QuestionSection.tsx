
import { QuestionType } from "./QuestionBank";
import QuestionCard from "./QuestionCard";

interface QuestionSectionProps {
  subtopics: {
    [key: string]: QuestionType | any;
  };
  activeTab: "essay" | "short-notes";
}

const QuestionSection = ({ subtopics, activeTab }: QuestionSectionProps) => {
  // Check if subtopics is null or undefined
  if (!subtopics) {
    return null;
  }

  return (
    <>
      {Object.entries(subtopics).map(([questionTypeKey, questionType]) => {
        // Skip if questionType is not valid
        if (!questionType) return null;
        
        // Check if we should render this question type based on the active tab
        const shouldRender = 
          (activeTab === "essay" && questionTypeKey === "essay") || 
          (activeTab === "short-notes" && (questionTypeKey === "short-note" || questionTypeKey === "short-notes"));
        
        if (!shouldRender) return null;
        
        // For essay and short notes questions
        if (typeof questionType === 'object' && 'questions' in questionType && Array.isArray(questionType.questions)) {
          return (
            <div key={questionTypeKey} className="w-full">
              <h6 className="text-base font-medium text-gray-600 dark:text-gray-400 mb-3">
                {questionType.name}
              </h6>
              <div className="space-y-4 max-w-full">
                {questionType.questions.map((question: string, index: number) => (
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
