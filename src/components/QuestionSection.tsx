
import { QuestionType, McqType } from "./QuestionBank";
import QuestionCard from "./QuestionCard";

interface QuestionSectionProps {
  subtopics: {
    [key: string]: QuestionType | McqType | { name: string; questions: any[] };
  };
  activeTab: "essay" | "short-notes" | "mcqs";
}

const QuestionSection = ({ subtopics, activeTab }: QuestionSectionProps) => {
  // For MCQs, we need to check if subtopics contain MCQ data
  if (activeTab === "mcqs") {
    // First check if this section contains MCQs directly
    const mcqSection = Object.entries(subtopics).find(
      ([key, section]) => key === "mcqs" || section.name?.toLowerCase().includes("mcq")
    );
    
    if (mcqSection) {
      return (
        <div className="w-full">
          <h6 className="text-base font-medium text-gray-600 dark:text-gray-400 mb-3">
            {mcqSection[1].name}
          </h6>
          <div className="space-y-4 max-w-full">
            {/* If mcqs has subtopics, render them */}
            {'subtopics' in mcqSection[1] && Object.entries(mcqSection[1].subtopics).map(([key, chapter]) => (
              <div key={key} className="mb-6">
                <h5 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  {chapter.name}
                </h5>
                <div className="space-y-4">
                  {'questions' in chapter && Array.isArray(chapter.questions) && 
                    chapter.questions.map((question, qIndex) => (
                      <QuestionCard 
                        key={qIndex}
                        question={question.question}
                        index={qIndex}
                        options={question.options}
                      />
                    ))
                  }
                </div>
              </div>
            ))}
            
            {/* If mcqs has questions directly */}
            {'questions' in mcqSection[1] && Array.isArray(mcqSection[1].questions) && 
              mcqSection[1].questions.map((question, qIndex) => (
                <QuestionCard 
                  key={qIndex}
                  question={question.question}
                  index={qIndex}
                  options={question.options}
                />
              ))
            }
          </div>
        </div>
      );
    }
    
    return null;
  }
  
  // For essay and short notes questions
  return (
    <>
      {Object.entries(subtopics).map(([questionTypeKey, questionType]) => {
        // Check if we should render this question type based on the active tab
        const shouldRender = 
          (activeTab === "essay" && questionTypeKey === "essay") || 
          (activeTab === "short-notes" && (questionTypeKey === "short-note" || questionTypeKey === "short-notes"));
        
        if (!shouldRender) return null;
        
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
