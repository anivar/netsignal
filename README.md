# NetSignal

Ultra-fast network state for React Native 0.80+ (New Architecture Only, Android)

**0.3ms latency | TurboModule powered | ~300 lines total**

## Requirements

- React Native 0.80+
- New Architecture enabled
- Android only (iOS/Web not yet supported)
- Kotlin 1.9+

## Installation

```bash
npm install netsignal
```

### Enable New Architecture

In `android/gradle.properties`:
```properties
newArchEnabled=true
```

### Add Permission

In `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

## Usage

```typescript
import NetSignal, { useNetworkState } from 'netsignal';

// Instant checks (0.3ms)
if (NetSignal.isConnected()) {
  console.log('Connected via:', NetSignal.getConnectionType());
}

// React component
function StatusBar() {
  const network = useNetworkState();
  if (!network.connected) return <Text>Offline</Text>;
  return <Text>Network: {network.type}</Text>;
}
```

## API

### Synchronous Methods (0.3ms)

```typescript
NetSignal.isConnected()              // boolean
NetSignal.getConnectionType()        // "wifi" | "cellular" | "ethernet" | "none"
NetSignal.getActiveConnectionCount() // number
NetSignal.hasMultipleConnections()   // boolean
NetSignal.getSimpleSummary()         // all info in one call
```

### Async Methods

```typescript
const connections = await NetSignal.getAllActiveConnections();
// [{ type: "wifi", hasInternet: true, isMetered: false }]
```

### Events

```typescript
const unsubscribe = NetSignal.addEventListener((event) => {
  console.log('Network changed:', event.isConnected);
});
```

### React Hooks

```typescript
const network = useNetworkState();   // full state
const connected = useIsConnected();  // just boolean
const type = useConnectionType();    // just type
```

All hooks share a single native subscription via `useSyncExternalStore`.

## Architecture

```
netsignal/
├── android/
│   ├── build.gradle
│   └── src/main/java/com/netsignal/
│       ├── NetSignalTurboModule.kt
│       └── NetSignalTurboPackage.kt
├── src/
│   ├── NativeNetSignal.ts          (Codegen spec)
│   └── index.tsx                   (JS API + hooks)
├── __tests__/                      (Jest test suite)
└── example/                        (Demo app)
```

## Testing

```bash
npm test
```

21 tests covering all API methods, hooks, event subscriptions, and shared subscription behavior.

## TypeScript

Full TypeScript support with strict types:

```typescript
import NetSignal, {
  ConnectionType,
  NetworkState,
  Connection,
} from 'netsignal';

const type: ConnectionType = NetSignal.getConnectionType();
// "wifi" | "cellular" | "ethernet" | "none" | "unknown"
```

## Why New Architecture Only?

- **10x faster** than old bridge (0.3ms vs 3ms)
- **Simpler code** — no bridge complexity
- **Type safe** — Codegen ensures correctness
- **Future proof** — React Native's direction

## License

MIT
