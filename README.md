# NetSignal

Real-time network state detection for React Native and Web applications. Sub-millisecond performance using native OS network callbacks instead of polling.

[![npm version](https://img.shields.io/npm/v/netsignal.svg)](https://www.npmjs.com/package/netsignal)
[![npm downloads](https://img.shields.io/npm/dm/netsignal.svg)](https://www.npmjs.com/package/netsignal)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-lightgrey.svg)](https://github.com/anivar/netsignal)

[![Bundle Size](https://img.shields.io/bundlephobia/minzip/netsignal)](https://bundlephobia.com/package/netsignal)
[![Tree Shaking](https://img.shields.io/badge/tree--shaking-supported-brightgreen.svg)](https://bundlephobia.com/package/netsignal)
[![Side Effects](https://img.shields.io/badge/side--effects-none-brightgreen.svg)](https://bundlephobia.com/package/netsignal)
[![React Native](https://img.shields.io/badge/React%20Native-0.72%2B-61DAFB.svg)](https://reactnative.dev/)
[![New Architecture](https://img.shields.io/badge/RN%20New%20Arch-Ready-brightgreen.svg)](https://reactnative.dev/docs/new-architecture-intro)

[![Test Coverage](https://img.shields.io/badge/coverage-80%25-green.svg)](https://github.com/anivar/netsignal)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/anivar/netsignal/pulls)
[![GitHub Stars](https://img.shields.io/github/stars/anivar/netsignal?style=social)](https://github.com/anivar/netsignal)

## Key Features

- **Synchronous API**: Get network state instantly without async/await
- **Native Performance**: Direct access to OS network state via TurboModules (React Native) and browser APIs (Web)
- **Memory Safe**: Automatic cleanup of event listeners prevents memory leaks
- **Type Safe**: Full TypeScript support with strict typing
- **Tree Shakable**: Platform-specific code splitting reduces bundle size

## Installation

```bash
npm install netsignal
```

### iOS Setup
```bash
cd ios && pod install
```

### Android Setup
Add to `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

## Core API

### Synchronous Methods

```typescript
import NetSignal from 'netsignal';

// Get network state instantly (no await needed)
const isOnline = NetSignal.isConnected(); // boolean
const connectionType = NetSignal.getType(); // 'wifi' | 'cellular' | 'ethernet' | 'none' | 'unknown'
```

### Network Monitoring

```typescript
// Subscribe to network changes
const unsubscribe = NetSignal.onChange((status) => {
  console.log('Connected:', status.isConnected);
  console.log('Type:', status.type);
  console.log('Quality:', status.quality); // 'excellent' | 'good' | 'fair' | 'poor'
});

// Cleanup
unsubscribe();
```

### Endpoint Health Check

```typescript
// Test endpoint reachability with retries
const result = await NetSignal.probe('https://api.example.com', {
  timeout: 5000,
  retries: 2,
  retryDelay: 1000
});

if (result.reachable) {
  console.log(`Response time: ${result.responseTime}ms`);
  console.log(`Network quality: ${result.quality}`);
}
```

## React Hooks

### Basic Network Status

```tsx
import { useNetSignal } from 'netsignal/hooks';

function NetworkIndicator() {
  const { isConnected, type, quality } = useNetSignal();

  if (!isConnected) {
    return <Alert>No network connection</Alert>;
  }

  return <StatusBar>Connected via {type} - Quality: {quality}</StatusBar>;
}
```

### Endpoint Monitoring

```tsx
import { useNetworkProbe } from 'netsignal/hooks';

function ApiHealthMonitor() {
  const { result, isLoading, probe } = useNetworkProbe(
    'https://api.example.com/health',
    {
      interval: 30000, // Check every 30s
      timeout: 5000,
      retries: 2
    }
  );

  if (result && !result.reachable) {
    return <Alert>API is unreachable</Alert>;
  }

  return (
    <View>
      <Text>API Latency: {result?.responseTime}ms</Text>
      <Button onPress={probe} title="Check Now" disabled={isLoading} />
    </View>
  );
}
```

### Network Quality Monitoring

```tsx
import { useNetworkQuality } from 'netsignal/hooks';

function QualityIndicator() {
  const { quality, latency, jitter, isChecking } = useNetworkQuality(
    'https://cdn.example.com',
    {
      sampleSize: 5,
      interval: 60000
    }
  );

  return (
    <View>
      <Text>Network Quality: {quality}</Text>
      <Text>Latency: {latency}ms</Text>
      <Text>Jitter: {jitter}ms</Text>
      {isChecking && <Spinner />}
    </View>
  );
}
```

## TypeScript Support

```typescript
import NetSignal, {
  ConnectionType,
  NetworkStatus,
  NetworkQuality,
  ProbeResult,
  ExtendedProbeResult
} from 'netsignal';

// All types are fully exported
const status: NetworkStatus = {
  isConnected: true,
  type: 'wifi',
  quality: 'excellent'
};

// Extended probe results include statistics
const result: ExtendedProbeResult = await probeWithRetry(
  NetSignal.probe,
  url,
  { retries: 3 }
);

console.log(result.averageResponseTime);
console.log(result.minResponseTime);
console.log(result.maxResponseTime);
```

## Technical Implementation

### Platform Architecture

| Platform | Implementation | Performance |
|----------|---------------|-------------|
| **iOS** | `NWPathMonitor` (Network.framework) | <1ms via cached state |
| **Android** | `NetworkCallback` API | <1ms via cached state |
| **Web** | `navigator.onLine` + Network Information API | <1ms via browser APIs |

### Native Module Design

```
┌─────────────────┐
│   JavaScript    │
└────────┬────────┘
         │ Synchronous call via JSI
┌────────▼────────┐
│  Native Module  │
│  (Cached State) │
└────────┬────────┘
         │ OS Callbacks
┌────────▼────────┐
│   OS Network    │
│   State Manager │
└─────────────────┘
```

The native module maintains a cached copy of the network state, updated in real-time by OS callbacks. This enables synchronous access from JavaScript without blocking or async overhead.

### Bundle Size Analysis

| Import Method | Size | Includes |
|--------------|------|----------|
| `netsignal` | ~5KB | Auto-detection + all platforms |
| `netsignal/web` | ~3KB | Web implementation only |
| `netsignal/native` | ~2KB | React Native only |

## Error Handling

NetSignal includes comprehensive error handling with custom error types:

```typescript
import { InvalidURLError, NetworkTimeoutError, NativeModuleError } from 'netsignal/errors';

try {
  await NetSignal.probe('invalid-url');
} catch (error) {
  if (error instanceof InvalidURLError) {
    console.error('Invalid URL provided');
  } else if (error instanceof NetworkTimeoutError) {
    console.error('Request timed out');
  } else if (error instanceof NativeModuleError) {
    console.error('Native module not available');
  }
}
```

## Performance Benchmarks

| Operation | Time | Method |
|-----------|------|--------|
| `isConnected()` | <1ms | Cached native state |
| `getType()` | <1ms | Cached native state |
| `onChange()` subscription | <1ms | Native event emitter |
| `probe()` | Network dependent | HTTP HEAD request |

## Browser Support

| Browser | Basic Support | Connection Type | Network Information API |
|---------|--------------|-----------------|------------------------|
| Chrome | ✅ | ✅ | ✅ |
| Firefox | ✅ | ⚠️ Limited | ❌ |
| Safari | ✅ | ⚠️ Limited | ❌ |
| Edge | ✅ | ✅ | ✅ |

## Requirements

- **React Native**: 0.72.0+ (New Architecture compatible)
- **iOS**: 12.0+
- **Android**: API 24+ (Android 7.0)
- **Node.js**: 20.0.0+
- **TypeScript**: 5.0+ (optional)

## Advanced Configuration

### Custom Probe URLs

```typescript
import { DEFAULT_PROBE_URLS } from 'netsignal/constants';

// Default URLs optimized for global availability
DEFAULT_PROBE_URLS.primary // 'https://www.google.com/generate_204'
DEFAULT_PROBE_URLS.secondary // 'https://1.1.1.1/dns-query'
```

### Quality Thresholds

```typescript
import { QUALITY_THRESHOLDS } from 'netsignal/constants';

// Customize quality detection (milliseconds)
QUALITY_THRESHOLDS.excellent // 50ms
QUALITY_THRESHOLDS.good // 150ms
QUALITY_THRESHOLDS.fair // 300ms
```

## Troubleshooting

### Issue: Memory leak warnings
**Solution**: Ensure you call the unsubscribe function returned by `onChange()` when component unmounts.

### Issue: Native module not found
**Solution**: Run `cd ios && pod install` for iOS or rebuild for Android after installation.

### Issue: Incorrect connection type on web
**Solution**: Network Information API has limited browser support. Use feature detection or fallback to basic online/offline status.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License

MIT © [Anivar A Aravind](https://github.com/anivar)