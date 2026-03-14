import React from 'react';
import { Text, View } from 'react-native';
import { render, act } from '@testing-library/react-native';
import { DeviceEventEmitter } from 'react-native';
import { useNetworkState, useIsConnected, useConnectionType, _resetForTesting } from '../src/index';
import NativeNetSignal from '../src/NativeNetSignal';

const mockNative = NativeNetSignal as jest.Mocked<typeof NativeNetSignal>;

beforeEach(() => {
  _resetForTesting();
  jest.clearAllMocks();
  mockNative.getSimpleSummary.mockReturnValue({
    connected: true,
    type: 'wifi',
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

describe('useNetworkState', () => {
  it('returns initial state from getSimpleSummary', () => {
    const { getByTestId } = render(<NetworkStateDisplay />);
    expect(getByTestId('connected').props.children).toBe('true');
    expect(getByTestId('type').props.children).toBe('wifi');
    expect(getByTestId('count').props.children).toBe('1');
  });

  it('updates state when network event fires', () => {
    const { getByTestId } = render(<NetworkStateDisplay />);

    act(() => {
      DeviceEventEmitter.emit('netSignalChange', {
        isConnected: false,
        type: 'none',
        connectionCount: 0,
      });
    });

    expect(getByTestId('connected').props.children).toBe('false');
    expect(getByTestId('type').props.children).toBe('none');
    expect(getByTestId('count').props.children).toBe('0');
  });

  it('cleans up subscription on unmount', () => {
    const { unmount } = render(<NetworkStateDisplay />);
    unmount();
    expect(mockNative.removeListeners).toHaveBeenCalled();
  });
});

describe('useIsConnected', () => {
  it('returns boolean connected state', () => {
    const { getByTestId } = render(<IsConnectedDisplay />);
    expect(getByTestId('connected').props.children).toBe('true');
  });

  it('updates when network changes', () => {
    const { getByTestId } = render(<IsConnectedDisplay />);

    act(() => {
      DeviceEventEmitter.emit('netSignalChange', {
        isConnected: false,
        type: 'none',
        connectionCount: 0,
      });
    });

    expect(getByTestId('connected').props.children).toBe('false');
  });
});

describe('useConnectionType', () => {
  it('returns connection type string', () => {
    const { getByTestId } = render(<ConnectionTypeDisplay />);
    expect(getByTestId('type').props.children).toBe('wifi');
  });

  it('updates when network changes', () => {
    const { getByTestId } = render(<ConnectionTypeDisplay />);

    act(() => {
      DeviceEventEmitter.emit('netSignalChange', {
        isConnected: true,
        type: 'cellular',
        connectionCount: 1,
      });
    });

    expect(getByTestId('type').props.children).toBe('cellular');
  });
});

describe('Shared subscription', () => {
  it('multiple hooks in same component use single native subscription', () => {
    render(<MultiHookDisplay />);
    const addListenerCalls = mockNative.addListener.mock.calls.length;
    expect(addListenerCalls).toBe(1);
  });

  it('subscription cleans up when all consumers unmount', () => {
    const { unmount } = render(<MultiHookDisplay />);
    unmount();
    expect(mockNative.removeListeners).toHaveBeenCalled();
  });
});
