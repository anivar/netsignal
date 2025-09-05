import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import type {
  NetworkStatus,
  NetworkDetails,
  ConnectionType,
  ConnectionQuality,
  ProbeResult,
  SpeedTestResult,
  EndpointConfig,
  NetSignalConfig,
} from './NativeNetSignal';

// Import the native module
const LINKING_ERROR =
  `The package 'netsignal' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const NetSignalModule = NativeModules.NetSignal
  ? NativeModules.NetSignal
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

// Create event emitter
const eventEmitter = new NativeEventEmitter(NetSignalModule);

// Event types
export type NetSignalEventType =
  | 'connectionChange'
  | 'connectivityChange'
  | 'speedTestComplete'
  | 'endpointStatusChange'
  | 'qualityChange';

export interface NetSignalEvents {
  connectionChange: (status: NetworkStatus) => void;
  connectivityChange: (isConnected: boolean) => void;
  speedTestComplete: (result: SpeedTestResult) => void;
  endpointStatusChange: (endpoint: string, result: ProbeResult) => void;
  qualityChange: (quality: ConnectionQuality) => void;
}

class NetSignalClass {
  private listeners: Map<string, any> = new Map();
  private isMonitoring: boolean = false;
  private config: NetSignalConfig = {};

  constructor() {
    // Initialize the native module
    this.initialize();
  }

  private async initialize() {
    try {
      const constants = await NetSignalModule.getConstants();
      console.log('NetSignal initialized:', constants);
    } catch (error) {
      console.error('Failed to initialize NetSignal:', error);
    }
  }

  // Synchronous methods
  isConnected(): boolean {
    return NetSignalModule.isConnected();
  }

  getConnectionType(): ConnectionType {
    return NetSignalModule.getConnectionType();
  }

  getCurrentStatus(): NetworkStatus {
    return NetSignalModule.getCurrentStatus();
  }

  // Asynchronous methods
  async getStatus(): Promise<NetworkStatus> {
    return NetSignalModule.getNetworkStatus();
  }

  async probe(url: string, timeout: number = 5000): Promise<ProbeResult> {
    return NetSignalModule.probeEndpoint(url, timeout);
  }

  async probeMultiple(endpoints: string[]): Promise<ProbeResult[]> {
    return NetSignalModule.probeMultipleEndpoints(endpoints);
  }

  async speedTest(): Promise<SpeedTestResult> {
    return NetSignalModule.performSpeedTest();
  }

  async configure(config: NetSignalConfig): Promise<void> {
    this.config = { ...this.config, ...config };
    return NetSignalModule.configure(this.config);
  }

  // Monitoring
  startMonitoring(intervalMs: number = 5000): void {
    if (this.isMonitoring) {
      console.warn('NetSignal monitoring is already active');
      return;
    }
    
    NetSignalModule.startMonitoring(intervalMs);
    this.isMonitoring = true;
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) {
      console.warn('NetSignal monitoring is not active');
      return;
    }
    
    NetSignalModule.stopMonitoring();
    this.isMonitoring = false;
  }

  // Event handling
  addEventListener<T extends keyof NetSignalEvents>(
    eventType: T,
    handler: NetSignalEvents[T]
  ): () => void {
    const subscription = eventEmitter.addListener(eventType, handler);
    const listenerId = `${eventType}_${Date.now()}`;
    this.listeners.set(listenerId, subscription);

    // Return unsubscribe function
    return () => {
      subscription.remove();
      this.listeners.delete(listenerId);
    };
  }

  removeAllListeners(): void {
    this.listeners.forEach((subscription) => subscription.remove());
    this.listeners.clear();
  }

  // Utility methods
  async waitForConnection(timeoutMs: number = 30000): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.isConnected()) {
        resolve(true);
        return;
      }

      const timeout = setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, timeoutMs);

      const unsubscribe = this.addEventListener('connectivityChange', (isConnected) => {
        if (isConnected) {
          clearTimeout(timeout);
          unsubscribe();
          resolve(true);
        }
      });
    });
  }

  async isEndpointReachable(url: string, timeout: number = 3000): Promise<boolean> {
    try {
      const result = await this.probe(url, timeout);
      return result.reachable;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
const NetSignal = new NetSignalClass();

export default NetSignal;
export {
  NetworkStatus,
  NetworkDetails,
  ConnectionType,
  ConnectionQuality,
  ProbeResult,
  SpeedTestResult,
  EndpointConfig,
  NetSignalConfig,
};