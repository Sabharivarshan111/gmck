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

export const QUESTION_BANK_DATA = {
  "pharmacology": {
    name: "Pharmacology",
    subtopics: {
      "paper-1": {
        name: "Paper 1",
        subtopics: {
          "general-pharmacology": pharmacologyData.subtopics["general-pharmacology"],
          "peripheral-nervous-system": peripheralNervousSystemData,
          "autonomic-nervous-system": autonomicNervousSystemData,
          "central-nervous-system": centralNervousSystemData,
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
  },
  "pathology": pathologyData
};
