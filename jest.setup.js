// Jest setup for NetSignal - September 2025
// Mock React Native modules

// Performance polyfill for tests
if (typeof performance === 'undefined') {
  global.performance = {
    now: () => Date.now(),
  };
}

// Silence console warnings in tests
const originalWarn = console.warn;

// eslint-disable-next-line no-undef
beforeAll(() => {
  console.warn = (...args) => {
    if (
      args[0]?.includes?.('Require cycle') ||
      args[0]?.includes?.('deprecated')
    ) {
      return;
    }
    originalWarn(...args);
  };
});

// eslint-disable-next-line no-undef
afterAll(() => {
  console.warn = originalWarn;
});
