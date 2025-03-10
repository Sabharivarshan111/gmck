
import { Accordion } from "@/components/ui/accordion";
import TopicAccordion from "@/components/TopicAccordion";
import { QuestionBankData } from "@/components/QuestionBank";
import NoContentMessage from "./NoContentMessage";
import { useState, useEffect } from "react";

interface QuestionBankContentProps {
  activeTab: "essay" | "short-notes" | "mcqs";
  hasContentToDisplay: boolean;
  filteredData: QuestionBankData;
  expandedItems: string[];
  searchQuery: string;
}

const QuestionBankContent = ({
  activeTab,
  hasContentToDisplay,
  filteredData,
  expandedItems,
  searchQuery
}: QuestionBankContentProps) => {
  const [localExpandedItems, setLocalExpandedItems] = useState<string[]>(expandedItems);

  // Update local state when prop changes
  useEffect(() => {
    setLocalExpandedItems(expandedItems);
  }, [expandedItems]);

  if (!hasContentToDisplay) {
    return <NoContentMessage />;
  }

  // Handle accordion item value change
  const handleAccordionValueChange = (value: string[]) => {
    setLocalExpandedItems(value);
  };

  return (
    <div className="grid gap-4">
      <Accordion 
        type="multiple" 
        value={localExpandedItems}
        onValueChange={handleAccordionValueChange}
        className="w-full text-gray-800 dark:text-gray-200"
      >
        {Object.entries(filteredData).map(([topicKey, topic]) => (
          <TopicAccordion 
            key={topicKey}
            topicKey={topicKey}
            topic={topic}
            isExpanded={searchQuery.trim() !== ""}
            activeTab={activeTab}
          />
        ))}
      </Accordion>
    </div>
  );
};

export default QuestionBankContent;
