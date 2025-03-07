
import { cellAsUnitData } from "./pathology/cellAsUnit";
import { cellInjuryData } from "./pathology/cellInjury";
import { inflammationRepairData } from "./pathology/inflammationRepair";
import { hemodynamicDisordersData } from "./pathology/hemodynamicDisorders";
import { geneticDisordersData } from "./pathology/geneticDisorders";
import { neoplasiaData } from "./pathology/neoplasia";
import { immunologyData } from "./pathology/immunology";
import { infectiousDiseasesData } from "./pathology/infectiousDiseases";
import { environmentalNutritionalDisordersData } from "./pathology/environmentalNutritionalDisorders";
import { infancyChildhoodDiseasesData } from "./pathology/infancyChildhoodDiseases";
import { pathologyPaper2Data } from "./pathology/paper2";

export const pathologyData = {
  name: "Pathology",
  subtopics: {
    "paper-1": {
      name: "Paper 1",
      subtopics: {
        "cell-as-unit": cellAsUnitData,
        "cell-injury": cellInjuryData,
        "inflammation-repair": inflammationRepairData,
        "hemodynamic-disorders": hemodynamicDisordersData,
        "genetic-disorders": geneticDisordersData,
        "neoplasia": neoplasiaData,
        "immunology": immunologyData,
        "infectious-diseases": infectiousDiseasesData,
        "environmental-nutritional-disorders": environmentalNutritionalDisordersData,
        "infancy-childhood-diseases": infancyChildhoodDiseasesData
      }
    },
    "paper-2": pathologyPaper2Data
  }
};
