import React from 'react';
import type { YearKey } from '@/lib/questionBank';
import OfflineUniversityBankScreen from '@/screens/OfflineUniversityBankScreen';

/** All imported MUHS questions now use checksum-verified APK assets, not Supabase at runtime. */
export default function MuhsImportedBank({ initialYear, onSwitchBack }: {initialYear: YearKey;onSwitchBack:()=>void}) {
  return <OfflineUniversityBankScreen university="muhs" initialYear={initialYear} onSwitchBack={onSwitchBack}/>;
}
