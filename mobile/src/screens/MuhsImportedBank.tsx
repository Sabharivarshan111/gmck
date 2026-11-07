import React from 'react';
import type { YearKey } from '@/lib/questionBank';
import { UnifiedImportedUniversityBank } from '@/screens/RguhsImportedBank';

/** Same reviewed + checksum-pinned offline bank used for RGUHS, scoped to MUHS. */
export default function MuhsImportedBank({ initialYear, onSwitchBack }: { initialYear: YearKey; onSwitchBack?: () => void }) {
  return <UnifiedImportedUniversityBank university="muhs" initialYear={initialYear} onSwitchBack={onSwitchBack} />;
}
