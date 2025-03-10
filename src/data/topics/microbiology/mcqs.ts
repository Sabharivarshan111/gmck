
import { McqType } from "@/components/QuestionBank";

export const microbiologyMcqsData: { [key: string]: McqType } = {
  "chapter-5-basic-concepts-of-mycology": {
    name: "Chapter 5: Basic concepts of mycology",
    questions: [
      {
        question: "Which of the following statement is NOT correct regarding yeasts?",
        options: [
          { text: "These are unicellular fungi that do not produce germ tubes or pseudo-hyphae", isCorrect: false },
          { text: "They reproduce by budding", isCorrect: false },
          { text: "Filamentous (hyphae-like) structures are seen in tissues or in culture", isCorrect: true },
          { text: "In culture, the colonies are pasty, resembling bacterial colonies", isCorrect: false }
        ]
      },
      {
        question: "The cytoplasmic membrane of fungi contains",
        options: [
          { text: "Carbohydrate", isCorrect: false },
          { text: "Protein", isCorrect: false },
          { text: "Sterol", isCorrect: true },
          { text: "Mannan", isCorrect: false }
        ]
      },
      {
        question: "The rigidity of fungal cell walls is due to presence of:",
        options: [
          { text: "Protein", isCorrect: false },
          { text: "Chitin", isCorrect: true },
          { text: "Teichoic acid", isCorrect: false },
          { text: "Lipopolysaccharide", isCorrect: false }
        ]
      },
      {
        question: "Which of the following is a subcutaneous mycosis?",
        options: [
          { text: "Favus", isCorrect: false },
          { text: "Pityriasis versicolor", isCorrect: false },
          { text: "Tinea capitis", isCorrect: false },
          { text: "Chromomycosis", isCorrect: true }
        ]
      },
      {
        question: "Which of the following is a superficial fungal infection?",
        options: [
          { text: "Favus", isCorrect: false },
          { text: "Pityriasis versicolor", isCorrect: true },
          { text: "Tinea capitis", isCorrect: false },
          { text: "Chromomycosis", isCorrect: false }
        ]
      },
      {
        question: "Which one of the following fungi is NOT a mould?",
        options: [
          { text: "Rhizopus", isCorrect: false },
          { text: "Cryptococcus", isCorrect: true },
          { text: "Aspergillus", isCorrect: false },
          { text: "Penicillium", isCorrect: false }
        ]
      },
      {
        question: "Which of the following is the morphological characteristic that refers to fungi imperfecti?",
        options: [
          { text: "Lack of cell wall", isCorrect: false },
          { text: "Lack of septate hyphae", isCorrect: false },
          { text: "Unidentified sexual phases", isCorrect: true },
          { text: "Unidentified microconidia", isCorrect: false }
        ]
      },
      {
        question: "Which of the following is NOT a fungal stain?",
        options: [
          { text: "Leishman", isCorrect: true },
          { text: "Calcofluor white", isCorrect: false },
          { text: "Periodic acid Schiff", isCorrect: false },
          { text: "Gomori's methenamine silver", isCorrect: false }
        ]
      },
      {
        question: "All the following media are used for identifying fungi EXCEPT:",
        options: [
          { text: "Cornmeal", isCorrect: false },
          { text: "Czapek–Dox medium", isCorrect: false },
          { text: "Bird seed", isCorrect: false },
          { text: "Horse serum agar", isCorrect: true }
        ]
      },
      {
        question: "The function of cycloheximide in Sabouraud dextrose agar is to prevent the growth of which of the following contaminants:",
        options: [
          { text: "Gram-positive bacteria", isCorrect: false },
          { text: "Gram-negative bacteria", isCorrect: false },
          { text: "Moulds", isCorrect: true },
          { text: "Yeasts", isCorrect: false }
        ]
      },
      {
        question: "Which of the following is correct regarding Sabouraud dextrose agar?",
        options: [
          { text: "Yeast do not grow on this medium.", isCorrect: false },
          { text: "It has a high concentration of either glucose or maltose", isCorrect: true },
          { text: "The pH of the medium is high (8.4)", isCorrect: false },
          { text: "It is prepared in petri dishes", isCorrect: false }
        ]
      },
      {
        question: "The most common direct microscopy method to visualise fungal elements from clinical samples is:",
        options: [
          { text: "KOH preparation", isCorrect: true },
          { text: "LPCB staining", isCorrect: false },
          { text: "Iodine mount", isCorrect: false },
          { text: "Albert stain", isCorrect: false }
        ]
      },
      {
        question: "Yeasts can be identified based on carbohydrate fermentation tests. Which of the following is correct regarding fermentation test?",
        options: [
          { text: "Fermentation test is performed in a medium containing 10% yeast extract and 2% test carbohydrate in distilled water", isCorrect: false },
          { text: "Fermentation test is performed in a medium containing 10% yeast extract and 2% test carbohydrate in thioglycolate broth", isCorrect: false },
          { text: "Fermentation test is performed in a medium containing 1% yeast extract and 20% test carbohydrate in distilled water", isCorrect: false },
          { text: "Fermentation test is performed in a medium containing 1% yeast extract and 2% test carbohydrate in distilled water", isCorrect: true }
        ]
      },
      {
        question: "Which of the following is not a medium to cultivate fungi from clinical samples?",
        options: [
          { text: "Czapek–Dox medium", isCorrect: false },
          { text: "Bird seed agar", isCorrect: false },
          { text: "MacConkey's agar", isCorrect: true },
          { text: "Brain–heart infusion agar", isCorrect: false }
        ]
      },
      {
        question: "Which of the following is NOT a prerequisite for the growth of fungi in the laboratory?",
        options: [
          { text: "Most fungi are grown at a low pH (5.4–6)", isCorrect: false },
          { text: "All fungi require oxygen for growth", isCorrect: false },
          { text: "Fungi grow best at 50°C", isCorrect: true },
          { text: "They are usually incubated in biochemical oxygen demand (BOD) incubators", isCorrect: false }
        ]
      },
      {
        question: "Which stain can be used to visualise fungi from culture?",
        options: [
          { text: "Lactophenol cotton blue", isCorrect: true },
          { text: "KOH", isCorrect: false },
          { text: "ZN stain", isCorrect: false },
          { text: "Methenamine silver stain", isCorrect: false }
        ]
      },
      {
        question: "Which stain can be used to visualise fungi from tissues?",
        options: [
          { text: "Lactophenol cotton blue", isCorrect: false },
          { text: "KOH", isCorrect: false },
          { text: "ZN stain", isCorrect: false },
          { text: "Methenamine silver stain", isCorrect: true }
        ]
      },
      {
        question: "Reynolds-Braude phenomenon refers to the formation of:",
        options: [
          { text: "Chlamydospores", isCorrect: false },
          { text: "Germ tubes", isCorrect: true },
          { text: "Rhizoids", isCorrect: false },
          { text: "Chains of conidia", isCorrect: false }
        ]
      },
      {
        question: "Which of the following fungus is capsulated?",
        options: [
          { text: "Candida", isCorrect: false },
          { text: "Rhodotorula", isCorrect: false },
          { text: "Pneumocystis", isCorrect: false },
          { text: "Cryptococcus", isCorrect: true }
        ]
      },
      {
        question: "Which statement is NOT TRUE regarding Cryptococcus neoformans?",
        options: [
          { text: "Grows at 37°C", isCorrect: false },
          { text: "Grows on SDA", isCorrect: false },
          { text: "Possesses polysaccharide capsule", isCorrect: false },
          { text: "Negative urease test", isCorrect: true }
        ]
      }
    ]
  }
};
