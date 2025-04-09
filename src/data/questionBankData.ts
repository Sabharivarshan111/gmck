
import { pharmacologyData } from './topics/pharmacology';
import { pathologyData } from './topics/pathology';
import { microbiologyData } from './topics/microbiology';

export const QUESTION_BANK_DATA = {
  "second-year": {
    name: "Second Year",
    subtopics: {
      "pharmacology": pharmacologyData,
      "pathology": pathologyData,
      "microbiology": microbiologyData
    }
  }
};
