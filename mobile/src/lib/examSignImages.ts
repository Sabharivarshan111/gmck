/**
 * Photographs fetched for the general-examination signs.
 *
 * Written by `.github/workflows/exam-sign-images.yml` — do not edit by hand,
 * the next run overwrites it. Each entry records the file it put under
 * `signs/` in the diagrams bucket, plus the attribution and licence, because
 * CC-BY requires attribution and `GeneralExamSigns.tsx` draws that credit line
 * directly under the picture.
 *
 * It is TypeScript rather than JSON on purpose: a JSON import needs
 * `resolveJsonModule`, which comes from the React Native tsconfig preset and
 * is therefore a flag this repo does not own. A generated `.ts` file needs
 * nothing and typechecks the same way every other file does.
 *
 * Empty is the correct starting state. A sign with no entry renders its text
 * and says it has no picture yet, which is what a sign whose only available
 * images are not licensed for commercial use should do for ever.
 */
export interface FetchedSignImage {
  /** Path under the diagrams bucket, e.g. 'signs/koilonychia.jpg'. */
  file: string;
  /** Shown under the picture. */
  credit?: string;
  /** e.g. 'CC BY-SA 4.0'. Commercial use must be permitted. */
  licence?: string;
  /** The Commons file page, for anyone checking the provenance. */
  source?: string;
  commonsTitle?: string;
}

export const SIGN_IMAGES: Record<string, FetchedSignImage> = {
  "clubbing": {
    "commonsTitle": "File:Clubbed fingers.JPG",
    "credit": "Bobjgalindo",
    "file": "signs/clubbing.jpg",
    "licence": "CC BY-SA 4.0",
    "source": "https://commons.wikimedia.org/w/index.php?curid=7279968"
  },
  "cyanosis-peripheral": {
    "commonsTitle": "File:Arterial thrombosis causing cyanosis.jpg",
    "credit": "James Heilman, MD",
    "file": "signs/cyanosis-peripheral.jpg",
    "licence": "CC BY-SA 3.0",
    "source": "https://commons.wikimedia.org/w/index.php?curid=15335626"
  },
  "dupuytren": {
    "commonsTitle": "File:Dupuytren's contracture.jpg",
    "credit": "Smartie77",
    "file": "signs/dupuytren.jpg",
    "licence": "CC BY-SA 3.0",
    "source": "https://commons.wikimedia.org/w/index.php?curid=17309958"
  },
  "edema": {
    "commonsTitle": "File:Pitting Edema2008.jpg",
    "credit": "James Heilman, MD",
    "file": "signs/edema.jpg",
    "licence": "CC BY-SA 3.0",
    "source": "https://commons.wikimedia.org/w/index.php?curid=4646147"
  },
  "icterus": {
    "commonsTitle": "File:Comparison of Cutaneous Jaundice and Scleral Icterus.jpg",
    "credit": "James Heilman, MD",
    "file": "signs/icterus.jpg",
    "licence": "CC BY 3.0",
    "source": "https://commons.wikimedia.org/w/index.php?curid=192212516"
  },
  "jvp": {
    "commonsTitle": "File:Elevated JVP.JPG",
    "credit": "James Heilman, MD",
    "file": "signs/jvp.jpg",
    "licence": "CC BY-SA 3.0",
    "source": "https://commons.wikimedia.org/w/index.php?curid=11509072"
  },
  "koilonychia": {
    "commonsTitle": "File:Koilonychia iron deficiency anemia.jpg",
    "credit": "CHeitz",
    "file": "signs/koilonychia.jpg",
    "licence": "CC BY 2.0",
    "source": "https://commons.wikimedia.org/w/index.php?curid=74757229"
  },
  "koplik-and-oral": {
    "commonsTitle": "File:AngularCheilitis5.jpg",
    "credit": "cevah",
    "file": "signs/koplik-and-oral.jpg",
    "licence": "CC BY-SA 2.5",
    "source": "https://commons.wikimedia.org/w/index.php?curid=31780981"
  },
  "leukonychia": {
    "commonsTitle": "File:Leukonychia2.jpg",
    "credit": "Londonsista",
    "file": "signs/leukonychia.jpg",
    "licence": "Public domain",
    "source": "https://commons.wikimedia.org/w/index.php?curid=12887962"
  },
  "lymphadenopathy": {
    "commonsTitle": "File:Cervical lymphadenopathy right neck.png",
    "credit": "Coronation Dental Specialty Group",
    "file": "signs/lymphadenopathy.jpg",
    "licence": "CC BY-SA 4.0",
    "source": "https://commons.wikimedia.org/w/index.php?curid=77245466"
  },
  "onycholysis": {
    "commonsTitle": "File:Onycholysis.jpg",
    "credit": "Alborz Fallah",
    "file": "signs/onycholysis.jpg",
    "licence": "CC BY-SA 3.0",
    "source": "https://commons.wikimedia.org/w/index.php?curid=29036621"
  },
  "pallor": {
    "commonsTitle": "File:Anemia.JPG",
    "credit": "James Heilman, MD",
    "file": "signs/pallor.jpg",
    "licence": "CC BY-SA 3.0",
    "source": "https://commons.wikimedia.org/w/index.php?curid=10313974"
  },
  "palmar-erythema": {
    "commonsTitle": "File:Palmar erythema.jpg",
    "credit": "Jmarchn",
    "file": "signs/palmar-erythema.jpg",
    "licence": "CC BY-SA 3.0",
    "source": "https://commons.wikimedia.org/w/index.php?curid=133856309"
  },
  "splinter-haemorrhages": {
    "commonsTitle": "File:Splinter hemorrhage under the microscope.jpg",
    "credit": "Dptfhpwlf",
    "file": "signs/splinter-haemorrhages.jpg",
    "licence": "CC BY-SA 4.0",
    "source": "https://commons.wikimedia.org/w/index.php?curid=75455617"
  }
};
