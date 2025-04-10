
import { generalPharmacologyData } from './pharmacology/generalPharmacology';
import { respiratorySystemData } from './pharmacology/respiratorySystem';
import { autacoidsData } from './pharmacology/autacoids';
import { cnsData } from './pharmacology/cns';
import { cardiovascularSystemData } from './pharmacology/cardiovascularSystem';
import { endocrineSystemData } from './pharmacology/endocrineSystem';
import { chemotherapyData } from './pharmacology/chemotherapy';

export const pharmacologyData = {
  name: "Pharmacology",
  subtopics: {
    "paper-1": {
      name: "Paper 1",
      subtopics: {
        "general-pharmacology": generalPharmacologyData,
        "respiratory-system": respiratorySystemData,
        "autacoids": autacoidsData,
      }
    },
    "paper-2": {
      name: "Paper 2",
      subtopics: {
        "cns": cnsData,
        "cardiovascular-system": cardiovascularSystemData,
        "endocrine-system": endocrineSystemData,
        "chemotherapy": chemotherapyData
      }
    }
  }
};
