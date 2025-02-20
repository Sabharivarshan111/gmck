
import { Book, FileText } from "lucide-react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Accordion } from "@/components/ui/accordion";
import SubtopicAccordion from "./SubtopicAccordion";
import { Topic } from "./QuestionBank";

interface TopicAccordionProps {
  topicKey: string;
  topic: Topic;
}

const TopicAccordion = ({ topicKey, topic }: TopicAccordionProps) => {
  return (
    <AccordionItem value={topicKey}>
      <AccordionTrigger className="px-4 hover:bg-gray-800/50 rounded-lg">
        <div className="flex items-center space-x-3">
          <Book className="h-6 w-6 text-blue-400" />
          <h3 className="text-xl font-semibold">{topic.name}</h3>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="pl-4">
          <Accordion type="single" collapsible>
            {Object.entries(topic.subtopics).map(([paperKey, paper]) => (
              <AccordionItem key={paperKey} value={paperKey}>
                <AccordionTrigger className="px-4 hover:bg-gray-800/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-indigo-400" />
                    <h4 className="text-lg font-medium">{paper.name}</h4>
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
            ))}
          </Accordion>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default TopicAccordion;
