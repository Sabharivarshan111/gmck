
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

  // Bacteriology content for 2nd year
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
      },
      {
        question: "Robertson's cooked meat medium is used to grow:",
        options: [
          { text: "Anaerobes", isCorrect: true },
          { text: "Viruses", isCorrect: false },
          { text: "Yeasts", isCorrect: false },
          { text: "Aerobes", isCorrect: false }
        ],
        explanation: "Robertson's cooked meat medium is an enrichment medium specifically designed for the cultivation of anaerobic bacteria, especially Clostridium species. The meat particles provide a reducing environment that favors anaerobic growth."
      },
      {
        question: "Agar-agar is used in microbiological media for:",
        options: [
          { text: "Nutritive value", isCorrect: false },
          { text: "Solidifying media", isCorrect: true },
          { text: "Carbon source", isCorrect: false },
          { text: "All of these", isCorrect: false }
        ],
        explanation: "Agar-agar is a polysaccharide extracted from certain red algae. In microbiology, it is primarily used as a solidifying agent for culture media. It has no nutritive value for most microorganisms and remains solid at typical incubation temperatures."
      },
      {
        question: "Which of the following selective media is used to isolate M. tuberculosis?",
        options: [
          { text: "Deoxycholate citrate medium", isCorrect: false },
          { text: "Thayer-Martin medium", isCorrect: false },
          { text: "Lowenstein-Jensen medium", isCorrect: true },
          { text: "Potassium tellurite blood agar", isCorrect: false }
        ],
        explanation: "Lowenstein-Jensen medium is a selective medium used for the isolation and cultivation of Mycobacterium tuberculosis. It contains malachite green that inhibits other bacteria while allowing mycobacteria to grow."
      },
      {
        question: "Cysteine lactose electrolyte deficient medium is an example of:",
        options: [
          { text: "Enriched medium", isCorrect: false },
          { text: "Differential medium", isCorrect: true },
          { text: "Transport medium", isCorrect: false },
          { text: "Basal medium", isCorrect: false }
        ],
        explanation: "Cysteine Lactose Electrolyte Deficient (CLED) medium is a differential medium primarily used for urinary tract pathogens. It differentiates between lactose-fermenting and non-lactose-fermenting bacteria based on color changes."
      },
      {
        question: "Which of the following require chocolate agar to grow:",
        options: [
          { text: "Neisseria meningitidis", isCorrect: true },
          { text: "E. coli", isCorrect: false },
          { text: "Salmonella typhi", isCorrect: false },
          { text: "Mycoplasma pneumoniae", isCorrect: false }
        ],
        explanation: "Neisseria meningitidis, a fastidious organism, requires chocolate agar for growth. Chocolate agar contains hemoglobin and other growth factors from heated blood that support the growth of fastidious bacteria."
      },
      {
        question: "McIntosh and Filde's anaerobic jar is used for the isolation of:",
        options: [
          { text: "Clostridium tetani", isCorrect: true },
          { text: "Pseudomonas aeruginosa", isCorrect: false },
          { text: "Nocardia asteroides", isCorrect: false },
          { text: "None of these", isCorrect: false }
        ],
        explanation: "McIntosh and Filde's anaerobic jar is used for creating anaerobic conditions for the cultivation of strict anaerobes like Clostridium tetani. It works by removing oxygen and generating anaerobic conditions inside a sealed jar."
      },
      {
        question: "Lawn culture method is used for:",
        options: [
          { text: "Antibiotic sensitivity testing", isCorrect: false },
          { text: "Bacteriophage typing", isCorrect: false },
          { text: "Obtaining bacterial growth in large quantities for the preparation of bacterial antigens", isCorrect: false },
          { text: "All of the above", isCorrect: true }
        ],
        explanation: "The lawn culture method produces a uniform, confluent growth of bacteria across the entire surface of the medium. It is used for antibiotic sensitivity testing, bacteriophage typing, and obtaining large quantities of bacterial growth for antigen preparation."
      },
      {
        question: "Which of the following culture methods can be used to determine the number of bacteria/mL of liquid broth?",
        options: [
          { text: "Lawn culture", isCorrect: false },
          { text: "Pour plate culture", isCorrect: true },
          { text: "Stab culture", isCorrect: false },
          { text: "Streak culture", isCorrect: false }
        ],
        explanation: "Pour plate culture method is used for quantifying viable bacteria in a liquid sample. Diluted samples are mixed with molten agar and allowed to solidify. Individual bacterial cells form distinct colonies that can be counted to determine the original concentration."
      },
      {
        question: "Craigie's tube culture method is used to:",
        options: [
          { text: "Separate bacteria with different optimum temperatures", isCorrect: false },
          { text: "Separate motile from non-motile bacteria", isCorrect: true },
          { text: "Separate pathogens from specimens with normal flora", isCorrect: false },
          { text: "Separate vegetative from spore-producing bacteria", isCorrect: false }
        ],
        explanation: "Craigie's tube method employs a tube within a tube setup. The inner tube contains media and has openings at the bottom. Only motile bacteria can swim up through these openings, providing a way to separate motile from non-motile bacteria."
      },
      {
        question: "The growth of bacteria in liquid culture medium is indicated by the presence of:",
        options: [
          { text: "Turbidity", isCorrect: false },
          { text: "Sediment", isCorrect: false },
          { text: "Surface pellicle", isCorrect: false },
          { text: "All of these", isCorrect: true }
        ],
        explanation: "Bacterial growth in liquid media can be detected by various signs including turbidity (cloudiness), formation of sediment at the bottom, or development of a surface pellicle (film) on top. Different bacteria may show different growth patterns."
      },
      {
        question: "Triple sugar iron medium contains all the following sugars EXCEPT:",
        options: [
          { text: "Glucose", isCorrect: false },
          { text: "Sucrose", isCorrect: false },
          { text: "Lactose", isCorrect: false },
          { text: "Maltose", isCorrect: true }
        ],
        explanation: "Triple Sugar Iron (TSI) agar contains three sugars: glucose (0.1%), lactose (1%), and sucrose (1%). It does not contain maltose. TSI is used to differentiate enteric bacteria based on their ability to ferment these sugars and produce hydrogen sulfide."
      },
      {
        question: "Lecithinase production on egg yolk agar is a characteristic feature of:",
        options: [
          { text: "Clostridium botulinum", isCorrect: false },
          { text: "Clostridium tetani", isCorrect: false },
          { text: "Clostridium perfringens", isCorrect: true },
          { text: "Clostridium difficile", isCorrect: false }
        ],
        explanation: "Clostridium perfringens produces lecithinase (alpha toxin), which breaks down lecithin in egg yolk, forming an opaque zone around bacterial colonies on egg yolk agar. This test helps identify C. perfringens from other clostridia."
      },
      {
        question: "An example of an anaerobic transport medium is:",
        options: [
          { text: "Cary-Blair medium", isCorrect: false },
          { text: "Crystal violet medium", isCorrect: false },
          { text: "Pike's medium", isCorrect: false },
          { text: "Robertson cooked meat medium", isCorrect: true }
        ],
        explanation: "Robertson's cooked meat medium serves as an excellent anaerobic transport medium. The meat particles create a reducing environment that maintains anaerobic conditions, preserving the viability of strict anaerobes during transport."
      },
      {
        question: "Routine blood agar for anaerobic culture contains:",
        options: [
          { text: "Penicillin", isCorrect: false },
          { text: "Neomycin", isCorrect: true },
          { text: "Oxacillin", isCorrect: false },
          { text: "Clindamycin", isCorrect: false }
        ],
        explanation: "Blood agar for anaerobic culture often contains neomycin as a selective agent. Neomycin inhibits most aerobic and facultative anaerobic bacteria while allowing the growth of strict anaerobes, helping in their isolation."
      },
      {
        question: "The principle of bacterial identification in matrix-assisted laser desorption/ionization-time of flight (MALDI-TOF) mass spectrometry is:",
        options: [
          { text: "Analysis of unique bacterial protein composition", isCorrect: true },
          { text: "Formation of complex between the probe and target DNA", isCorrect: false },
          { text: "Amplification of target nucleic acid", isCorrect: false },
          { text: "Nucleic acid sequence-based amplification", isCorrect: false }
        ],
        explanation: "MALDI-TOF mass spectrometry identifies bacteria by analyzing their unique protein composition, particularly ribosomal proteins. It creates a protein spectrum that serves as a fingerprint for bacterial identification when compared to a database."
      },
      {
        question: "What is TRUE regarding the MALDI-TOF technique?",
        options: [
          { text: "Rapid technique", isCorrect: false },
          { text: "Requires culture of the organism", isCorrect: true },
          { text: "Targets the cell wall component", isCorrect: false },
          { text: "Less specific", isCorrect: false }
        ],
        explanation: "MALDI-TOF requires a pure culture of the organism for accurate identification. While it is a rapid technique that primarily targets proteins (not specifically cell wall components) and is highly specific, the correct answer is that it requires culture of the organism."
      },
      {
        question: "All the following are TRUE of conventional microbiological techniques EXCEPT:",
        options: [
          { text: "Labour intensive", isCorrect: false },
          { text: "Less expensive", isCorrect: false },
          { text: "Greater turn-around time", isCorrect: false },
          { text: "Do not require expertise", isCorrect: true }
        ],
        explanation: "Conventional microbiological techniques DO require significant expertise. They are labor-intensive, generally less expensive than molecular methods, and have longer turn-around times, but they definitely require skilled technicians with specific training."
      },
      {
        question: "The following substances can be added to produce an anaerobic environment EXCEPT:",
        options: [
          { text: "Ascorbic acid", isCorrect: false },
          { text: "Glutathione", isCorrect: false },
          { text: "Glycerol", isCorrect: true },
          { text: "Cysteine", isCorrect: false }
        ],
        explanation: "Glycerol is not used to create anaerobic conditions. Ascorbic acid, glutathione, and cysteine are reducing agents that can help create and maintain anaerobic conditions by removing oxygen from the environment."
      },
      {
        question: "The medium that does NOT support the growth of clostridia is:",
        options: [
          { text: "Brain–heart infusion broth", isCorrect: true },
          { text: "Thioglycolate broth", isCorrect: false },
          { text: "Litmus milk medium", isCorrect: false },
          { text: "Robertson's cooked meat broth", isCorrect: false }
        ],
        explanation: "While Brain-heart infusion (BHI) broth can support the growth of many microorganisms, it is not specifically designed for clostridia and lacks the reducing environment needed for optimal growth of strict anaerobes. The other media listed are more suitable for clostridia cultivation."
      },
      {
        question: "The phenyl deaminase test is used to identify which of the following?",
        options: [
          { text: "Shigella", isCorrect: false },
          { text: "Salmonella", isCorrect: false },
          { text: "Proteus", isCorrect: true },
          { text: "Pseudomonas", isCorrect: false }
        ],
        explanation: "The phenylalanine deaminase (PDA) test is used to identify Proteus species. These bacteria can deaminate phenylalanine to phenylpyruvic acid, which produces a green color when ferric chloride is added, allowing differentiation from other Enterobacteriaceae."
      }
    ]
  };

  // Systematic bacteriology content for 2nd year
  const systematicBacteriologyMcqs: McqData = {
    name: "Chapter 3: Systematic bacteriology",
    questions: [
      {
        question: "Phenotypic classification refers to classification based on:",
        options: [
          { text: "Direct analysis of genes in microbes", isCorrect: false },
          { text: "Chromosomal and extrachromosomal DNA analysis of microbes", isCorrect: false },
          { text: "Expressed characteristics of microorganisms", isCorrect: true },
          { text: "Nucleotide sequencing of microbes", isCorrect: false }
        ],
        explanation: "Phenotypic classification is based on observable characteristics that are expressed by microorganisms, such as morphology, staining properties, biochemical reactions, and growth requirements."
      },
      {
        question: "Incubation period refers to the time duration:",
        options: [
          { text: "Between entry of pathogen and exit of pathogen in body", isCorrect: false },
          { text: "Between entry of pathogen in vector and entry in host", isCorrect: false },
          { text: "Between entry of pathogen and manifestation of symptoms or signs in host", isCorrect: true },
          { text: "Between entry of pathogen and its detection in host", isCorrect: false }
        ],
        explanation: "The incubation period is the time interval between the initial infection with a pathogen and the appearance of the first clinical signs or symptoms of disease. This varies widely among different infectious diseases."
      },
      {
        question: "Which of the following is not a gram-positive coccus?",
        options: [
          { text: "Pneumococcus", isCorrect: false },
          { text: "Meningococcus", isCorrect: true },
          { text: "Enterococcus", isCorrect: false },
          { text: "Staphylococcus", isCorrect: false }
        ],
        explanation: "Meningococcus (Neisseria meningitidis) is a gram-negative diplococci. The other options - Pneumococcus (Streptococcus pneumoniae), Enterococcus, and Staphylococcus - are all gram-positive cocci."
      },
      {
        question: "Normal microbial flora are also called:",
        options: [
          { text: "Resident flora", isCorrect: false },
          { text: "Commensal flora", isCorrect: false },
          { text: "Transient flora", isCorrect: false },
          { text: "All of these", isCorrect: true }
        ],
        explanation: "Normal microbial flora can be called resident flora (permanently colonizing the body), commensal flora (living in mutual non-harmful relationship), or transient flora (temporarily present). All these terms are used to describe the normal microbiota."
      },
      {
        question: "All the following are constituents of normal flora EXCEPT:",
        options: [
          { text: "Gram-positive bacteria", isCorrect: false },
          { text: "Gram-negative bacteria", isCorrect: false },
          { text: "Yeast", isCorrect: true },
          { text: "Viruses", isCorrect: false }
        ],
        explanation: "Yeast is not typically considered a constituent of normal microbial flora. While some yeasts like Candida may colonize certain body sites in small numbers, they are generally not considered part of the normal flora. Gram-positive bacteria, gram-negative bacteria, and certain viruses are normal constituents of the human microbiome."
      },
      {
        question: "The major components of the intestinal flora constitute:",
        options: [
          { text: "Coliform bacteria", isCorrect: false },
          { text: "Clostridium species", isCorrect: true },
          { text: "Yeast", isCorrect: false },
          { text: "Enterococcus species", isCorrect: false }
        ],
        explanation: "Clostridium species are major components of the intestinal flora, particularly in the colon. Anaerobic bacteria, including Bacteroides, Clostridium, and other anaerobes, outnumber aerobic bacteria in the intestine by 1000:1."
      },
      {
        question: "Sterile body sites include all the following EXCEPT:",
        options: [
          { text: "CNS", isCorrect: false },
          { text: "Nasopharynx", isCorrect: true },
          { text: "Lungs", isCorrect: false },
          { text: "Liver", isCorrect: false }
        ],
        explanation: "The nasopharynx is not a sterile body site; it is heavily colonized with normal flora. The CNS (cerebrospinal fluid, brain), deeper lung tissue, and liver are normally sterile sites in healthy individuals."
      },
      {
        question: "Normal flora of skin includes all the following EXCEPT:",
        options: [
          { text: "α-streptococci", isCorrect: false },
          { text: "Staphylococci", isCorrect: false },
          { text: "Candida", isCorrect: false },
          { text: "Lactobacilli", isCorrect: true }
        ],
        explanation: "Lactobacilli are not typical residents of skin flora. They are more commonly found in the vaginal flora and gastrointestinal tract. Skin flora primarily consists of staphylococci (especially S. epidermidis), α-streptococci, corynebacteria, and occasionally small numbers of Candida."
      },
      {
        question: "The relationship between a host and the normal flora wherein both co-exist is called:",
        options: [
          { text: "Symbiosis", isCorrect: true },
          { text: "Commensalism", isCorrect: false },
          { text: "Parasitism", isCorrect: false },
          { text: "Opportunistic infection", isCorrect: false }
        ],
        explanation: "Symbiosis refers to a close and long-term biological interaction between two different biological organisms. In the context of normal flora, it describes the mutually beneficial relationship between the host and the microorganisms."
      },
      {
        question: "Normal flora in the human body, when administered in adequate amounts, confer a health benefit to the host. These organisms are known as:",
        options: [
          { text: "Probiotics", isCorrect: true },
          { text: "Gnotobiotic", isCorrect: false },
          { text: "Symbiotics", isCorrect: false },
          { text: "Prebiotics", isCorrect: false }
        ],
        explanation: "Probiotics are live microorganisms that, when administered in adequate amounts, confer a health benefit on the host. They are often derived from normal flora and are used therapeutically to restore balance to the microbiome."
      },
      {
        question: "Most common probiotics include:",
        options: [
          { text: "Fusobacterium and Lactobacillus", isCorrect: false },
          { text: "Bacteroides and Fusobacterium", isCorrect: false },
          { text: "Lactobacillus and Bifidobacterium", isCorrect: true },
          { text: "Bifidobacterium and Propionibacterium", isCorrect: false }
        ],
        explanation: "Lactobacillus and Bifidobacterium species are the most commonly used probiotics. They are found naturally in fermented foods and are part of the normal human gastrointestinal and vaginal flora."
      },
      {
        question: "Disturbance to the normal flora can be caused by:",
        options: [
          { text: "Prolonged antibiotic therapy", isCorrect: false },
          { text: "Alternation of pH in the mucosa", isCorrect: false },
          { text: "Immunosuppressive therapy", isCorrect: false },
          { text: "All of these", isCorrect: true }
        ],
        explanation: "Normal flora can be disturbed by multiple factors, including prolonged antibiotic therapy (which kills beneficial bacteria), alteration of mucosal pH (which changes the environment), and immunosuppressive therapy (which alters host defenses)."
      },
      {
        question: "Which of the following statements is NOT TRUE?",
        options: [
          { text: "Normal flora cause confusion in the laboratory diagnosis", isCorrect: false },
          { text: "Clindamycin administration helps in the multiplication of normal flora", isCorrect: true },
          { text: "Probiotics are used in treating antibiotic-associated colitis", isCorrect: false },
          { text: "Fecal transplantation is attempted for irritable bowel syndrome", isCorrect: false }
        ],
        explanation: "Clindamycin administration does NOT help in the multiplication of normal flora. On the contrary, it is known to disrupt normal intestinal flora and is associated with antibiotic-associated colitis caused by Clostridium difficile overgrowth."
      },
      {
        question: "Microorganisms that fail to grow in the presence of as low as 0.03% O2 are called:",
        options: [
          { text: "Aerotolerant", isCorrect: false },
          { text: "Obligate anaerobes", isCorrect: true },
          { text: "Facultative anaerobes", isCorrect: false },
          { text: "Facultative aerobes", isCorrect: false }
        ],
        explanation: "Obligate anaerobes cannot tolerate even low levels of oxygen (as low as 0.03%) and die when exposed to oxygen. They lack the enzymes necessary to detoxify oxygen and its reactive intermediates."
      },
      {
        question: "The FALSE statement about anaerobic cocci is:",
        options: [
          { text: "They are always pathogenic", isCorrect: true },
          { text: "They are generally sensitive to penicillin", isCorrect: false },
          { text: "They are normal inhabitants of the vagina, intestine and mouth", isCorrect: false },
          { text: "They occur as cocci in pairs, groups and chains", isCorrect: false }
        ],
        explanation: "Anaerobic cocci are NOT always pathogenic. Many are part of the normal flora in the vagina, intestine, and mouth, and only cause disease under certain conditions, such as tissue injury or compromised host defenses."
      },
      {
        question: "The most commonly isolated anaerobe from clinical specimens is:",
        options: [
          { text: "Fusobacterium", isCorrect: false },
          { text: "Lactobacillus", isCorrect: false },
          { text: "Bacteroides", isCorrect: true },
          { text: "Prevotella", isCorrect: false }
        ],
        explanation: "Bacteroides species, particularly Bacteroides fragilis, are the most commonly isolated anaerobes from clinical specimens. They are particularly associated with intra-abdominal infections and abscesses."
      },
      {
        question: "Usually, pus from anaerobic infections is putrid, with a nauseating odour. An exception to this is infection with:",
        options: [
          { text: "Bacteroids fragilis", isCorrect: true },
          { text: "Prevotella", isCorrect: false },
          { text: "Porphyromonas", isCorrect: false },
          { text: "Fusobacterium", isCorrect: false }
        ],
        explanation: "Bacteroides fragilis infections typically do not produce foul-smelling pus, unlike other anaerobic infections. This is due to differences in metabolic end products compared to other anaerobes."
      },
      {
        question: "The predominant flora in the human GIT is anaerobic. The number of anaerobic bacteria in the colon is:",
        options: [
          { text: "10,000/g", isCorrect: false },
          { text: "105/g", isCorrect: false },
          { text: "107/g", isCorrect: false },
          { text: "1011/g", isCorrect: true }
        ],
        explanation: "The colon contains an extremely high density of bacteria, with anaerobes reaching concentrations of approximately 10^11 (100 billion) organisms per gram of feces. This is one of the highest concentrations of microbes found anywhere in nature."
      },
      {
        question: "Most enteric bacilli are motile. The one which is non-motile is:",
        options: [
          { text: "Salmonella", isCorrect: false },
          { text: "E. coli", isCorrect: false },
          { text: "Klebsiella", isCorrect: true },
          { text: "Proteus", isCorrect: false }
        ],
        explanation: "Klebsiella species are non-motile enteric bacilli. They lack flagella, which are the structures that provide motility to many other Enterobacteriaceae, such as Salmonella, E. coli, and Proteus."
      },
      {
        question: "The always pathogenic Enterobacteriaceae is:",
        options: [
          { text: "E. coli", isCorrect: false },
          { text: "Klebsiella", isCorrect: false },
          { text: "Shigella", isCorrect: true },
          { text: "Yersinia", isCorrect: false }
        ],
        explanation: "Shigella species are always considered pathogenic; they are not found as part of normal human flora. In contrast, E. coli and Klebsiella can be part of normal intestinal flora, and only certain strains or serotypes are pathogenic."
      },
      {
        question: "Serotyping or antigenic typing of E. coli is based on:",
        options: [
          { text: "Somatic antigen O", isCorrect: false },
          { text: "Flagellar antigen H", isCorrect: false },
          { text: "Capsular antigen K", isCorrect: false },
          { text: "All of these", isCorrect: true }
        ],
        explanation: "Serotyping of E. coli is based on all three antigens: the somatic O antigen (lipopolysaccharide), the flagellar H antigen, and the capsular K antigen. The combination of these antigens defines specific serotypes, which may be associated with particular virulence properties."
      },
      {
        question: "The following are TRUE about the somatic antigen (antigen O) of E. coli EXCEPT:",
        options: [
          { text: "It is a lipopolysaccharide", isCorrect: false },
          { text: "It is heat-stable", isCorrect: false },
          { text: "It is associated with virulence", isCorrect: false },
          { text: "'Early' groups are pathogenic", isCorrect: true }
        ],
        explanation: "The statement that 'Early' O groups are pathogenic is incorrect. Pathogenicity in E. coli is not determined by whether an O antigen was discovered early or late, but rather by specific serotypes associated with virulence factors. The O antigen is indeed a lipopolysaccharide, is heat-stable, and is associated with virulence."
      },
      {
        question: "The commonest culture media used for Leptospira is:",
        options: [
          { text: "Korthof's", isCorrect: false },
          { text: "Fletcher's", isCorrect: false },
          { text: "Stuart's", isCorrect: false },
          { text: "EMJH", isCorrect: true }
        ],
        explanation: "EMJH (Ellinghausen-McCullough-Johnson-Harris) medium is the most commonly used culture medium for Leptospira species. It contains long-chain fatty acids as a carbon source and bovine serum albumin to detoxify fatty acids."
      },
      {
        question: "Clostridium perfringens has the shape of a:",
        options: [
          { text: "Spindle", isCorrect: false },
          { text: "Club", isCorrect: true },
          { text: "Tennis racket", isCorrect: false },
          { text: "Drumstick", isCorrect: false }
        ],
        explanation: "Clostridium perfringens cells have a club-shaped appearance, with a wider end where the spore may form. This distinguishes it from other Clostridium species, which may have different characteristic shapes."
      },
      {
        question: "Epidemic relapsing fever is caused by:",
        options: [
          { text: "Borrelia recurrentis", isCorrect: true },
          { text: "B. burgdorferi", isCorrect: false },
          { text: "B. duttonii", isCorrect: false },
          { text: "B. vincentii", isCorrect: false }
        ],
        explanation: "Borrelia recurrentis is the causative agent of epidemic (louse-borne) relapsing fever. It is transmitted by the body louse Pediculus humanus corporis and has historically caused large outbreaks in crowded conditions with poor hygiene."
      },
      {
        question: "The vector for endemic relapsing fever is:",
        options: [
          { text: "Pediculus humanus corporis", isCorrect: false },
          { text: "Pediculus humanus capitus", isCorrect: false },
          { text: "Ornithodoros ticks", isCorrect: true },
          { text: "Ixodes ticks", isCorrect: false }
        ],
        explanation: "Endemic (tick-borne) relapsing fever is transmitted by soft-bodied ticks of the genus Ornithodoros. Different Borrelia species cause endemic relapsing fever in different geographical regions, each associated with a specific Ornithodoros tick species."
      },
      {
        question: "Migrating skin lesions in Lyme's disease are called:",
        options: [
          { text: "Erythema marginatum", isCorrect: false },
          { text: "Erythema migrans", isCorrect: true },
          { text: "Erythema nodosum", isCorrect: false },
          { text: "Erythema toxicum", isCorrect: false }
        ],
        explanation: "Erythema migrans is the characteristic skin lesion of early Lyme disease. It appears as an expanding red ring-like or bull's-eye pattern at the site of the tick bite, often with central clearing."
      },
      {
        question: "Motility of borreliae is described as:",
        options: [
          { text: "Darting", isCorrect: false },
          { text: "Tumbling", isCorrect: false },
          { text: "Lashing", isCorrect: true },
          { text: "Twitching", isCorrect: false }
        ],
        explanation: "Borreliae exhibit a characteristic lashing motility due to their axial filaments (endoflagella). This can be observed under dark-field or phase-contrast microscopy and helps in their identification."
      },
      {
        question: "Bannwarth syndrome is seen in association with:",
        options: [
          { text: "Lyme disease", isCorrect: true },
          { text: "Weil's disease", isCorrect: false },
          { text: "Endemic relapsing fever", isCorrect: false },
          { text: "Epidemic relapsing fever", isCorrect: false }
        ],
        explanation: "Bannwarth syndrome (lymphocytic meningoradiculitis) is a neurological manifestation of Lyme disease in the early disseminated phase. It is characterized by painful radiculopathy, cranial nerve palsies (especially facial palsy), and lymphocytic pleocytosis in cerebrospinal fluid."
      },
      {
        question: "Bifidobacterium is a:",
        options: [
          { text: "Prebiotic", isCorrect: false },
          { text: "Probiotic", isCorrect: true },
          { text: "Parabiotic", isCorrect: false },
          { text: "Postbiotic", isCorrect: false }
        ],
        explanation: "Bifidobacterium is a genus of probiotic bacteria. These gram-positive, non-motile, often branched anaerobic bacteria are natural inhabitants of the gastrointestinal tract and are commonly used in probiotic supplements and fermented dairy products."
      },
      {
        question: "Which of the following samples for bacterial culture MUST be collected in a sterile container?",
        options: [
          { text: "Stool", isCorrect: false },
          { text: "Rectal swab", isCorrect: false },
          { text: "Pleural fluid", isCorrect: true },
          { text: "All of the above", isCorrect: false }
        ],
        explanation: "Pleural fluid must be collected in a sterile container because it comes from a normally sterile site. Any bacteria isolated from pleural fluid are likely to be significant pathogens. Stool and rectal swabs are not from sterile sites and do not require the same level of sterility in collection."
      },
      {
        question: "A lumbar puncture was performed at night in a patient suspected of having acute pyogenic meningitis. The CSF sample for culture will have to wait till morning when the lab opens. Where should the sample be stored overnight for best results?",
        options: [
          { text: "In the freezer", isCorrect: false },
          { text: "In the fridge", isCorrect: false },
          { text: "At -20°C", isCorrect: false },
          { text: "In an incubator at 37°C", isCorrect: true }
        ],
        explanation: "For suspected acute pyogenic meningitis, the CSF sample should be kept at 37°C (in an incubator) if processing is delayed. This maintains the viability of fastidious organisms like Neisseria meningitidis and Streptococcus pneumoniae, which may not survive refrigeration or freezing."
      },
      {
        question: "A blood sample was collected from a patient admitted in the fever ward for the NS1 and IgM dengue test. However, when the specimen arrived in the microbiology lab, it was found that the patient's complete residential address and contact number were not mentioned in the requisition slip. This pertains to an error in the:",
        options: [
          { text: "Pre-analytical phase", isCorrect: true },
          { text: "Analytical phase", isCorrect: false },
          { text: "Post-analytical phase", isCorrect: false },
          { text: "None of the above", isCorrect: false }
        ],
        explanation: "Incomplete patient information on the requisition form is an error in the pre-analytical phase of laboratory testing. The pre-analytical phase includes all steps from test ordering to sample processing, before the actual analysis begins."
      },
      {
        question: "HEPA refers to:",
        options: [
          { text: "Highly effective particulate air", isCorrect: false },
          { text: "High efficiency particulate air", isCorrect: true },
          { text: "Highly effective partition air", isCorrect: false },
          { text: "High efficiency part aircycle", isCorrect: false }
        ],
        explanation: "HEPA stands for High Efficiency Particulate Air. HEPA filters are used in biological safety cabinets, clean rooms, and other applications requiring high-level air filtration to remove particles, including microorganisms, from the air."
      },
      {
        question: "Which of the following is false regarding sample collection from a patient?",
        options: [
          { text: "Informed consent must be taken before sample collection", isCorrect: false },
          { text: "Material with due consent must be used for what it is intended, and not for any other purpose", isCorrect: true },
          { text: "Results can be shared with family members", isCorrect: false },
          { text: "Patient privacy must be ensured while collecting samples", isCorrect: false }
        ],
        explanation: "The statement 'Material with due consent must be used for what it is intended, and not for any other purpose' is not entirely true. With proper ethical approval and consent, samples may sometimes be used for research or quality assurance purposes beyond the initial clinical testing."
      },
      {
        question: "The vector for epidemic typhus is:",
        options: [
          { text: "Rat flea", isCorrect: false },
          { text: "Mite", isCorrect: false },
          { text: "Louse", isCorrect: true },
          { text: "Tick", isCorrect: false }
        ],
        explanation: "Epidemic typhus (caused by Rickettsia prowazekii) is transmitted by the human body louse, Pediculus humanus corporis. It has historically caused large outbreaks in crowded conditions with poor hygiene, such as during wars and famines."
      },
      {
        question: "Which of the following is FALSE about rickettsiae:",
        options: [
          { text: "Do not possess peptidoglycan cell wall", isCorrect: true },
          { text: "Have metabolic enzymes", isCorrect: false },
          { text: "Reproduce by binary fission", isCorrect: false },
          { text: "Possess both RNA and DNA", isCorrect: false }
        ],
        explanation: "The statement 'Rickettsiae do not possess peptidoglycan cell wall' is false. Rickettsiae do have a peptidoglycan cell wall similar to gram-negative bacteria, though it is often thin. They have metabolic enzymes, reproduce by binary fission, and possess both RNA and DNA, like other bacteria."
      },
      {
        question: "Disease that does NOT occur in the typhus fever group is:",
        options: [
          { text: "Epidemic typhus", isCorrect: false },
          { text: "Endemic typhus", isCorrect: false },
          { text: "Q fever", isCorrect: true },
          { text: "Brill-Zinser disease", isCorrect: false }
        ],
        explanation: "Q fever, caused by Coxiella burnetii, is not classified in the typhus group of rickettsial diseases. It belongs to the spotted fever group. Epidemic typhus, endemic (murine) typhus, and Brill-Zinser disease (recrudescent epidemic typhus) are all part of the typhus group."
      },
      {
        question: "Griffith typing of streptococci is based on:",
        options: [
          { text: "Carbohydrate C antigen", isCorrect: false },
          { text: "M proteins", isCorrect: true },
          { text: "Hemolysis on blood agar", isCorrect: false },
          { text: "Oxygen requirement during culture", isCorrect: false }
        ],
        explanation: "Griffith typing of streptococci is based on the M protein antigen. The M protein is a major virulence factor of Streptococcus pyogenes (Group A Streptococcus) and serves as the basis for the serological classification system developed by Rebecca Lancefield."
      },
      {
        question: "Which of the following is NOT a gram-positive bacillus?",
        options: [
          { text: "Staphylococcus", isCorrect: true },
          { text: "Corynebacterium", isCorrect: false },
          { text: "Bacillus", isCorrect: false },
          { text: "Clostridium", isCorrect: false }
        ],
        explanation: "Staphylococcus is not a gram-positive bacillus; it is a gram-positive coccus that typically appears in grape-like clusters. Corynebacterium, Bacillus, and Clostridium are all gram-positive bacilli (rod-shaped bacteria)."
      }
    ]
  };

  // History and scope of microbiology content
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
                    <AccordionItem value="chapter1">
                      <AccordionTrigger className="hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-lg px-4">
                        <div className="flex items-center space-x-3">
                          <TestTube className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <h4 className="text-lg font-medium">{microbiologyMcqs.name}</h4>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pt-4">
                        <div className="space-y-8">
                          {microbiologyMcqs.questions.map((question, qIndex) => (
                            <div key={qIndex} className="bg-white dark:bg-gray-900 shadow-sm border dark:border-gray-800 rounded-lg p-6">
                              <div className="space-y-6">
                                <h3 className="text-lg font-medium leading-relaxed break-words">
                                  {qIndex + 1}. {question.question}
                                </h3>
                                
                                <div className="space-y-3">
                                  {question.options.map((option, oIndex) => (
                                    <div 
                                      key={oIndex} 
                                      className={`flex items-start space-x-3 p-3 rounded-md cursor-pointer
                                        ${selectedAnswers[`1_${qIndex}`] === oIndex ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}
                                        ${showResults[`1_${qIndex}`] && option.isCorrect ? 'bg-green-50 dark:bg-green-900/20' : ''}
                                        ${showResults[`1_${qIndex}`] && selectedAnswers[`1_${qIndex}`] === oIndex && !option.isCorrect ? 'bg-red-50 dark:bg-red-900/20' : ''}
                                      `}
                                      onClick={() => !showResults[`1_${qIndex}`] && handleSelectOption(`1_${qIndex}`, oIndex)}
                                    >
                                      <div className="flex h-6 w-6 min-w-6 mt-0.5">
                                        {showResults[`1_${qIndex}`] ? (
                                          option.isCorrect ? (
                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                          ) : selectedAnswers[`1_${qIndex}`] === oIndex ? (
                                            <XCircle className="h-5 w-5 text-red-500" />
                                          ) : (
                                            <div className="h-5 w-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                                          )
                                        ) : (
                                          <Checkbox 
                                            checked={selectedAnswers[`1_${qIndex}`] === oIndex}
                                            className="rounded-full"
                                            onCheckedChange={() => handleSelectOption(`1_${qIndex}`, oIndex)}
                                          />
                                        )}
                                      </div>
                                      <div className="text-base break-words leading-relaxed">{option.text}</div>
                                    </div>
                                  ))}
                                </div>
                                
                                {showResults[`1_${qIndex}`] && question.explanation && (
                                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                                    <h4 className="font-medium mb-2">Explanation:</h4>
                                    <p className="break-words leading-relaxed">{question.explanation}</p>
                                  </div>
                                )}
                                
                                <div className="flex space-x-4 pt-2">
                                  {!showResults[`1_${qIndex}`] ? (
                                    <Button 
                                      onClick={() => handleCheckAnswer(`1_${qIndex}`)}
                                      disabled={selectedAnswers[`1_${qIndex}`] === undefined}
                                      className="bg-blue-600 hover:bg-blue-700"
                                    >
                                      Check Answer
                                    </Button>
                                  ) : (
                                    <Button 
                                      onClick={() => handleReset(`1_${qIndex}`)}
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
                                <h3 className="text-lg font-medium leading-relaxed break-words">
                                  {qIndex + 1}. {question.question}
                                </h3>
                                
                                <div className="space-y-3">
                                  {question.options.map((option, oIndex) => (
                                    <div 
                                      key={oIndex} 
                                      className={`flex items-start space-x-3 p-3 rounded-md cursor-pointer
                                        ${selectedAnswers[`2_${qIndex}`] === oIndex ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}
                                        ${showResults[`2_${qIndex}`] && option.isCorrect ? 'bg-green-50 dark:bg-green-900/20' : ''}
                                        ${showResults[`2_${qIndex}`] && selectedAnswers[`2_${qIndex}`] === oIndex && !option.isCorrect ? 'bg-red-50 dark:bg-red-900/20' : ''}
                                      `}
                                      onClick={() => !showResults[`2_${qIndex}`] && handleSelectOption(`2_${qIndex}`, oIndex)}
                                    >
                                      <div className="flex h-6 w-6 min-w-6 mt-0.5">
                                        {showResults[`2_${qIndex}`] ? (
                                          option.isCorrect ? (
                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                          ) : selectedAnswers[`2_${qIndex}`] === oIndex ? (
                                            <XCircle className="h-5 w-5 text-red-500" />
                                          ) : (
                                            <div className="h-5 w-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                                          )
                                        ) : (
                                          <Checkbox 
                                            checked={selectedAnswers[`2_${qIndex}`] === oIndex}
                                            className="rounded-full"
                                            onCheckedChange={() => handleSelectOption(`2_${qIndex}`, oIndex)}
                                          />
                                        )}
                                      </div>
                                      <div className="text-base break-words leading-relaxed">{option.text}</div>
                                    </div>
                                  ))}
                                </div>
                                
                                {showResults[`2_${qIndex}`] && question.explanation && (
                                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                                    <h4 className="font-medium mb-2">Explanation:</h4>
                                    <p className="break-words leading-relaxed">{question.explanation}</p>
                                  </div>
                                )}
                                
                                <div className="flex space-x-4 pt-2">
                                  {!showResults[`2_${qIndex}`] ? (
                                    <Button 
                                      onClick={() => handleCheckAnswer(`2_${qIndex}`)}
                                      disabled={selectedAnswers[`2_${qIndex}`] === undefined}
                                      className="bg-blue-600 hover:bg-blue-700"
                                    >
                                      Check Answer
                                    </Button>
                                  ) : (
                                    <Button 
                                      onClick={() => handleReset(`2_${qIndex}`)}
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

                    <AccordionItem value="chapter3">
                      <AccordionTrigger className="hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-lg px-4">
                        <div className="flex items-center space-x-3">
                          <TestTube className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <h4 className="text-lg font-medium">{systematicBacteriologyMcqs.name}</h4>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pt-4">
                        <div className="space-y-8">
                          {systematicBacteriologyMcqs.questions.map((question, qIndex) => (
                            <div key={qIndex} className="bg-white dark:bg-gray-900 shadow-sm border dark:border-gray-800 rounded-lg p-6">
                              <div className="space-y-6">
                                <h3 className="text-lg font-medium leading-relaxed break-words">
                                  {qIndex + 1}. {question.question}
                                </h3>
                                
                                <div className="space-y-3">
                                  {question.options.map((option, oIndex) => (
                                    <div 
                                      key={oIndex} 
                                      className={`flex items-start space-x-3 p-3 rounded-md cursor-pointer
                                        ${selectedAnswers[`3_${qIndex}`] === oIndex ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}
                                        ${showResults[`3_${qIndex}`] && option.isCorrect ? 'bg-green-50 dark:bg-green-900/20' : ''}
                                        ${showResults[`3_${qIndex}`] && selectedAnswers[`3_${qIndex}`] === oIndex && !option.isCorrect ? 'bg-red-50 dark:bg-red-900/20' : ''}
                                      `}
                                      onClick={() => !showResults[`3_${qIndex}`] && handleSelectOption(`3_${qIndex}`, oIndex)}
                                    >
                                      <div className="flex h-6 w-6 min-w-6 mt-0.5">
                                        {showResults[`3_${qIndex}`] ? (
                                          option.isCorrect ? (
                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                          ) : selectedAnswers[`3_${qIndex}`] === oIndex ? (
                                            <XCircle className="h-5 w-5 text-red-500" />
                                          ) : (
                                            <div className="h-5 w-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                                          )
                                        ) : (
                                          <Checkbox 
                                            checked={selectedAnswers[`3_${qIndex}`] === oIndex}
                                            className="rounded-full"
                                            onCheckedChange={() => handleSelectOption(`3_${qIndex}`, oIndex)}
                                          />
                                        )}
                                      </div>
                                      <div className="text-base break-words leading-relaxed">{option.text}</div>
                                    </div>
                                  ))}
                                </div>
                                
                                {showResults[`3_${qIndex}`] && question.explanation && (
                                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                                    <h4 className="font-medium mb-2">Explanation:</h4>
                                    <p className="break-words leading-relaxed">{question.explanation}</p>
                                  </div>
                                )}
                                
                                <div className="flex space-x-4 pt-2">
                                  {!showResults[`3_${qIndex}`] ? (
                                    <Button 
                                      onClick={() => handleCheckAnswer(`3_${qIndex}`)}
                                      disabled={selectedAnswers[`3_${qIndex}`] === undefined}
                                      className="bg-blue-600 hover:bg-blue-700"
                                    >
                                      Check Answer
                                    </Button>
                                  ) : (
                                    <Button 
                                      onClick={() => handleReset(`3_${qIndex}`)}
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

