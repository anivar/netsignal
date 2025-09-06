import { useEffect, useState } from 'react';
import NetSignal, { NetworkStatus } from './index';

/**
 * React hook for network status
 */
export function useNetSignal(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(() => ({
    isConnected: NetSignal.isConnected(),
    type: NetSignal.getType()
  }));

  useEffect(() => {
    // Update immediately with current status
    setStatus({
      isConnected: NetSignal.isConnected(),
      type: NetSignal.getType()
    });

    // Subscribe to changes
    const unsubscribe = NetSignal.onChange((newStatus) => {
      setStatus(newStatus);
    });

    return unsubscribe;
  }, []);

  return status;
}