// Mock the TurboModule native module
jest.mock('../src/NativeNetSignal', () => ({
  __esModule: true,
  default: {
    isConnected: jest.fn(() => true),
    getConnectionType: jest.fn(() => 'wifi'),
    getActiveConnectionCount: jest.fn(() => 1),
    hasMultipleConnections: jest.fn(() => false),
    getSimpleSummary: jest.fn(() => ({
      connected: true,
      type: 'wifi',
      connectionCount: 1,
      multipleConnections: false,
    })),
    getAllActiveConnections: jest.fn(() =>
      Promise.resolve({
        connections: [{ type: 'wifi', hasInternet: true, isMetered: false }],
      }),
    ),
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  },
}));
