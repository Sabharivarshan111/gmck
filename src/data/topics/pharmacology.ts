
import { generalPharmacologyData } from './pharmacology/generalPharmacology';
import { respiratorySystemData } from './pharmacology/respiratorySystem';
import { autacoidsData } from './pharmacology/autacoids';
import { cnsData } from './pharmacology/cns';
import { cardiovascularSystemData } from './pharmacology/cardiovascularSystem';
import { peripheralNervousSystemData } from './peripheralNervousSystem';
import { autonomicNervousSystemData } from './autonomicNervousSystem';
import { hormonesData } from './hormones';
import { gastrointestinalSystemData } from './gastrointestinalSystem';
import { antiMicrobialDrugsData } from './antiMicrobialDrugs';
import { neoplasticDrugsData } from './neoplasticDrugs';
import { miscellaneousDrugsData } from './miscellaneousDrugs';

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
        "gastrointestinal-system": gastrointestinalSystemData,
        "anti-microbial-drugs": antiMicrobialDrugsData,
        "neoplastic-drugs": neoplasticDrugsData,
        "miscellaneous-drugs": miscellaneousDrugsData
      }
    }
  }
};
