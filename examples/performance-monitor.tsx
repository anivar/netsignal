import NetSignal from 'netsignal';
import React from 'react';
import { Button, Text, View } from 'react-native';

function PerformanceMonitor() {
  const [measurements, setMeasurements] = React.useState<number[]>([]);
  const [isMonitoring, setIsMonitoring] = React.useState(false);

  const runBenchmark = () => {
    const iterations = 1000;
    const results: number[] = [];

    console.time('NetSignal.isConnected() x1000');

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      NetSignal.isConnected();
      const end = performance.now();
      results.push(end - start);
    }

    console.timeEnd('NetSignal.isConnected() x1000');

    setMeasurements(results);
  };

  const startContinuousMonitoring = () => {
    setIsMonitoring(true);
    const newMeasurements: number[] = [];

    const interval = setInterval(() => {
      const start = performance.now();
      NetSignal.isConnected();
      const duration = performance.now() - start;

      newMeasurements.push(duration);
      setMeasurements(prev => [...prev.slice(-99), duration]);
    }, 100);

    // Stop after 10 seconds
    setTimeout(() => {
      clearInterval(interval);
      setIsMonitoring(false);
    }, 10000);
  };

  const getStats = () => {
    if (measurements.length === 0) return null;

    const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length;
    const min = Math.min(...measurements);
    const max = Math.max(...measurements);
    const median = measurements.sort((a, b) => a - b)[Math.floor(measurements.length / 2)];

    return { avg, min, max, median };
  };

  const stats = getStats();

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>NetSignal Performance</Text>

      <View style={{ marginVertical: 20 }}>
        <Button title="Run Benchmark (1000 calls)" onPress={runBenchmark} disabled={isMonitoring} />

        <View style={{ marginTop: 10 }}>
          <Button
            title={isMonitoring ? 'Monitoring...' : 'Start Continuous Monitor (10s)'}
            onPress={startContinuousMonitoring}
            disabled={isMonitoring}
          />
        </View>
      </View>

      {stats && (
        <View>
          <Text style={{ fontWeight: 'bold' }}>
            Performance Stats ({measurements.length} calls):
          </Text>
          <Text>Average: {stats.avg.toFixed(3)}ms</Text>
          <Text>Median: {stats.median.toFixed(3)}ms</Text>
          <Text>Min: {stats.min.toFixed(3)}ms</Text>
          <Text>Max: {stats.max.toFixed(3)}ms</Text>

          <Text style={{ marginTop: 10, color: stats.avg < 1 ? 'green' : 'orange' }}>
            {stats.avg < 1 ? '✓ Excellent performance' : '⚠ Performance degraded'}
          </Text>
        </View>
      )}
    </View>
  );
}

export default PerformanceMonitor;
