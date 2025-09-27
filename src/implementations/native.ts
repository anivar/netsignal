/**
 * Native implementation for iOS/Android
 * Tree-shakable - no web dependencies
 */

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import { BaseNetSignal } from './base';
import type { ConnectionType, NetworkStatus, ProbeResult } from '../types';
import { NativeModuleError, InvalidURLError, InvalidTimeoutError, NetworkRequestError } from '../errors';

export class NativeNetSignal extends BaseNetSignal {
  private native = NativeModules.NetSignal || null;
  private emitter = this.native ? new NativeEventEmitter(NativeModules.NetSignal) : null;
  private listeners = new Map<string, any>();

  constructor() {
    super();
    if (!this.native) {
      const platform = Platform?.OS || 'unknown';
      console.warn(
        `NetSignal: Native module not available on ${platform}. ` +
        'Please ensure the native module is properly installed and linked.'
      );
    }
  }

  isConnected(): boolean {
    return this.native?.isConnected() ?? false;
  }

  getType(): ConnectionType {
    return this.native?.getConnectionType() ?? 'unknown';
  }

  async probe(url: string, timeoutMs = 5000): Promise<ProbeResult> {
    if (!this.native) {
      throw new NativeModuleError(Platform?.OS || 'unknown');
    }

    // Validate URL
    try {
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new InvalidURLError(url, 'Only HTTP/HTTPS protocols are supported');
      }
    } catch (error) {
      if (error instanceof InvalidURLError) {
        throw error;
      }
      throw new InvalidURLError(url);
    }

    // Validate timeout
    if (timeoutMs <= 0 || timeoutMs > 60000) {
      throw new InvalidTimeoutError(timeoutMs);
    }

    try {
      return await this.native.probe(url, timeoutMs);
    } catch (error: any) {
      throw new NetworkRequestError(url, error);
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
