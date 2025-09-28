# NetSignal

Ultra-fast network state detection for React Native 0.80+ New Architecture

[![GitHub](https://img.shields.io/github/license/anivar/netsignal)](LICENSE)
[![React Native](https://img.shields.io/badge/react--native-0.80%2B-blue.svg)](https://reactnative.dev/)
[![Platform](https://img.shields.io/badge/platform-android-green.svg)](https://developer.android.com/)
[![TypeScript](https://img.shields.io/badge/typescript-5.0%2B-blue.svg)](https://www.typescriptlang.org/)

**0.3ms latency • TurboModule powered • Android-first • Production ready**

## Features

- **Lightning fast** - 0.3ms response time via TurboModule
- **New Architecture** - Built for React Native 0.80+
- **Production ready** - Comprehensive error handling and thread safety
- **Multiple connections** - Detects WiFi + Ethernet redundancy
- **React hooks** - Clean integration with React components
- **Zero dependencies** - No external runtime dependencies

## Requirements

- React Native 0.80.0 or higher
- New Architecture enabled (`newArchEnabled=true`)
- Android only (iOS support planned for v1.1.0)
- Kotlin 1.9+ for compilation

## Installation

```bash
npm install netsignal
```

### Setup

1. **Enable New Architecture** in `android/gradle.properties`:
```properties
newArchEnabled=true
```

2. **Add package** to `MainApplication.kt`:
```kotlin
import com.netsignal.NetSignalTurboPackage

override fun getPackages(): List<ReactPackage> = listOf(
    // ... other packages
    NetSignalTurboPackage()
)
```

3. **Add permission** to `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

## Basic Usage

```typescript
import NetSignal, { useNetworkState } from 'netsignal';

// Synchronous methods (0.3ms each)
const isOnline = NetSignal.isConnected();
const networkType = NetSignal.getConnectionType(); // "wifi" | "cellular" | "ethernet" | "none"
const connectionCount = NetSignal.getActiveConnectionCount();
const hasBackup = NetSignal.hasMultipleConnections();

// React hook
function NetworkStatus() {
  const network = useNetworkState();

  return (
    <Text>
      {network.connected ? `Online via ${network.type}` : 'Offline'}
      {network.multipleConnections && ' (Backup available)'}
    </Text>
  );
}
```

## API Reference

### Synchronous Methods

| Method | Return Type | Description |
|--------|-------------|-------------|
| `isConnected()` | `boolean` | Internet connectivity status |
| `getConnectionType()` | `string` | Connection type: wifi/cellular/ethernet/none |
| `getActiveConnectionCount()` | `number` | Number of active connections |
| `hasMultipleConnections()` | `boolean` | Whether multiple connections exist |
| `getSimpleSummary()` | `object` | All network info in one call |

### Async Methods

```typescript
const connections = await NetSignal.getAllActiveConnections();
// Returns: { connections: [{ type: "wifi", hasInternet: true, isMetered: false }] }
```

### Events

```typescript
const unsubscribe = NetSignal.addEventListener((event) => {
  console.log('Network changed:', event.isConnected, event.type);
});

// Cleanup
unsubscribe();
```

### React Hooks

```typescript
const network = useNetworkState();      // Complete network state
const connected = useIsConnected();     // Just connectivity boolean
const type = useConnectionType();       // Just connection type
```

## Performance

All synchronous calls complete in **0.3-0.5ms**:

```typescript
console.time('check');
NetSignal.isConnected();
console.timeEnd('check');
// Typical result: ~0.3ms
```

**Why fast:**
- Direct TurboModule JSI calls
- No bridge serialization
- Native Android system APIs
- No async overhead for sync methods

## Error Handling

NetSignal handles all error cases gracefully:

- Missing `ACCESS_NETWORK_STATE` permission → returns safe defaults, logs warning
- No ConnectivityManager available → returns false/none
- Network API failures → returns default values
- Never crashes your app

## TypeScript Support

Full type safety:

```typescript
import NetSignal, {
  ConnectionType,    // "wifi" | "cellular" | "ethernet" | "none" | "unknown"
  NetworkState,      // { connected: boolean, type: string, connectionCount: number, multipleConnections: boolean }
  Connection,        // { type: string, hasInternet: boolean, isMetered: boolean }
  NetworkChangeEvent // { isConnected: boolean, type: string, connectionCount: number }
} from 'netsignal';
```

## Architecture

```
netsignal/
├── android/src/main/java/com/netsignal/
│   ├── NetSignalTurboModule.kt      (~170 lines) - Core implementation
│   ├── NetSignalTurboPackage.kt     (~25 lines)  - Package registration
│   └── NativeNetSignalSpec.kt       (~20 lines)  - Abstract base
├── src/
│   ├── NativeNetSignal.ts           (~25 lines)  - Codegen spec
│   └── index.tsx                    (~110 lines) - TypeScript wrapper + hooks
└── package.json

Total: ~350 lines
```

## Migration

### From @react-native-community/netinfo

```diff
- import NetInfo from '@react-native-community/netinfo';
+ import NetSignal, { useNetworkState } from 'netsignal';

- const netInfo = await NetInfo.fetch();
+ const isConnected = NetSignal.isConnected(); // Instant!

- NetInfo.addEventListener(callback);
+ const unsubscribe = NetSignal.addEventListener(callback);
```

## Real-World Example

```typescript
// POS payment system
async function processPayment(amount: number) {
  // Instant connectivity check (0.3ms)
  if (!NetSignal.isConnected()) {
    throw new Error('No internet connection');
  }

  // Prefer ethernet for stability
  if (NetSignal.getConnectionType() === 'ethernet') {
    console.log('Using stable wired connection');
  }

  // Verify backup connectivity
  if (NetSignal.hasMultipleConnections()) {
    console.log('Backup connection available');
  }

  return await submitPayment(amount);
}
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License

MIT © [Anivar Aravind](https://github.com/anivar)