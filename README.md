# NetSignal

⚡ **Instant network detection for React Native** - Get network status in <1ms instead of 3-40 seconds

[![npm version](https://img.shields.io/npm/v/netsignal.svg)](https://www.npmjs.com/package/netsignal)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-lightgrey.svg)](https://github.com/anivar/netsignal)
[![Bundle Size](https://img.shields.io/badge/size-5--8KB-brightgreen)](https://www.npmjs.com/package/netsignal)
[![Tree Shakable](https://img.shields.io/badge/tree%20shakable-✓-brightgreen)](https://github.com/anivar/netsignal/blob/main/TREE_SHAKING.md)

```javascript
// ❌ Slow: Traditional polling approach (3-40 seconds)
await fetch('https://google.com').then(() => true).catch(() => false);

// ✅ Fast: NetSignal (<1ms)
import NetSignal from 'netsignal';
const isOnline = NetSignal.isConnected(); // Instant!
```

## The Problem

🐌 **Your app freezes for 3-40 seconds** checking if the network is available

📱 **Users see loading spinners** when the device already knows it's offline

💸 **Wasted API calls** to check connectivity when the OS already has this information

## The Solution

NetSignal uses **native OS callbacks** instead of polling. The operating system already maintains real-time network state - we just expose it to React Native with zero latency.

## Key Features

| Feature | NetSignal | Traditional Polling |
|---------|-----------|--------------------|
| **Detection Speed** | <1ms ⚡ | 3-40 seconds 🐌 |
| **Battery Impact** | Minimal ✅ | High (constant polling) ❌ |
| **Data Usage** | Zero 🎯 | Wastes data on checks 💸 |
| **Accuracy** | Real-time OS state 📡 | Can miss quick changes ⚠️ |
| **Bundle Size** | 5-8KB 🎯 | Often 100KB+ 📦📦📦 |
| **Tree Shakable** | ✅ Platform-specific | ❌ Includes all code |

## Installation

```bash
npm install netsignal
# or
yarn add netsignal
# or
pnpm add netsignal
```

### iOS Setup

```bash
cd ios && pod install
```

### Android Setup

Add permission to `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

## 🎯 Tree-Shakable Imports (v0.2.0+)

NetSignal automatically excludes unused platform code:

```javascript
// Automatic platform detection
import NetSignal from 'netsignal'; // 5-8KB based on platform

// Force web-only (5KB) - no React Native code
import NetSignal from 'netsignal/web';

// Force native-only (8KB) - no web code  
import NetSignal from 'netsignal/native';
```

See [Tree-Shaking Guide](./TREE_SHAKING.md) for bundler configuration.

## Quick Start - 30 Second Integration

```typescript
import NetSignal from 'netsignal';

// Check connection instantly (synchronous!)
const isOnline = NetSignal.isConnected(); // true/false

// Get connection type
const type = NetSignal.getType(); // 'wifi' | 'cellular' | 'ethernet' | 'none'

// Listen for changes
const unsubscribe = NetSignal.onChange((status) => {
  console.log('Network:', status.isConnected ? 'Online' : 'Offline');
  console.log('Type:', status.type);
});

// Check endpoint reachability
const health = await NetSignal.probe('https://api.example.com', 5000);
if (health.reachable) {
  console.log(`API responded in ${health.responseTime}ms`);
}

// Clean up
unsubscribe();
```

## React Hook

```tsx
import { useNetSignal } from 'netsignal/hooks';

function MyComponent() {
  const { isConnected, type } = useNetSignal();
  
  if (!isConnected) {
    return <Text>You're offline</Text>;
  }
  
  return <Text>Connected via {type}</Text>;
}
```

## API Reference

### `isConnected(): boolean`

Returns connection status instantly from native cache.

- **Synchronous** - No await needed
- **Instant** - <1ms response time
- **Cached** - No network calls

### `getType(): ConnectionType`

Returns the current connection type.

**Possible values:**
- `'wifi'` - WiFi connection
- `'cellular'` - Mobile data (3G/4G/5G)
- `'ethernet'` - Wired connection
- `'none'` - No connection
- `'unknown'` - Connection type cannot be determined

### `probe(url: string, timeoutMs?: number): Promise<ProbeResult>`

Tests if a specific endpoint is reachable.

**Parameters:**
- `url` - The URL to test
- `timeoutMs` - Optional timeout (default: 5000ms)

**Returns:**
```typescript
{
  reachable: boolean;
  responseTime: number; // milliseconds, -1 if failed
  error?: string;       // Error message if failed
}
```

### `onChange(callback: (status: NetworkStatus) => void): () => void`

Subscribes to network status changes.

**Callback receives:**
```typescript
{
  isConnected: boolean;
  type: ConnectionType;
}
```

**Returns:** Unsubscribe function

## Platform Support

| Feature | iOS | Android | Web |
|---------|-----|---------|-----|
| Instant Detection | ✅ | ✅ | ✅ |
| Connection Type | ✅ | ✅ | ⚠️ Limited |
| Change Events | ✅ | ✅ | ✅ |
| Endpoint Probe | ✅ | ✅ | ✅ |
| Turbo Modules | ✅ | ✅ | N/A |

## Requirements

- React Native 0.72.0+
- iOS 12.0+
- Android API 24+ (Android 7.0)
- Node.js 20.0.0+

## React Native New Architecture

NetSignal fully supports the New Architecture:

- ✅ TurboModules for synchronous native calls
- ✅ Fabric compatible
- ✅ JSI direct native access
- ✅ Backward compatible with old architecture

## Performance

| Metric | Value |
|--------|-------|
| Status Check | <1ms (synchronous from cache) |
| Type Check | <1ms (synchronous from cache) |
| Change Detection | Instant (OS callbacks) |
| npm Package Size | 29KB |
| Tests | 55 passing |

## Handling High Latency Networks

NetSignal works reliably regardless of network latency:

- **`isConnected()` and `getType()`** - Always instant (<1ms) even on networks with 10+ second latency, because they return cached OS state
- **`probe(url, timeout)`** - Accurately reports actual endpoint response times. You control the timeout (default 5000ms, configurable up to any value you need)

```javascript
// Check connectivity instantly, even on satellite internet (600ms+ latency)
const connected = NetSignal.isConnected(); // <1ms always

// Probe with custom timeout for high-latency networks  
const result = await NetSignal.probe('https://api.example.com', 30000); // 30 second timeout
if (result.reachable) {
  console.log(`API responded in ${result.responseTime}ms`);
}
```

The library has been tested with latencies from 3-10 seconds and works correctly with any latency level.

## How It Works

### Native Implementation
- **Android**: Uses `NetworkCallback` API for real-time network state monitoring
- **iOS**: Uses `NWPathMonitor` from Network.framework for instant updates  
- **Web**: Uses `navigator.onLine` and Network Information API where available

The native modules maintain cached network state that's updated instantly via OS callbacks, eliminating the need for polling.

## Troubleshooting

### Network changes not detected on Android

Ensure you have the `ACCESS_NETWORK_STATE` permission in your `AndroidManifest.xml`.

### Connection type shows 'unknown' on Web

The Network Information API has limited browser support. Connection type detection works best on Chrome/Edge.

### Probe takes long time

This is expected behavior - `probe()` reports actual network conditions. In areas with high latency, probes will accurately reflect the real response time. Use `isConnected()` for instant connectivity checks.

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT © [Anivar A Aravind](https://github.com/anivar)

## Author

**Anivar A Aravind**  
Email: [ping@anivar.net](mailto:ping@anivar.net)  
GitHub: [@anivar](https://github.com/anivar)

---

## Keywords

react-native, network, connectivity, offline, online, network-detection, internet, wifi, cellular, network-status, connection, turbo-module, react-native-network, netinfo, network-monitor, instant-detection

---

**Built to solve real production issues** where network polling was causing 8-40 second delays in POS systems.

⭐ **Star on GitHub** if this saves you from slow network checks!