import { useEffect, useState, useCallback, useRef } from 'react';
import NetSignal, { NetworkStatus, ExtendedProbeResult, NetworkQuality } from './index';
import { getQualityFromLatency, probeWithRetry } from './utils/network-quality';
import { DEFAULT_PROBE_URLS } from './constants';

/**
 * React hook for network status
 * @returns Current network status including connection state and type
 *
 * @example
 * ```tsx
 * const { isConnected, type } = useNetSignal();
 *
 * if (!isConnected) {
 *   return <Text>You're offline</Text>;
 * }
 * ```
 */
export function useNetSignal(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(() => ({
    isConnected: NetSignal.isConnected(),
    type: NetSignal.getType(),
  }));

  useEffect(() => {
    // Update immediately with current status
    setStatus({
      isConnected: NetSignal.isConnected(),
      type: NetSignal.getType(),
    });

    // Subscribe to changes
    const unsubscribe = NetSignal.onChange((newStatus: NetworkStatus) => {
      setStatus(newStatus);
    });

    return unsubscribe;
  }, []);

  return status;
}

/**
 * React hook for monitoring endpoint reachability
 * @param url URL to monitor
 * @param options Monitoring options
 * @returns Probe result, loading state, and manual probe function
 *
 * @example
 * ```tsx
 * const { result, isLoading, probe } = useNetworkProbe('https://api.example.com', {
 *   interval: 30000, // Check every 30 seconds
 *   timeout: 5000,
 *   retries: 2
 * });
 *
 * if (!result?.reachable) {
 *   return <Text>API is unreachable</Text>;
 * }
 * ```
 */
export function useNetworkProbe(
  url: string,
  options: {
    interval?: number; // How often to probe (ms)
    timeout?: number;
    retries?: number;
    retryDelay?: number;
    enabled?: boolean; // Whether to auto-probe
  } = {}
): {
  result: ExtendedProbeResult | null;
  isLoading: boolean;
  probe: () => Promise<void>;
} {
  const {
    interval = 0, // No auto-probe by default
    timeout = 5000,
    retries = 0,
    retryDelay = 1000,
    enabled = true,
  } = options;

  const [result, setResult] = useState<ExtendedProbeResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  const probe = useCallback(async () => {
    if (!url || !enabled) {return;}

    setIsLoading(true);
    try {
      const probeResult = await probeWithRetry(
        NetSignal.probe.bind(NetSignal),
        url,
        { timeout, retries, retryDelay }
      );
      setResult(probeResult);
    } catch (error: any) {
      setResult({
        reachable: false,
        responseTime: -1,
        error: error.message,
        attempts: retries + 1,
        quality: 'unknown',
      });
    } finally {
      setIsLoading(false);
    }
  }, [url, timeout, retries, retryDelay, enabled]);

  useEffect(() => {
    if (!enabled) {return;}

    // Initial probe
    probe();

    // Set up interval if specified
    if (interval > 0) {
      intervalRef.current = setInterval(probe, interval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [probe, interval, enabled]);

  return { result, isLoading, probe };
}

/**
 * React hook for monitoring network quality
 * @param testUrl Optional URL to use for quality testing
 * @param options Quality monitoring options
 * @returns Network quality information
 *
 * @example
 * ```tsx
 * const { quality, latency, isChecking } = useNetworkQuality('https://cdn.example.com', {
 *   sampleSize: 5, // Take 5 samples
 *   interval: 60000, // Check every minute
 * });
 *
 * if (quality === 'poor') {
 *   return <Text>Poor network quality detected</Text>;
 * }
 * ```
 */
export function useNetworkQuality(
  testUrl?: string,
  options: {
    sampleSize?: number; // Number of samples to take
    interval?: number; // How often to check quality (ms)
    enabled?: boolean;
  } = {}
): {
  quality: NetworkQuality;
  latency: number | null;
  jitter: number | null;
  isChecking: boolean;
  checkQuality: () => Promise<void>;
} {
  const {
    sampleSize = 3,
    interval = 0,
    enabled = true,
  } = options;

  const [quality, setQuality] = useState<NetworkQuality>('unknown');
  const [latency, setLatency] = useState<number | null>(null);
  const [jitter, setJitter] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  const checkQuality = useCallback(async () => {
    if (!enabled) {return;}

    const url = testUrl || DEFAULT_PROBE_URLS.primary;
    const samples: number[] = [];

    setIsChecking(true);
    try {
      for (let i = 0; i < sampleSize; i++) {
        if (i > 0) {
          // Small delay between samples
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        try {
          const result = await NetSignal.probe(url, 5000);
          if (result.reachable && result.responseTime > 0) {
            samples.push(result.responseTime);
          }
        } catch {
          // Ignore individual failures
        }
      }

      if (samples.length > 0) {
        const avgLatency = samples.reduce((sum, s) => sum + s, 0) / samples.length;
        setLatency(Math.round(avgLatency));
        setQuality(getQualityFromLatency(avgLatency));

        // Calculate jitter if we have multiple samples
        if (samples.length > 1) {
          let jitterSum = 0;
          for (let i = 1; i < samples.length; i++) {
            jitterSum += Math.abs(samples[i] - samples[i - 1]);
          }
          setJitter(Math.round(jitterSum / (samples.length - 1)));
        }
      }
    } finally {
      setIsChecking(false);
    }
  }, [testUrl, sampleSize, enabled]);

  useEffect(() => {
    if (!enabled) {return;}

    // Initial check
    checkQuality();

    // Set up interval if specified
    if (interval > 0) {
      intervalRef.current = setInterval(checkQuality, interval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkQuality, interval, enabled]);

  return { quality, latency, jitter, isChecking, checkQuality };
}
