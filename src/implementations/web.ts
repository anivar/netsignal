/**
 * Web-only implementation of NetSignal
 * Tree-shakable - no React Native dependencies
 */

import { BaseNetSignal } from './base';
import type { ConnectionType, NetworkStatus, ProbeResult } from '../types';

export class WebNetSignal extends BaseNetSignal {
  private listeners = new Map<string, any>();
  private state = {
    isConnected: typeof navigator !== 'undefined' ? navigator.onLine : true,
    type: 'unknown' as ConnectionType
  };

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
    
    window.addEventListener('online', () => this.updateState());
    window.addEventListener('offline', () => this.updateState());
    
    const conn = (navigator as any).connection;
    if (conn) {
      conn.addEventListener('change', () => this.updateState());
    }
  }

  private updateState() {
    this.state.isConnected = navigator.onLine;
    
    if (!navigator.onLine) {
      this.state.type = 'none';
      return;
    }
    
    const conn = (navigator as any).connection;
    if (conn?.type) {
      this.state.type = conn.type;
    } else if (conn?.effectiveType) {
      this.state.type = conn.effectiveType.includes('g') ? 'cellular' : 'wifi';
    } else {
      this.state.type = 'unknown';
    }
  }
}