/**
 * NetSignal - Universal entry point with automatic platform detection
 *
 * Build tools will tree-shake unused implementations:
 * - Web bundlers (webpack/vite) will use index.web.ts
 * - Metro (React Native) will use index.native.ts
 * - This file is the fallback with runtime detection
 *
 * @author Anivar A Aravind <ping@anivar.net>
 * @license MIT
 * @copyright 2025
 */

import type { BaseNetSignal } from './implementations/base';
import type {
  ConnectionType,
  ExtendedProbeResult,
  NetworkQuality,
  NetworkQualityInfo,
  NetworkStatus,
  ProbeOptions,
  ProbeResult,
} from './types';

// Runtime platform detection (only used as fallback)
const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';

// Dynamic import based on platform
let NetSignalImpl: new () => BaseNetSignal;

if (isWeb) {
  // Web environment - load only web implementation
  NetSignalImpl = require('./implementations/web').WebNetSignal;
} else {
  // Native environment - load only native implementation
  try {
    NetSignalImpl = require('./implementations/native').NativeNetSignal;
  } catch {
    // Fallback if React Native not available
    NetSignalImpl = require('./implementations/web').WebNetSignal;
  }
}

// Create singleton
const NetSignal = new NetSignalImpl();

export default NetSignal;

// Type exports
export type {
  ConnectionType,
  NetworkStatus,
  ProbeResult,
  NetworkQuality,
  NetworkQualityInfo,
  ExtendedProbeResult,
  ProbeOptions,
};

// Convenience exports
export const isConnected = () => NetSignal.isConnected();
export const getType = () => NetSignal.getType();
export const probe = (url: string, timeout?: number) => NetSignal.probe(url, timeout);
export const onChange = (callback: (status: NetworkStatus) => void) => NetSignal.onChange(callback);
