/**
 * Network quality detection utilities
 */

import type { ExtendedProbeResult, NetworkQuality } from '../types';

/**
 * Determine network quality based on latency
 * @param latency Response time in milliseconds
 * @returns Network quality rating
 */
export function getQualityFromLatency(latency: number): NetworkQuality {
  if (latency < 0) {
    return 'unknown';
  }
  if (latency < 50) {
    return 'excellent';
  }
  if (latency < 150) {
    return 'good';
  }
  if (latency < 300) {
    return 'fair';
  }
  return 'poor';
}

/**
 * Calculate network quality from multiple probe results
 * @param results Array of response times in milliseconds
 * @returns Extended network quality metrics
 */
export function calculateNetworkQuality(results: number[]): {
  quality: NetworkQuality;
  average: number;
  min: number;
  max: number;
  jitter: number;
} {
  if (results.length === 0) {
    return {
      quality: 'unknown',
      average: -1,
      min: -1,
      max: -1,
      jitter: -1,
    };
  }

  const validResults = results.filter((r) => r >= 0);
  if (validResults.length === 0) {
    return {
      quality: 'unknown',
      average: -1,
      min: -1,
      max: -1,
      jitter: -1,
    };
  }

  const average = validResults.reduce((sum, r) => sum + r, 0) / validResults.length;
  const min = Math.min(...validResults);
  const max = Math.max(...validResults);

  // Calculate jitter (variation in latency)
  let jitter = 0;
  if (validResults.length > 1) {
    for (let i = 1; i < validResults.length; i++) {
      jitter += Math.abs(validResults[i] - validResults[i - 1]);
    }
    jitter = jitter / (validResults.length - 1);
  }

  const quality = getQualityFromLatency(average);

  return {
    quality,
    average: Math.round(average),
    min: Math.round(min),
    max: Math.round(max),
    jitter: Math.round(jitter),
  };
}

/**
 * Perform probe with retries
 * @param probeFn The probe function to call
 * @param url URL to probe
 * @param options Probe options including retries
 * @returns Extended probe result with quality metrics
 */
export async function probeWithRetry(
  probeFn: (
    url: string,
    timeout?: number,
  ) => Promise<{ reachable: boolean; responseTime: number; error?: string }>,
  url: string,
  options: {
    timeout?: number;
    retries?: number;
    retryDelay?: number;
  } = {},
): Promise<ExtendedProbeResult> {
  const { timeout = 5000, retries = 0, retryDelay = 1000 } = options;

  const results: number[] = [];
  let lastError: string | undefined;
  let successCount = 0;

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }

    try {
      const result = await probeFn(url, timeout);

      if (result.reachable) {
        results.push(result.responseTime);
        successCount++;
      } else {
        results.push(-1);
        lastError = result.error;
      }
    } catch (error) {
      results.push(-1);
      lastError = error instanceof Error ? error.message : 'Unknown error';
    }
  }

  const validResults = results.filter((r) => r >= 0);
  const reachable = successCount > 0;

  if (validResults.length === 0) {
    return {
      reachable: false,
      responseTime: -1,
      error: lastError,
      attempts: retries + 1,
      quality: 'unknown',
    };
  }

  const qualityMetrics = calculateNetworkQuality(validResults);

  return {
    reachable,
    responseTime: qualityMetrics.average,
    attempts: retries + 1,
    averageResponseTime: qualityMetrics.average,
    minResponseTime: qualityMetrics.min,
    maxResponseTime: qualityMetrics.max,
    quality: qualityMetrics.quality,
  };
}
