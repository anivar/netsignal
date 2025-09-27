/**
 * NetSignal Type Definitions
 * Shared across all platforms
 */

export type ConnectionType = 'wifi' | 'cellular' | 'ethernet' | 'none' | 'unknown';

export type NetworkQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';

export interface NetworkStatus {
  isConnected: boolean;
  type: ConnectionType;
  quality?: NetworkQuality;
}

export interface ProbeResult {
  reachable: boolean;
  responseTime: number;
  error?: string;
}

export interface ProbeOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface NetworkQualityInfo {
  quality: NetworkQuality;
  downloadSpeed?: number; // Mbps
  uploadSpeed?: number; // Mbps
  latency?: number; // ms
  packetLoss?: number; // percentage
  jitter?: number; // ms
}

export interface ExtendedProbeResult extends ProbeResult {
  attempts?: number;
  averageResponseTime?: number;
  minResponseTime?: number;
  maxResponseTime?: number;
  quality?: NetworkQuality;
}
