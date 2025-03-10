import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Book, CheckCircle, XCircle, Microscope, TestTube } from "lucide-react";

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

  // First year content - History and scope of microbiology
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

  // Second year content - Basic concepts of bacteriology
  const bacteriologyMcqs: McqData = {
    name: "Chapter 2: Basic concepts of bacteriology",
    questions: [
      {
        question: "Which microscope is based on the principle that differences in the refractive indices of bacterial cells and the surrounding medium make them clearly visible?",
        options: [
          { text: "Dark-ground microscope", isCorrect: false },
          { text: "Phase-contrast microscope", isCorrect: true },
          { text: "Electron microscope", isCorrect: false },
          { text: "Confocal microscope", isCorrect: false }
        ],
        explanation: "The phase-contrast microscope works on the principle that differences in refractive indices between bacterial cells and the surrounding medium create phase shifts in light waves, making bacteria visible without staining."
      },
      {
        question: "Which of the following bacteria resist decolourisation with 5% sulphuric acid in acid-fast staining?",
        options: [
          { text: "Nocardia", isCorrect: false },
          { text: "Legionella", isCorrect: false },
          { text: "Mycobacterium leprae", isCorrect: true },
          { text: "Mycobacterium tuberculosis", isCorrect: false }
        ],
        explanation: "Mycobacterium leprae (the leprosy bacillus) is strongly acid-fast and resists decolorization with 5% sulfuric acid, which is a characteristic feature used in its identification."
      },
      {
        question: "All the following are components of the cell wall of gram-negative bacteria EXCEPT:",
        options: [
          { text: "Peptidoglycan", isCorrect: false },
          { text: "Lipopolysaccharide", isCorrect: false },
          { text: "Outer membrane", isCorrect: false },
          { text: "Teichoic acid", isCorrect: true }
        ],
        explanation: "Teichoic acid is a component of gram-positive bacterial cell walls, not gram-negative bacteria. Gram-negative cell walls contain peptidoglycan, lipopolysaccharide, and an outer membrane."
      },
      {
        question: "All of the following statements are TRUE of the outer membrane layer of the gram-negative cell wall EXCEPT:",
        options: [
          { text: "It forms the outermost layer", isCorrect: false },
          { text: "It is responsible for endotoxic activities", isCorrect: true },
          { text: "It has receptors for some bacteriophages", isCorrect: false },
          { text: "Porins in this layer serve as diffusion channels for small molecules", isCorrect: false }
        ],
        explanation: "The lipopolysaccharide (LPS) component of the outer membrane is responsible for endotoxic activities, not the outer membrane itself. The outer membrane forms the outermost layer, contains bacteriophage receptors, and has porins for diffusion."
      },
      {
        question: "Peritrichous arrangement of flagella refers to:",
        options: [
          { text: "A single flagellum at one pole", isCorrect: false },
          { text: "Flagella all around the cell", isCorrect: true },
          { text: "Flagella at both poles", isCorrect: false },
          { text: "Tufts of flagella at one pole", isCorrect: false }
        ],
        explanation: "Peritrichous flagella arrangement means that the bacterial cell has flagella distributed all around its surface, as seen in bacteria like Escherichia coli and Salmonella species."
      },
      {
        question: "The organ of adhesion in bacteria is the:",
        options: [
          { text: "Flagellum", isCorrect: false },
          { text: "Fimbria", isCorrect: true },
          { text: "Capsule", isCorrect: false },
          { text: "Mesosome", isCorrect: false }
        ],
        explanation: "Fimbriae (pili) are hair-like appendages on bacterial cells that primarily function as adhesion structures, allowing bacteria to attach to surfaces and other cells."
      },
      {
        question: "Bacteria that grow at temperatures below 20°C are called:",
        options: [
          { text: "Mesophiles", isCorrect: false },
          { text: "Thermophiles", isCorrect: false },
          { text: "Psychrophiles", isCorrect: true },
          { text: "Capnophiles", isCorrect: false }
        ],
        explanation: "Psychrophiles are microorganisms capable of growth at temperatures below 20°C. They are commonly found in cold environments such as oceans, polar regions, and refrigerated foods."
      },
      {
        question: "All the following statements are TRUE about L-forms of bacteria EXCEPT that they:",
        options: [
          { text: "Are aberrant morphological forms", isCorrect: false },
          { text: "Develop in the presence of penicillin", isCorrect: false },
          { text: "Are always stable", isCorrect: true },
          { text: "Are named after Lister Institute, London", isCorrect: false }
        ],
        explanation: "L-forms of bacteria are not always stable. They can be unstable and revert to their normal form when the environmental stress (like exposure to penicillin) is removed. They are cell wall-deficient bacteria named after the Lister Institute in London."
      },
      {
        question: "All the following statements are TRUE about bacterial spores EXCEPT that they:",
        options: [
          { text: "They are a method of reproduction", isCorrect: true },
          { text: "They are resistant to desiccation", isCorrect: false },
          { text: "They can be destroyed by autoclaving at 120°C for 15 minutes", isCorrect: false },
          { text: "They are produced by the genus Bacillus", isCorrect: false }
        ],
        explanation: "Bacterial spores are NOT a method of reproduction; they are a dormant, resistant form that bacteria enter during unfavorable conditions. They are highly resistant to desiccation, heat (requiring autoclaving to destroy), and are characteristic of genera like Bacillus and Clostridium."
      },
      {
        question: "In which phase of bacterial growth does sporulation occur?",
        options: [
          { text: "Lag phase", isCorrect: false },
          { text: "Log phase", isCorrect: false },
          { text: "Stationary phase", isCorrect: true },
          { text: "Phase of decline", isCorrect: false }
        ],
        explanation: "Sporulation typically occurs during the stationary phase of bacterial growth when nutrients become limited and waste products accumulate, triggering the formation of endospores in species capable of producing them."
      },
      {
        question: "Bacteria that are unable to synthesise their own metabolites and depend on pre-formed organic compounds are called:",
        options: [
          { text: "Phototrophs", isCorrect: false },
          { text: "Chemotrophs", isCorrect: false },
          { text: "Autotrophs", isCorrect: false },
          { text: "Heterotrophs", isCorrect: true }
        ],
        explanation: "Heterotrophs are organisms that cannot synthesize their own food and must obtain organic carbon from pre-formed compounds in their environment. Most bacteria are heterotrophs."
      },
      {
        question: "Bacterial capsules can be demonstrated by:",
        options: [
          { text: "Albert's stain", isCorrect: false },
          { text: "India ink", isCorrect: true },
          { text: "Ziehl-Neelsen stain", isCorrect: false },
          { text: "All of these", isCorrect: false }
        ],
        explanation: "India ink is used for negative staining to demonstrate bacterial capsules. The ink particles cannot penetrate the capsule, creating a clear zone around the bacterium against the dark background of the ink."
      },
      {
        question: "Mesosomes function as:",
        options: [
          { text: "Sites for storage of products for metabolism and energy", isCorrect: false },
          { text: "Sites for bacterial respiration", isCorrect: true },
          { text: "Sites for protein synthesis", isCorrect: false },
          { text: "Diffusion channels for small molecules", isCorrect: false }
        ],
        explanation: "Mesosomes are invaginations of the plasma membrane in bacteria that function as the site for respiratory enzymes, particularly in aerobic bacteria, serving as the primary location for cellular respiration."
      },
      {
        question: "Bacteria are more susceptible to antibiotics during which of the following phases of the bacterial growth curve?",
        options: [
          { text: "Lag phase", isCorrect: false },
          { text: "Log phase", isCorrect: true },
          { text: "Stationary phase", isCorrect: false },
          { text: "Phase of decline", isCorrect: false }
        ],
        explanation: "Bacteria are most susceptible to antibiotics during the log (exponential) phase when they are actively dividing and metabolizing. Many antibiotics target cell wall synthesis, protein synthesis, or DNA replication, processes that are most active during this phase."
      },
      {
        question: "Which of the following is an enrichment medium?",
        options: [
          { text: "Nutrient broth", isCorrect: false },
          { text: "Tetrathionate broth", isCorrect: true },
          { text: "Stuart's medium", isCorrect: false },
          { text: "Thayer-Martin medium", isCorrect: false }
        ],
        explanation: "Tetrathionate broth is an enrichment medium used for isolating Salmonella species. It contains sodium tetrathionate which inhibits the growth of normal intestinal bacteria while allowing Salmonella to multiply."
      },
      {
        question: "Which of the following statements is TRUE?",
        options: [
          { text: "Agar has nutrient properties", isCorrect: false },
          { text: "Chocolate agar is a selective medium", isCorrect: false },
          { text: "Solid media with the addition of selective substances are called enrichment media", isCorrect: false },
          { text: "Nutrient broth is a basal medium", isCorrect: true }
        ],
        explanation: "Nutrient broth is a basal medium that contains basic nutrients for bacterial growth but lacks specialized ingredients. Agar is a solidifying agent without nutrients, chocolate agar is an enriched (not selective) medium, and solid media with selective agents are called selective media."
      },
      {
        question: "MacConkey agar is an example of:",
        options: [
          { text: "Differential medium", isCorrect: true },
          { text: "Transport medium", isCorrect: false },
          { text: "Enriched medium", isCorrect: false },
          { text: "Anaerobic medium", isCorrect: false }
        ],
        explanation: "MacConkey agar is a differential medium that distinguishes between lactose-fermenting and non-lactose-fermenting bacteria. Lactose fermenters produce pink colonies due to the pH indicator, while non-lactose fermenters produce colorless colonies."
      },
      {
        question: "All the following are enriched media EXCEPT:",
        options: [
          { text: "Loeffler's serum slope", isCorrect: false },
          { text: "Blood agar", isCorrect: false },
          { text: "Chocolate agar", isCorrect: false },
          { text: "Nutrient agar", isCorrect: true }
        ],
        explanation: "Nutrient agar is a basic medium without enrichment factors. Loeffler's serum slope, blood agar, and chocolate agar are all enriched media containing additional nutrients like serum, blood, or heated blood to support the growth of fastidious organisms."
      },
      {
        question: "A solid medium containing substances which allow the required bacteria to grow and inhibit the growth of unwanted bacteria is called:",
        options: [
          { text: "Differential medium", isCorrect: false },
          { text: "Enriched medium", isCorrect: false },
          { text: "Enrichment medium", isCorrect: false },
          { text: "Selective medium", isCorrect: true }
        ],
        explanation: "A selective medium contains substances that inhibit the growth of certain bacteria while allowing others to grow. This selectivity helps in isolating specific bacteria from mixed cultures or specimens."
      },
      {
        question: "Stuart's transport medium is used for the transport of specimens containing:",
        options: [
          { text: "Salmonella", isCorrect: false },
          { text: "Gonococci", isCorrect: true },
          { text: "Vibrio cholerae", isCorrect: false },
          { text: "Shigella", isCorrect: false }
        ],
        explanation: "Stuart's transport medium is specifically designed for the transport of clinical specimens containing Neisseria gonorrhoeae (gonococci). It maintains the viability of these delicate organisms during transport to the laboratory."
      }
    ]
  };

  const handleSelectOption = (questionKey: string, optionIndex: number) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionKey]: optionIndex
    });
  };

  const handleCheckAnswer = (questionKey: string) => {
    setShowResults({
      ...showResults,
      [questionKey]: true
    });
  };

  const handleReset = (questionKey: string) => {
    const updatedAnswers = { ...selectedAnswers };
    delete updatedAnswers[questionKey];
    
    const updatedResults = { ...showResults };
    delete updatedResults[questionKey];
    
    setSelectedAnswers(updatedAnswers);
    setShowResults(updatedResults);
  };

  return (
    <div className="space-y-6">
      {/* First Year */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="firstYear">
          <AccordionTrigger className="hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-lg px-4">
            <div className="flex items-center space-x-3">
              <Book className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xl md:text-2xl font-semibold">1st Year</h3>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Accordion type="single" collapsible className="w-full ml-6 mt-2">
              <AccordionItem value="microbiology1">
                <AccordionTrigger className="hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-lg px-4">
                  <div className="flex items-center space-x-3">
                    <Microscope className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <h4 className="text-lg font-medium">Microbiology</h4>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4">
                  <Accordion type="single" collapsible className="w-full ml-2 mt-2">
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
                                        ${selectedAnswers[`1_1_${qIndex}`] === oIndex ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}
                                        ${showResults[`1_1_${qIndex}`] && option.isCorrect ? 'bg-green-50 dark:bg-green-900/20' : ''}
                                        ${showResults[`1_1_${qIndex}`] && selectedAnswers[`1_1_${qIndex}`] === oIndex && !option.isCorrect ? 'bg-red-50 dark:bg-red-900/20' : ''}
                                      `}
                                      onClick={() => !showResults[`1_1_${qIndex}`] && handleSelectOption(`1_1_${qIndex}`, oIndex)}
                                    >
                                      <div className="flex h-6 w-6 mt-0.5">
                                        {showResults[`1_1_${qIndex}`] ? (
                                          option.isCorrect ? (
                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                          ) : selectedAnswers[`1_1_${qIndex}`] === oIndex ? (
                                            <XCircle className="h-5 w-5 text-red-500" />
                                          ) : (
                                            <div className="h-5 w-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                                          )
                                        ) : (
                                          <Checkbox 
                                            checked={selectedAnswers[`1_1_${qIndex}`] === oIndex}
                                            className="rounded-full"
                                            onCheckedChange={() => handleSelectOption(`1_1_${qIndex}`, oIndex)}
                                          />
                                        )}
                                      </div>
                                      <div className="text-base">{option.text}</div>
                                    </div>
                                  ))}
                                </div>
                                
                                {showResults[`1_1_${qIndex}`] && question.explanation && (
                                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                                    <h4 className="font-medium mb-2">Explanation:</h4>
                                    <p>{question.explanation}</p>
                                  </div>
                                )}
                                
                                <div className="flex space-x-4 pt-2">
                                  {!showResults[`1_1_${qIndex}`] ? (
                                    <Button 
                                      onClick={() => handleCheckAnswer(`1_1_${qIndex}`)}
                                      disabled={selectedAnswers[`1_1_${qIndex}`] === undefined}
                                      className="bg-blue-600 hover:bg-blue-700"
                                    >
                                      Check Answer
                                    </Button>
                                  ) : (
                                    <Button 
                                      onClick={() => handleReset(`1_1_${qIndex}`)}
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Second Year */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="secondYear">
          <AccordionTrigger className="hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-lg px-4">
            <div className="flex items-center space-x-3">
              <Book className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              <h3 className="text-xl md:text-2xl font-semibold">2nd Year</h3>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Accordion type="single" collapsible className="w-full ml-6 mt-2">
              <AccordionItem value="microbiology2">
                <AccordionTrigger className="hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-lg px-4">
                  <div className="flex items-center space-x-3">
                    <Microscope className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <h4 className="text-lg font-medium">Microbiology</h4>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4">
                  <Accordion type="single" collapsible className="w-full ml-2 mt-2">
                    <AccordionItem value="chapter2">
                      <AccordionTrigger className="hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-lg px-4">
                        <div className="flex items-center space-x-3">
                          <TestTube className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <h4 className="text-lg font-medium">{bacteriologyMcqs.name}</h4>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pt-4">
                        <div className="space-y-8">
                          {bacteriologyMcqs.questions.map((question, qIndex) => (
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
                                        ${selectedAnswers[`2_2_${qIndex}`] === oIndex ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}
                                        ${showResults[`2_2_${qIndex}`] && option.isCorrect ? 'bg-green-50 dark:bg-green-900/20' : ''}
                                        ${showResults[`2_2_${qIndex}`] && selectedAnswers[`2_2_${qIndex}`] === oIndex && !option.isCorrect ? 'bg-red-50 dark:bg-red-900/20' : ''}
                                      `}
                                      onClick={() => !showResults[`2_2_${qIndex}`] && handleSelectOption(`2_2_${qIndex}`, oIndex)}
                                    >
                                      <div className="flex h-6 w-6 mt-0.5">
                                        {showResults[`2_2_${qIndex}`] ? (
                                          option.isCorrect ? (
                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                          ) : selectedAnswers[`2_2_${qIndex}`] === oIndex ? (
                                            <XCircle className="h-5 w-5 text-red-500" />
                                          ) : (
                                            <div className="h-5 w-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                                          )
                                        ) : (
                                          <Checkbox 
                                            checked={selectedAnswers[`2_2_${qIndex}`] === oIndex}
                                            className="rounded-full"
                                            onCheckedChange={() => handleSelectOption(`2_2_${qIndex}`, oIndex)}
                                          />
                                        )}
                                      </div>
                                      <div className="text-base">{option.text}</div>
                                    </div>
                                  ))}
                                </div>
                                
                                {showResults[`2_2_${qIndex}`] && question.explanation && (
                                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                                    <h4 className="font-medium mb-2">Explanation:</h4>
                                    <p>{question.explanation}</p>
                                  </div>
                                )}
                                
                                <div className="flex space-x-4 pt-2">
                                  {!showResults[`2_2_${qIndex}`] ? (
                                    <Button 
                                      onClick={() => handleCheckAnswer(`2_2_${qIndex}`)}
                                      disabled={selectedAnswers[`2_2_${qIndex}`] === undefined}
                                      className="bg-blue-600 hover:bg-blue-700"
                                    >
                                      Check Answer
                                    </Button>
                                  ) : (
                                    <Button 
                                      onClick={() => handleReset(`2_2_${qIndex}`)}
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default McqContent;
