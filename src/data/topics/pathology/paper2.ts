
import { respiratorySystemData } from "./respiratorySystem";
import { heartData } from "./heart";
import { bloodVesselsData } from "./bloodVessels";
import { gastrointestinalSystemData } from "./gastrointestinalSystem";
import { liverGallbladderPancreasData } from "./liverGallbladderPancreas";

export const pathologyPaper2Data = {
  name: "Paper 2",
  subtopics: {
    "respiratory-system": respiratorySystemData,
    "heart": heartData,
    "blood-vessels": bloodVesselsData,
    "gastrointestinal-system": gastrointestinalSystemData,
    "liver-gallbladder-pancreas": liverGallbladderPancreasData
  }
};
