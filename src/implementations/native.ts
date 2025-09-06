/**
 * Native implementation for iOS/Android
 * Tree-shakable - no web dependencies
 */

import { NativeModules, NativeEventEmitter } from 'react-native';
import { BaseNetSignal } from './base';
import type { ConnectionType, NetworkStatus, ProbeResult } from '../types';

export class NativeNetSignal extends BaseNetSignal {
  private native = NativeModules.NetSignal || null;
  private emitter = this.native ? new NativeEventEmitter(NativeModules.NetSignal) : null;
  private listeners = new Map<string, any>();

  isConnected(): boolean {
    return this.native?.isConnected() ?? false;
  }

  getType(): ConnectionType {
    return this.native?.getConnectionType() ?? 'unknown';
  }

  async probe(url: string, timeoutMs = 5000): Promise<ProbeResult> {
    if (!this.native) {
      return { reachable: false, responseTime: -1, error: 'Native module not available' };
    }
    
    try {
      return await this.native.probe(url, timeoutMs);
    } catch (error: any) {
      return { reachable: false, responseTime: -1, error: error.message };
    }
  }

  onChange(callback: (status: NetworkStatus) => void): () => void {
    if (!this.emitter) {
      return () => {};
    }
    
    const id = Math.random().toString(36);
    const subscription = this.emitter.addListener('connectionChange', callback);
    this.listeners.set(id, subscription);
    
    return () => {
      subscription.remove();
      this.listeners.delete(id);
    };
  }
}