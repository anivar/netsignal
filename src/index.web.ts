/**
 * Web-only entry point
 * Webpack/Vite will use this for web builds
 * Native code is completely excluded
 */

import { WebNetSignal } from './implementations/web';
export type { ConnectionType, NetworkStatus, ProbeResult } from './types';

// Singleton instance
const NetSignal = new WebNetSignal();

export default NetSignal;

// Convenience exports
export const isConnected = () => NetSignal.isConnected();
export const getType = () => NetSignal.getType();
export const probe = (url: string, timeout?: number) => NetSignal.probe(url, timeout);
export const onChange = (callback: (status: any) => void) => NetSignal.onChange(callback);