/**
 * Tests for network quality utilities
 */

import { DEFAULT_PROBE_URLS } from '../constants';
import {
  calculateNetworkQuality,
  getQualityFromLatency,
  probeWithRetry,
} from '../utils/network-quality';

describe('Network Quality Utilities', () => {
  describe('getQualityFromLatency', () => {
    it('should return excellent for <50ms', () => {
      expect(getQualityFromLatency(10)).toBe('excellent');
      expect(getQualityFromLatency(49)).toBe('excellent');
    });

    it('should return good for 50-150ms', () => {
      expect(getQualityFromLatency(50)).toBe('good');
      expect(getQualityFromLatency(100)).toBe('good');
      expect(getQualityFromLatency(149)).toBe('good');
    });

    it('should return fair for 150-300ms', () => {
      expect(getQualityFromLatency(150)).toBe('fair');
      expect(getQualityFromLatency(250)).toBe('fair');
      expect(getQualityFromLatency(299)).toBe('fair');
    });

    it('should return poor for >=300ms', () => {
      expect(getQualityFromLatency(300)).toBe('poor');
      expect(getQualityFromLatency(1000)).toBe('poor');
    });

    it('should return unknown for negative values', () => {
      expect(getQualityFromLatency(-1)).toBe('unknown');
    });
  });

  describe('calculateNetworkQuality', () => {
    it('should handle empty results', () => {
      const result = calculateNetworkQuality([]);
      expect(result.quality).toBe('unknown');
      expect(result.average).toBe(-1);
      expect(result.min).toBe(-1);
      expect(result.max).toBe(-1);
      expect(result.jitter).toBe(-1);
    });

    it('should calculate metrics for valid results', () => {
      const results = [100, 120, 110, 90, 130];
      const metrics = calculateNetworkQuality(results);

      expect(metrics.quality).toBe('good');
      expect(metrics.average).toBe(110);
      expect(metrics.min).toBe(90);
      expect(metrics.max).toBe(130);
      expect(metrics.jitter).toBeGreaterThan(0);
    });

    it('should filter out negative values', () => {
      const results = [100, -1, 120, -1, 110];
      const metrics = calculateNetworkQuality(results);

      expect(metrics.average).toBe(110);
      expect(metrics.min).toBe(100);
      expect(metrics.max).toBe(120);
    });

    it('should handle single valid result', () => {
      const metrics = calculateNetworkQuality([100]);

      expect(metrics.quality).toBe('good');
      expect(metrics.average).toBe(100);
      expect(metrics.jitter).toBe(0);
    });
  });

  describe('probeWithRetry', () => {
    let mockProbe: jest.Mock;

    beforeEach(() => {
      mockProbe = jest.fn();
    });

    it('should succeed and collect statistics', async () => {
      mockProbe.mockResolvedValue({
        reachable: true,
        responseTime: 100,
      });

      const result = await probeWithRetry(mockProbe, DEFAULT_PROBE_URLS.primary, {
        retries: 2,
        retryDelay: 10,
      });

      expect(result.reachable).toBe(true);
      expect(result.responseTime).toBe(100);
      expect(result.attempts).toBe(3); // Always does all attempts for statistics
      expect(result.quality).toBe('good');
      expect(mockProbe).toHaveBeenCalledTimes(3); // Called for each attempt
    });

    it('should retry on failure', async () => {
      mockProbe
        .mockResolvedValueOnce({ reachable: false, responseTime: -1 })
        .mockResolvedValueOnce({ reachable: false, responseTime: -1 })
        .mockResolvedValueOnce({ reachable: true, responseTime: 150 });

      const result = await probeWithRetry(mockProbe, DEFAULT_PROBE_URLS.primary, {
        retries: 2,
        retryDelay: 10, // Short delay for testing
      });

      expect(result.reachable).toBe(true);
      expect(result.attempts).toBe(3);
      expect(mockProbe).toHaveBeenCalledTimes(3);
    });

    it('should handle all failures', async () => {
      mockProbe.mockResolvedValue({
        reachable: false,
        responseTime: -1,
        error: 'Network error',
      });

      const result = await probeWithRetry(mockProbe, DEFAULT_PROBE_URLS.primary, {
        retries: 2,
        retryDelay: 10,
      });

      expect(result.reachable).toBe(false);
      expect(result.responseTime).toBe(-1);
      expect(result.error).toBe('Network error');
      expect(result.attempts).toBe(3);
      expect(result.quality).toBe('unknown');
    });

    it('should calculate average response time', async () => {
      mockProbe
        .mockResolvedValueOnce({ reachable: true, responseTime: 100 })
        .mockResolvedValueOnce({ reachable: true, responseTime: 120 })
        .mockResolvedValueOnce({ reachable: true, responseTime: 110 });

      const result = await probeWithRetry(mockProbe, DEFAULT_PROBE_URLS.primary, {
        retries: 2,
        retryDelay: 10,
      });

      expect(result.reachable).toBe(true);
      expect(result.averageResponseTime).toBe(110);
      expect(result.minResponseTime).toBe(100);
      expect(result.maxResponseTime).toBe(120);
    });
  });
});
