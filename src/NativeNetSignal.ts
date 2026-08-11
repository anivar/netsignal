import type { TurboModule } from "react-native";
import { TurboModuleRegistry } from "react-native";

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

// `get`, not `getEnforcing`. This package is Android only, and `getEnforcing`
// throws from module scope — so on iOS or web merely *importing* the package
// crashes the app, before any `Platform.OS` check a caller might write. `get`
// returns null there instead, and index.tsx raises an error naming the platform
// only when a method is actually called.
export default TurboModuleRegistry.get<Spec>("NetSignal");
