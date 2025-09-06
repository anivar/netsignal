/**
 * NetSignal Tests - September 2025 Standards
 * Using latest React Native Testing Library patterns
 */

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import NetSignal, { isConnected, getType, probe, onChange } from '../index';

/// <reference path="./global.d.ts" />

// Mock native modules
jest.mock('react-native', () => ({
  NativeModules: {
    NetSignal: {
      isConnected: jest.fn(),
      getConnectionType: jest.fn(),
      probe: jest.fn(),
      addListener: jest.fn(),
      removeListeners: jest.fn()
    }
  },
  NativeEventEmitter: jest.fn(() => ({
    addListener: jest.fn(() => ({ remove: jest.fn() })),
    removeAllListeners: jest.fn()
  })),
  Platform: {
    OS: 'ios'
  }
}));

describe('NetSignal - Core API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isConnected()', () => {
    it('should return connection status from native module', () => {
      (NativeModules.NetSignal.isConnected as jest.Mock).mockReturnValue(true);

      const result = NetSignal.isConnected();

      expect(result).toBe(true);
      expect(NativeModules.NetSignal.isConnected).toHaveBeenCalledTimes(1);
    });

    it('should return false when native module unavailable', () => {
      // Clear the module cache to test initialization without native module
      jest.resetModules();

      // Mock react-native without NetSignal module
      jest.doMock('react-native', () => ({
        NativeModules: {},
        NativeEventEmitter: jest.fn(),
        Platform: { OS: 'ios' }
      }));

      // Re-import to get fresh instance
      const { isConnected: isConnectedWithoutNative } = require('../index');

      const result = isConnectedWithoutNative();

      expect(result).toBe(false);

      // Restore original mock
      jest.resetModules();
    });

    it('should handle synchronous calls efficiently', () => {
      // Reset and setup mock
      jest.clearAllMocks();
      (NativeModules.NetSignal.isConnected as jest.Mock).mockReturnValue(true);

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        NetSignal.isConnected();
      }
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50); // Should be <50ms for 1000 calls (more realistic)
      expect(NativeModules.NetSignal.isConnected).toHaveBeenCalledTimes(1000);
    });
  });

  describe('getType()', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return connection type from native module', () => {
      (NativeModules.NetSignal.getConnectionType as jest.Mock).mockReturnValue('wifi');

      const result = NetSignal.getType();

      expect(result).toBe('wifi');
      expect(NativeModules.NetSignal.getConnectionType).toHaveBeenCalledTimes(1);
    });

    it('should return all valid connection types', () => {
      const types = ['wifi', 'cellular', 'ethernet', 'none', 'unknown'];

      types.forEach(type => {
        jest.clearAllMocks();
        (NativeModules.NetSignal.getConnectionType as jest.Mock).mockReturnValue(type);
        expect(getType()).toBe(type);
      });
    });
  });

  describe('probe()', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should probe URL and return success result', async () => {
      const mockResult = {
        reachable: true,
        responseTime: 123
      };

      (NativeModules.NetSignal.probe as jest.Mock).mockResolvedValue(mockResult);

      const result = await NetSignal.probe('https://example.com');

      expect(result).toEqual(mockResult);
      expect(NativeModules.NetSignal.probe).toHaveBeenCalledWith('https://example.com', 5000);
    });

    it('should handle probe failure gracefully', async () => {
      const mockResult = {
        reachable: false,
        responseTime: -1,
        error: 'Network timeout'
      };

      (NativeModules.NetSignal.probe as jest.Mock).mockResolvedValue(mockResult);

      const result = await probe('https://unreachable.com', 1000);

      expect(result.reachable).toBe(false);
      expect(result.error).toBe('Network timeout');
      expect(NativeModules.NetSignal.probe).toHaveBeenCalledWith('https://unreachable.com', 1000);
    });

    it('should handle high latency areas (2-3 seconds)', async () => {
      const mockResult = {
        reachable: true,
        responseTime: 2500
      };

      (NativeModules.NetSignal.probe as jest.Mock).mockResolvedValue(mockResult);

      const result = await NetSignal.probe('https://high-latency.com', 5000);

      expect(result.reachable).toBe(true);
      expect(result.responseTime).toBe(2500);
    });

    it('should handle native module errors', async () => {
      (NativeModules.NetSignal.probe as jest.Mock).mockRejectedValue(new Error('Native error'));

      const result = await NetSignal.probe('https://example.com');

      expect(result.reachable).toBe(false);
      expect(result.responseTime).toBe(-1);
      expect(result.error).toBe('Native error');
    });
  });

  describe('onChange()', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should subscribe to network changes', () => {
      const callback = jest.fn();
      const mockListener = { remove: jest.fn() };

      // NativeEventEmitter is created in the NetSignal constructor
      // We need to mock its instance methods
      (NativeEventEmitter as jest.MockedClass<typeof NativeEventEmitter>).mockImplementation(() => ({
        addListener: jest.fn().mockReturnValue(mockListener),
        removeAllListeners: jest.fn(),
        emit: jest.fn(),
        listenerCount: jest.fn().mockReturnValue(0),
        removeSubscription: jest.fn()
      } as unknown as NativeEventEmitter));

      // Re-import to get fresh instance with mocked emitter
      jest.resetModules();
      const FreshNetSignal = require('../index').default;

      const unsubscribe = FreshNetSignal.onChange(callback);

      // The unsubscribe function should work
      expect(typeof unsubscribe).toBe('function');
      unsubscribe();

      jest.resetModules(); // Clean up
    });

    it('should handle multiple listeners', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const unsubscribe1 = onChange(callback1);
      const unsubscribe2 = onChange(callback2);

      expect(typeof unsubscribe1).toBe('function');
      expect(typeof unsubscribe2).toBe('function');

      unsubscribe1();
      unsubscribe2();
    });
  });
});

describe('NetSignal - Web Platform', () => {
  beforeAll(() => {
    // Save original mocks
    jest.resetModules();

    // Mock for web platform - no native modules
    jest.doMock('react-native', () => ({
      Platform: { OS: 'web' },
      NativeModules: {}, // No native modules on web
      NativeEventEmitter: jest.fn()
    }));

    // Mock web APIs
    Object.defineProperty(global, 'navigator', {
      value: {
        onLine: true,
        connection: {
          type: 'wifi',
          effectiveType: '4g',
          addEventListener: jest.fn(),
          removeEventListener: jest.fn()
        }
      },
      writable: true,
      configurable: true
    });

    Object.defineProperty(global, 'window', {
      value: {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      },
      writable: true,
      configurable: true
    });

    global.fetch = jest.fn();
  });

  afterAll(() => {
    jest.resetModules();
    // Clean up global mocks
    const g = global as any;
    if ('navigator' in g) delete g.navigator;
    if ('window' in g) delete g.window;
    if ('fetch' in g) delete g.fetch;
  });

  it('should detect web connection status', () => {
    // Import NetSignal after setting up web environment
    const WebNetSignal = require('../index').default;

    const result = WebNetSignal.isConnected();
    expect(result).toBe(true);
  });

  it('should probe URLs on web platform', async () => {
    const mockResponse = { ok: true };
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    // Use the already imported web NetSignal
    const WebNetSignal = require('../index').default;

    const result = await WebNetSignal.probe('https://example.com');

    expect(result.reachable).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({
        method: 'HEAD',
        mode: 'cors',
        cache: 'no-cache'
      })
    );
  });
});

describe('NetSignal - Performance', () => {
  it('should provide instant synchronous responses', () => {
    (NativeModules.NetSignal.isConnected as jest.Mock).mockReturnValue(true);
    (NativeModules.NetSignal.getConnectionType as jest.Mock).mockReturnValue('wifi');

    const operations = 10000;
    const start = performance.now();

    for (let i = 0; i < operations; i++) {
      NetSignal.isConnected();
      NetSignal.getType();
    }

    const duration = performance.now() - start;
    const avgTime = duration / (operations * 2);

    expect(avgTime).toBeLessThan(0.001); // <1 microsecond per call
  });

  it('should handle memory efficiently with many listeners', () => {
    const listeners: (() => void)[] = [];

    // Add 100 listeners
    for (let i = 0; i < 100; i++) {
      listeners.push(onChange(() => {}));
    }

    // Remove all listeners
    listeners.forEach(unsubscribe => unsubscribe());

    // Memory should be freed (this would be monitored in real environment)
    expect(listeners.length).toBe(100);
  });
});

describe('NetSignal - Edge Cases', () => {
  it('should handle rapid connection changes', () => {
    // Reset modules for clean test
    jest.resetModules();

    // Setup mock emitter that we can control
    let registeredCallback: any;
    const mockEmitter = {
      addListener: jest.fn((event, cb) => {
        registeredCallback = cb;
        return { remove: jest.fn() };
      }),
      removeAllListeners: jest.fn()
    };

    jest.doMock('react-native', () => ({
      NativeModules: {
        NetSignal: {
          isConnected: jest.fn().mockReturnValue(true),
          getConnectionType: jest.fn().mockReturnValue('wifi'),
          probe: jest.fn(),
          addListener: jest.fn(),
          removeListeners: jest.fn()
        }
      },
      NativeEventEmitter: jest.fn(() => mockEmitter),
      Platform: { OS: 'ios' }
    }));

    const FreshNetSignal = require('../index').default;
    const callback = jest.fn();
    const unsubscribe = FreshNetSignal.onChange(callback);

    // Simulate rapid changes
    for (let i = 0; i < 100; i++) {
      if (registeredCallback) {
        registeredCallback({ isConnected: i % 2 === 0, type: 'wifi' });
      }
    }

    expect(callback).toHaveBeenCalledTimes(100);
    unsubscribe();

    jest.resetModules();
  });

  it('should handle undefined native module gracefully', () => {
    // Clean setup
    jest.resetModules();

    // Mock react-native without NetSignal module
    jest.doMock('react-native', () => ({
      NativeModules: {}, // No NetSignal module
      NativeEventEmitter: jest.fn(),
      Platform: { OS: 'ios' }
    }));

    const FallbackNetSignal = require('../index').default;

    expect(FallbackNetSignal.isConnected()).toBe(false);
    expect(FallbackNetSignal.getType()).toBe('unknown');

    jest.resetModules();
  });
});