/**
 * NetSignal Turbo Module Specification
 * React Native New Architecture (Fabric/TurboModules)
 */

import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  // Synchronous methods (instant, cached)
  isConnected(): boolean;
  getConnectionType(): string;

  // Asynchronous methods
  probe(url: string, timeoutMs: number): Promise<Object>;

  // Event subscription (handled by NativeEventEmitter)
  addListener: (eventName: string) => void;
  removeListeners: (count: number) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NetSignal');