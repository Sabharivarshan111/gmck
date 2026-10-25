import { requireNativeComponent, type NativeSyntheticEvent, type ViewProps } from 'react-native';

export interface LocalSimulatorProps extends ViewProps {
  route: string;
  active: boolean;
  backRequest: number;
  initialPatient?: string;
  onStatus: (event: NativeSyntheticEvent<{ status: 'loading' | 'ready' | 'error' | 'exit' | 'vault' | 'patient' | 'premium'; patient?: string }>) => void;
}
/** Locally bundled canonical WebGL renderer, not a remote website or native OpenGL rewrite. */
export default requireNativeComponent<LocalSimulatorProps>('OrbitSimulator');
