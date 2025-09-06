/**
 * NetSignal Type Definitions
 * Shared across all platforms
 */

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