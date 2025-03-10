
import { microbiologyPaper1Data } from './microbiology/paper1';
import { microbiologyPaper2Data } from './microbiology/paper2';

// Define the MCQ questions for Chapter 3: Systematic bacteriology
const systematicBacteriologyMcqs = {
  name: "Chapter 3: Systematic bacteriology",
  questions: [
    {
      question: "Phenotypic classification refers to classification based on:",
      options: [
        { text: "Direct analysis of genes in microbes", isCorrect: false },
        { text: "Chromosomal and extrachromosomal DNA analysis of microbes.", isCorrect: false },
        { text: "Expressed characteristics of microorganisms.", isCorrect: true },
        { text: "Nucleotide sequencing of microbes", isCorrect: false }
      ]
    },
    {
      question: "Incubation period refers to the time duration",
      options: [
        { text: "Between entry of pathogen and exit of pathogen in body", isCorrect: false },
        { text: "Between entry of pathogen in vector and entry in host", isCorrect: false },
        { text: "Between entry of pathogen and manifestation of symptoms or signs in host", isCorrect: true },
        { text: "Between entry of pathogen and its detection in host", isCorrect: false }
      ]
    },
    {
      question: "Which of the following is not a gram-positive coccus?",
      options: [
        { text: "Pneumococcus", isCorrect: false },
        { text: "Meningococcus", isCorrect: true },
        { text: "Enterococcus", isCorrect: false },
        { text: "Staphylococcus", isCorrect: false }
      ]
    },
    {
      question: "Normal microbial flora are also called:",
      options: [
        { text: "Resident flora", isCorrect: false },
        { text: "Commensal flora", isCorrect: false },
        { text: "Transient flora", isCorrect: false },
        { text: "All of these", isCorrect: true }
      ]
    },
    {
      question: "All the following are constituents of normal flora EXCEPT:",
      options: [
        { text: "Gram-positive bacteria", isCorrect: false },
        { text: "Gram-negative bacteria", isCorrect: false },
        { text: "Yeast", isCorrect: true },
        { text: "Viruses", isCorrect: false }
      ]
    },
    {
      question: "The major components of the intestinal flora constitute:",
      options: [
        { text: "Coliform bacteria", isCorrect: false },
        { text: "Clostridium species", isCorrect: true },
        { text: "Yeast", isCorrect: false },
        { text: "Enterococcus species", isCorrect: false }
      ]
    },
    {
      question: "Sterile body sites include all the following EXCEPT:",
      options: [
        { text: "CNS", isCorrect: false },
        { text: "Nasopharynx", isCorrect: true },
        { text: "Lungs", isCorrect: false },
        { text: "Liver", isCorrect: false }
      ]
    },
    {
      question: "Normal flora of skin includes all the following EXCEPT:",
      options: [
        { text: "α-streptococci", isCorrect: false },
        { text: "Staphylococci", isCorrect: false },
        { text: "Candida", isCorrect: false },
        { text: "Lactobacilli", isCorrect: true }
      ]
    },
    {
      question: "The relationship between a host and the normal flora wherein both co-exist is called:",
      options: [
        { text: "Symbiosis", isCorrect: true },
        { text: "Commensalism", isCorrect: false },
        { text: "Parasitism", isCorrect: false },
        { text: "Opportunistic infection", isCorrect: false }
      ]
    },
    {
      question: "Normal flora in the human body, when administered in adequate amounts, confer a health benefit to the host. These organisms are known as:",
      options: [
        { text: "Probiotics", isCorrect: true },
        { text: "Gnotobiotic", isCorrect: false },
        { text: "Symbiotics", isCorrect: false },
        { text: "Prebiotics", isCorrect: false }
      ]
    },
    {
      question: "Most common probiotics include:",
      options: [
        { text: "Fusobacterium and Lactobacillus", isCorrect: false },
        { text: "Bacteroides and Fusobacterium", isCorrect: false },
        { text: "Lactobacillus and Bifidobacterium", isCorrect: true },
        { text: "Bifidobacterium and Propionibacterium", isCorrect: false }
      ]
    },
    {
      question: "Disturbance to the normal flora can be caused by:",
      options: [
        { text: "Prolonged antibiotic therapy", isCorrect: false },
        { text: "Alternation of pH in the mucosa", isCorrect: false },
        { text: "Immunosuppressive therapy", isCorrect: false },
        { text: "All of these", isCorrect: true }
      ]
    },
    {
      question: "Which of the following statements is NOT TRUE?",
      options: [
        { text: "Normal flora cause confusion in the laboratory diagnosis", isCorrect: false },
        { text: "Clindamycin administration helps in the multiplication of normal flora", isCorrect: true },
        { text: "Probiotics are used in treating antibiotic-associated colitis", isCorrect: false },
        { text: "Fecal transplantation is attempted for irritable bowel syndrome", isCorrect: false }
      ]
    },
    {
      question: "Microorganisms that fail to grow in the presence of as low as 0.03% O2 are called:",
      options: [
        { text: "Aerotolerant", isCorrect: false },
        { text: "Obligate anaerobes", isCorrect: true },
        { text: "Facultative anaerobes", isCorrect: false },
        { text: "Facultative aerobes", isCorrect: false }
      ]
    },
    {
      question: "The FALSE statement about anaerobic cocci is:",
      options: [
        { text: "They are always pathogenic", isCorrect: true },
        { text: "They are generally sensitive to penicillin", isCorrect: false },
        { text: "They are normal inhabitants of the vagina, intestine and mouth", isCorrect: false },
        { text: "They occur as cocci in pairs, groups and chains", isCorrect: false }
      ]
    },
    {
      question: "The most commonly isolated anaerobe from clinical specimens is:",
      options: [
        { text: "Fusobacterium", isCorrect: false },
        { text: "Lactobacillus", isCorrect: false },
        { text: "Bacteroides", isCorrect: true },
        { text: "Prevotella", isCorrect: false }
      ]
    },
    {
      question: "Usually, pus from anaerobic infections is putrid, with a nauseating odour. An exception to this is infection with:",
      options: [
        { text: "Bacteroids fragilis", isCorrect: true },
        { text: "Prevotella", isCorrect: false },
        { text: "Porphyromonas", isCorrect: false },
        { text: "Fusobacterium", isCorrect: false }
      ]
    },
    {
      question: "The predominant flora in the human GIT is anaerobic. The number of anaerobic bacteria in the colon is:",
      options: [
        { text: "10,000/g", isCorrect: false },
        { text: "105/g", isCorrect: false },
        { text: "107/g", isCorrect: false },
        { text: "1011/g", isCorrect: true }
      ]
    },
    {
      question: "Most enteric bacilli are motile. The one which is non-motile is:",
      options: [
        { text: "Salmonella", isCorrect: false },
        { text: "E. coli", isCorrect: false },
        { text: "Klebsiella", isCorrect: true },
        { text: "Proteus", isCorrect: false }
      ]
    },
    {
      question: "The always pathogenic Enterobacteriaceae is:",
      options: [
        { text: "E. coli", isCorrect: false },
        { text: "Klebsiella", isCorrect: false },
        { text: "Shigella", isCorrect: true },
        { text: "Yersinia", isCorrect: false }
      ]
    },
    {
      question: "Serotyping or antigenic typing of E. coli is based on:",
      options: [
        { text: "Somatic antigen O", isCorrect: false },
        { text: "Flagellar antigen H", isCorrect: false },
        { text: "Capsular antigen K", isCorrect: false },
        { text: "All of these", isCorrect: true }
      ]
    },
    {
      question: "The following are TRUE about the somatic antigen (antigen O) of E. coli EXCEPT:",
      options: [
        { text: "It is a lipopolysaccharide", isCorrect: false },
        { text: "It is heat-stable", isCorrect: false },
        { text: "It is associated with virulence", isCorrect: false },
        { text: "'Early' groups are pathogenic", isCorrect: true }
      ]
    },
    {
      question: "The commonest culture media used for Leptospira is:",
      options: [
        { text: "Korthof's", isCorrect: false },
        { text: "Fletcher's", isCorrect: false },
        { text: "Stuart's", isCorrect: false },
        { text: "EMJH", isCorrect: true }
      ]
    },
    {
      question: "Clostridium perfringens has the shape of a:",
      options: [
        { text: "Spindle", isCorrect: false },
        { text: "Club", isCorrect: true },
        { text: "Tennis racket", isCorrect: false },
        { text: "Drumstick", isCorrect: false }
      ]
    },
    {
      question: "Epidemic relapsing fever is caused by:",
      options: [
        { text: "Borrelia recurrentis", isCorrect: true },
        { text: "B. burgdorferi", isCorrect: false },
        { text: "B. duttonii", isCorrect: false },
        { text: "B. vincentii", isCorrect: false }
      ]
    },
    {
      question: "The vector for endemic relapsing fever is:",
      options: [
        { text: "Pediculus humanus corporis", isCorrect: false },
        { text: "Pediculus humanus capitus", isCorrect: false },
        { text: "Ornithodoros ticks", isCorrect: true },
        { text: "Ixodes ticks", isCorrect: false }
      ]
    },
    {
      question: "Migrating skin lesions in Lyme's disease are called:",
      options: [
        { text: "Erythema marginatum", isCorrect: false },
        { text: "Erythema migrans", isCorrect: true },
        { text: "Erythema nodosum", isCorrect: false },
        { text: "Erythema toxicum", isCorrect: false }
      ]
    },
    {
      question: "Motility of borreliae is described as:",
      options: [
        { text: "Darting", isCorrect: false },
        { text: "Tumbling", isCorrect: false },
        { text: "Lashing", isCorrect: true },
        { text: "Twitching", isCorrect: false }
      ]
    },
    {
      question: "Bannwarth syndrome is seen in association with:",
      options: [
        { text: "Lyme disease", isCorrect: true },
        { text: "Weil's disease", isCorrect: false },
        { text: "Endemic relapsing fever", isCorrect: false },
        { text: "Epidemic relapsing fever", isCorrect: false }
      ]
    },
    {
      question: "Bifidobacterium is a:",
      options: [
        { text: "Prebiotic", isCorrect: false },
        { text: "Probiotic", isCorrect: true },
        { text: "Parabiotic", isCorrect: false },
        { text: "Postbiotic", isCorrect: false }
      ]
    },
    {
      question: "Which of the following samples for bacterial culture MUST be collected in a sterile container?",
      options: [
        { text: "Stool", isCorrect: false },
        { text: "Rectal swab", isCorrect: false },
        { text: "Pleural fluid", isCorrect: true },
        { text: "All of the above", isCorrect: false }
      ]
    },
    {
      question: "A lumbar puncture was performed at night in a patient suspected of having acute pyogenic meningitis. The CSF sample for culture will have to wait till morning when the lab opens. Where should the sample be stored overnight for best results?",
      options: [
        { text: "In the freezer", isCorrect: false },
        { text: "In the fridge", isCorrect: false },
        { text: "At -20°C", isCorrect: false },
        { text: "In an incubator at 37°C", isCorrect: true }
      ]
    },
    {
      question: "A blood sample was collected from a patient admitted in the fever ward for the NS1 and IgM dengue test. However, when the specimen arrived in the microbiology lab, it was found that the patient's complete residential address and contact number were not mentioned in the requisition slip. This pertains to an error in the:",
      options: [
        { text: "Pre-analytical phase", isCorrect: true },
        { text: "Analytical phase", isCorrect: false },
        { text: "Post-analytical phase", isCorrect: false },
        { text: "None of the above", isCorrect: false }
      ]
    },
    {
      question: "HEPA refers to",
      options: [
        { text: "Highly effective particulate air", isCorrect: false },
        { text: "High efficiency particulate air", isCorrect: true },
        { text: "Highly effective partition air", isCorrect: false },
        { text: "High efficiency part aircycle", isCorrect: false }
      ]
    },
    {
      question: "Which of the following is false regarding sample collection from a patient?",
      options: [
        { text: "Informed consent must be taken before sample collection", isCorrect: false },
        { text: "Material with due consent must be used for what it is intended, and not for any other purpose", isCorrect: false },
        { text: "Results can be shared with family members", isCorrect: true },
        { text: "Patient privacy must be ensured while collecting samples", isCorrect: false }
      ]
    },
    {
      question: "The vector for epidemic typhus is",
      options: [
        { text: "Rat flea", isCorrect: false },
        { text: "Mite", isCorrect: false },
        { text: "Louse", isCorrect: true },
        { text: "Tick", isCorrect: false }
      ]
    },
    {
      question: "Which of the following is FALSE about rickettsiae:",
      options: [
        { text: "Do not possess peptidoglycan cell wall", isCorrect: true },
        { text: "Have metabolic enzymes", isCorrect: false },
        { text: "Reproduce by binary fission", isCorrect: false },
        { text: "Possess both RNA and DNA", isCorrect: false }
      ]
    },
    {
      question: "Disease that does NOT occur in the typhus fever group is:",
      options: [
        { text: "Epidemic typhus", isCorrect: false },
        { text: "Endemic typhus", isCorrect: false },
        { text: "Q fever", isCorrect: true },
        { text: "Brill-Zinser disease", isCorrect: false }
      ]
    },
    {
      question: "Griffith typing of streptococci is based on:",
      options: [
        { text: "Carbohydrate C antigen", isCorrect: false },
        { text: "M proteins", isCorrect: true },
        { text: "Hemolysis on blood agar", isCorrect: false },
        { text: "Oxygen requirement during culture", isCorrect: false }
      ]
    },
    {
      question: "Which of the following is NOT a gram-positive bacillus?",
      options: [
        { text: "Staphylococcus", isCorrect: true },
        { text: "Corynebacterium", isCorrect: false },
        { text: "Bacillus", isCorrect: false },
        { text: "Clostridium", isCorrect: false }
      ]
    }
  ]
};

// Define the MCQ questions for Chapter 4: Basic concepts of bacteriology
const basicBacteriologyConceptsMcqs = {
  name: "Chapter 4: Basic concepts of bacteriology",
  questions: [
    {
      question: "Prolonged storage of viruses can be done by:",
      options: [
        { text: "Storage at -70°C", isCorrect: false },
        { text: "Freeze-drying", isCorrect: false },
        { text: "Lyophilisation", isCorrect: false },
        { text: "Both (b) and (c)", isCorrect: true }
      ]
    },
    {
      question: "The following virus CANNOT withstand freeze-drying:",
      options: [
        { text: "Varicella", isCorrect: false },
        { text: "Rabies virus", isCorrect: false },
        { text: "Poliovirus", isCorrect: true },
        { text: "CMV", isCorrect: false }
      ]
    },
    {
      question: "Viruses are inactivated by:",
      options: [
        { text: "Chlorination", isCorrect: false },
        { text: "Acidic pH", isCorrect: false },
        { text: "Ionising radiation", isCorrect: true },
        { text: "Organic iodine compounds", isCorrect: false }
      ]
    },
    {
      question: "Which of the following is a receptor-destroying enzyme?",
      options: [
        { text: "Neuraminidase", isCorrect: true },
        { text: "Transcriptase c", isCorrect: false },
        { text: "Reverse transcriptase", isCorrect: false },
        { text: "Hemagglutinin", isCorrect: false }
      ]
    },
    {
      question: "Elution is the characteristic feature of which one of the following virus groups?",
      options: [
        { text: "Poliovirus", isCorrect: false },
        { text: "Arbovirus", isCorrect: false },
        { text: "Myxovirus", isCorrect: true },
        { text: "Poxvirus", isCorrect: false }
      ]
    },
    {
      question: "The von Magnus phenomenon refers to:",
      options: [
        { text: "Incomplete virus assembly", isCorrect: true },
        { text: "Eclipse phase", isCorrect: false },
        { text: "Elution", isCorrect: false },
        { text: "Abortive infection", isCorrect: false }
      ]
    },
    {
      question: "Pock-forming viruses belong to which of the following groups?",
      options: [
        { text: "Influenza", isCorrect: false },
        { text: "Vaccinia", isCorrect: true },
        { text: "Yellow fever", isCorrect: false },
        { text: "Paramyxo", isCorrect: false }
      ]
    },
    {
      question: "Cytoplasmic vacuolation is the characteristic feature of:",
      options: [
        { text: "Herpes virus", isCorrect: false },
        { text: "SV40 virus", isCorrect: true },
        { text: "Influenza virus", isCorrect: false },
        { text: "Parainfluenza virus", isCorrect: false }
      ]
    },
    {
      question: "Hemadsorption test uses RBCs of:",
      options: [
        { text: "Sheep", isCorrect: false },
        { text: "Mouse", isCorrect: false },
        { text: "Guinea pig", isCorrect: true },
        { text: "Hamster", isCorrect: false }
      ]
    },
    {
      question: "RBCs used for the estimation of viral hemagglutination titre are taken from:",
      options: [
        { text: "Chicken", isCorrect: true },
        { text: "Sheep", isCorrect: false },
        { text: "Rabbits", isCorrect: false },
        { text: "Male mice", isCorrect: false }
      ]
    },
    {
      question: "When the genome of a virus is covered by the entire capsid of the other virus it is called:",
      options: [
        { text: "Stable variation", isCorrect: false },
        { text: "Transcapsidation", isCorrect: true },
        { text: "Complementation", isCorrect: false },
        { text: "Interference", isCorrect: false }
      ]
    },
    {
      question: "Which of the following is a single-stranded DNA virus?",
      options: [
        { text: "Pox", isCorrect: false },
        { text: "Papova", isCorrect: false },
        { text: "Paramyxo", isCorrect: false },
        { text: "Parvo", isCorrect: true }
      ]
    },
    {
      question: "Which of the following groups of viruses belongs to the Picornaviridae family?",
      options: [
        { text: "HAV, Polio, Echo", isCorrect: true },
        { text: "Denso, Polio, Rhino", isCorrect: false },
        { text: "Rhino, Nairo, Lassa", isCorrect: false },
        { text: "Rubi, Coxsackie, Echo", isCorrect: false }
      ]
    },
    {
      question: "The process of viral uncoating is favoured by:",
      options: [
        { text: "RDE enzyme", isCorrect: false },
        { text: "Neuraminidase", isCorrect: false },
        { text: "Transcriptase", isCorrect: false },
        { text: "Lysosomes", isCorrect: true }
      ]
    },
    {
      question: "Which of the following is FALSE regarding inclusion bodies?",
      options: [
        { text: "They are crystalline aggregates of virions", isCorrect: false },
        { text: "They represent degenerative changes produced by viral infections", isCorrect: false },
        { text: "They can be demonstrated under an electron microscope", isCorrect: true },
        { text: "They can be acidophilic or basophilic", isCorrect: false }
      ]
    },
    {
      question: "Bollinger bodies are associated with which of the following diseases?",
      options: [
        { text: "Fowl pox", isCorrect: true },
        { text: "Rabies", isCorrect: false },
        { text: "Polio", isCorrect: false },
        { text: "Measles", isCorrect: false }
      ]
    },
    {
      question: "Which of the following inclusion bodies is intracytoplasmic?",
      options: [
        { text: "Bollinger", isCorrect: false },
        { text: "Negri", isCorrect: true },
        { text: "Cowdry type A", isCorrect: false },
        { text: "Cowdry type B", isCorrect: false }
      ]
    },
    {
      question: "Guarnieri bodies are seen in which viral infection?",
      options: [
        { text: "Rabies", isCorrect: false },
        { text: "Polio", isCorrect: false },
        { text: "Vaccinia", isCorrect: true },
        { text: "Herpes", isCorrect: false }
      ]
    },
    {
      question: "Which of the following viruses is inactivated by gastric pH?",
      options: [
        { text: "Poliovirus", isCorrect: false },
        { text: "Hepatitis virus", isCorrect: false },
        { text: "Rotavirus", isCorrect: false },
        { text: "Rhinovirus", isCorrect: true }
      ]
    },
    {
      question: "Enveloped viruses are inactivated by:",
      options: [
        { text: "Gastric pH", isCorrect: false },
        { text: "Bile", isCorrect: true },
        { text: "Saliva", isCorrect: false },
        { text: "Tears", isCorrect: false }
      ]
    },
    {
      question: "The mode of infection in murine mammary tumour virus is:",
      options: [
        { text: "Congenital", isCorrect: false },
        { text: "Sexual", isCorrect: false },
        { text: "Insect bite", isCorrect: false },
        { text: "Breast milk", isCorrect: true }
      ]
    },
    {
      question: "The common route of entry for all the following viruses is through the alimentary tract EXCEPT in:",
      options: [
        { text: "Adenoviruses", isCorrect: false },
        { text: "Reoviruses", isCorrect: false },
        { text: "Hepatitis C virus", isCorrect: true },
        { text: "Poliovirus", isCorrect: false }
      ]
    },
    {
      question: "The important initial response of a human body to a viral infection is:",
      options: [
        { text: "B cell stimulation", isCorrect: false },
        { text: "Antibody production", isCorrect: false },
        { text: "Interferon production", isCorrect: true },
        { text: "T cell stimulation", isCorrect: false }
      ]
    },
    {
      question: "Seller's stain is used for the demonstration of which of the following viruses?",
      options: [
        { text: "CMV", isCorrect: false },
        { text: "Rabies virus", isCorrect: true },
        { text: "Measles virus", isCorrect: false },
        { text: "Herpes virus", isCorrect: false }
      ]
    },
    {
      question: "Which of the following agents was developed as an antiparasitic but is presently used as an antiviral?",
      options: [
        { text: "Amantadine", isCorrect: false },
        { text: "Acyclovir", isCorrect: false },
        { text: "Suramine", isCorrect: true },
        { text: "Virazole", isCorrect: false }
      ]
    },
    {
      question: "All of the following viruses produce lesions at the site of entry EXCEPT:",
      options: [
        { text: "Orf virus", isCorrect: false },
        { text: "Vaccinia virus", isCorrect: false },
        { text: "Papillomavirus", isCorrect: false },
        { text: "Adenovirus", isCorrect: true }
      ]
    },
    {
      question: "Fever blisters or herpes febrilis are seen in all of the following infections EXCEPT:",
      options: [
        { text: "Pneumococcal infection", isCorrect: false },
        { text: "Herpes", isCorrect: true },
        { text: "Malaria", isCorrect: false },
        { text: "Influenza", isCorrect: false }
      ]
    },
    {
      question: "HBV vaccine is an example of which type of vaccine?",
      options: [
        { text: "Live", isCorrect: false },
        { text: "Killed", isCorrect: false },
        { text: "Live-attenuated", isCorrect: false },
        { text: "Cloned subunit", isCorrect: true }
      ]
    },
    {
      question: "The type of vaccine used against Japanese encephalitis is:",
      options: [
        { text: "Killed", isCorrect: true },
        { text: "Live-attenuated", isCorrect: false },
        { text: "Live", isCorrect: false },
        { text: "Subunit", isCorrect: false }
      ]
    },
    {
      question: "Which of the following is FALSE regarding bacteriophages?",
      options: [
        { text: "They have no role in genetic manipulations", isCorrect: true },
        { text: "They confer certain properties to bacteria", isCorrect: false },
        { text: "They are used for bacterial typing", isCorrect: false },
        { text: "They control the total number of bacteria in natural environments", isCorrect: false }
      ]
    },
    {
      question: "Phage typing is NOT useful for:",
      options: [
        { text: "Tracing the carrier during an epidemic", isCorrect: false },
        { text: "Identification of bacteria", isCorrect: false },
        { text: "Differentiating classical V. cholera from the El Tor type", isCorrect: false },
        { text: "Pathogenicity testing", isCorrect: true }
      ]
    },
    {
      question: "The process of transmission of genes between bacteria through bacteriophages is called:",
      options: [
        { text: "Transduction", isCorrect: true },
        { text: "Eclipse", isCorrect: false },
        { text: "Conjugation", isCorrect: false },
        { text: "Transformation", isCorrect: false }
      ]
    },
    {
      question: "Which of the following event/s occur/s in the temperate cycle of a bacteriophage life cycle?",
      options: [
        { text: "Intracellular multiplication", isCorrect: false },
        { text: "Intracellular multiplication and host cell death", isCorrect: false },
        { text: "Multiplication, incorporation into host DNA and cell death", isCorrect: false },
        { text: "Incorporation in host DNA and no harm to host cell", isCorrect: true }
      ]
    },
    {
      question: "The interval between the entry of phage into the cell and appearance of the first infectious intracellular phage particle is called:",
      options: [
        { text: "Latent period", isCorrect: false },
        { text: "Eclipse phase", isCorrect: true },
        { text: "Rise period", isCorrect: false },
        { text: "Burst phase", isCorrect: false }
      ]
    },
    {
      question: "Beta prophage is associated with:",
      options: [
        { text: "E. coli", isCorrect: false },
        { text: "Classical vibrios", isCorrect: false },
        { text: "El Tor vibrios", isCorrect: false },
        { text: "C. diphtheriae", isCorrect: true }
      ]
    },
    {
      question: "Superinfection immunity is seen in the case of:",
      options: [
        { text: "MRSA", isCorrect: false },
        { text: "El Tor vibrios", isCorrect: false },
        { text: "Bacteriophage", isCorrect: true },
        { text: "E. coli", isCorrect: false }
      ]
    },
    {
      question: "The highest dilution of the phage preparation that produces confluent lysis is called:",
      options: [
        { text: "Routine test dose", isCorrect: true },
        { text: "Prophage beta", isCorrect: false },
        { text: "Eclipse phase", isCorrect: false },
        { text: "Latent phase", isCorrect: false }
      ]
    },
    {
      question: "Which of the following is TRUE about lysogenisation?",
      options: [
        { text: "Inhibits bacterial multiplication", isCorrect: false },
        { text: "Abolishes toxigenicity of bacteria", isCorrect: false },
        { text: "Does not interfere with bacterial metabolism", isCorrect: true },
        { text: "Interferes with bacterial motility", isCorrect: false }
      ]
    },
    {
      question: "Bacteriophages CANNOT be used for:",
      options: [
        { text: "Tracing the disease carrier", isCorrect: false },
        { text: "Identification of bacteria", isCorrect: false },
        { text: "Prophylaxis of bacterial infections", isCorrect: true },
        { text: "Differentiating classical V. cholera from the El Tor type", isCorrect: false }
      ]
    },
    {
      question: "Yolk sac inoculation technique is used for cultivation of:",
      options: [
        { text: "Influenza virus", isCorrect: false },
        { text: "Smallpox virus", isCorrect: false },
        { text: "Chlamydia", isCorrect: true },
        { text: "Mycoplasma", isCorrect: false }
      ]
    },
    {
      question: "Which of the following is an example of primary cell lines?",
      options: [
        { text: "HeLa", isCorrect: false },
        { text: "HEp-2", isCorrect: false },
        { text: "KB", isCorrect: false },
        { text: "Monkey kidney", isCorrect: true }
      ]
    },
    {
      question: "Which continuous cell line is now permitted to be used for vaccine production?",
      options: [
        { text: "Vero cell lines", isCorrect: true },
        { text: "HeLa", isCorrect: false },
        { text: "HEp-2", isCorrect: false },
        { text: "KB", isCorrect: false }
      ]
    },
    {
      question: "Which virus results in syncytium formation in cell lines?",
      options: [
        { text: "Adenovirus", isCorrect: false },
        { text: "Herpesvirus", isCorrect: false },
        { text: "Enterovirus", isCorrect: false },
        { text: "Measles virus", isCorrect: true }
      ]
    },
    {
      question: "The hemagglutination inhibition test is used to detect and assay which virus?",
      options: [
        { text: "Influenza virus", isCorrect: true },
        { text: "Herpes virus", isCorrect: false },
        { text: "Enterovirus", isCorrect: false },
        { text: "Rubella virus", isCorrect: false }
      ]
    },
    {
      question: "Warthin–Finkeldey cell is an",
      options: [
        { text: "Acidophilic intracytoplasmic and intranuclear inclusion body seen in measles", isCorrect: false },
        { text: "Eosinophilic intracytoplasmic and intranuclear inclusion body seen in rabies", isCorrect: false },
        { text: "Eosinophilic intracytoplasmic and intranuclear inclusion body seen in measles", isCorrect: true },
        { text: "Acidophilic intracytoplasmic and intranuclear inclusion body seen in vaccinia", isCorrect: false }
      ]
    }
  ]
};

// Update the microbiologyData to include both MCQ chapters
export const microbiologyData = {
  name: "Microbiology",
  subtopics: {
    "paper-1": {
      ...microbiologyPaper1Data,
      subtopics: {
        ...microbiologyPaper1Data.subtopics,
        "mcqs": {
          name: "MCQs",
          subtopics: {
            "chapter-3-systematic-bacteriology": systematicBacteriologyMcqs,
            "chapter-4-basic-concepts-of-bacteriology": basicBacteriologyConceptsMcqs
          }
        }
      }
    },
    "paper-2": microbiologyPaper2Data
  }
};
