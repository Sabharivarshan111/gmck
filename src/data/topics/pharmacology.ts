
import { generalPharmacologyData } from './pharmacology/generalPharmacology';
import { respiratorySystemData } from './pharmacology/respiratorySystem';
import { autacoidsData } from './pharmacology/autacoids';
import { cnsData } from './pharmacology/cns';
import { cardiovascularSystemData } from './pharmacology/cardiovascularSystem';
import { endocrineSystemData } from './pharmacology/endocrineSystem';
import { chemotherapyData } from './pharmacology/chemotherapy';
import { peripheralNervousSystemData } from './topics/peripheralNervousSystem';
import { autonomicNervousSystemData } from './topics/autonomicNervousSystem';
import { hormonesData } from './topics/hormones';

export const pharmacologyData = {
  name: "Pharmacology",
  subtopics: {
    "paper-1": {
      name: "Paper 1",
      subtopics: {
        "general-pharmacology": generalPharmacologyData,
        "peripheral-nervous-system": peripheralNervousSystemData,
        "autonomic-nervous-system": autonomicNervousSystemData,
        "central-nervous-system": cnsData,
        "cardiovascular-system": cardiovascularSystemData,
        "respiratory-system": respiratorySystemData,
        "autacoids": autacoidsData
      }
    },
    "paper-2": {
      name: "Paper 2",
      subtopics: {
        "hormones": hormonesData,
        "endocrine-system": endocrineSystemData,
        "chemotherapy": chemotherapyData
      }
    }
  }
};
