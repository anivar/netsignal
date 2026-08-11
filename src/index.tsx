import { useSyncExternalStore } from "react";
import { DeviceEventEmitter, Platform } from "react-native";
import type { Spec } from "./NativeNetSignal";
import NativeNetSignalOrNull from "./NativeNetSignal";

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
  type: ConnectionType;
  connectionCount: number;
};

// --- Native module access ---

/**
 * Throws with the reason rather than a `TypeError: null is not an object`.
 * The module is absent on iOS and web because this package implements Android
 * only; it is absent on Android only if autolinking did not pick it up.
 */
function requireNative(): Spec {
  if (NativeNetSignalOrNull == null) {
    throw new Error(
      Platform.OS === "android"
        ? "netsignal: the native module is not linked. Rebuild the app after installing (autolinking runs at build time, not at runtime)."
        : `netsignal: no implementation for ${Platform.OS}. This package supports Android only — guard your calls with Platform.OS === 'android'.`,
    );
  }
  return NativeNetSignalOrNull;
}

/** True where the native module is present, so callers can branch without try/catch. */
export const isSupported: boolean = NativeNetSignalOrNull != null;

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

/** @internal Only for unit tests; not part of the stable API. */
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
      const summary = requireNative().getSimpleSummary();
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
  const next: NetworkState = {
    connected: event.isConnected,
    type: event.type,
    connectionCount: event.connectionCount,
    multipleConnections: event.connectionCount > 1,
  };

  // Android fires onCapabilitiesChanged for signal-strength and metering
  // changes, several times a second on a moving device. Replacing the snapshot
  // unconditionally would give every useSyncExternalStore subscriber a new
  // object identity each time and re-render the tree for no visible change.
  if (
    next.connected === currentState.connected &&
    next.type === currentState.type &&
    next.connectionCount === currentState.connectionCount
  ) {
    return;
  }

  currentState = next;
  notifyStoreListeners();
}

function startNativeListener(): void {
  if (nativeSubscription === null) {
    const native = requireNative();
    native.addListener("netSignalChange");
    const subscription = DeviceEventEmitter.addListener(
      "netSignalChange",
      handleNativeEvent,
    );
    nativeSubscription = () => {
      subscription.remove();
      native.removeListeners(1);
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
    // The cached snapshot is only kept fresh by the native callback that was
    // just torn down. Without this, a screen mounted later reads whatever the
    // network looked like when the last one unmounted, and keeps reading it
    // until the next change event.
    initialized = false;
  }
}

function subscribe(listener: () => void): () => void {
  initState();
  storeListeners.add(listener);
  startNativeListener();

  // React calls the returned function exactly once, but the same is not true of
  // hand-written callers of addEventListener. A second call must not decrement
  // the shared count again and tear the native listener out from under everyone
  // else.
  let unsubscribed = false;
  return () => {
    if (unsubscribed) return;
    unsubscribed = true;
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
    return requireNative().isConnected();
  }

  getConnectionType(): ConnectionType {
    return requireNative().getConnectionType() as ConnectionType;
  }

  getActiveConnectionCount(): number {
    return requireNative().getActiveConnectionCount();
  }

  hasMultipleConnections(): boolean {
    return requireNative().hasMultipleConnections();
  }

  getSimpleSummary(): NetworkState {
    const summary = requireNative().getSimpleSummary();
    return {
      connected: summary.connected,
      type: summary.type as ConnectionType,
      connectionCount: summary.connectionCount,
      multipleConnections: summary.multipleConnections,
    };
  }

  async getAllActiveConnections(): Promise<Connection[]> {
    const result = await requireNative().getAllActiveConnections();
    return result.connections;
  }

  addEventListener(listener: (event: NetworkChangeEvent) => void): () => void {
    initState();
    startNativeListener();

    const emitterSubscription = DeviceEventEmitter.addListener(
      "netSignalChange",
      listener,
    );

    let unsubscribed = false;
    return () => {
      if (unsubscribed) return;
      unsubscribed = true;
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
