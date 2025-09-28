import NetSignal, { useNetworkState, useIsConnected } from 'netsignal';
import React from 'react';
import { Alert, Button, Text, View } from 'react-native';

// Basic synchronous usage
function BasicExample() {
  const checkNetwork = () => {
    const isConnected = NetSignal.isConnected();
    const type = NetSignal.getConnectionType();
    const count = NetSignal.getActiveConnectionCount();

    Alert.alert(
      'Network Status',
      `Connected: ${isConnected}\nType: ${type}\nConnections: ${count}`
    );
  };

  return (
    <View style={{ padding: 20 }}>
      <Button title="Check Network" onPress={checkNetwork} />
    </View>
  );
}

// React hook usage
function HookExample() {
  const network = useNetworkState();
  const isConnected = useIsConnected();

  return (
    <View style={{ padding: 20 }}>
      <Text>Status: {isConnected ? 'Online' : 'Offline'}</Text>
      <Text>Type: {network.type}</Text>
      <Text>Connections: {network.connectionCount}</Text>
      {network.multipleConnections && <Text style={{ color: 'green' }}>✓ Backup available</Text>}
    </View>
  );
}

// Event listener usage
function EventExample() {
  const [status, setStatus] = React.useState('Unknown');

  React.useEffect(() => {
    const unsubscribe = NetSignal.addEventListener(event => {
      setStatus(`${event.isConnected ? 'Online' : 'Offline'} via ${event.type}`);
    });

    return unsubscribe;
  }, []);

  return (
    <View style={{ padding: 20 }}>
      <Text>Live Status: {status}</Text>
    </View>
  );
}

export { BasicExample, HookExample, EventExample };
