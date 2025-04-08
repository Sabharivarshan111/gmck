import { QuestionType } from "./QuestionBank";
import QuestionCard from "./QuestionCard";

interface QuestionSectionProps {
  subtopics: {
    [key: string]: QuestionType | { name: string; questions: any[] } | any;
  };
  activeTab: "essay" | "short-notes";
}

const findQuestionsRecursive = (
  data: any,
  activeTab: "essay" | "short-notes"
): { questionType: QuestionType; typeKey: string } | null => {
  // If this is a question type with questions array, check if it matches the active tab
  if (data && typeof data === 'object' && 'questions' in data) {
    // Direct match for essay or short-notes (with potential variations like "short-note")
    const isEssayMatch = activeTab === "essay" && data.name?.toLowerCase() === "essay";
    const isShortNotesMatch = activeTab === "short-notes" && 
      (data.name?.toLowerCase() === "short notes" || 
       data.name?.toLowerCase() === "short note" || 
       data.name?.toLowerCase() === "short-notes");
    
    if (isEssayMatch || isShortNotesMatch) {
      return { 
        questionType: data as QuestionType, 
        typeKey: isEssayMatch ? "essay" : "short-note" 
      };
    }
  }

  // If we have subtopics, search recursively in them
  if (data && typeof data === 'object' && 'subtopics' in data) {
    for (const [key, subtopic] of Object.entries(data.subtopics)) {
      // If key exactly matches the target type, check directly first
      if ((activeTab === "essay" && key === "essay") || 
          (activeTab === "short-notes" && (key === "short-note" || key === "short-notes"))) {
        if (subtopic && typeof subtopic === 'object' && 'questions' in subtopic) {
          return {
            questionType: subtopic as QuestionType,
            typeKey: key
          };
        }
      }
      
      // Otherwise, search recursively in this subtopic
      const result = findQuestionsRecursive(subtopic, activeTab);
      if (result) {
        return result;
      }
    }
  }

  return null;
};

const QuestionSection = ({ subtopics, activeTab }: QuestionSectionProps) => {
  const results: JSX.Element[] = [];

  // Check each direct subtopic
  Object.entries(subtopics).forEach(([subtopicKey, subtopic]) => {
    // First check if this is directly a question type that matches our active tab
    if ((activeTab === "essay" && subtopicKey === "essay") || 
        (activeTab === "short-notes" && (subtopicKey === "short-note" || subtopicKey === "short-notes"))) {
      
      if (subtopic && typeof subtopic === 'object' && 'questions' in subtopic) {
        const typedQuestionType = subtopic as QuestionType;
        results.push(
          <div key={subtopicKey} className="w-full">
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
    } else {
      // Try to find matching questions recursively
      const result = findQuestionsRecursive(subtopic, activeTab);
      if (result) {
        results.push(
          <div key={subtopicKey} className="w-full">
            <h6 className="text-base font-medium text-gray-600 dark:text-gray-400 mb-3">
              {result.questionType.name}
            </h6>
            <div className="space-y-4 max-w-full">
              {result.questionType.questions.map((question, index) => (
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
    }
  });
  
  return <>{results}</>;
};

export default QuestionSection;
