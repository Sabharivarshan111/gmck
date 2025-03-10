
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
    // Loop through all subtopics to find MCQ questions
    const mcqSections = Object.entries(subtopics).filter(([key, section]) => {
      // Check if this is an MCQ section based on name or key
      return (
        key === "mcqs" || 
        (section && typeof section === 'object' && section.name && 
          (section.name.toLowerCase().includes('mcq') || 
           section.name.toLowerCase().includes('multiple choice')))
      );
    });
    
    if (mcqSections.length > 0) {
      return (
        <div className="w-full space-y-6">
          {mcqSections.map(([sectionKey, section]) => (
            <div key={sectionKey} className="w-full">
              <h6 className="text-base font-medium text-gray-600 dark:text-gray-400 mb-3">
                {section.name}
              </h6>
              
              {/* If section has questions directly */}
              {'questions' in section && Array.isArray(section.questions) && section.questions.length > 0 && (
                <div className="space-y-4 max-w-full">
                  {section.questions.map((question, qIndex) => (
                    <QuestionCard 
                      key={qIndex}
                      question={question.question}
                      index={qIndex}
                      options={question.options}
                    />
                  ))}
                </div>
              )}
              
              {/* If section has subtopics, render each subtopic with questions */}
              {'subtopics' in section && section.subtopics && Object.entries(section.subtopics).length > 0 && (
                <div className="space-y-6">
                  {Object.entries(section.subtopics).map(([subtopicKey, subtopic]) => (
                    <div key={subtopicKey} className="mb-6">
                      <h5 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        {subtopic.name}
                      </h5>
                      <div className="space-y-4">
                        {'questions' in subtopic && Array.isArray(subtopic.questions) && 
                          subtopic.questions.map((question, qIndex) => (
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
                </div>
              )}
            </div>
          ))}
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
