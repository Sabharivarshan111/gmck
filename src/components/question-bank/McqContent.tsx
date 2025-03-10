
import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Book, CheckCircle, XCircle } from "lucide-react";

interface McqOption {
  text: string;
  isCorrect: boolean;
}

interface McqQuestion {
  question: string;
  options: McqOption[];
  explanation?: string;
}

interface McqData {
  name: string;
  questions: McqQuestion[];
}

const McqContent = () => {
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: number }>({});
  const [showResults, setShowResults] = useState<{ [key: string]: boolean }>({});

  const microbiologyMcqs: McqData = {
    name: "Chapter 1: History and scope of microbiology",
    questions: [
      {
        question: "All of the following are Koch's postulates EXCEPT:",
        options: [
          { 
            text: "The bacterium should be constantly associated with the lesions of the disease caused by it", 
            isCorrect: false 
          },
          { 
            text: "It should be possible to isolate the bacterium in pure culture from the lesions", 
            isCorrect: false 
          },
          { 
            text: "Inoculation of such pure cultures into suitable laboratory animals should reproduce the disease", 
            isCorrect: false 
          },
          { 
            text: "The bacterium need not be re-isolated from lesions produced in experimental animals", 
            isCorrect: true 
          }
        ],
        explanation: "Koch's fourth postulate states that the bacterium must be re-isolated from lesions produced in experimental animals. The option stating it 'need not be re-isolated' is incorrect, making it the exception."
      }
    ]
  };

  const handleSelectOption = (questionIndex: number, optionIndex: number) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionIndex]: optionIndex
    });
  };

  const handleCheckAnswer = (questionIndex: number) => {
    setShowResults({
      ...showResults,
      [questionIndex]: true
    });
  };

  const handleReset = (questionIndex: number) => {
    const updatedAnswers = { ...selectedAnswers };
    delete updatedAnswers[questionIndex];
    
    const updatedResults = { ...showResults };
    delete updatedResults[questionIndex];
    
    setSelectedAnswers(updatedAnswers);
    setShowResults(updatedResults);
  };

  return (
    <div className="space-y-6">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="microbiology">
          <AccordionTrigger className="hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-lg px-4">
            <div className="flex items-center space-x-3">
              <Book className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xl md:text-2xl font-semibold">Microbiology</h3>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Accordion type="single" collapsible className="w-full ml-6 mt-2">
              <AccordionItem value="chapter1">
                <AccordionTrigger className="hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-lg px-4">
                  <h4 className="text-lg font-medium">{microbiologyMcqs.name}</h4>
                </AccordionTrigger>
                <AccordionContent className="px-4 pt-4">
                  <div className="space-y-8">
                    {microbiologyMcqs.questions.map((question, qIndex) => (
                      <div key={qIndex} className="bg-white dark:bg-gray-900 shadow-sm border dark:border-gray-800 rounded-lg p-6">
                        <div className="space-y-6">
                          <h3 className="text-lg font-medium">
                            {qIndex + 1}. {question.question}
                          </h3>
                          
                          <div className="space-y-3">
                            {question.options.map((option, oIndex) => (
                              <div 
                                key={oIndex} 
                                className={`flex items-start space-x-3 p-3 rounded-md cursor-pointer
                                  ${selectedAnswers[qIndex] === oIndex ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}
                                  ${showResults[qIndex] && option.isCorrect ? 'bg-green-50 dark:bg-green-900/20' : ''}
                                  ${showResults[qIndex] && selectedAnswers[qIndex] === oIndex && !option.isCorrect ? 'bg-red-50 dark:bg-red-900/20' : ''}
                                `}
                                onClick={() => !showResults[qIndex] && handleSelectOption(qIndex, oIndex)}
                              >
                                <div className="flex h-6 w-6 mt-0.5">
                                  {showResults[qIndex] ? (
                                    option.isCorrect ? (
                                      <CheckCircle className="h-5 w-5 text-green-500" />
                                    ) : selectedAnswers[qIndex] === oIndex ? (
                                      <XCircle className="h-5 w-5 text-red-500" />
                                    ) : (
                                      <div className="h-5 w-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                                    )
                                  ) : (
                                    <Checkbox 
                                      checked={selectedAnswers[qIndex] === oIndex}
                                      className="rounded-full"
                                      onCheckedChange={() => handleSelectOption(qIndex, oIndex)}
                                    />
                                  )}
                                </div>
                                <div className="text-base">{option.text}</div>
                              </div>
                            ))}
                          </div>
                          
                          {showResults[qIndex] && question.explanation && (
                            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                              <h4 className="font-medium mb-2">Explanation:</h4>
                              <p>{question.explanation}</p>
                            </div>
                          )}
                          
                          <div className="flex space-x-4 pt-2">
                            {!showResults[qIndex] ? (
                              <Button 
                                onClick={() => handleCheckAnswer(qIndex)}
                                disabled={selectedAnswers[qIndex] === undefined}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                Check Answer
                              </Button>
                            ) : (
                              <Button 
                                onClick={() => handleReset(qIndex)}
                                variant="outline"
                              >
                                Try Again
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default McqContent;
