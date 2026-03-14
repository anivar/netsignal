import { useSyncExternalStore } from "react";
import { DeviceEventEmitter } from "react-native";
import NativeNetSignal from "./NativeNetSignal";

export type ConnectionType =
  | "wifi"
  | "cellular"
  | "ethernet"
  | "none"
  | "unknown";

export interface NetworkState {
  connected: boolean;
  type: ConnectionType;
  connectionCount: number;
  multipleConnections: boolean;
}

export interface Connection {
  type: string;
  hasInternet: boolean;
  isMetered: boolean;
}

export type NetworkChangeEvent = {
  isConnected: boolean;
  type: string;
  connectionCount: number;
};

// --- Module-level shared store ---

let currentState: NetworkState = {
  connected: false,
  type: "unknown",
  connectionCount: 0,
  multipleConnections: false,
};

let initialized = false;
const storeListeners = new Set<() => void>();
let nativeSubscription: (() => void) | null = null;
let nativeListenerCount = 0;

export function _resetForTesting(): void {
  currentState = {
    connected: false,
    type: "unknown",
    connectionCount: 0,
    multipleConnections: false,
  };
  initialized = false;
  storeListeners.clear();
  if (nativeSubscription !== null) {
    nativeSubscription();
    nativeSubscription = null;
  }
  nativeListenerCount = 0;
}

function initState(): void {
  if (!initialized) {
    try {
      const summary = NativeNetSignal.getSimpleSummary();
      currentState = {
        connected: summary.connected,
        type: summary.type as ConnectionType,
        connectionCount: summary.connectionCount,
        multipleConnections: summary.multipleConnections,
      };
    } catch (_e) {
      // Keep default state if native module not available
    }
    initialized = true;
  }
}

function notifyStoreListeners(): void {
  for (const listener of storeListeners) {
    listener();
  }
}

function handleNativeEvent(event: NetworkChangeEvent): void {
  currentState = {
    connected: event.isConnected,
    type: event.type as ConnectionType,
    connectionCount: event.connectionCount,
    multipleConnections: event.connectionCount > 1,
  };
  notifyStoreListeners();
}

function startNativeListener(): void {
  if (nativeSubscription === null) {
    NativeNetSignal.addListener("netSignalChange");
    const subscription = DeviceEventEmitter.addListener(
      "netSignalChange",
      handleNativeEvent,
    );
    nativeSubscription = () => {
      subscription.remove();
      NativeNetSignal.removeListeners(1);
    };
  }
  nativeListenerCount++;
}

function stopNativeListener(): void {
  nativeListenerCount--;
  if (nativeListenerCount <= 0) {
    nativeListenerCount = 0;
    if (nativeSubscription !== null) {
      nativeSubscription();
      nativeSubscription = null;
    }
  }
}

function subscribe(listener: () => void): () => void {
  initState();
  storeListeners.add(listener);
  startNativeListener();

  return () => {
    storeListeners.delete(listener);
    stopNativeListener();
  };
}

function getSnapshot(): NetworkState {
  initState();
  return currentState;
}

// --- Public API class ---

class NetSignalModule {
  isConnected(): boolean {
    return NativeNetSignal.isConnected();
  }

  getConnectionType(): ConnectionType {
    return NativeNetSignal.getConnectionType() as ConnectionType;
  }

  getActiveConnectionCount(): number {
    return NativeNetSignal.getActiveConnectionCount();
  }

  hasMultipleConnections(): boolean {
    return NativeNetSignal.hasMultipleConnections();
  }

  getSimpleSummary(): NetworkState {
    const summary = NativeNetSignal.getSimpleSummary();
    return {
      connected: summary.connected,
      type: summary.type as ConnectionType,
      connectionCount: summary.connectionCount,
      multipleConnections: summary.multipleConnections,
    };
  }

  async getAllActiveConnections(): Promise<Connection[]> {
    const result = await NativeNetSignal.getAllActiveConnections();
    return result.connections;
  }

  addEventListener(listener: (event: NetworkChangeEvent) => void): () => void {
    initState();
    startNativeListener();

    const emitterSubscription = DeviceEventEmitter.addListener(
      "netSignalChange",
      listener,
    );

    return () => {
      emitterSubscription.remove();
      stopNativeListener();
    };
  }
}

const NetSignal = new NetSignalModule();

// --- Hooks (shared store via useSyncExternalStore) ---

export function useNetworkState(): NetworkState {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function useIsConnected(): boolean {
  return useSyncExternalStore(subscribe, () => getSnapshot().connected);
}

export function useConnectionType(): ConnectionType {
  return useSyncExternalStore(subscribe, () => getSnapshot().type);
}

export default NetSignal;
