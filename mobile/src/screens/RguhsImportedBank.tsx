import React from 'react';
import type { YearKey } from '@/lib/questionBank';
import OfflineUniversityBankScreen from '@/screens/OfflineUniversityBankScreen';

/** All imported RGUHS questions now use checksum-verified APK assets, not Supabase at runtime. */
export default function RguhsImportedBank({ initialYear, onSwitchBack }: {initialYear: YearKey;onSwitchBack:()=>void}) {
  return <OfflineUniversityBankScreen university="rguhs" initialYear={initialYear} onSwitchBack={onSwitchBack}/>;
}
