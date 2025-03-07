
import { respiratorySystemData } from "./respiratorySystem";
import { heartData } from "./heart";
import { bloodVesselsData } from "./bloodVessels";
import { gastrointestinalSystemData } from "./gastrointestinalSystem";
import { liverGallbladderPancreasData } from "./liverGallbladderPancreas";
import { kidneyData } from "./kidney";
import { maleGenitalTractData } from "./maleGenitalTract";
import { femaleGenitalTractData } from "./femaleGenitalTract";
import { skinData } from "./skin";
import { bonesJointsSoftTissueData } from "./bonesJointsSoftTissue";
import { cnsPathologyData } from "./centralNervousSystem";

export const pathologyPaper2Data = {
  name: "Paper 2",
  subtopics: {
    "respiratory-system": respiratorySystemData,
    "heart": heartData,
    "blood-vessels": bloodVesselsData,
    "gastrointestinal-system": gastrointestinalSystemData,
    "liver-gallbladder-pancreas": liverGallbladderPancreasData,
    "kidney": kidneyData,
    "male-genital-tract": maleGenitalTractData,
    "female-genital-tract": femaleGenitalTractData,
    "skin": skinData,
    "bones-joints-soft-tissue": bonesJointsSoftTissueData,
    "central-nervous-system": cnsPathologyData
  }
};
