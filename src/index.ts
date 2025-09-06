/**
 * NetSignal - Instant Network Detection for React Native
 *
 * @author Anivar A Aravind <ping@anivar.net>
 * @license MIT
 * @copyright 2025 Anivar A Aravind
 *
 * Ultra-lean network detection with Turbo Module support
 * Provides instant (<1ms) network status checks across all platforms
 */

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

// ============================================
// Types
// ============================================

export type ConnectionType = 'wifi' | 'cellular' | 'ethernet' | 'none' | 'unknown';

export interface NetworkStatus {
  isConnected: boolean;
  type: ConnectionType;
}

export interface ProbeResult {
  reachable: boolean;
  responseTime: number;
  error?: string;
}

// ============================================
// Platform Detection
// ============================================

const PLATFORM = {
  isWeb: Platform.OS === 'web',
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',
  hasNative: NativeModules.NetSignal != null
};

// ============================================
// Implementation
// ============================================

class NetSignalImpl {
  private native = PLATFORM.hasNative ? NativeModules.NetSignal : null;
  private emitter = PLATFORM.hasNative ? new NativeEventEmitter(NativeModules.NetSignal) : null;
  private listeners = new Map<string, any>();

  // Cached state for web
  private webState = {
    isConnected: typeof navigator !== 'undefined' ? navigator.onLine : true,
    type: 'unknown' as ConnectionType
  };

  constructor() {
    if (PLATFORM.isWeb) {
      this.initWeb();
    }
  }

  // ============================================
  // Core API
  // ============================================

  /**
   * Check connection status - instant from cache
   */
  isConnected(): boolean {
    if (PLATFORM.isWeb) {
      return this.webState.isConnected;
    }
    return this.native?.isConnected() ?? false;
  }

  /**
   * Get connection type - instant from cache
   */
  getType(): ConnectionType {
    if (PLATFORM.isWeb) {
      return this.webState.type;
    }
    return this.native?.getConnectionType() ?? 'unknown';
  }

  /**
   * Probe endpoint reachability
   */
  async probe(url: string, timeoutMs = 5000): Promise<ProbeResult> {
    if (PLATFORM.isWeb) {
      return this.probeWeb(url, timeoutMs);
    }

    if (!this.native) {
      return { reachable: false, responseTime: -1, error: 'Not supported' };
    }

    try {
      return await this.native.probe(url, timeoutMs);
    } catch (error: any) {
      return { reachable: false, responseTime: -1, error: error.message };
    }
  }

  /**
   * Listen to network changes
   */
  onChange(callback: (status: NetworkStatus) => void): () => void {
    const id = Math.random().toString(36);

    if (PLATFORM.isWeb) {
      const handler = () => {
        this.updateWebState();
        callback({ isConnected: this.webState.isConnected, type: this.webState.type });
      };

      window.addEventListener('online', handler);
      window.addEventListener('offline', handler);
      this.listeners.set(id, handler);

      return () => {
        window.removeEventListener('online', handler);
        window.removeEventListener('offline', handler);
        this.listeners.delete(id);
      };
    }

    if (this.emitter) {
      const subscription = this.emitter.addListener('connectionChange', callback);
      this.listeners.set(id, subscription);

      return () => {
        subscription.remove();
        this.listeners.delete(id);
      };
    }

    return () => {};
  }

  // ============================================
  // Web Implementation
  // ============================================

  private initWeb() {
    if (typeof window === 'undefined') return;

    // Update state on load
    this.updateWebState();

    // Listen for changes
    window.addEventListener('online', () => this.updateWebState());
    window.addEventListener('offline', () => this.updateWebState());

    // Network Information API
    const conn = (navigator as any).connection;
    if (conn) {
      conn.addEventListener('change', () => this.updateWebState());
    }
  }

  private updateWebState() {
    this.webState.isConnected = navigator.onLine;

    if (!navigator.onLine) {
      this.webState.type = 'none';
      return;
    }

    const conn = (navigator as any).connection;
    if (conn?.type) {
      this.webState.type = conn.type;
    } else if (conn?.effectiveType) {
      this.webState.type = conn.effectiveType.includes('g') ? 'cellular' : 'wifi';
    } else {
      this.webState.type = 'unknown';
    }
  }

  private async probeWeb(url: string, timeoutMs: number): Promise<ProbeResult> {
    const start = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'cors',
        cache: 'no-cache',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      return {
        reachable: response.ok,
        responseTime: Date.now() - start
      };
    } catch (error: any) {
      return {
        reachable: false,
        responseTime: -1,
        error: error.message
      };
    }
  }
}

// ============================================
// Singleton Export
// ============================================

const NetSignal = new NetSignalImpl();

export default NetSignal;

// Convenience exports
export const isConnected = () => NetSignal.isConnected();
export const getType = () => NetSignal.getType();
export const probe = (url: string, timeout?: number) => NetSignal.probe(url, timeout);
export const onChange = (callback: (status: NetworkStatus) => void) => NetSignal.onChange(callback);