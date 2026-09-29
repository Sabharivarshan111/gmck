/**
 * Hand-checked rows from the supplied Kerala question PDFs. This is an
 * incomplete review seed, never the published bank. The source page is the
 * PDF page number (not the printed page number).
 *
 * First year uses month/year sittings and was confirmed as a Kerala-only book.
 * Later books mix KU with TU and RGU; only KU references are recorded here.
 */
export interface VerifiedKuhsQuestion {
  id: string;
  year: 'first' | 'second' | 'third' | 'final';
  subjectKey: string;
  topicKey: string;
  kind: 'essay' | 'short-notes';
  question: string;
  examRefs: string[];
  pdfPage: number;
}

type Row = Omit<VerifiedKuhsQuestion, 'year' | 'subjectKey' | 'pdfPage'>;
const firstAnatomy = (row: Row): VerifiedKuhsQuestion =>
  ({ ...row, year: 'first', subjectKey: 'anatomy', pdfPage: 3 });
const firstAnatomyPage4 = (row: Row): VerifiedKuhsQuestion =>
  ({ ...row, year: 'first', subjectKey: 'anatomy', pdfPage: 4 });
const firstAnatomyPage5 = (row: Row): VerifiedKuhsQuestion =>
  ({ ...row, year: 'first', subjectKey: 'anatomy', pdfPage: 5 });
const secondPharmacology = (row: Row): VerifiedKuhsQuestion =>
  ({ ...row, year: 'second', subjectKey: 'pharmacology', pdfPage: 7 });

export const VERIFIED_KUHS_QUESTIONS: VerifiedKuhsQuestion[] = [
  firstAnatomy({ id: 'kuhs-1-anat-p3-01', topicKey: 'basic-tissues', kind: 'essay', question: 'Describe the structure and function of skin with its appendages.', examRefs: ['May 23'] }),
  firstAnatomy({ id: 'kuhs-1-anat-p3-02', topicKey: 'basic-tissues', kind: 'short-notes', question: 'Connective tissue fibres', examRefs: ['Feb 14'] }),
  firstAnatomy({ id: 'kuhs-1-anat-p3-03', topicKey: 'basic-tissues', kind: 'short-notes', question: 'Compound glands', examRefs: ['Aug 11'] }),
  firstAnatomy({ id: 'kuhs-1-anat-p3-04', topicKey: 'bones-and-joints', kind: 'essay', question: 'Classify joints. Give the structure of synovial joint with an example.', examRefs: ['May 23'] }),
  firstAnatomy({ id: 'kuhs-1-anat-p3-05', topicKey: 'bones-and-joints', kind: 'essay', question: 'Describe the structure of synovial joints. Classify synovial joints with examples.', examRefs: ['Jan 24'] }),
  firstAnatomy({ id: 'kuhs-1-anat-p3-06', topicKey: 'bones-and-joints', kind: 'essay', question: 'Classify cartilage with suitable examples. Describe the structure of elastic cartilage.', examRefs: ['Feb 22'] }),
  firstAnatomy({ id: 'kuhs-1-anat-p3-07', topicKey: 'bones-and-joints', kind: 'short-notes', question: 'Classify synovial joints with an example for each', examRefs: ['Jul 24'] }),
  firstAnatomy({ id: 'kuhs-1-anat-p3-08', topicKey: 'bones-and-joints', kind: 'short-notes', question: 'Types of epiphysis', examRefs: ['Jan 24'] }),
  firstAnatomy({ id: 'kuhs-1-anat-p3-09', topicKey: 'bones-and-joints', kind: 'short-notes', question: 'Sesamoid bone', examRefs: ['Jul 23'] }),
  firstAnatomy({ id: 'kuhs-1-anat-p3-10', topicKey: 'bones-and-joints', kind: 'short-notes', question: 'Periosteum', examRefs: ['Feb 23'] }),
  firstAnatomy({ id: 'kuhs-1-anat-p3-11', topicKey: 'bones-and-joints', kind: 'short-notes', question: 'Pivot joint', examRefs: ['Feb 22'] }),
  firstAnatomy({ id: 'kuhs-1-anat-p3-12', topicKey: 'bones-and-joints', kind: 'short-notes', question: 'Blood supply of long bone.', examRefs: ['Feb 22', 'Aug 15'] }),
  firstAnatomy({ id: 'kuhs-1-anat-p3-13', topicKey: 'bones-and-joints', kind: 'short-notes', question: 'Epiphyseal plate', examRefs: ['Nov 20'] }),
  firstAnatomy({ id: 'kuhs-1-anat-p3-14', topicKey: 'bones-and-joints', kind: 'short-notes', question: 'Fibrous joints', examRefs: ['Feb 15', 'Feb 16', 'Jul 17'] }),
  firstAnatomy({ id: 'kuhs-1-anat-p3-15', topicKey: 'bones-and-joints', kind: 'short-notes', question: 'Epiphysis', examRefs: ['Feb 16'] }),
  firstAnatomy({ id: 'kuhs-1-anat-p3-16', topicKey: 'bones-and-joints', kind: 'short-notes', question: 'Osteon', examRefs: ['Jan 18'] }),
  firstAnatomy({ id: 'kuhs-1-anat-p3-17', topicKey: 'bones-and-joints', kind: 'short-notes', question: 'Cells of bone tissues', examRefs: ['Feb 17'] }),
  firstAnatomy({ id: 'kuhs-1-anat-p3-18', topicKey: 'bones-and-joints', kind: 'short-notes', question: 'Anterior fontanelle', examRefs: ['Aug 18'] }),

  // PDF page 4: short essays and short notes. The MCQ and old 1-mark
  // sections on the same spread are deliberately kept separate.
  firstAnatomyPage4({ id: 'kuhs-1-anat-p4-01', topicKey: 'muscles', kind: 'short-notes', question: 'Sarcomere', examRefs: ['Jul 17'] }),
  firstAnatomyPage4({ id: 'kuhs-1-anat-p4-02', topicKey: 'cardiovascular-system', kind: 'essay', question: 'Describe the various types and structure-function correlation of blood vessels.', examRefs: ['May 22'] }),
  firstAnatomyPage4({ id: 'kuhs-1-anat-p4-03', topicKey: 'nervous-system', kind: 'short-notes', question: 'Neuroglia', examRefs: ['Mar 21'] }),
  firstAnatomyPage4({ id: 'kuhs-1-anat-p4-04', topicKey: 'general-embryology', kind: 'essay', question: 'Describe the formation, fate and embryological significance of primitive streak.', examRefs: ['Oct 24'] }),
  firstAnatomyPage4({ id: 'kuhs-1-anat-p4-05', topicKey: 'general-embryology', kind: 'essay', question: 'Describe the process of implantation and common abnormal sites of implantation.', examRefs: ['Jul 24'] }),
  firstAnatomyPage4({ id: 'kuhs-1-anat-p4-06', topicKey: 'general-embryology', kind: 'essay', question: 'Describe the process of neurulation. Name the vesicles in the cranial expanded part of the neural tube and mention their fate.', examRefs: ['Jul 24'] }),
  firstAnatomyPage4({ id: 'kuhs-1-anat-p4-07', topicKey: 'general-embryology', kind: 'essay', question: 'Development of placenta and its associated anomalies.', examRefs: ['Jul 24', 'Mar 21', 'Aug 15', 'Aug 14'] }),
  firstAnatomyPage4({ id: 'kuhs-1-anat-p4-08', topicKey: 'general-embryology', kind: 'essay', question: 'Formation of placenta', examRefs: ['Jan 24'] }),
  firstAnatomyPage4({ id: 'kuhs-1-anat-p4-09', topicKey: 'general-embryology', kind: 'essay', question: 'Formation and fate of notochord.', examRefs: ['Nov 23', 'May 23'] }),
  firstAnatomyPage4({ id: 'kuhs-1-anat-p4-10', topicKey: 'general-embryology', kind: 'essay', question: 'Graafian follicle', examRefs: ['Jul 23'] }),
  firstAnatomyPage4({ id: 'kuhs-1-anat-p4-11', topicKey: 'general-embryology', kind: 'essay', question: 'Process of implantation and its clinical aspects', examRefs: ['Feb 23'] }),
  firstAnatomyPage4({ id: 'kuhs-1-anat-p4-12', topicKey: 'general-embryology', kind: 'essay', question: 'Implantation', examRefs: ['Feb 23'] }),
  firstAnatomyPage4({ id: 'kuhs-1-anat-p4-13', topicKey: 'general-embryology', kind: 'essay', question: 'Divisions and derivatives of intraembryonic mesoderm.', examRefs: ['Feb 22'] }),
  firstAnatomyPage4({ id: 'kuhs-1-anat-p4-14', topicKey: 'general-embryology', kind: 'essay', question: 'Notochord', examRefs: ['Feb 22'] }),
  firstAnatomyPage4({ id: 'kuhs-1-anat-p4-15', topicKey: 'general-embryology', kind: 'essay', question: 'Stages and consequences of fertilisation', examRefs: ['Aug 21'] }),
  firstAnatomyPage4({ id: 'kuhs-1-anat-p4-40', topicKey: 'general-embryology', kind: 'essay', question: 'Placenta', examRefs: ['Mar 21'] }),
  firstAnatomyPage4({ id: 'kuhs-1-anat-p4-41', topicKey: 'general-embryology', kind: 'essay', question: 'Intra embryonic mesoderm', examRefs: ['Nov 20', 'Jan 20', 'Aug 13'] }),
  firstAnatomyPage4({ id: 'kuhs-1-anat-p4-42', topicKey: 'general-embryology', kind: 'essay', question: 'Neural crest', examRefs: ['Aug 16'] }),
  firstAnatomyPage4({ id: 'kuhs-1-anat-p4-43', topicKey: 'general-embryology', kind: 'short-notes', question: 'Describe fertilization and its results', examRefs: ['Oct 24'] }),
  firstAnatomyPage4({ id: 'kuhs-1-anat-p4-16', topicKey: 'general-embryology', kind: 'short-notes', question: 'Development of interatrial septum', examRefs: ['Jan 24', 'Aug 19'] }),
  firstAnatomyPage4({ id: 'kuhs-1-anat-p4-17', topicKey: 'general-embryology', kind: 'short-notes', question: 'Formation and fate of primitive streak', examRefs: ['Jan 24', 'Aug 21'] }),
  firstAnatomyPage4({ id: 'kuhs-1-anat-p4-18', topicKey: 'general-embryology', kind: 'short-notes', question: 'Parts of blastocyst.', examRefs: ['Jan 24'] }),
  firstAnatomyPage4({ id: 'kuhs-1-anat-p4-19', topicKey: 'general-embryology', kind: 'short-notes', question: 'Oogenesis', examRefs: ['Nov 23', 'Sep 21', 'Aug 16'] }),
  firstAnatomyPage4({ id: 'kuhs-1-anat-p4-20', topicKey: 'general-embryology', kind: 'short-notes', question: 'Subdivisions and derivatives of neural tube', examRefs: ['May 23'] }),
  firstAnatomyPage4({ id: 'kuhs-1-anat-p4-21', topicKey: 'general-embryology', kind: 'short-notes', question: 'Formation and structure of umbilical cord.', examRefs: ['May 23'] }),
  firstAnatomyPage4({ id: 'kuhs-1-anat-p4-22', topicKey: 'general-embryology', kind: 'short-notes', question: 'Embryological basis of twinning', examRefs: ['Feb 23'] }),
  firstAnatomyPage4({ id: 'kuhs-1-anat-p4-23', topicKey: 'general-embryology', kind: 'short-notes', question: 'Neural crest cells.', examRefs: ['May 22'] }),
  firstAnatomyPage4({ id: 'kuhs-1-anat-p4-24', topicKey: 'general-embryology', kind: 'short-notes', question: 'Spermatogenesis.', examRefs: ['Feb 22'] }),
  firstAnatomyPage4({ id: 'kuhs-1-anat-p4-25', topicKey: 'general-embryology', kind: 'short-notes', question: 'Decidua', examRefs: ['Nov 20'] }),
  firstAnatomyPage4({ id: 'kuhs-1-anat-p4-26', topicKey: 'general-embryology', kind: 'short-notes', question: 'Yolk sac', examRefs: ['Aug 19', 'Jan 19'] }),
  firstAnatomyPage4({ id: 'kuhs-1-anat-p4-27', topicKey: 'general-embryology', kind: 'short-notes', question: 'Graafian follicle', examRefs: ['Aug 19'] }),
  firstAnatomyPage4({ id: 'kuhs-1-anat-p4-28', topicKey: 'general-embryology', kind: 'short-notes', question: 'Zona pellucida', examRefs: ['Jan 19'] }),
  firstAnatomyPage4({ id: 'kuhs-1-anat-p4-29', topicKey: 'general-embryology', kind: 'short-notes', question: 'Right atrial development', examRefs: ['Aug 16'] }),
  firstAnatomyPage4({ id: 'kuhs-1-anat-p4-30', topicKey: 'general-embryology', kind: 'short-notes', question: 'Inter ventricular septum', examRefs: ['Aug 18', 'Feb 16'] }),
  firstAnatomyPage4({ id: 'kuhs-1-anat-p4-31', topicKey: 'general-embryology', kind: 'short-notes', question: 'Somites', examRefs: ['Aug 16', 'Feb 17', 'Aug 18'] }),
  firstAnatomyPage4({ id: 'kuhs-1-anat-p4-32', topicKey: 'general-embryology', kind: 'short-notes', question: 'Neural crest derivatives', examRefs: ['Feb 16'] }),
  firstAnatomyPage4({ id: 'kuhs-1-anat-p4-33', topicKey: 'general-embryology', kind: 'short-notes', question: 'Chorionic villi', examRefs: ['Feb 15', 'Feb 16'] }),
  firstAnatomyPage4({ id: 'kuhs-1-anat-p4-34', topicKey: 'general-embryology', kind: 'short-notes', question: 'Development of lungs', examRefs: ['Feb 14'] }),
  firstAnatomyPage4({ id: 'kuhs-1-anat-p4-35', topicKey: 'general-embryology', kind: 'short-notes', question: 'Dizygotic twins', examRefs: ['Feb 14'] }),
  firstAnatomyPage4({ id: 'kuhs-1-anat-p4-36', topicKey: 'general-embryology', kind: 'short-notes', question: 'Fertilisation', examRefs: ['Aug 13'] }),
  firstAnatomyPage4({ id: 'kuhs-1-anat-p4-37', topicKey: 'general-embryology', kind: 'short-notes', question: 'Neural tube', examRefs: ['Aug 12'] }),
  firstAnatomyPage4({ id: 'kuhs-1-anat-p4-38', topicKey: 'general-embryology', kind: 'short-notes', question: 'Spermiogenesis', examRefs: ['Aug 18', 'Feb 17', 'Aug 11'] }),
  firstAnatomyPage4({ id: 'kuhs-1-anat-p4-39', topicKey: 'general-embryology', kind: 'short-notes', question: 'Implantation', examRefs: ['Aug 11'] }),

  // PDF page 5 continues Anatomy I with genetics and general histology.
  firstAnatomyPage5({ id: 'kuhs-1-anat-p5-01', topicKey: 'genetics', kind: 'essay', question: 'With the help of pedigree charts describe the various modes of inheritance involving the sex chromosomes. Give suitable examples for each type.', examRefs: ['Oct 24'] }),
  firstAnatomyPage5({ id: 'kuhs-1-anat-p5-02', topicKey: 'genetics', kind: 'essay', question: 'Describe the structure of chromosomes with classification. Explain any three structural anomalies of chromosomes.', examRefs: ['Jul 24'] }),
  firstAnatomyPage5({ id: 'kuhs-1-anat-p5-03', topicKey: 'genetics', kind: 'essay', question: 'Karyotyping', examRefs: ['Nov 23'] }),
  firstAnatomyPage5({ id: 'kuhs-1-anat-p5-04', topicKey: 'genetics', kind: 'essay', question: 'Describe the technique of karyotyping with its applications.', examRefs: ['Feb 23'] }),
  firstAnatomyPage5({ id: 'kuhs-1-anat-p5-05', topicKey: 'genetics', kind: 'essay', question: 'Numerical aberrations of chromosomes', examRefs: ['Feb 23'] }),
  firstAnatomyPage5({ id: 'kuhs-1-anat-p5-06', topicKey: 'genetics', kind: 'essay', question: 'Chromosomal aberrations.', examRefs: ['Feb 22'] }),
  firstAnatomyPage5({ id: 'kuhs-1-anat-p5-07', topicKey: 'genetics', kind: 'essay', question: 'Describe various modes of inheritance with examples', examRefs: ['Aug 21'] }),
  firstAnatomyPage5({ id: 'kuhs-1-anat-p5-08', topicKey: 'genetics', kind: 'essay', question: 'Mendelian inheritance', examRefs: ['Mar 21', 'Jan 18'] }),
  firstAnatomyPage5({ id: 'kuhs-1-anat-p5-09', topicKey: 'genetics', kind: 'essay', question: 'Down syndrome', examRefs: ['Jul 17'] }),
  firstAnatomyPage5({ id: 'kuhs-1-anat-p5-10', topicKey: 'genetics', kind: 'short-notes', question: 'Explain autosomal dominant inheritance in genetic diseases', examRefs: ['Jul 24'] }),
  firstAnatomyPage5({ id: 'kuhs-1-anat-p5-11', topicKey: 'genetics', kind: 'short-notes', question: 'Karyotype and clinical features of Klinefelter syndrome', examRefs: ['Jul 24'] }),
  firstAnatomyPage5({ id: 'kuhs-1-anat-p5-12', topicKey: 'genetics', kind: 'short-notes', question: 'Karyotyping', examRefs: ['Jan 24', 'Jul 23', 'Jan 20', 'Nov 20'] }),
  firstAnatomyPage5({ id: 'kuhs-1-anat-p5-13', topicKey: 'genetics', kind: 'short-notes', question: 'Define Karyotype. What are the steps of Karyotyping.', examRefs: ['Jan 24'] }),
  firstAnatomyPage5({ id: 'kuhs-1-anat-p5-14', topicKey: 'genetics', kind: 'short-notes', question: 'Trisomy 21', examRefs: ['Feb 23'] }),
  firstAnatomyPage5({ id: 'kuhs-1-anat-p5-15', topicKey: 'genetics', kind: 'short-notes', question: 'Describe structure of chromosome with classification.', examRefs: ['May 22'] }),
  firstAnatomyPage5({ id: 'kuhs-1-anat-p5-16', topicKey: 'genetics', kind: 'short-notes', question: 'Chromosomes and its classification', examRefs: ['Feb 22'] }),
  firstAnatomyPage5({ id: 'kuhs-1-anat-p5-17', topicKey: 'genetics', kind: 'short-notes', question: 'Name the structural chromosomal abnormalities', examRefs: ['Sep 21'] }),
  firstAnatomyPage5({ id: 'kuhs-1-anat-p5-18', topicKey: 'genetics', kind: 'short-notes', question: 'Barr body', examRefs: ['Sep 21', 'Feb 17', 'Feb 15', 'Aug 14'] }),
  firstAnatomyPage5({ id: 'kuhs-1-anat-p5-19', topicKey: 'genetics', kind: 'short-notes', question: 'Genetic counselling', examRefs: ['Mar 21'] }),
  firstAnatomyPage5({ id: 'kuhs-1-anat-p5-20', topicKey: 'genetics', kind: 'short-notes', question: 'Chromosomal aberrations', examRefs: ['Aug 19'] }),
  firstAnatomyPage5({ id: 'kuhs-1-anat-p5-21', topicKey: 'genetics', kind: 'short-notes', question: 'Numerical chromosomal abnormalities', examRefs: ['Aug 18'] }),
  firstAnatomyPage5({ id: 'kuhs-1-anat-p5-22', topicKey: 'genetics', kind: 'short-notes', question: 'Down syndrome', examRefs: ['Aug 15', 'Aug 16'] }),
  firstAnatomyPage5({ id: 'kuhs-1-anat-p5-23', topicKey: 'genetics', kind: 'short-notes', question: 'Reciprocal translocation', examRefs: ['Feb 14'] }),
  firstAnatomyPage5({ id: 'kuhs-1-anat-p5-24', topicKey: 'genetics', kind: 'short-notes', question: 'Klinefelter’s syndrome', examRefs: ['Aug 13'] }),
  firstAnatomyPage5({ id: 'kuhs-1-anat-p5-25', topicKey: 'genetics', kind: 'short-notes', question: 'Turner’s syndrome', examRefs: ['Jan 19', 'Feb 16', 'Aug 11'] }),
  firstAnatomyPage5({ id: 'kuhs-1-anat-p5-26', topicKey: 'general-histology', kind: 'essay', question: 'Describe the structure of transitional epithelium with site of occurrence and its functional significance', examRefs: ['Oct 24'] }),
  firstAnatomyPage5({ id: 'kuhs-1-anat-p5-27', topicKey: 'general-histology', kind: 'essay', question: 'Illustrate and describe the microscopic anatomy of the large artery and medium-sized artery highlighting how their structure is suited for their function', examRefs: ['Jul 24'] }),
  firstAnatomyPage5({ id: 'kuhs-1-anat-p5-28', topicKey: 'general-histology', kind: 'essay', question: 'Histology of thin skin. Write a note on appendages of skin.', examRefs: ['Jan 24'] }),
  firstAnatomyPage5({ id: 'kuhs-1-anat-p5-29', topicKey: 'general-histology', kind: 'essay', question: 'Explain the microscopic structure of thin skin', examRefs: ['Nov 23'] }),
  firstAnatomyPage5({ id: 'kuhs-1-anat-p5-30', topicKey: 'general-histology', kind: 'essay', question: 'Classify muscular tissue with suitable examples. Describe the structure of skeletal muscle.', examRefs: ['Mar 21'] }),
  firstAnatomyPage5({ id: 'kuhs-1-anat-p5-31', topicKey: 'general-histology', kind: 'short-notes', question: 'Transitional epithelium', examRefs: ['Jul 24', 'Jan 20'] }),
  firstAnatomyPage5({ id: 'kuhs-1-anat-p5-32', topicKey: 'general-histology', kind: 'short-notes', question: 'Microscopic structure of peripheral nerve', examRefs: ['Jul 24'] }),

  secondPharmacology({ id: 'kuhs-2-pharm-p7-01', topicKey: 'pharmacokinetics', kind: 'short-notes', question: 'Plasma half life and its clinical relevance', examRefs: ['KU14', 'KU16', 'KU18'] }),
  secondPharmacology({ id: 'kuhs-2-pharm-p7-02', topicKey: 'pharmacokinetics', kind: 'short-notes', question: 'Microsomal enzyme induction', examRefs: ['KU13'] }),
  secondPharmacology({ id: 'kuhs-2-pharm-p7-03', topicKey: 'pharmacokinetics', kind: 'short-notes', question: 'What is a prodrug and mention 2 examples', examRefs: ['KU13'] }),
  secondPharmacology({ id: 'kuhs-2-pharm-p7-04', topicKey: 'pharmacokinetics', kind: 'short-notes', question: 'Kinetics of elimination', examRefs: ['KU13'] }),
  secondPharmacology({ id: 'kuhs-2-pharm-p7-05', topicKey: 'pharmacokinetics', kind: 'short-notes', question: 'Hoffman elimination', examRefs: ['KU13'] }),
  secondPharmacology({ id: 'kuhs-2-pharm-p7-06', topicKey: 'pharmacodynamics', kind: 'short-notes', question: 'Define a receptor. Discuss the various transducer mechanisms by which the receptors act', examRefs: ['KU18'] }),
  secondPharmacology({ id: 'kuhs-2-pharm-p7-07', topicKey: 'pharmacodynamics', kind: 'short-notes', question: 'Discuss the various factors modifying drug action with suitable examples', examRefs: ['KU22'] }),
  secondPharmacology({ id: 'kuhs-2-pharm-p7-08', topicKey: 'pharmacodynamics', kind: 'short-notes', question: 'Drug antagonism', examRefs: ['KU23'] }),
  secondPharmacology({ id: 'kuhs-2-pharm-p7-09', topicKey: 'pharmacodynamics', kind: 'short-notes', question: 'G-protein coupled receptors', examRefs: ['KU20'] }),
  secondPharmacology({ id: 'kuhs-2-pharm-p7-10', topicKey: 'pharmacodynamics', kind: 'short-notes', question: 'Explain physiological antagonism with one example', examRefs: ['KU17'] }),
  secondPharmacology({ id: 'kuhs-2-pharm-p7-11', topicKey: 'pharmacodynamics', kind: 'short-notes', question: 'Chemical antagonism with one example', examRefs: ['KU14'] }),
  secondPharmacology({ id: 'kuhs-2-pharm-p7-12', topicKey: 'pharmacotherapy-and-adverse-drug-effects', kind: 'short-notes', question: 'Fixed drug combination of drugs', examRefs: ['KU24'] }),
  secondPharmacology({ id: 'kuhs-2-pharm-p7-13', topicKey: 'pharmacotherapy-and-adverse-drug-effects', kind: 'short-notes', question: 'Pharmacogenetics', examRefs: ['KU21'] }),
  secondPharmacology({ id: 'kuhs-2-pharm-p7-14', topicKey: 'pharmacotherapy-and-adverse-drug-effects', kind: 'short-notes', question: 'Tachyphylaxis with examples', examRefs: ['KU18'] }),
  secondPharmacology({ id: 'kuhs-2-pharm-p7-15', topicKey: 'pharmacotherapy-and-adverse-drug-effects', kind: 'short-notes', question: 'Pharmacovigilance. Describe the basis and grading of causality assessment', examRefs: ['KU15'] }),
  secondPharmacology({ id: 'kuhs-2-pharm-p7-16', topicKey: 'pharmacotherapy-and-adverse-drug-effects', kind: 'short-notes', question: 'Define Teratogenicity, mention four teratogenic drugs', examRefs: ['KU15'] }),
];

export function kuhsRepeatCount(row: VerifiedKuhsQuestion): number {
  return new Set(row.examRefs).size;
}
