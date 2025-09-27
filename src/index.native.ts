/**
 * Native-only entry point (iOS/Android)
 * Metro bundler will use this for React Native builds
 * Web code is completely excluded
 */

import { NativeNetSignal } from './implementations/native';
export type { ConnectionType, NetworkStatus, ProbeResult } from './types';

// Singleton instance
const NetSignal = new NativeNetSignal();

export default NetSignal;

// Convenience exports
export const isConnected = () => NetSignal.isConnected();
export const getType = () => NetSignal.getType();
export const probe = (url: string, timeout?: number) => NetSignal.probe(url, timeout);
export const onChange = (callback: (status: any) => void) => NetSignal.onChange(callback);
