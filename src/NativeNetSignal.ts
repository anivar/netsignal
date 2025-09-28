import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  isConnected(): boolean;
  getConnectionType(): string;
  getActiveConnectionCount(): number;
  hasMultipleConnections(): boolean;
  getSimpleSummary(): {
    connected: boolean;
    type: string;
    connectionCount: number;
    multipleConnections: boolean;
  };
  getAllActiveConnections(): Promise<{
    connections: Array<{
      type: string;
      hasInternet: boolean;
      isMetered: boolean;
    }>;
  }>;
  addListener(eventType: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NetSignal');
