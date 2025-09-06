/**
 * Base interface for NetSignal implementations
 */

import type { ConnectionType, NetworkStatus, ProbeResult } from '../types';

export abstract class BaseNetSignal {
  abstract isConnected(): boolean;
  abstract getType(): ConnectionType;
  abstract probe(url: string, timeoutMs?: number): Promise<ProbeResult>;
  abstract onChange(callback: (status: NetworkStatus) => void): () => void;
}