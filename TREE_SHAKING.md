# Tree-Shaking Guide for NetSignal v0.2.0

NetSignal now supports automatic tree-shaking to minimize bundle size based on your target platform.

## Bundle Sizes

| Import Method | Bundle Size | Includes |
|--------------|-------------|----------|
| `netsignal/web` | ~5KB | Web-only implementation |
| `netsignal/native` | ~8KB | iOS/Android only |
| `netsignal` (auto) | 5-8KB | Platform-specific based on build |
| `netsignal` (universal) | ~15KB | Both implementations (fallback) |

## Automatic Platform Detection

### React Native Projects
Metro bundler automatically uses the native implementation:
```javascript
import NetSignal from 'netsignal'; // Automatically uses native implementation
```

### Web Projects (Webpack/Vite)
Web bundlers automatically use the web implementation:
```javascript
import NetSignal from 'netsignal'; // Automatically uses web implementation
```

## Manual Platform Selection

### Force Web-Only Bundle
```javascript
import NetSignal from 'netsignal/web'; // Only web code, no React Native
```

### Force Native-Only Bundle
```javascript
import NetSignal from 'netsignal/native'; // Only native code, no web
```

## Webpack Configuration

For optimal tree-shaking in webpack:

```javascript
// webpack.config.js
module.exports = {
  resolve: {
    alias: {
      'netsignal': 'netsignal/web', // Force web-only
      'react-native': 'react-native-web' // If using RN Web
    }
  },
  optimization: {
    usedExports: true,
    sideEffects: false
  }
};
```

## Vite Configuration

For Vite projects:

```javascript
// vite.config.js
export default {
  resolve: {
    alias: {
      'netsignal': 'netsignal/web'
    }
  },
  build: {
    rollupOptions: {
      treeshake: true
    }
  }
};
```

## Next.js Configuration

For Next.js projects:

```javascript
// next.config.js
module.exports = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'netsignal': 'netsignal/web'
    };
    return config;
  }
};
```

## React Native Web

For React Native Web projects:

```javascript
// Use automatic detection (recommended)
import NetSignal from 'netsignal';

// Or explicitly use web version
import NetSignal from 'netsignal/web';
```

## Bundle Analysis

To verify tree-shaking is working:

### Webpack Bundle Analyzer
```bash
npm install --save-dev webpack-bundle-analyzer
```

### Vite
```bash
npx vite build --mode analyze
```

### React Native
```bash
npx react-native bundle --platform ios --dev false --entry-file index.js --bundle-output /tmp/main.jsbundle
# Check bundle size
ls -lh /tmp/main.jsbundle
```

## Platform-Specific Features

### Web-Only Features
- Uses browser's Network Information API
- No React Native dependencies
- Smaller bundle size
- Works in all modern browsers

### Native-Only Features
- Uses iOS Network.framework
- Uses Android NetworkCallback API
- Real-time OS callbacks
- No web polyfills

## TypeScript Support

TypeScript automatically picks the correct types based on your import:

```typescript
// Automatic platform detection
import NetSignal from 'netsignal';

// Explicit web types
import NetSignal from 'netsignal/web';

// Explicit native types
import NetSignal from 'netsignal/native';
```

## Migration from v0.1.0

No code changes required! The API is identical:

```javascript
// v0.1.0 and v0.2.0 - Same API
const isOnline = NetSignal.isConnected();
const type = NetSignal.getType();
```

The only difference is smaller bundle sizes due to tree-shaking.

## Troubleshooting

### Bundle includes both implementations

**Solution**: Use explicit imports (`netsignal/web` or `netsignal/native`)

### TypeScript errors with platform-specific imports

**Solution**: Ensure `moduleResolution: "bundler"` in tsconfig.json

### Metro bundler not finding native implementation

**Solution**: Clear Metro cache: `npx react-native start --reset-cache`