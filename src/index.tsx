import { useEffect, useState, useRef } from 'react';
import { NativeEventEmitter, NativeModules } from 'react-native';
import NativeNetSignal from './NativeNetSignal';

export type ConnectionType = 'wifi' | 'cellular' | 'ethernet' | 'none' | 'unknown';

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

class NetSignalModule {
  private emitter: NativeEventEmitter;
  private listeners: Set<(event: NetworkChangeEvent) => void> = new Set();

  constructor() {
    this.emitter = new NativeEventEmitter(NativeModules.NetSignal);
  }

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
    if (this.listeners.size === 0) {
      NativeNetSignal.addListener('netSignalChange');
      this.emitter.addListener('netSignalChange', this.handleEvent);
    }

    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.emitter.removeAllListeners('netSignalChange');
        NativeNetSignal.removeListeners(1);
      }
    };
  }

  private handleEvent = (event: NetworkChangeEvent) => {
    this.listeners.forEach(listener => listener(event));
  };
}

const NetSignal = new NetSignalModule();

export function useNetworkState(): NetworkState {
  const [state, setState] = useState<NetworkState>(NetSignal.getSimpleSummary());

  useEffect(() => {
    setState(NetSignal.getSimpleSummary());

    return NetSignal.addEventListener((event) => {
      setState({
        connected: event.isConnected,
        type: event.type as ConnectionType,
        connectionCount: event.connectionCount,
        multipleConnections: event.connectionCount > 1,
      });
    });
  }, []);

  return state;
}

export function useIsConnected(): boolean {
  const { connected } = useNetworkState();
  return connected;
}

export function useConnectionType(): ConnectionType {
  const { type } = useNetworkState();
  return type;
}

export default NetSignal;