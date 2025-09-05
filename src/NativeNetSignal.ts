import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export type ConnectionType = 
  | 'none'
  | 'unknown'
  | 'cellular'
  | 'wifi'
  | 'bluetooth'
  | 'ethernet'
  | 'wimax'
  | 'vpn'
  | 'other';

export type ConnectionQuality =
  | 'unknown'
  | 'poor'
  | 'fair'
  | 'good'
  | 'excellent';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: ConnectionType;
  quality: ConnectionQuality;
  details: NetworkDetails;
}

export interface NetworkDetails {
  isConnectionExpensive: boolean;
  cellularGeneration?: '2g' | '3g' | '4g' | '5g' | 'unknown';
  signalStrength?: number; // 0-100
  downloadBandwidthKbps?: number;
  uploadBandwidthKbps?: number;
  latencyMs?: number;
  ssid?: string;
  ipAddress?: string;
  subnet?: string;
  isVpnActive?: boolean;
  isAirplaneMode?: boolean;
}

export interface ProbeResult {
  endpoint: string;
  reachable: boolean;
  responseTimeMs: number;
  statusCode?: number;
  error?: string;
}

export interface SpeedTestResult {
  downloadSpeedMbps: number;
  uploadSpeedMbps: number;
  latencyMs: number;
  jitterMs: number;
  packetLoss: number;
  testDurationMs: number;
  timestamp: number;
}

export interface EndpointConfig {
  url: string;
  method?: 'HEAD' | 'GET' | 'POST';
  timeout?: number;
  headers?: Record<string, string>;
  critical?: boolean;
}

export interface NetSignalConfig {
  endpoints?: Record<string, EndpointConfig>;
  checkInterval?: number;
  enableSpeedTest?: boolean;
  speedTestInterval?: number;
  enableDebugLogs?: boolean;
  offlineQueueSize?: number;
  thresholds?: {
    minDownloadSpeedMbps?: number;
    maxLatencyMs?: number;
    maxPacketLoss?: number;
  };
}

export interface Spec extends TurboModule {
  // Constants
  getConstants(): {
    isNativeModuleLoaded: boolean;
    platformVersion: string;
  };

  // Synchronous methods for immediate status
  isConnected(): boolean;
  getConnectionType(): ConnectionType;
  getCurrentStatus(): NetworkStatus;

  // Asynchronous methods
  getNetworkStatus(): Promise<NetworkStatus>;
  probeEndpoint(url: string, timeoutMs?: number): Promise<ProbeResult>;
  probeMultipleEndpoints(endpoints: string[]): Promise<ProbeResult[]>;
  performSpeedTest(): Promise<SpeedTestResult>;
  
  // Configuration
  configure(config: NetSignalConfig): Promise<void>;
  
  // Monitoring control
  startMonitoring(intervalMs?: number): void;
  stopMonitoring(): void;
  
  // Event emitter methods (required for Turbo Modules)
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NetSignal');