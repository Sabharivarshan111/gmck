
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
import { forensicMedicineData } from './topics/forensicMedicine';
import { communityMedicineData } from './topics/communityMedicine';
import { generalMedicineData } from './topics/generalMedicine';
import { obstetricsGynaecologyData } from './topics/obstetricsGynaecology';
import { generalSurgeryData } from './topics/generalSurgery';
import { orthopaedicsData } from './topics/orthopaedics';
import { paediatricsData } from './topics/paediatrics';
import { anatomyData } from './topics/anatomy';
import { physiologyData } from './topics/physiology';
import { biochemistryData } from './topics/biochemistry';
import { entData } from './topics/ent';
import { ophthalmologyData } from './topics/ophthalmology';


// Create a structured hierarchy with all four years as main categories
export const QUESTION_BANK_DATA = {
  "first-year": {
    name: "First Year",
    subtopics: {
      "anatomy": anatomyData,
      "physiology": physiologyData,
      "biochemistry": biochemistryData
    }
  },
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
    // ENT and Ophthalmology are taught in third year as well as being examined
    // in final year, so third year serves the **same** two subject nodes rather
    // than a copy of them. One object in two places is the whole point: the
    // questions, the diagrams and the per-question progress keys are identical,
    // so a question ticked in third year is ticked in final year too. Copying
    // the data instead would be two banks to keep in step, and they would drift.
    //
    // Final year keeps both. Nothing was moved.
    subtopics: {
      "forensic-medicine": forensicMedicineData,
      "community-medicine": communityMedicineData,
      "ent": entData,
      "ophthalmology": ophthalmologyData
    }
  },
  "final-year": {
    name: "Final Year",
    subtopics: {
      "general-medicine": generalMedicineData,
      "obstetrics-gynaecology": obstetricsGynaecologyData,
      "general-surgery": { ...generalSurgeryData, name: "General Surgery and Orthopaedics" },
      "paediatrics": paediatricsData,
      "ent": entData,
      "ophthalmology": ophthalmologyData
    }
  }
};
