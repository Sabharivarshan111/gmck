
import { QuestionType } from "./QuestionBank";
import QuestionCard from "./QuestionCard";

interface QuestionSectionProps {
  subtopics: {
    [key: string]: QuestionType | { name: string; questions: any[] } | any;
  };
  activeTab: "essay" | "short-notes";
}

const QuestionSection = ({ subtopics, activeTab }: QuestionSectionProps) => {
  // Look for essay or short-notes/short-note keys
  const essayKey = "essay";
  const shortNoteKeys = ["short-notes", "short-note"];
  
  // Function to render question section if it exists
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

  // Recursive function to find and render questions at any nesting level
  const findAndRenderQuestions = (section: any, targetTab: string): JSX.Element | null => {
    // Direct match (essay or short-notes at this level)
    if (targetTab in section) {
      return renderQuestionType(targetTab, section[targetTab]);
    }
    
    // Check if "short-note" exists when looking for short-notes
    if (targetTab === "short-notes" && "short-note" in section) {
      return renderQuestionType("short-note", section["short-note"]);
    }
    
    // If this level has subtopics, recursively search in them
    if ('subtopics' in section) {
      for (const key in section.subtopics) {
        const result = findAndRenderQuestions(section.subtopics[key], targetTab);
        if (result) return result;
      }
    }
    
    return null;
  };

  // If direct access works, use it
  if (activeTab === "essay" && essayKey in subtopics) {
    return renderQuestionType(essayKey, subtopics[essayKey]);
  }
  
  if (activeTab === "short-notes") {
    // Try both short-notes and short-note keys directly
    for (const key of shortNoteKeys) {
      if (key in subtopics) {
        return renderQuestionType(key, subtopics[key]);
      }
    }
  }
  
  // If direct access didn't work, try recursive search
  const targetKey = activeTab === "essay" ? "essay" : "short-notes";
  const result = findAndRenderQuestions(subtopics, targetKey);
  if (result) return result;
  
  // If we still don't have a result, look through all keys at this level for possible matches
  return (
    <>
      {Object.entries(subtopics).map(([key, section]) => {
        if (key !== "name" && typeof section === "object") {
          const nestedResult = findAndRenderQuestions(section, targetKey);
          if (nestedResult) return nestedResult;
        }
        return null;
      })}
    </>
  );
};

export default QuestionSection;
