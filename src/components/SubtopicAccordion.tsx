
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

interface SubtopicAccordionProps {
  subtopicKey: string;
  subtopic: SubTopic;
  isExpanded?: boolean;
  activeTab: "essay" | "short-notes";
}

const SubtopicAccordion = ({ subtopicKey, subtopic, isExpanded = false, activeTab }: SubtopicAccordionProps) => {
  // Check if the subtopic is valid
  if (!subtopic || !subtopic.subtopics) {
    return null;
  }
  
  const hasNestedSubtopics = subtopic.subtopics && Object.keys(subtopic.subtopics).filter(key => {
    const item = subtopic.subtopics[key];
    return item && typeof item === 'object' && 'subtopics' in item;
  }).length > 0;
  
  // Get keys for items that have a 'subtopics' property (nested structure)
  const typeKeys = hasNestedSubtopics ? Object.keys(subtopic.subtopics).filter(key => {
    const item = subtopic.subtopics[key];
    return item && typeof item === 'object' && 'subtopics' in item;
  }) : [];
  
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

  // Check if this subtopic has direct questions for the active tab
  const hasDirectQuestions = () => {
    if (!subtopic.subtopics) return false;
    
    return Object.entries(subtopic.subtopics).some(([key, item]) => {
      if (item && typeof item === 'object' && 'questions' in item) {
        if (activeTab === "essay" && key === "essay") return true;
        if (activeTab === "short-notes" && (key === "short-note" || key === "short-notes")) return true;
      }
      return false;
    });
  };

  // Check if this subtopic has questions for the active tab (directly or in nested subtopics)
  const hasQuestionsForTab = () => {
    if (hasDirectQuestions()) return true;
    if (!hasNestedSubtopics) return false;
    
    // Check nested subtopics
    return Object.values(subtopic.subtopics).some(item => {
      if (!item || typeof item !== 'object') return false;
      
      // Direct question check
      if ('questions' in item && Array.isArray(item.questions)) {
        if (activeTab === "essay" && item.name === "Essay") return true;
        if (activeTab === "short-notes" && (item.name === "Short Note" || item.name === "Short Notes")) return true;
        return false;
      }
      
      // Nested subtopic check
      if ('subtopics' in item) {
        const nestedSubtopics = (item as SubTopic).subtopics;
        if (!nestedSubtopics) return false;
        
        return Object.entries(nestedSubtopics).some(([key, subItem]) => {
          if (subItem && typeof subItem === 'object' && 'questions' in subItem) {
            if (activeTab === "essay" && key === "essay") return true;
            if (activeTab === "short-notes" && (key === "short-note" || key === "short-notes")) return true;
          }
          return false;
        });
      }
      
      return false;
    });
  };

  if (!hasQuestionsForTab()) {
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
              {Object.entries(subtopic.subtopics).map(([typeKey, item]) => {
                // Skip items that don't have nested structure or questions relevant to the active tab
                if (!item || typeof item !== 'object') return null;

                // Display direct questions in this level
                if ('questions' in item && Array.isArray(item.questions)) {
                  if ((activeTab === "essay" && item.name === "Essay") ||
                      (activeTab === "short-notes" && (item.name === "Short Note" || item.name === "Short Notes"))) {
                    return (
                      <div key={typeKey} className="w-full mt-3 mb-6">
                        <h6 className="text-base font-medium text-gray-600 dark:text-gray-400 mb-3">
                          {item.name}
                        </h6>
                        <div className="space-y-4 max-w-full">
                          {item.questions.map((question, index) => (
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
                
                // If it has subtopics, render TypeAccordion
                if ('subtopics' in item) {
                  return (
                    <TypeAccordion 
                      key={typeKey}
                      typeKey={typeKey}
                      type={item as any} // Cast to appropriate type
                      isExpanded={isExpanded}
                      activeTab={activeTab}
                    />
                  );
                }
                
                return null;
              })}
            </Accordion>
          ) : (
            <div className="space-y-4">
              {/* Direct questions display */}
              <QuestionSection 
                subtopics={subtopic.subtopics}
                activeTab={activeTab} 
              />
            </div>
          )}
        </ScrollArea>
      </AccordionContent>
    </AccordionItem>
  );
};

// Import QuestionCard component
import QuestionCard from "./QuestionCard";

export default SubtopicAccordion;
