import { useEffect, useState, useRef, useCallback } from 'react';
import NetSignal from './index';
import type {
  NetworkStatus,
  ConnectionQuality,
  SpeedTestResult,
  ProbeResult,
  NetSignalConfig,
} from './NativeNetSignal';

export interface UseNetSignalOptions extends NetSignalConfig {
  onConnectionChange?: (status: NetworkStatus) => void;
  onQualityChange?: (quality: ConnectionQuality) => void;
  autoStart?: boolean;
}

export interface UseNetSignalReturn {
  // Status
  status: NetworkStatus | null;
  isConnected: boolean;
  isInternetReachable: boolean;
  connectionType: string;
  connectionQuality: ConnectionQuality;
  
  // Derived states
  isOnline: boolean;
  isOffline: boolean;
  isFast: boolean;
  isSlow: boolean;
  isExpensive: boolean;
  
  // Actions
  refresh: () => Promise<void>;
  probe: (url: string) => Promise<ProbeResult>;
  speedTest: () => Promise<SpeedTestResult>;
  
  // Monitoring
  startMonitoring: () => void;
  stopMonitoring: () => void;
  isMonitoring: boolean;
}

export function useNetSignal(options: UseNetSignalOptions = {}): UseNetSignalReturn {
  const [status, setStatus] = useState<NetworkStatus | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [speedTestResult, setSpeedTestResult] = useState<SpeedTestResult | null>(null);
  
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Initialize and configure
  useEffect(() => {
    const initializeNetSignal = async () => {
      try {
        // Configure if options provided
        if (Object.keys(options).length > 0) {
          await NetSignal.configure(options);
        }

        // Get initial status
        const initialStatus = await NetSignal.getStatus();
        setStatus(initialStatus);

        // Auto-start monitoring if requested
        if (options.autoStart !== false) {
          NetSignal.startMonitoring(options.checkInterval);
          setIsMonitoring(true);
        }
      } catch (error) {
        console.error('Failed to initialize NetSignal:', error);
      }
    };

    initializeNetSignal();

    // Cleanup
    return () => {
      if (isMonitoring) {
        NetSignal.stopMonitoring();
      }
    };
  }, []);

  // Subscribe to events
  useEffect(() => {
    const unsubscribeConnection = NetSignal.addEventListener('connectionChange', (newStatus) => {
      setStatus(newStatus);
      optionsRef.current.onConnectionChange?.(newStatus);
    });

    const unsubscribeQuality = NetSignal.addEventListener('qualityChange', (quality) => {
      optionsRef.current.onQualityChange?.(quality);
    });

    const unsubscribeSpeedTest = NetSignal.addEventListener('speedTestComplete', (result) => {
      setSpeedTestResult(result);
    });

    return () => {
      unsubscribeConnection();
      unsubscribeQuality();
      unsubscribeSpeedTest();
    };
  }, []);

  // Actions
  const refresh = useCallback(async () => {
    const newStatus = await NetSignal.getStatus();
    setStatus(newStatus);
  }, []);

  const probe = useCallback(async (url: string) => {
    return NetSignal.probe(url);
  }, []);

  const speedTest = useCallback(async () => {
    const result = await NetSignal.speedTest();
    setSpeedTestResult(result);
    return result;
  }, []);

  const startMonitoring = useCallback(() => {
    NetSignal.startMonitoring(options.checkInterval);
    setIsMonitoring(true);
  }, [options.checkInterval]);

  const stopMonitoring = useCallback(() => {
    NetSignal.stopMonitoring();
    setIsMonitoring(false);
  }, []);

  // Derived states
  const isConnected = status?.isConnected ?? false;
  const isInternetReachable = status?.isInternetReachable ?? false;
  const isOnline = isConnected && isInternetReachable;
  const isOffline = !isOnline;
  const connectionType = status?.type ?? 'unknown';
  const connectionQuality = status?.quality ?? 'unknown';
  const isExpensive = status?.details?.isConnectionExpensive ?? false;
  
  const isFast = connectionQuality === 'excellent' || connectionQuality === 'good';
  const isSlow = connectionQuality === 'poor' || connectionQuality === 'fair';

  return {
    // Status
    status,
    isConnected,
    isInternetReachable,
    connectionType,
    connectionQuality,
    
    // Derived states
    isOnline,
    isOffline,
    isFast,
    isSlow,
    isExpensive,
    
    // Actions
    refresh,
    probe,
    speedTest,
    
    // Monitoring
    startMonitoring,
    stopMonitoring,
    isMonitoring,
  };
}

// Simplified hook for basic use cases
export function useIsOnline(): boolean {
  const { isOnline } = useNetSignal({ autoStart: true });
  return isOnline;
}

// Hook for connection quality monitoring
export function useConnectionQuality(): {
  quality: ConnectionQuality;
  isFast: boolean;
  isSlow: boolean;
} {
  const { connectionQuality, isFast, isSlow } = useNetSignal({ autoStart: true });
  return { quality: connectionQuality, isFast, isSlow };
}

// Hook for endpoint monitoring
export function useEndpointStatus(url: string, intervalMs: number = 10000): {
  isReachable: boolean;
  latency: number | null;
  lastChecked: Date | null;
} {
  const [isReachable, setIsReachable] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    const checkEndpoint = async () => {
      try {
        const result = await NetSignal.probe(url);
        setIsReachable(result.reachable);
        setLatency(result.responseTimeMs);
        setLastChecked(new Date());
      } catch (error) {
        setIsReachable(false);
        setLatency(null);
      }
    };

    checkEndpoint(); // Initial check
    const interval = setInterval(checkEndpoint, intervalMs);

    return () => clearInterval(interval);
  }, [url, intervalMs]);

  return { isReachable, latency, lastChecked };
}