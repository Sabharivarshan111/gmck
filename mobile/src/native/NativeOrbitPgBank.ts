import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
export interface Spec extends TurboModule {
  /** Read only a bundled, checksum-pinned PG subject pack. No network or textbook export. */
  readPack(id: string, sha256: string): Promise<string>;
}
export default TurboModuleRegistry.get<Spec>('OrbitPgBank');
