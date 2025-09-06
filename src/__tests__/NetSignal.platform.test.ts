/**
 * Platform-specific tests for NetSignal
 * Tests iOS, Android, and Web behavior independently
 */

// Platform-specific tests use dynamic imports

// Helper to test each platform
const testPlatform = (platformName: 'ios' | 'android' | 'web') => {
  describe(`NetSignal - ${platformName.toUpperCase()} Platform`, () => {
    let NetSignal: any;
    let NativeModules: any;
    let NativeEventEmitter: any;

    beforeEach(() => {
      // Clear all module caches
      jest.resetModules();
      jest.clearAllMocks();

      // Platform is set via mock

      if (platformName === 'web') {
        // Mock for web platform
        jest.doMock('react-native', () => ({
          Platform: { OS: 'web' },
          NativeModules: {},
          NativeEventEmitter: jest.fn()
        }));

        // Mock browser APIs with proper mutable property
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
      } else {
        // Mock for native platforms (iOS/Android)
        jest.doMock('react-native', () => ({
          Platform: { OS: platformName },
          NativeModules: {
            NetSignal: {
              isConnected: jest.fn().mockReturnValue(true),
              getConnectionType: jest.fn().mockReturnValue('wifi'),
              probe: jest.fn().mockResolvedValue({
                reachable: true,
                responseTime: 100
              }),
              addListener: jest.fn(),
              removeListeners: jest.fn()
            }
          },
          NativeEventEmitter: jest.fn(() => ({
            addListener: jest.fn(() => ({ remove: jest.fn() })),
            removeAllListeners: jest.fn()
          }))
        }));
      }

      // Import the appropriate implementation based on platform
      if (platformName === 'web') {
        const { WebNetSignal } = require('../implementations/web');
        NetSignal = new WebNetSignal();
      } else {
        const { NativeNetSignal } = require('../implementations/native');
        NetSignal = new NativeNetSignal();
      }
      const RN = require('react-native');
      NativeModules = RN.NativeModules;
      NativeEventEmitter = RN.NativeEventEmitter;
    });

    afterEach(() => {
      jest.resetModules();
      if (platformName === 'web') {
        // Clean up global mocks properly
        const g = global as any;
        if ('navigator' in g) delete g.navigator;
        if ('window' in g) delete g.window;
        if ('fetch' in g) delete g.fetch;
      }
    });

    describe('isConnected()', () => {
      if (platformName === 'web') {
        it('should use navigator.onLine on web', () => {
          const result = NetSignal.isConnected();
          expect(result).toBe(true);

          // Test offline - recreate navigator with onLine false
          Object.defineProperty(global, 'navigator', {
            value: {
              onLine: false,
              connection: null
            },
            writable: true,
            configurable: true
          });
          
          jest.resetModules();
          const { WebNetSignal } = require('../implementations/web');
          const offlineNetSignal = new WebNetSignal();
          expect(offlineNetSignal.isConnected()).toBe(false);
        });
      } else {
        it(`should use native module on ${platformName}`, () => {
          const result = NetSignal.isConnected();
          expect(result).toBe(true);
          expect(NativeModules.NetSignal.isConnected).toHaveBeenCalled();
        });
      }
    });

    describe('getType()', () => {
      if (platformName === 'web') {
        it('should detect connection type from browser API', () => {
          const result = NetSignal.getType();
          // Web detection logic checks navigator.connection
          expect(['wifi', 'cellular', 'unknown'].includes(result)).toBe(true);
        });
      } else {
        it(`should get connection type from native module on ${platformName}`, () => {
          const result = NetSignal.getType();
          expect(result).toBe('wifi');
          expect(NativeModules.NetSignal.getConnectionType).toHaveBeenCalled();
        });
      }
    });

    describe('probe()', () => {
      if (platformName === 'web') {
        it('should use fetch API on web', async () => {
          // Mock AbortController
          global.AbortController = jest.fn().mockImplementation(() => ({
            abort: jest.fn(),
            signal: {}
          }));
          
          (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

          const result = await NetSignal.probe('https://example.com');

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
      } else {
        it(`should use native probe on ${platformName}`, async () => {
          const result = await NetSignal.probe('https://example.com');

          expect(result.reachable).toBe(true);
          expect(result.responseTime).toBe(100);
          expect(NativeModules.NetSignal.probe).toHaveBeenCalledWith(
            'https://example.com',
            5000
          );
        });
      }
    });

    describe('onChange()', () => {
      if (platformName === 'web') {
        it('should use window event listeners on web', () => {
          const callback = jest.fn();

          const unsubscribe = NetSignal.onChange(callback);

          expect(global.window.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
          expect(global.window.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));

          unsubscribe();

          expect(global.window.removeEventListener).toHaveBeenCalled();
        });
      } else {
        it(`should use NativeEventEmitter on ${platformName}`, () => {
          const callback = jest.fn();

          const unsubscribe = NetSignal.onChange(callback);

          expect(typeof unsubscribe).toBe('function');

          // Should have created an emitter
          expect(NativeEventEmitter).toHaveBeenCalled();
        });
      }
    });

    describe('Platform-specific behavior', () => {
      if (platformName === 'ios') {
        it('should handle iOS-specific network types', () => {
          // iOS might have specific network types
          (NativeModules.NetSignal.getConnectionType as jest.Mock).mockReturnValue('wifi');
          expect(NetSignal.getType()).toBe('wifi');
        });
      }

      if (platformName === 'android') {
        it('should handle Android-specific network types', () => {
          // Android supports ethernet detection
          (NativeModules.NetSignal.getConnectionType as jest.Mock).mockReturnValue('ethernet');
          expect(NetSignal.getType()).toBe('ethernet');
        });
      }

      if (platformName === 'web') {
        it('should handle browser-specific connection API', () => {
          // Test with missing connection API (older browsers)
          Object.defineProperty(global, 'navigator', {
            value: {
              onLine: true
              // connection property intentionally omitted
            },
            writable: true,
            configurable: true
          });
          jest.resetModules();
          const LimitedNetSignal = require('../index').default;

          const type = LimitedNetSignal.getType();
          expect(type).toBe('unknown'); // Falls back to unknown when API unavailable
        });
      }
    });
  });
};

// Run tests for each platform
testPlatform('ios');
testPlatform('android');
testPlatform('web');