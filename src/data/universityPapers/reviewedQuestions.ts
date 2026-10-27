import { REVIEWED_UNIVERSITY_QUESTIONS as batch01 } from './reviewedBatch01';
import { REVIEWED_UNIVERSITY_QUESTIONS_BATCH02 as batch02 } from './reviewedBatch02';
import { REVIEWED_UNIVERSITY_QUESTIONS_BATCH03 as batch03 } from './reviewedBatch03';
import { REVIEWED_UNIVERSITY_QUESTIONS_BATCH04 as batch04 } from './reviewedBatch04';
import { REVIEWED_UNIVERSITY_QUESTIONS_BATCH05 as batch05 } from './reviewedBatch05';
import { REVIEWED_UNIVERSITY_QUESTIONS_BATCH06 as batch06 } from './reviewedBatch06';
import { REVIEWED_UNIVERSITY_QUESTIONS_BATCH07 as batch07 } from './reviewedBatch07';
import { REVIEWED_UNIVERSITY_QUESTIONS_BATCH08 as batch08 } from './reviewedBatch08';
import { REVIEWED_UNIVERSITY_QUESTIONS_BATCH09 as batch09 } from './reviewedBatch09';
import { REVIEWED_UNIVERSITY_QUESTIONS_BATCH10 as batch10 } from './reviewedBatch10';
import type { ReviewedUniversityQuestion } from './types';

/** Explicitly approved batches only. The mechanical extraction queue is never imported. */
export const REVIEWED_UNIVERSITY_QUESTIONS: ReviewedUniversityQuestion[] = [...batch01, ...batch02, ...batch03, ...batch04, ...batch05, ...batch06, ...batch07, ...batch08, ...batch09, ...batch10];
