
import { Book, FileText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import SubtopicAccordion from "./SubtopicAccordion";
import { Topic } from "./QuestionBank";

interface TopicAccordionProps {
  topicKey: string;
  topic: Topic;
}

const TopicAccordion = ({ topicKey, topic }: TopicAccordionProps) => {
  return (
    <AccordionItem 
      value={topicKey}
      className="animate-fade-in transition-all duration-300"
    >
      <AccordionTrigger className="px-4 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-all duration-200">
        <div className="flex items-center space-x-3">
          <Book className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h3 className="text-xl md:text-2xl font-semibold">{topic.name}</h3>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <ScrollArea className="h-full px-4">
          <Accordion type="single" collapsible className="w-full">
            {Object.entries(topic.subtopics).map(([paperKey, paper]) => (
              <AccordionItem 
                key={paperKey} 
                value={paperKey}
                className="animate-fade-in"
              >
                <AccordionTrigger className="px-4 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="text-lg md:text-xl font-medium">{paper.name}</h4>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pl-4">
                    <Accordion type="single" collapsible className="w-full">
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
        </ScrollArea>
      </AccordionContent>
    </AccordionItem>
  );
};

export default TopicAccordion;
