
import { QuestionType, McqType } from "./QuestionBank";
import QuestionCard from "./QuestionCard";

interface QuestionSectionProps {
  subtopics: {
    [key: string]: QuestionType | McqType | { name: string; questions: any[] };
  };
  activeTab: "essay" | "short-notes" | "mcqs";
}

const QuestionSection = ({ subtopics, activeTab }: QuestionSectionProps) => {
  return (
    <>
      {Object.entries(subtopics).map(([questionTypeKey, questionType]) => {
        // Check if we should render this question type based on the active tab
        const shouldRender = 
          (activeTab === "essay" && questionTypeKey === "essay") || 
          (activeTab === "short-notes" && (questionTypeKey === "short-note" || questionTypeKey === "short-notes")) ||
          (activeTab === "mcqs" && (questionTypeKey === "mcqs" || questionTypeKey === "mcq"));
        
        if (!shouldRender) return null;
        
        // Handle MCQ question types separately - they're managed by MCQContent component
        if (activeTab === "mcqs") {
          return null;
        }
        
        // For essay and short notes questions
        if (questionType && typeof questionType === 'object' && 'questions' in questionType) {
          const typedQuestionType = questionType as QuestionType;
          
          return (
            <div key={questionTypeKey} className="w-full">
              <h6 className="text-base font-medium text-gray-600 dark:text-gray-400 mb-3">
                {typedQuestionType.name}
              </h6>
              <div className="space-y-4 max-w-full">
                {typedQuestionType.questions.map((question, index) => (
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
