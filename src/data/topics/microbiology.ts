
import { microbiologyPaper1Data } from './microbiology/paper1';
import { microbiologyPaper2Data } from './microbiology/paper2';
import { microbiologyMcqsData } from './microbiology/mcqs';

export const microbiologyData = {
  name: "Microbiology",
  subtopics: {
    "paper-1": microbiologyPaper1Data,
    "paper-2": microbiologyPaper2Data,
    "mcqs": {
      name: "MCQs",
      subtopics: microbiologyMcqsData
    }
  }
};
