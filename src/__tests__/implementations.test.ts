/**
 * Test platform-specific implementations directly
 * Tests the actual built modules like the real build process
 */

import { WebNetSignal } from '../implementations/web';

describe('WebNetSignal Implementation', () => {
  let webNetSignal: WebNetSignal;

  beforeEach(() => {
    // Mock browser APIs
    Object.defineProperty(global, 'navigator', {
      value: {
        onLine: true,
        connection: {
          type: 'wifi',
          effectiveType: '4g',
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        },
      },
      writable: true,
      configurable: true,
    });

    Object.defineProperty(global, 'window', {
      value: {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      },
      writable: true,
      configurable: true,
    });

    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
      } as Response)
    );

    webNetSignal = new WebNetSignal();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isConnected()', () => {
    it('should return navigator.onLine status', () => {
      expect(webNetSignal.isConnected()).toBe(true);

      // Test offline
      Object.defineProperty(global, 'navigator', {
        value: { onLine: false },
        configurable: true,
      });
      const offlineNetSignal = new WebNetSignal();
      expect(offlineNetSignal.isConnected()).toBe(false);
    });
  });

  describe('getType()', () => {
    it('should return connection type from navigator.connection', () => {
      const type = webNetSignal.getType();
      expect(type).toBe('wifi');
    });

    it('should return unknown when connection API not available', () => {
      Object.defineProperty(global, 'navigator', {
        value: { onLine: true },
        configurable: true,
      });
      const noConnectionNetSignal = new WebNetSignal();
      expect(noConnectionNetSignal.getType()).toBe('unknown');
    });
  });

  describe('probe()', () => {
    it('should use fetch to test URL reachability', async () => {
      const result = await webNetSignal.probe('https://example.com');

      expect(result.reachable).toBe(true);
      expect(typeof result.responseTime).toBe('number');
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({
          method: 'HEAD',
          mode: 'cors',
          cache: 'no-cache',
        })
      );
    });

    it('should handle probe failures', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

      const result = await webNetSignal.probe('https://example.com');

      expect(result.reachable).toBe(false);
      expect(result.responseTime).toBe(-1);
      expect(result.error).toBe('Network error');
    });

    it('should respect custom timeout', async () => {
      // Mock AbortController to simulate timeout
      const abortMock = jest.fn();
      global.AbortController = jest.fn().mockImplementation(() => ({
        abort: abortMock,
        signal: { aborted: false },
      }));

      // Mock fetch to reject when aborted
      global.fetch = jest.fn().mockRejectedValue(new Error('The user aborted a request.'));

      const result = await webNetSignal.probe('https://example.com', 100);

      expect(result.reachable).toBe(false);
      expect(result.responseTime).toBe(-1);
      expect(result.error).toContain('aborted');
    });
  });

  describe('onChange()', () => {
    it('should register and call callback on network changes', () => {
      const callback = jest.fn();
      const unsubscribe = webNetSignal.onChange(callback);

      // Verify event listeners were added
      expect(global.window.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(global.window.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));

      // Verify unsubscribe removes listeners
      unsubscribe();
      expect(global.window.removeEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(global.window.removeEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });

    it('should return unsubscribe function', () => {
      const callback = jest.fn();
      const unsubscribe = webNetSignal.onChange(callback);

      expect(typeof unsubscribe).toBe('function');

      // Call unsubscribe
      unsubscribe();

      // Verify removeEventListener was called
      expect(global.window.removeEventListener).toHaveBeenCalledTimes(2); // online and offline
    });
  });
});

// Test NativeNetSignal with mocked React Native
describe('NativeNetSignal Implementation', () => {
  let NativeNetSignal: any;

  beforeEach(() => {
    jest.resetModules();

    // Mock React Native modules
    jest.doMock('react-native', () => ({
      NativeModules: {
        NetSignal: {
          isConnected: jest.fn(() => true),
          getConnectionType: jest.fn(() => 'wifi'),
          probe: jest.fn(() => Promise.resolve({
            reachable: true,
            responseTime: 50,
          })),
          addListener: jest.fn(),
          removeListeners: jest.fn(),
        },
      },
      NativeEventEmitter: jest.fn().mockImplementation(() => ({
        addListener: jest.fn((event, callback) => {
          // Simulate immediate callback for testing
          if (event === 'NetSignal.NetworkChanged') {
            setTimeout(() => callback({
              isConnected: true,
              type: 'wifi',
            }), 0);
          }
          return { remove: jest.fn() };
        }),
        removeAllListeners: jest.fn(),
      })),
    }));

    // Import after mocking
    const { NativeNetSignal: NativeImpl } = require('../implementations/native');
    NativeNetSignal = NativeImpl;
  });

  it('should call native module for isConnected', () => {
    const nativeNetSignal = new NativeNetSignal();
    const result = nativeNetSignal.isConnected();

    expect(result).toBe(true);
  });

  it('should call native module for getType', () => {
    const nativeNetSignal = new NativeNetSignal();
    const result = nativeNetSignal.getType();

    expect(result).toBe('wifi');
  });

  it('should call native module for probe', async () => {
    const nativeNetSignal = new NativeNetSignal();
    const result = await nativeNetSignal.probe('https://example.com');

    expect(result.reachable).toBe(true);
    expect(result.responseTime).toBe(50);
  });

  it('should handle native module not available', () => {
    jest.resetModules();
    jest.doMock('react-native', () => ({
      NativeModules: {},
      NativeEventEmitter: jest.fn(),
    }));

    const { NativeNetSignal: NativeImpl } = require('../implementations/native');
    const nativeNetSignal = new NativeImpl();

    expect(nativeNetSignal.isConnected()).toBe(false);
    expect(nativeNetSignal.getType()).toBe('unknown');
  });
});

// Test the main index auto-detection
describe('NetSignal Auto-Detection', () => {
  it('should load web implementation in browser environment', () => {
    // Set up web environment
    Object.defineProperty(global, 'window', {
      value: { document: {} },
      configurable: true,
    });

    jest.resetModules();
    const NetSignal = require('../index').default;

    // Should have web implementation methods
    expect(typeof NetSignal.isConnected).toBe('function');
    expect(typeof NetSignal.getType).toBe('function');
    expect(typeof NetSignal.probe).toBe('function');
    expect(typeof NetSignal.onChange).toBe('function');
  });
});
