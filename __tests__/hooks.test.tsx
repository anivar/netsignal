import { act, render } from "@testing-library/react-native";
import { DeviceEventEmitter, Text, View } from "react-native";
import NetSignal, {
  _resetForTesting,
  useConnectionType,
  useIsConnected,
  useNetworkState,
} from "../src/index";
import NativeNetSignal from "../src/NativeNetSignal";

const mockNative = NativeNetSignal as jest.Mocked<
  NonNullable<typeof NativeNetSignal>
>;

beforeEach(() => {
  _resetForTesting();
  jest.clearAllMocks();
  mockNative.getSimpleSummary.mockReturnValue({
    connected: true,
    type: "wifi",
    connectionCount: 1,
    multipleConnections: false,
  });
});

function NetworkStateDisplay() {
  const state = useNetworkState();
  return (
    <View>
      <Text testID="connected">{String(state.connected)}</Text>
      <Text testID="type">{state.type}</Text>
      <Text testID="count">{String(state.connectionCount)}</Text>
    </View>
  );
}

function IsConnectedDisplay() {
  const connected = useIsConnected();
  return <Text testID="connected">{String(connected)}</Text>;
}

function ConnectionTypeDisplay() {
  const type = useConnectionType();
  return <Text testID="type">{type}</Text>;
}

function MultiHookDisplay() {
  const connected = useIsConnected();
  const type = useConnectionType();
  return (
    <View>
      <Text testID="connected">{String(connected)}</Text>
      <Text testID="type">{type}</Text>
    </View>
  );
}

describe("useNetworkState", () => {
  it("returns initial state from getSimpleSummary", () => {
    const { getByTestId } = render(<NetworkStateDisplay />);
    expect(getByTestId("connected").props.children).toBe("true");
    expect(getByTestId("type").props.children).toBe("wifi");
    expect(getByTestId("count").props.children).toBe("1");
  });

  it("updates state when network event fires", () => {
    const { getByTestId } = render(<NetworkStateDisplay />);

    act(() => {
      DeviceEventEmitter.emit("netSignalChange", {
        isConnected: false,
        type: "none",
        connectionCount: 0,
      });
    });

    expect(getByTestId("connected").props.children).toBe("false");
    expect(getByTestId("type").props.children).toBe("none");
    expect(getByTestId("count").props.children).toBe("0");
  });

  it("cleans up subscription on unmount", () => {
    const { unmount } = render(<NetworkStateDisplay />);
    unmount();
    expect(mockNative.removeListeners).toHaveBeenCalled();
  });
});

describe("useIsConnected", () => {
  it("returns boolean connected state", () => {
    const { getByTestId } = render(<IsConnectedDisplay />);
    expect(getByTestId("connected").props.children).toBe("true");
  });

  it("updates when network changes", () => {
    const { getByTestId } = render(<IsConnectedDisplay />);

    act(() => {
      DeviceEventEmitter.emit("netSignalChange", {
        isConnected: false,
        type: "none",
        connectionCount: 0,
      });
    });

    expect(getByTestId("connected").props.children).toBe("false");
  });
});

describe("useConnectionType", () => {
  it("returns connection type string", () => {
    const { getByTestId } = render(<ConnectionTypeDisplay />);
    expect(getByTestId("type").props.children).toBe("wifi");
  });

  it("updates when network changes", () => {
    const { getByTestId } = render(<ConnectionTypeDisplay />);

    act(() => {
      DeviceEventEmitter.emit("netSignalChange", {
        isConnected: true,
        type: "cellular",
        connectionCount: 1,
      });
    });

    expect(getByTestId("type").props.children).toBe("cellular");
  });
});

describe("Shared subscription", () => {
  it("multiple hooks in same component use single native subscription", () => {
    render(<MultiHookDisplay />);
    const addListenerCalls = mockNative.addListener.mock.calls.length;
    expect(addListenerCalls).toBe(1);
  });

  it("subscription cleans up when all consumers unmount", () => {
    const { unmount } = render(<MultiHookDisplay />);
    unmount();
    expect(mockNative.removeListeners).toHaveBeenCalled();
  });
});

describe("Regressions", () => {
  it("does not re-render when an event repeats the current state", () => {
    let renders = 0;
    function CountingDisplay() {
      renders++;
      const state = useNetworkState();
      return <Text testID="type">{state.type}</Text>;
    }

    render(<CountingDisplay />);
    const before = renders;

    // Android emits onCapabilitiesChanged for signal-strength and metering
    // changes; the observable state is unchanged.
    act(() => {
      DeviceEventEmitter.emit("netSignalChange", {
        isConnected: true,
        type: "wifi",
        connectionCount: 1,
      });
    });

    expect(renders).toBe(before);

    act(() => {
      DeviceEventEmitter.emit("netSignalChange", {
        isConnected: true,
        type: "cellular",
        connectionCount: 1,
      });
    });

    expect(renders).toBeGreaterThan(before);
  });

  it("re-reads the native snapshot when a consumer mounts after teardown", () => {
    const { unmount } = render(<ConnectionTypeDisplay />);
    unmount();

    mockNative.getSimpleSummary.mockReturnValue({
      connected: true,
      type: "cellular",
      connectionCount: 2,
      multipleConnections: true,
    });

    const { getByTestId } = render(<ConnectionTypeDisplay />);
    expect(getByTestId("type").props.children).toBe("cellular");
  });

  it("ignores a second unsubscribe instead of tearing down for others", () => {
    const unsubscribeTwice = NetSignal.addEventListener(() => {});
    const { getByTestId } = render(<ConnectionTypeDisplay />);

    unsubscribeTwice();
    unsubscribeTwice();

    expect(mockNative.removeListeners).not.toHaveBeenCalled();

    act(() => {
      DeviceEventEmitter.emit("netSignalChange", {
        isConnected: true,
        type: "ethernet",
        connectionCount: 1,
      });
    });

    expect(getByTestId("type").props.children).toBe("ethernet");
  });
});
