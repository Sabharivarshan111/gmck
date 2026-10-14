import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
export interface Spec extends TurboModule {
  renderXray(path: string, contrast: number, brightness: number): Promise<string>;
  renderMri(plane: string, slice: number, contrast: number, brightness: number): Promise<string>;
}
export default TurboModuleRegistry.get<Spec>('OrbitRadiology');
