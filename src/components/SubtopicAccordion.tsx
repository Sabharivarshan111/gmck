
import { BookOpen } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import TypeAccordion from "./TypeAccordion";
import { SubTopic } from "./QuestionBank";
import { useState, useEffect } from "react";
import QuestionSection from "./QuestionSection";
import QuestionCard from "./QuestionCard";

interface SubtopicAccordionProps {
  subtopicKey: string;
  subtopic: SubTopic;
  isExpanded?: boolean;
  activeTab: "essay" | "short-notes";
}

const SubtopicAccordion = ({ subtopicKey, subtopic, isExpanded = false, activeTab }: SubtopicAccordionProps) => {
  const hasNestedSubtopics = subtopic.subtopics && Object.keys(subtopic.subtopics).length > 0;
  
  const typeKeys = hasNestedSubtopics ? Object.keys(subtopic.subtopics) : [];
  
  const [localExpandedItems, setLocalExpandedItems] = useState<string[]>(
    isExpanded ? typeKeys : []
  );

  useEffect(() => {
    if (isExpanded) {
      setLocalExpandedItems(typeKeys);
    }
  }, [isExpanded, typeKeys]);

  const handleAccordionValueChange = (value: string[]) => {
    setLocalExpandedItems(value);
    console.log("Subtopic expanded items:", value);
  };

  // Check if this subtopic has direct essay or short-notes questions
  const hasDirectQuestions = () => {
    if (!subtopic.subtopics) return false;
    
    const hasEssay = activeTab === "essay" && subtopic.subtopics["essay"];
    const hasShortNotes = activeTab === "short-notes" && 
      (subtopic.subtopics["short-note"] || subtopic.subtopics["short-notes"]);
    
    return hasEssay || hasShortNotes;
  };

  const hasQuestionsForTab = () => {
    if (hasDirectQuestions()) return true;
    if (!hasNestedSubtopics) return false;
    
    return Object.values(subtopic.subtopics).some(subItem => {
      if (!subItem || typeof subItem !== 'object') return false;

      // Direct question check
      if ('questions' in subItem && Array.isArray(subItem.questions)) {
        if (activeTab === "essay" && subItem.name === "Essay") return true;
        if (activeTab === "short-notes" && (subItem.name === "Short Note" || subItem.name === "Short Notes")) return true;
        return false;
      }
      
      // Nested subtopic check
      if ('subtopics' in subItem) {
        const nestedSubtopics = subItem.subtopics;
        if (!nestedSubtopics) return false;
        
        return (activeTab === "essay" && nestedSubtopics["essay"]) || 
               (activeTab === "short-notes" && (nestedSubtopics["short-note"] || nestedSubtopics["short-notes"]));
      }
      
      return false;
    });
  };

  if (!hasNestedSubtopics && !hasQuestionsForTab() && !hasDirectQuestions()) {
    return null;
  }

  return (
    <AccordionItem 
      value={subtopicKey}
      className="animate-fade-in transition-all duration-300 text-gray-800 dark:text-gray-200"
    >
      <AccordionTrigger className="hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-lg px-4">
        <div className="flex items-center space-x-3">
          <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h4 className="text-lg md:text-xl font-medium">{subtopic.name}</h4>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <ScrollArea className="h-full px-4">
          {hasNestedSubtopics ? (
            <Accordion 
              type="multiple" 
              value={localExpandedItems}
              onValueChange={handleAccordionValueChange}
              className="w-full"
            >
              {Object.entries(subtopic.subtopics).map(([typeKey, type]) => {
                // For regular question types (essay/short-notes)
                if (type && 
                    typeof type === 'object' && 
                    'questions' in type && 
                    Array.isArray(type.questions)) {
                  if ((activeTab === "essay" && type.name === "Essay") ||
                      (activeTab === "short-notes" && (type.name === "Short Note" || type.name === "Short Notes"))) {
                    return (
                      <div key={typeKey} className="w-full mt-3 mb-6">
                        <h6 className="text-base font-medium text-gray-600 dark:text-gray-400 mb-3">
                          {type.name}
                        </h6>
                        <div className="space-y-4 max-w-full">
                          {type.questions.map((question, index) => (
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
                }
                
                // For nested subtopics
                return (
                  <TypeAccordion 
                    key={typeKey}
                    typeKey={typeKey}
                    type={type}
                    isExpanded={isExpanded}
                    activeTab={activeTab}
                  />
                );
              })}
            </Accordion>
          ) : (
            <div className="space-y-4">
              {/* Direct questions display */}
              <QuestionSection 
                subtopics={{
                  essay: subtopic.subtopics.essay,
                  "short-note": subtopic.subtopics["short-note"] || subtopic.subtopics["short-notes"]
                }} 
                activeTab={activeTab} 
              />
            </div>
          )}
        </ScrollArea>
      </AccordionContent>
    </AccordionItem>
  );
};

export default SubtopicAccordion;
