
import { Book, FileText } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { type Topic, type Paper } from "./QuestionBank";
import SubtopicAccordion from "./SubtopicAccordion";

interface TopicAccordionProps {
  topicKey: string;
  topic: Topic;
}

const TopicAccordion = ({ topicKey, topic }: TopicAccordionProps) => {
  return (
    <AccordionItem value={topicKey} className="border-b border-gray-800">
      <AccordionTrigger className="px-4 hover:bg-gray-800/50 rounded-lg">
        <div className="flex items-center space-x-3">
          <Book className="h-6 w-6 text-blue-400" />
          <h3 className="text-xl font-semibold text-white">{topic.name}</h3>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="pl-4">
          <Accordion type="single" collapsible>
            {Object.entries(topic.subtopics).map(([paperKey, paper]) => (
              <PaperAccordion key={paperKey} paperKey={paperKey} paper={paper} />
            ))}
          </Accordion>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

interface PaperAccordionProps {
  paperKey: string;
  paper: Paper;
}

const PaperAccordion = ({ paperKey, paper }: PaperAccordionProps) => {
  return (
    <AccordionItem value={paperKey} className="border-b border-gray-800">
      <AccordionTrigger className="px-4 hover:bg-gray-800/50 rounded-lg">
        <div className="flex items-center space-x-3">
          <FileText className="h-5 w-5 text-indigo-400" />
          <span className="text-lg font-medium text-white">{paper.name}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="pl-4">
          <Accordion type="single" collapsible>
            {Object.entries(paper.subtopics).map(([subtopicKey, subtopic]) => (
              <SubtopicAccordion
                key={subtopicKey}
                subtopicKey={subtopicKey}
                subtopic={subtopic}
              />
            ))}
          </Accordion>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default TopicAccordion;
