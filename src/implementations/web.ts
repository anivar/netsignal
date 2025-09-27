/**
 * Web-only implementation of NetSignal
 * Tree-shakable - no React Native dependencies
 */

import type { ConnectionType, NetworkStatus, ProbeResult } from '../types';
import { BaseNetSignal } from './base';

// Network Information API types
interface NetworkInformation {
  type?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  addEventListener?: (type: string, handler: () => void) => void;
  removeEventListener?: (type: string, handler: () => void) => void;
}

export class WebNetSignal extends BaseNetSignal {
  private listeners = new Map<string, (status: NetworkStatus) => void>();
  private state = {
    isConnected: typeof navigator !== 'undefined' ? navigator.onLine : true,
    type: 'unknown' as ConnectionType,
  };
  private globalHandlers: Array<() => void> = [];

  constructor() {
    super();
    if (typeof window !== 'undefined') {
      this.initWeb();
    }
  }

  isConnected(): boolean {
    return this.state.isConnected;
  }

  getType(): ConnectionType {
    return this.state.type;
  }

  async probe(url: string, timeoutMs = 5000): Promise<ProbeResult> {
    const start = Date.now();

    // Validate URL
    try {
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return {
          reachable: false,
          responseTime: -1,
          error: 'Invalid protocol. Only HTTP/HTTPS are supported',
        };
      }
    } catch (_error) {
      return {
        reachable: false,
        responseTime: -1,
        error: 'Invalid URL format',
      };
    }

    // Validate timeout
    if (timeoutMs <= 0 || timeoutMs > 60000) {
      return {
        reachable: false,
        responseTime: -1,
        error: 'Timeout must be between 1ms and 60000ms',
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'cors',
        cache: 'no-cache',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      return {
        reachable: response.ok,
        responseTime: Date.now() - start,
      };
    } catch (error) {
      return {
        reachable: false,
        responseTime: -1,
        error: error.name === 'AbortError' ? 'Request timeout' : error.message,
      };
    }
  }

  onChange(callback: (status: NetworkStatus) => void): () => void {
    const id = Math.random().toString(36);

    const handler = () => {
      this.updateState();
      callback({ isConnected: this.state.isConnected, type: this.state.type });
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

  private initWeb() {
    this.updateState();

    // Store handlers for cleanup
    const onlineHandler = () => this.updateState();
    const offlineHandler = () => this.updateState();

    window.addEventListener('online', onlineHandler);
    window.addEventListener('offline', offlineHandler);

    // Track handlers for cleanup
    this.globalHandlers.push(() => {
      window.removeEventListener('online', onlineHandler);
      window.removeEventListener('offline', offlineHandler);
    });

    const conn = (navigator as unknown as { connection?: NetworkInformation }).connection;
    if (conn) {
      const changeHandler = () => this.updateState();
      conn.addEventListener('change', changeHandler);
      this.globalHandlers.push(() => {
        conn.removeEventListener('change', changeHandler);
      });
    }
  }

  /**
   * Clean up all event listeners - call this when unmounting
   */
  public cleanup(): void {
    // Clean up global handlers
    for (const cleanup of this.globalHandlers) {
      cleanup();
    }
    this.globalHandlers = [];

    // Clean up all onChange listeners
    this.listeners.clear();
  }

  private updateState() {
    this.state.isConnected = navigator.onLine;

    if (!navigator.onLine) {
      this.state.type = 'none';
      return;
    }

    const conn = (navigator as unknown as { connection?: NetworkInformation }).connection;
    if (conn?.type) {
      this.state.type = conn.type;
    } else if (conn?.effectiveType) {
      this.state.type = conn.effectiveType.includes('g') ? 'cellular' : 'wifi';
    } else {
      this.state.type = 'unknown';
    }
  }
}
