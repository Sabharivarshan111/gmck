import { REVIEWED_UNIVERSITY_QUESTIONS as batch01 } from './reviewedBatch01';
import { REVIEWED_UNIVERSITY_QUESTIONS_BATCH02 as batch02 } from './reviewedBatch02';
import { REVIEWED_UNIVERSITY_QUESTIONS_BATCH03 as batch03 } from './reviewedBatch03';
import type { ReviewedUniversityQuestion } from './types';

/** Explicitly approved batches only. The mechanical extraction queue is never imported. */
export const REVIEWED_UNIVERSITY_QUESTIONS: ReviewedUniversityQuestion[] = [...batch01, ...batch02, ...batch03];
