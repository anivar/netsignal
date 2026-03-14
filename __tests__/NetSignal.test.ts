import { DeviceEventEmitter } from "react-native";
import NetSignal, { _resetForTesting } from "../src/index";
import NativeNetSignal from "../src/NativeNetSignal";

const mockNative = NativeNetSignal as jest.Mocked<typeof NativeNetSignal>;

beforeEach(() => {
  _resetForTesting();
  jest.clearAllMocks();
  mockNative.isConnected.mockReturnValue(true);
  mockNative.getConnectionType.mockReturnValue("wifi");
  mockNative.getActiveConnectionCount.mockReturnValue(1);
  mockNative.hasMultipleConnections.mockReturnValue(false);
  mockNative.getSimpleSummary.mockReturnValue({
    connected: true,
    type: "wifi",
    connectionCount: 1,
    multipleConnections: false,
  });
  mockNative.getAllActiveConnections.mockResolvedValue({
    connections: [{ type: "wifi", hasInternet: true, isMetered: false }],
  });
});

describe("NetSignal", () => {
  describe("isConnected", () => {
    it("returns true when native reports connected", () => {
      mockNative.isConnected.mockReturnValue(true);
      expect(NetSignal.isConnected()).toBe(true);
    });

    it("returns false when native reports disconnected", () => {
      mockNative.isConnected.mockReturnValue(false);
      expect(NetSignal.isConnected()).toBe(false);
    });
  });

  describe("getConnectionType", () => {
    it("returns the connection type from native", () => {
      mockNative.getConnectionType.mockReturnValue("cellular");
      expect(NetSignal.getConnectionType()).toBe("cellular");
    });
  });

  describe("getActiveConnectionCount", () => {
    it("returns the count from native", () => {
      mockNative.getActiveConnectionCount.mockReturnValue(3);
      expect(NetSignal.getActiveConnectionCount()).toBe(3);
    });
  });

  describe("hasMultipleConnections", () => {
    it("returns boolean from native", () => {
      mockNative.hasMultipleConnections.mockReturnValue(true);
      expect(NetSignal.hasMultipleConnections()).toBe(true);
    });
  });

  describe("getSimpleSummary", () => {
    it("returns NetworkState with correct ConnectionType cast", () => {
      mockNative.getSimpleSummary.mockReturnValue({
        connected: true,
        type: "ethernet",
        connectionCount: 2,
        multipleConnections: true,
      });
      const summary = NetSignal.getSimpleSummary();
      expect(summary).toEqual({
        connected: true,
        type: "ethernet",
        connectionCount: 2,
        multipleConnections: true,
      });
    });
  });

  describe("getAllActiveConnections", () => {
    it("resolves with unwrapped Connection array", async () => {
      const connections = await NetSignal.getAllActiveConnections();
      expect(connections).toEqual([
        { type: "wifi", hasInternet: true, isMetered: false },
      ]);
    });
  });

  describe("addEventListener", () => {
    it("registers native listener on first subscriber", () => {
      const listener = jest.fn();
      const unsubscribe = NetSignal.addEventListener(listener);
      expect(mockNative.addListener).toHaveBeenCalledWith("netSignalChange");
      unsubscribe();
    });

    it("returns unsubscribe function that cleans up", () => {
      const listener = jest.fn();
      const unsubscribe = NetSignal.addEventListener(listener);
      unsubscribe();
      expect(mockNative.removeListeners).toHaveBeenCalledWith(1);
    });

    it("calls listener when native event fires", () => {
      const listener = jest.fn();
      const unsubscribe = NetSignal.addEventListener(listener);

      DeviceEventEmitter.emit("netSignalChange", {
        isConnected: false,
        type: "none",
        connectionCount: 0,
      });

      expect(listener).toHaveBeenCalledWith({
        isConnected: false,
        type: "none",
        connectionCount: 0,
      });

      unsubscribe();
    });

    it("multiple listeners share single native registration", () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      const unsub1 = NetSignal.addEventListener(listener1);
      const unsub2 = NetSignal.addEventListener(listener2);

      expect(mockNative.addListener).toHaveBeenCalledTimes(1);

      unsub1();
      unsub2();
    });

    it("last unsubscribe removes native listener", () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      const unsub1 = NetSignal.addEventListener(listener1);
      const unsub2 = NetSignal.addEventListener(listener2);

      unsub1();
      expect(mockNative.removeListeners).not.toHaveBeenCalled();

      unsub2();
      expect(mockNative.removeListeners).toHaveBeenCalledWith(1);
    });
  });
});
