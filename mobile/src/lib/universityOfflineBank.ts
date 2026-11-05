import PgBank from '@/native/NativeOrbitPgBank';
import { UNIVERSITY_OFFLINE_MANIFEST } from './universityOfflineManifest';
import type { OfflineUniversity,OfflineUniversityYear,OfflineUniversityQuestion } from './universityOfflineTypes';

export { UNIVERSITY_OFFLINE_MANIFEST };
const pending = new Map<string,Promise<OfflineUniversityQuestion[]>>();

export function offlineUniversitySubjects(university: OfflineUniversity, year: OfflineUniversityYear) {
  return UNIVERSITY_OFFLINE_MANIFEST.packs.filter(pack => pack.university === university && pack.year === year);
}
export async function loadUniversityOfflineSubject(university:OfflineUniversity,year:OfflineUniversityYear,subject:string) {
  const meta=offlineUniversitySubjects(university,year).find(pack=>pack.subject===subject);
  if(!meta)throw new Error('University questions were not bundled in this build. Install the newer Android release.');
  if(!PgBank)throw new Error('Native offline university reader is missing from this Android version.');
  const previous=pending.get(meta.id);
  if(previous)return previous;
  const task=(async()=>{
    const result=JSON.parse(await PgBank.readUniversityPack(meta.id,meta.sha256));
    if(!Array.isArray(result)||result.length!==meta.count||result.some(item=>
      item.university!==university||item.year!==year||item.subject!==subject))
      throw new Error('Offline university pack inventory mismatch for '+subject);
    return result as OfflineUniversityQuestion[];
  })();
  pending.set(meta.id,task);
  try{return await task;}catch(error){pending.delete(meta.id);throw error;}
}
