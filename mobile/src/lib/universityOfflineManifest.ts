// Build-time placeholder. The release MUST replace this with the database snapshot.
// scripts/check-university-offline-artifact.py rejects an empty manifest/APK.
import type {OfflineUniversityManifest} from './universityOfflineTypes';
export const UNIVERSITY_OFFLINE_MANIFEST: OfflineUniversityManifest = {
  schema:1,sourceCounts:{},rawCount:0,duplicatesRemoved:0,
  totals:{muhs:0,rguhs:0},packs:[],
};
