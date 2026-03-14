import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
  StyleSheet,
  Button,
} from 'react-native';
import NetSignal, {
  useNetworkState,
  useIsConnected,
  useConnectionType,
  type NetworkChangeEvent,
} from 'netsignal';

function SyncApiSection() {
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Sync API (direct calls)</Text>
      <Text>isConnected: {String(NetSignal.isConnected())}</Text>
      <Text>getConnectionType: {NetSignal.getConnectionType()}</Text>
      <Text>getActiveConnectionCount: {NetSignal.getActiveConnectionCount()}</Text>
      <Text>hasMultipleConnections: {String(NetSignal.hasMultipleConnections())}</Text>
      <Text>getSimpleSummary: {JSON.stringify(NetSignal.getSimpleSummary(), null, 2)}</Text>
    </View>
  );
}

function AsyncApiSection() {
  const [connections, setConnections] = useState<string>('loading...');

  useEffect(() => {
    NetSignal.getAllActiveConnections().then((result) => {
      setConnections(JSON.stringify(result, null, 2));
    });
  }, []);

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Async API</Text>
      <Text>getAllActiveConnections: {connections}</Text>
    </View>
  );
}

function HooksSection() {
  const networkState = useNetworkState();
  const isConnected = useIsConnected();
  const connectionType = useConnectionType();

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Hooks</Text>
      <Text>useNetworkState: {JSON.stringify(networkState, null, 2)}</Text>
      <Text>useIsConnected: {String(isConnected)}</Text>
      <Text>useConnectionType: {connectionType}</Text>
    </View>
  );
}

function EventLogSection() {
  const [events, setEvents] = useState<string[]>([]);

  useEffect(() => {
    return NetSignal.addEventListener((event: NetworkChangeEvent) => {
      setEvents((prev) => [
        `${new Date().toISOString()} - connected:${event.isConnected} type:${event.type}`,
        ...prev.slice(0, 19),
      ]);
    });
  }, []);

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Event Log</Text>
      {events.length === 0 ? (
        <Text>Waiting for network changes...</Text>
      ) : (
        events.map((e, i) => <Text key={i}>{e}</Text>)
      )}
    </View>
  );
}

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>NetSignal Example</Text>
        <Button title="Refresh Sync APIs" onPress={() => setRefreshKey((k) => k + 1)} />
        <SyncApiSection key={refreshKey} />
        <AsyncApiSection />
        <HooksSection />
        <EventLogSection />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', padding: 16 },
  heading: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  section: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
});
