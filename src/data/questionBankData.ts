
import { pharmacologyData } from './topics/pharmacology';
import { autonomicNervousSystemData } from './topics/autonomicNervousSystem';
import { centralNervousSystemData } from './topics/centralNervousSystem';
import { cardiovascularSystemData } from './topics/cardiovascularSystem';
import { respiratorySystemData } from './topics/respiratorySystem';
import { autacoidsData } from './topics/autacoids';
import { peripheralNervousSystemData } from './topics/peripheralNervousSystem';
import { hormonesData } from './topics/hormones';
import { gastrointestinalSystemData } from './topics/gastrointestinalSystem';
import { antiMicrobialDrugsData } from './topics/antiMicrobialDrugs';
import { neoplasticDrugsData } from './topics/neoplasticDrugs';
import { miscellaneousDrugsData } from './topics/miscellaneousDrugs';
import { pathologyData } from './topics/pathology';
import { microbiologyData } from './topics/microbiology';

// Create a structured hierarchy with Second Year and Third Year as main categories
export const QUESTION_BANK_DATA = {
  "second-year": {
    name: "Second Year",
    subtopics: {
      "pharmacology": pharmacologyData,
      "pathology": pathologyData,
      "microbiology": microbiologyData
    }
  },
  "third-year": {
    name: "Third Year",
    subtopics: {
      // Placeholder for third year subjects - can be expanded later
      "clinical-subjects": {
        name: "Clinical Subjects",
        subtopics: {}
      }
    }
  }
};
