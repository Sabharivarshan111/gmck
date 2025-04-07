
import { QuestionType } from "./QuestionBank";
import QuestionCard from "./QuestionCard";

interface QuestionSectionProps {
  subtopics: {
    [key: string]: QuestionType | { name: string; questions: any[] };
  };
  activeTab: "essay" | "short-notes";
}

const QuestionSection = ({ subtopics, activeTab }: QuestionSectionProps) => {
  // Look for essay or short-notes/short-note keys
  const essayKey = "essay";
  const shortNoteKeys = ["short-notes", "short-note"];
  
  // Function to render question type if it exists
  const renderQuestionType = (key: string, questionType: QuestionType | any) => {
    if (questionType && typeof questionType === 'object' && 'questions' in questionType) {
      const typedQuestionType = questionType as QuestionType;
      
      return (
        <div key={key} className="w-full">
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
  };

  // Check if we should render based on activeTab
  if (activeTab === "essay" && essayKey in subtopics) {
    return renderQuestionType(essayKey, subtopics[essayKey]);
  }
  
  if (activeTab === "short-notes") {
    // Try both short-notes and short-note keys
    for (const key of shortNoteKeys) {
      if (key in subtopics) {
        return renderQuestionType(key, subtopics[key]);
      }
    }
  }
  
  // If we have neither or activeTab doesn't match, try to render any appropriate section
  return (
    <>
      {Object.entries(subtopics).map(([questionTypeKey, questionType]) => {
        // Check if we should render this question type based on the active tab
        const shouldRender = 
          (activeTab === "essay" && questionTypeKey === "essay") || 
          (activeTab === "short-notes" && (questionTypeKey === "short-note" || questionTypeKey === "short-notes"));
        
        if (!shouldRender) return null;
        
        return renderQuestionType(questionTypeKey, questionType);
      })}
    </>
  );
};

export default QuestionSection;
