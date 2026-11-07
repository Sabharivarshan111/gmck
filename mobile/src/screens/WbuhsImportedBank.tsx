import React from 'react';
import type { YearKey } from '@/lib/questionBank';
import { UnifiedImportedUniversityBank } from '@/screens/RguhsImportedBank';

/** Reviewed WBUHS questions are always bundled; scanned OCR rows cache after download. */
export default function WbuhsImportedBank({ initialYear, onSwitchBack }: {
  initialYear: YearKey;
  onSwitchBack?: () => void;
}) {
  return <UnifiedImportedUniversityBank university="wbuhs" initialYear={initialYear} onSwitchBack={onSwitchBack} />;
}
