
import { Accordion } from "@/components/ui/accordion";
import TopicAccordion from "@/components/TopicAccordion";
import { QuestionBankData } from "@/components/QuestionBank";
import NoContentMessage from "./NoContentMessage";
import { useState, useEffect } from "react";
import { useTheme } from "@/components/theme/ThemeProvider";

interface QuestionBankContentProps {
  activeTab: "essay" | "short-notes";
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
  const { theme } = useTheme();

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

  const getAccordionClassNameByTheme = () => {
    if (theme === "blackpink") {
      return "w-full text-gray-800 dark:text-gray-200 question-bank-content";
    } else if (theme === "retro") {
      return "w-full text-[#ea384c] question-bank-content";
    } else {
      return "w-full text-gray-800 dark:text-gray-200";
    }
  };

  return (
    <div className="grid gap-4">
      <Accordion 
        type="multiple" 
        value={localExpandedItems}
        onValueChange={handleAccordionValueChange}
        className={getAccordionClassNameByTheme()}
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
