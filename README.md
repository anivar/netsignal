# NetSignal

⚡ **Instant network detection for React Native & Web** - Get network status in <1ms

[![npm version](https://img.shields.io/npm/v/netsignal.svg)](https://www.npmjs.com/package/netsignal)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-lightgrey.svg)](https://github.com/anivar/netsignal)
[![Bundle Size](https://img.shields.io/badge/size-2--5KB-brightgreen)](https://www.npmjs.com/package/netsignal)
[![Tree Shakable](https://img.shields.io/badge/tree%20shakable-✓-brightgreen)](https://github.com/anivar/netsignal#tree-shaking)

```javascript
import NetSignal from 'netsignal';

// Instant network status - no waiting!
const isOnline = NetSignal.isConnected(); // <1ms
const connectionType = NetSignal.getType(); // 'wifi' | 'cellular' | 'none'
```

## Features

- **⚡ Instant Detection** - Get network status in <1ms using native OS callbacks
- **🪶 Tiny Bundle** - Only 2-5KB depending on platform
- **🔋 Zero Polling** - No battery drain, uses system events
- **📱 Cross Platform** - Works on iOS, Android, and Web
- **🎯 Tree Shakable** - Load only the code for your platform

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

## Usage

```javascript
import NetSignal from 'netsignal';

// Use the same API on all platforms
const isOnline = NetSignal.isConnected();
const type = NetSignal.getType();
```

## Quick Start

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

## Advanced Usage

### Handling High Latency Networks

NetSignal works reliably regardless of network latency:

```javascript
// Check connectivity instantly, even on satellite internet
const connected = NetSignal.isConnected(); // <1ms always

// Probe with custom timeout for high-latency networks  
const result = await NetSignal.probe('https://api.example.com', 30000);
if (result.reachable) {
  console.log(`API responded in ${result.responseTime}ms`);
}
```

### TypeScript Support

Full TypeScript support with type definitions included:

```typescript
import NetSignal, { ConnectionType, NetworkStatus, ProbeResult } from 'netsignal';

const status: NetworkStatus = {
  isConnected: true,
  type: 'wifi' as ConnectionType
};

const result: ProbeResult = await NetSignal.probe('https://api.com');
```

## How It Works

- **Android**: Uses `NetworkCallback` API for real-time network state monitoring
- **iOS**: Uses `NWPathMonitor` from Network.framework for instant updates  
- **Web**: Uses `navigator.onLine` and Network Information API where available

The native modules maintain cached network state that's updated instantly via OS callbacks, eliminating the need for polling.

## Tree Shaking

NetSignal v0.2.0+ supports automatic tree-shaking. Your bundler will only include code for your target platform:

- **Web builds** exclude React Native dependencies (3KB)
- **Native builds** exclude web polyfills (2KB)
- **Automatic detection** based on your build environment (5KB)

### Platform-Specific Imports

```javascript
// Automatic detection (recommended for most cases)
import NetSignal from 'netsignal';

// Force specific platform for smaller bundle
import NetSignal from 'netsignal/web';    // Web only (3KB)
import NetSignal from 'netsignal/native'; // React Native only (2KB)
```

The default import automatically detects your platform - Metro bundler uses native, web bundlers use web implementation.

## Troubleshooting

### Network changes not detected on Android

Ensure you have the `ACCESS_NETWORK_STATE` permission in your `AndroidManifest.xml`.

### Connection type shows 'unknown' on Web

The Network Information API has limited browser support. Connection type detection works best on Chrome/Edge.

### Probe takes long time

This is expected behavior - `probe()` reports actual network conditions. Use `isConnected()` for instant connectivity checks.

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT © [Anivar A Aravind](https://github.com/anivar)

## Author

**Anivar A Aravind**  
Email: [ping@anivar.net](mailto:ping@anivar.net)  
GitHub: [@anivar](https://github.com/anivar)

---

⭐ **Star on GitHub** if NetSignal helps your project!