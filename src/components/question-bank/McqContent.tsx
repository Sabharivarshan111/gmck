
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
      },
      {
        question: "Which of the following organisms does not follow Koch's postulates?",
        options: [
          { 
            text: "Mycobacterium leprae", 
            isCorrect: true 
          },
          { 
            text: "Escherichia coli", 
            isCorrect: false 
          },
          { 
            text: "Klebsiella species", 
            isCorrect: false 
          },
          { 
            text: "Staphylococcus aureus", 
            isCorrect: false 
          }
        ],
        explanation: "Mycobacterium leprae, the causative agent of leprosy, cannot be cultured in artificial media and has limited growth in animal models, making it impossible to fulfill Koch's postulates completely."
      },
      {
        question: "Stanley B. Prusiner was awarded the Nobel prize for his discovery of:",
        options: [
          { 
            text: "Prions", 
            isCorrect: true 
          },
          { 
            text: "Cell-mediated immunity", 
            isCorrect: false 
          },
          { 
            text: "Smallpox vaccine", 
            isCorrect: false 
          },
          { 
            text: "Penicillin", 
            isCorrect: false 
          }
        ],
        explanation: "Stanley B. Prusiner received the Nobel Prize in Physiology or Medicine in 1997 for his discovery of prions, a new biological principle of infection involving proteins that can fold abnormally and cause neurodegenerative diseases."
      },
      {
        question: "The first scientist to have observed bacteria using a single lens microscope is:",
        options: [
          { 
            text: "Edward Jenner", 
            isCorrect: false 
          },
          { 
            text: "Antonie van Leeuwenhoek", 
            isCorrect: true 
          },
          { 
            text: "Alexander Fleming", 
            isCorrect: false 
          },
          { 
            text: "Louis Pasteur", 
            isCorrect: false 
          }
        ],
        explanation: "Antonie van Leeuwenhoek was the first to observe and describe single-celled organisms (which he called 'animalcules') using simple microscopes of his own design in the 1670s."
      },
      {
        question: "Who is the father of antiseptic surgery?",
        options: [
          { 
            text: "Robert Koch", 
            isCorrect: false 
          },
          { 
            text: "Paul Ehrlich", 
            isCorrect: false 
          },
          { 
            text: "Joseph Lister", 
            isCorrect: true 
          },
          { 
            text: "Alexander Fleming", 
            isCorrect: false 
          }
        ],
        explanation: "Joseph Lister introduced the concept of sterile surgery by using carbolic acid as an antiseptic agent to sterilize surgical instruments and wound dressings, dramatically reducing post-surgical infections."
      },
      {
        question: "All of the following are contributions of Louis Pasteur EXCEPT:",
        options: [
          { 
            text: "The introduction of sterilisation techniques", 
            isCorrect: false 
          },
          { 
            text: "The discovery of the vaccine for hydrophobia", 
            isCorrect: false 
          },
          { 
            text: "The introduction of antiseptic techniques in surgery", 
            isCorrect: true 
          },
          { 
            text: "The discovery of the principles of fermentation", 
            isCorrect: false 
          }
        ],
        explanation: "The introduction of antiseptic techniques in surgery was a contribution of Joseph Lister, not Louis Pasteur. Pasteur's major contributions include sterilization techniques, vaccines (including rabies/hydrophobia), and principles of fermentation."
      },
      {
        question: "The smallpox vaccine was discovered by:",
        options: [
          { 
            text: "Edward Jenner", 
            isCorrect: true 
          },
          { 
            text: "Joseph Lister", 
            isCorrect: false 
          },
          { 
            text: "Niels Jerne", 
            isCorrect: false 
          },
          { 
            text: "Paul Ehrlich", 
            isCorrect: false 
          }
        ],
        explanation: "Edward Jenner developed the smallpox vaccine in 1796. He observed that milkmaids who had contracted cowpox were immune to smallpox, leading to his development of the first vaccine."
      },
      {
        question: "Who is credited with the discovery of the electron microscope?",
        options: [
          { 
            text: "Antonie V Leeuwenhoek", 
            isCorrect: false 
          },
          { 
            text: "Ernst Ruska", 
            isCorrect: true 
          },
          { 
            text: "Niels Jerne", 
            isCorrect: false 
          },
          { 
            text: "Frank Burnet", 
            isCorrect: false 
          }
        ],
        explanation: "Ernst Ruska developed the first electron microscope in 1931, for which he was awarded the Nobel Prize in Physics in 1986. The electron microscope uses beams of electrons instead of light, allowing for much higher magnification and resolution."
      },
      {
        question: "The first whole-genome sequence of a microbe was published in 1995. Which organism's genome was the first to be published in 1995?",
        options: [
          { 
            text: "H. influenzae", 
            isCorrect: true 
          },
          { 
            text: "Staphylococcus aureus", 
            isCorrect: false 
          },
          { 
            text: "Streptococcus pyogenes", 
            isCorrect: false 
          },
          { 
            text: "Escherichia coli", 
            isCorrect: false 
          }
        ],
        explanation: "Haemophilus influenzae was the first free-living organism to have its complete genome sequenced, published in 1995 by Craig Venter and his team at The Institute for Genomic Research (TIGR)."
      },
      {
        question: "Which of the following bacteria was discovered by Robert Koch?",
        options: [
          { 
            text: "Mycobacterium leprae", 
            isCorrect: false 
          },
          { 
            text: "Vibrio cholerae", 
            isCorrect: true 
          },
          { 
            text: "Treponemes", 
            isCorrect: false 
          },
          { 
            text: "Clostridium tetani", 
            isCorrect: false 
          }
        ],
        explanation: "Robert Koch discovered Vibrio cholerae, the causative agent of cholera, in 1883. He also discovered the tuberculosis bacterium (Mycobacterium tuberculosis) in 1882, but not Mycobacterium leprae."
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
