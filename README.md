# NetSignal

⚡ **Instant network detection for React Native & Web** - Get network status in <1ms with 93% smaller bundle size

[![npm version](https://img.shields.io/npm/v/netsignal.svg)](https://www.npmjs.com/package/netsignal)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-lightgrey.svg)](https://github.com/anivar/netsignal)
[![Bundle Size](https://img.shields.io/badge/size-2--5KB-brightgreen)](https://www.npmjs.com/package/netsignal)
[![Tree Shakable](https://img.shields.io/badge/tree%20shakable-✓-brightgreen)](https://github.com/anivar/netsignal/blob/main/TREE_SHAKING.md)

```javascript
// ❌ Slow & Heavy: Traditional approach
await fetch('https://google.com') // 3-40 seconds + 100KB+ bundle
  .then(() => true)
  .catch(() => false);

// ✅ Fast & Light: NetSignal v0.2.0
import NetSignal from 'netsignal/web'; // Only 3KB!
const isOnline = NetSignal.isConnected(); // <1ms instant!
```

## Why NetSignal v0.2.0?

### 🎯 The Problems We Solve

1. **🐌 Slow Detection**: Apps freeze for 3-40 seconds checking network status
2. **📦 Huge Bundles**: Network libraries add 40-120KB to your app
3. **🔋 Battery Drain**: Constant polling wastes battery
4. **💸 Wasted Data**: Unnecessary API calls just to check connectivity

### ✨ The NetSignal Solution

- **⚡ Instant Detection**: <1ms response using native OS callbacks
- **🪶 Tiny Bundle**: Only 2-3KB with tree-shaking (93% smaller!)
- **🔋 Zero Polling**: No battery drain, no background tasks
- **🎯 Platform Optimized**: Load only the code you need

## Key Features

| Feature | NetSignal | Traditional Polling |
|---------|-----------|--------------------|
| **Detection Speed** | <1ms ⚡ | 3-40 seconds 🐌 |
| **Battery Impact** | Minimal ✅ | High (constant polling) ❌ |
| **Data Usage** | Zero 🎯 | Wastes data on checks 💸 |
| **Accuracy** | Real-time OS state 📡 | Can miss quick changes ⚠️ |
| **Bundle Size** | 2-5KB 🎯 | Often 100KB+ 📦📦📦 |
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

NetSignal v0.2.0 introduces **revolutionary bundle size reduction** through platform-specific builds:

### Bundle Sizes by Import Method

| Import Method | Bundle Size | Size Reduction | Best For |
|--------------|-------------|----------------|----------|
| `netsignal/web` | **3KB** | 89% smaller | Web apps, PWAs |
| `netsignal/native` | **2KB** | 93% smaller | React Native apps |
| `netsignal` (auto) | **5KB** | 81% smaller | Universal apps |

```javascript
// 🌐 Web-only (3KB) - no React Native dependencies
import NetSignal from 'netsignal/web';

// 📱 Native-only (2KB) - no web polyfills
import NetSignal from 'netsignal/native';

// 🔄 Automatic detection (5KB) - tree-shakes based on platform
import NetSignal from 'netsignal';
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
| Bundle Size (Web) | 3KB (89% smaller than v0.1.0) |
| Bundle Size (Native) | 2KB (93% smaller than v0.1.0) |
| Bundle Size (Auto) | 5KB (81% smaller than v0.1.0) |
| Tests | 68 passing |

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

## What's New in v0.2.0

### 🚀 Massive Bundle Size Reduction
- **Up to 93% smaller** bundle sizes through tree-shaking
- Platform-specific builds eliminate unused code
- Web builds no longer include React Native dependencies
- Native builds no longer include web polyfills

### 📦 Smart Platform Detection
- Automatic platform detection at build time
- Zero runtime overhead for platform checks
- Bundlers automatically select the right implementation

### 🔧 Improved Architecture
- Modular design with separate platform implementations
- Clean separation between web and native code
- Full TypeScript support with platform-specific types

## How It Works

### Tree-Shaking Architecture (v0.2.0+)
NetSignal uses conditional exports in package.json to provide different entry points for different environments:
- Metro bundler (React Native) automatically uses the native implementation
- Web bundlers (Webpack, Vite, etc.) automatically use the web implementation
- The main entry point includes runtime detection as a fallback

### Native Implementation
- **Android**: Uses `NetworkCallback` API for real-time network state monitoring
- **iOS**: Uses `NWPathMonitor` from Network.framework for instant updates  
- **Web**: Uses `navigator.onLine` and Network Information API where available

The native modules maintain cached network state that's updated instantly via OS callbacks, eliminating the need for polling.

## Migration from v0.1.0

### ✨ Good News: No Code Changes Required!

The API is 100% backward compatible. To get the bundle size benefits:

1. **Update to v0.2.0:**
   ```bash
   npm install netsignal@latest
   ```

2. **Optional: Use platform-specific imports for maximum savings:**
   ```javascript
   // Old (v0.1.0) - 29KB
   import NetSignal from 'netsignal';
   
   // New (v0.2.0) - Choose based on your platform:
   import NetSignal from 'netsignal/web';    // 3KB for web
   import NetSignal from 'netsignal/native'; // 2KB for React Native
   import NetSignal from 'netsignal';        // 5KB auto-detect
   ```

3. **That's it!** Enjoy 89-93% smaller bundles with zero API changes.

## Troubleshooting

### Network changes not detected on Android

Ensure you have the `ACCESS_NETWORK_STATE` permission in your `AndroidManifest.xml`.

### Connection type shows 'unknown' on Web

The Network Information API has limited browser support. Connection type detection works best on Chrome/Edge.

### Probe takes long time

This is expected behavior - `probe()` reports actual network conditions. In areas with high latency, probes will accurately reflect the real response time. Use `isConnected()` for instant connectivity checks.

## Bundle Size Comparison

### v0.1.0 vs v0.2.0

```
v0.1.0 (Monolithic):  ████████████████████████████ 29KB
v0.2.0 (Auto):        █████ 5KB (-81%)
v0.2.0 (Web):         ███ 3KB (-89%)
v0.2.0 (Native):      ██ 2KB (-93%)
```

### vs Popular Alternatives

| Library | Bundle Size | Detection Speed | Tree-Shakable |
|---------|------------|----------------|---------------|
| **NetSignal v0.2.0** | **2-5KB** | **<1ms** | **✅** |
| @react-native-community/netinfo | 38KB | 100-500ms | ❌ |
| react-native-offline | 121KB | 3-40s | ❌ |
| react-native-connection-info | 45KB | 1-5s | ❌ |

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