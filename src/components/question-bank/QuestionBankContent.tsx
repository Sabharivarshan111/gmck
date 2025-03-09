
import { Accordion } from "@/components/ui/accordion";
import TopicAccordion from "@/components/TopicAccordion";
import { Topic } from "@/components/QuestionBank";
import NoContentMessage from "./NoContentMessage";

interface QuestionBankContentProps {
  activeTab: "essay" | "short-notes";
  hasContentToDisplay: boolean;
  filteredData: { [key: string]: Topic };
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
  if (!hasContentToDisplay) {
    return <NoContentMessage />;
  }

  return (
    <div className="grid gap-4">
      <Accordion 
        type="multiple" 
        value={expandedItems}
        className="w-full"
      >
        {Object.entries(filteredData).map(([topicKey, topic]) => (
          <TopicAccordion 
            key={topicKey}
            topicKey={topicKey}
            topic={topic as Topic}
            isExpanded={searchQuery.trim() !== ""}
            activeTab={activeTab}
          />
        ))}
      </Accordion>
    </div>
  );
};

export default QuestionBankContent;
