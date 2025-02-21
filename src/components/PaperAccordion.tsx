
import { FileText } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { type Paper } from "./QuestionBank";
import SubtopicAccordion from "./SubtopicAccordion";

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

export default PaperAccordion;
