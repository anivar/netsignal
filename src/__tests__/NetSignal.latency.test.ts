/**
 * High Latency Scenario Tests for NetSignal
 * Testing real-world conditions with sub-10 second latency
 *
 * @author Anivar A Aravind <ping@anivar.net>
 * @copyright 2025 Anivar A Aravind
 */

// Tests use dynamic imports to ensure proper module isolation

describe('NetSignal - High Latency Scenarios', () => {
  // Set timeout for long-running tests (15 seconds to handle 10-second latency)
  jest.setTimeout(15000);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('Sub-10 Second Latency Areas', () => {
    beforeEach(() => {
      // Mock high latency environment
      jest.doMock('react-native', () => ({
        Platform: { OS: 'android' },
        NativeModules: {
          NetSignal: {
            isConnected: jest.fn().mockReturnValue(true), // Connected but slow
            getConnectionType: jest.fn().mockReturnValue('cellular'), // Often cellular in remote areas
            probe: jest.fn(),
            addListener: jest.fn(),
            removeListeners: jest.fn(),
          },
        },
        NativeEventEmitter: jest.fn(() => ({
          addListener: jest.fn(() => ({ remove: jest.fn() })),
          removeAllListeners: jest.fn(),
        })),
      }));
    });

    it('should report connection as true even with high latency', () => {
      const HighLatencyNetSignal = require('../index').default;

      // Connection status should be instant even in high latency
      const start = Date.now();
      const isConnected = HighLatencyNetSignal.isConnected();
      const duration = Date.now() - start;

      expect(isConnected).toBe(true); // Still connected
      expect(duration).toBeLessThanOrEqual(1); // Still instant (<=1ms)
    });

    it('should handle 3 second probe latency gracefully', async () => {
      const RN = require('react-native');

      // Simulate 3 second latency
      (RN.NativeModules.NetSignal.probe as jest.Mock).mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              reachable: true,
              responseTime: 3000, // 3 seconds
              error: undefined,
            });
          }, 3000);
        });
      });

      const HighLatencyNetSignal = require('../index').default;

      const start = Date.now();
      const result = await HighLatencyNetSignal.probe('https://slow-server.com', 5000);
      const duration = Date.now() - start;

      expect(result.reachable).toBe(true);
      expect(result.responseTime).toBeGreaterThanOrEqual(3000);
      expect(duration).toBeGreaterThanOrEqual(3000);
      expect(duration).toBeLessThan(3100); // Should not add significant overhead
    });

    it('should handle 7 second probe latency', async () => {
      const RN = require('react-native');

      // Simulate 7 second latency
      (RN.NativeModules.NetSignal.probe as jest.Mock).mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              reachable: true,
              responseTime: 7000, // 7 seconds
              error: undefined,
            });
          }, 7000);
        });
      });

      const HighLatencyNetSignal = require('../index').default;

      // Must use timeout > 7 seconds
      const result = await HighLatencyNetSignal.probe('https://very-slow-server.com', 10000);

      expect(result.reachable).toBe(true);
      expect(result.responseTime).toBe(7000);
    });

    it('should handle 9 second probe latency near 10-second boundary', async () => {
      const RN = require('react-native');

      // Simulate 9 second latency
      (RN.NativeModules.NetSignal.probe as jest.Mock).mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              reachable: true,
              responseTime: 9000, // 9 seconds
              error: undefined,
            });
          }, 9000);
        });
      });

      const HighLatencyNetSignal = require('../index').default;

      const result = await HighLatencyNetSignal.probe('https://extremely-slow-server.com', 10000);

      expect(result.reachable).toBe(true);
      expect(result.responseTime).toBe(9000);
    });

    it('should handle 5 second probe latency at timeout boundary', async () => {
      const RN = require('react-native');

      // Simulate 5 second latency (at default timeout boundary)
      (RN.NativeModules.NetSignal.probe as jest.Mock).mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              reachable: true,
              responseTime: 4999, // Just under 5 seconds
              error: undefined,
            });
          }, 4999);
        });
      });

      const HighLatencyNetSignal = require('../index').default;

      const result = await HighLatencyNetSignal.probe('https://very-slow-server.com', 5000);

      expect(result.reachable).toBe(true);
      expect(result.responseTime).toBe(4999);
    });

    it('should timeout correctly when latency exceeds timeout', async () => {
      const RN = require('react-native');

      // Simulate latency exceeding timeout
      (RN.NativeModules.NetSignal.probe as jest.Mock).mockImplementation(() => {
        return new Promise((resolve) => {
          // Native module would handle timeout
          resolve({
            reachable: false,
            responseTime: -1,
            error: 'Request timeout',
          });
        });
      });

      const HighLatencyNetSignal = require('../index').default;

      // Use 3 second timeout but server takes longer
      const result = await HighLatencyNetSignal.probe('https://timeout-server.com', 3000);

      expect(result.reachable).toBe(false);
      expect(result.responseTime).toBe(-1);
      expect(result.error).toBe('Request timeout');
    });

    it('should handle intermittent connectivity with high latency', async () => {
      const RN = require('react-native');
      let callCount = 0;

      // Simulate intermittent connectivity
      (RN.NativeModules.NetSignal.probe as jest.Mock).mockImplementation(() => {
        callCount++;
        return new Promise((resolve) => {
          if (callCount % 2 === 0) {
            // Even calls succeed with high latency
            setTimeout(() => {
              resolve({
                reachable: true,
                responseTime: 3500,
              });
            }, 3500);
          } else {
            // Odd calls fail
            resolve({
              reachable: false,
              responseTime: -1,
              error: 'Network unreachable',
            });
          }
        });
      });

      const HighLatencyNetSignal = require('../index').default;

      // First probe fails (odd)
      const result1 = await HighLatencyNetSignal.probe('https://intermittent.com');
      expect(result1.reachable).toBe(false);

      // Second probe succeeds with high latency (even)
      const result2 = await HighLatencyNetSignal.probe('https://intermittent.com');
      expect(result2.reachable).toBe(true);
      expect(result2.responseTime).toBe(3500);
    });
  });

  describe('Connection Type in High Latency', () => {
    it('should correctly identify 2G/3G connections with high latency', () => {
      jest.doMock('react-native', () => ({
        Platform: { OS: 'android' },
        NativeModules: {
          NetSignal: {
            isConnected: jest.fn().mockReturnValue(true),
            getConnectionType: jest.fn().mockReturnValue('cellular'), // 2G/3G often has high latency
            probe: jest.fn(),
            addListener: jest.fn(),
            removeListeners: jest.fn(),
          },
        },
        NativeEventEmitter: jest.fn(() => ({
          addListener: jest.fn(() => ({ remove: jest.fn() })),
          removeAllListeners: jest.fn(),
        })),
      }));

      const SlowNetSignal = require('../index').default;

      expect(SlowNetSignal.isConnected()).toBe(true);
      expect(SlowNetSignal.getType()).toBe('cellular');
    });

    it('should handle satellite internet scenarios', () => {
      // Satellite internet has 600ms+ latency but is still "connected"
      jest.doMock('react-native', () => ({
        Platform: { OS: 'android' },
        NativeModules: {
          NetSignal: {
            isConnected: jest.fn().mockReturnValue(true),
            getConnectionType: jest.fn().mockReturnValue('unknown'), // Satellite often shows as unknown
            probe: jest.fn().mockResolvedValue({
              reachable: true,
              responseTime: 650, // Typical satellite latency
            }),
            addListener: jest.fn(),
            removeListeners: jest.fn(),
          },
        },
        NativeEventEmitter: jest.fn(() => ({
          addListener: jest.fn(() => ({ remove: jest.fn() })),
          removeAllListeners: jest.fn(),
        })),
      }));

      const SatelliteNetSignal = require('../index').default;

      expect(SatelliteNetSignal.isConnected()).toBe(true);
      expect(SatelliteNetSignal.getType()).toBe('unknown');
    });
  });

  describe('Real-world Usage Patterns', () => {
    it('should not retry or add overhead - just report facts', async () => {
      jest.doMock('react-native', () => ({
        Platform: { OS: 'ios' },
        NativeModules: {
          NetSignal: {
            isConnected: jest.fn().mockReturnValue(true),
            getConnectionType: jest.fn().mockReturnValue('cellular'),
            probe: jest.fn().mockResolvedValue({
              reachable: false,
              responseTime: -1,
              error: 'Host unreachable',
            }),
            addListener: jest.fn(),
            removeListeners: jest.fn(),
          },
        },
        NativeEventEmitter: jest.fn(() => ({
          addListener: jest.fn(() => ({ remove: jest.fn() })),
          removeAllListeners: jest.fn(),
        })),
      }));

      const LeanNetSignal = require('../index').default;
      const RN = require('react-native');

      // Probe fails
      const result = await LeanNetSignal.probe('https://unreachable.com');

      // Should call native module exactly once - no retries
      expect(RN.NativeModules.NetSignal.probe).toHaveBeenCalledTimes(1);

      // Should report failure immediately
      expect(result.reachable).toBe(false);
      expect(result.error).toBe('Host unreachable');
    });

    it('should allow app to implement its own retry logic', async () => {
      jest.doMock('react-native', () => ({
        Platform: { OS: 'android' },
        NativeModules: {
          NetSignal: {
            isConnected: jest.fn().mockReturnValue(true),
            getConnectionType: jest.fn().mockReturnValue('wifi'),
            probe: jest
              .fn()
              .mockResolvedValueOnce({ reachable: false, responseTime: -1, error: 'Timeout' })
              .mockResolvedValueOnce({ reachable: false, responseTime: -1, error: 'Timeout' })
              .mockResolvedValueOnce({ reachable: true, responseTime: 2500 }),
            addListener: jest.fn(),
            removeListeners: jest.fn(),
          },
        },
        NativeEventEmitter: jest.fn(() => ({
          addListener: jest.fn(() => ({ remove: jest.fn() })),
          removeAllListeners: jest.fn(),
        })),
      }));

      const AppNetSignal = require('../index').default;

      // App implements its own retry logic
      async function probeWithRetry(url: string, maxRetries = 3): Promise<any> {
        for (let i = 0; i < maxRetries; i++) {
          const result = await AppNetSignal.probe(url);
          if (result.reachable) {
            return result;
          }
          // App decides to wait before retry
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        return { reachable: false, responseTime: -1, error: 'Max retries exceeded' };
      }

      const result = await probeWithRetry('https://flaky-server.com');

      expect(result.reachable).toBe(true);
      expect(result.responseTime).toBe(2500);
    });

    it('should handle rapid network changes in high latency areas', () => {
      // In areas with poor connectivity, network might flip between connected/disconnected
      let isConnected = true;

      jest.doMock('react-native', () => ({
        Platform: { OS: 'android' },
        NativeModules: {
          NetSignal: {
            isConnected: jest.fn(() => isConnected),
            getConnectionType: jest.fn(() => (isConnected ? 'cellular' : 'none')),
            probe: jest.fn(),
            addListener: jest.fn(),
            removeListeners: jest.fn(),
          },
        },
        NativeEventEmitter: jest.fn(() => ({
          addListener: jest.fn(() => ({ remove: jest.fn() })),
          removeAllListeners: jest.fn(),
        })),
      }));

      const FlappingNetSignal = require('../index').default;

      // Rapid flapping between connected and disconnected
      const results = [];
      for (let i = 0; i < 10; i++) {
        isConnected = !isConnected;
        results.push(FlappingNetSignal.isConnected());
      }

      // Should accurately reflect each state change
      expect(results).toEqual([false, true, false, true, false, true, false, true, false, true]);
    });
  });

  describe('Performance in High Latency', () => {
    it('should maintain instant status checks regardless of network latency', () => {
      jest.doMock('react-native', () => ({
        Platform: { OS: 'ios' },
        NativeModules: {
          NetSignal: {
            isConnected: jest.fn().mockReturnValue(true),
            getConnectionType: jest.fn().mockReturnValue('cellular'),
            probe: jest.fn(),
            addListener: jest.fn(),
            removeListeners: jest.fn(),
          },
        },
        NativeEventEmitter: jest.fn(() => ({
          addListener: jest.fn(() => ({ remove: jest.fn() })),
          removeAllListeners: jest.fn(),
        })),
      }));

      const PerformantNetSignal = require('../index').default;

      // Even with high network latency, status checks are instant
      const timings = [];
      for (let i = 0; i < 100; i++) {
        const start = performance.now();
        PerformantNetSignal.isConnected();
        PerformantNetSignal.getType();
        const duration = performance.now() - start;
        timings.push(duration);
      }

      const avgTime = timings.reduce((a, b) => a + b, 0) / timings.length;
      const maxTime = Math.max(...timings);

      expect(avgTime).toBeLessThan(1); // Average < 1ms
      expect(maxTime).toBeLessThan(5); // Max < 5ms (more realistic for test environment)
    });
  });
});
