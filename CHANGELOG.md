# Changelog

All notable changes to NetSignal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Network Quality Detection** - Real-time quality assessment based on latency thresholds
  - `NetworkQuality` type: 'excellent' (<50ms) | 'good' (50-150ms) | 'fair' (150-300ms) | 'poor' (>300ms)
  - Quality metrics in probe results including jitter calculation
- **Advanced React Hooks**
  - `useNetworkProbe()` - Monitor endpoint health with configurable intervals and retries
  - `useNetworkQuality()` - Track network quality metrics with sampling
- **Retry Logic** - `probeWithRetry()` utility with configurable attempts and delays
- **Custom Error Types** - Type-safe error handling
  - `InvalidURLError` - URL validation failures
  - `NetworkTimeoutError` - Request timeout errors
  - `NetworkRequestError` - Network request failures
  - `NativeModuleError` - Native module unavailability
- **Memory Leak Prevention** - Web implementation includes cleanup() method for event listeners
- **Constants Module** - Configurable defaults
  - `DEFAULT_PROBE_URLS` - Google's generate_204 as primary, Cloudflare DNS as secondary
  - `QUALITY_THRESHOLDS` - Customizable latency thresholds
  - `TIMEOUTS` - Configurable timeout ranges (1ms-60s)

### Changed
- **Enhanced probe() method**
  - URL validation with protocol checking (HTTP/HTTPS only)
  - Timeout validation (1ms-60,000ms range)
  - Better error messages with context
- **Improved TypeScript types**
  - `ExtendedProbeResult` with statistics (min/max/average response times)
  - `ProbeOptions` interface for configuration
  - `NetworkQualityInfo` for detailed metrics
- **Native implementation error handling**
  - Throws specific error types instead of returning error objects
  - Better Platform.OS handling for undefined cases

### Fixed
- **Memory leak in web implementation** - Event listeners not cleaned up
- **Security vulnerability** - Missing URL validation in probe method
- **Test reliability** - Fixed async timing issues in network quality tests

### Developer Experience
- **Enhanced npm scripts**
  - `npm run build` - Explicit build command
  - `npm run clean` - Clean all build artifacts
  - `npm run test:watch` - Jest watch mode
  - `npm run test:coverage` - Coverage reporting
  - `npm run lint:fix` - Auto-fix linting issues
  - `npm run prepublishOnly` - Pre-publish validation
- **Package.json improvements**
  - Added `sideEffects: false` for better tree-shaking
  - Added `funding` field for GitHub sponsors
- **Comprehensive test suite** - 81 tests covering all new features

## [0.2.0] - 2025-09-06

### Added
- **Tree-shakable architecture** - Platform-specific code splitting
  - Web builds: ~3KB (excludes React Native dependencies)
  - Native builds: ~2KB (excludes web polyfills)
  - Auto-detection: ~5KB (includes platform detection logic)
- **Multiple entry points** for optimal bundle size
  - `netsignal/web` - Web-only implementation
  - `netsignal/native` - React Native-only implementation
  - `netsignal` - Automatic platform detection

### Changed
- **Architecture refactor**
  - Separated implementations into `src/implementations/` directory
  - Abstract `BaseNetSignal` class defines interface
  - Platform-specific classes extend base
- **Build system improvements**
  - react-native-builder-bob configuration for multiple targets
  - Conditional exports in package.json
  - TypeScript project references for modular builds

### Performance
- 80% bundle size reduction for web-only builds
- 70% bundle size reduction for native-only builds
- Zero runtime overhead for platform detection (resolved at build time)

## [0.1.0] - 2025-09-06

### Initial Release

#### Core Features
- **Synchronous API** - Sub-millisecond network state detection
  - `isConnected()` - Returns boolean instantly from cached state
  - `getType()` - Returns connection type from cache
- **Asynchronous Methods**
  - `probe(url, timeout)` - HTTP HEAD request for endpoint health
  - `onChange(callback)` - Subscribe to network state changes
- **React Integration**
  - `useNetSignal()` hook for component state management

#### Platform Implementation
- **iOS**: `NWPathMonitor` from Network.framework
- **Android**: `NetworkCallback` API with cached state
- **Web**: `navigator.onLine` with Network Information API fallback

#### Technical Specifications
- **React Native**: 0.72.0+ with New Architecture support
- **Bundle Size**: ~10KB gzipped
- **Performance**: <1ms for synchronous methods
- **Type Safety**: Full TypeScript definitions
- **Zero Dependencies**: No external packages required

#### Platform Requirements
- iOS 12.0+
- Android API 24+ (Android 7.0)
- Node.js 20.0.0+
- React 18.0.0+ or 19.0.0+

[Unreleased]: https://github.com/anivar/netsignal/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/anivar/netsignal/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/anivar/netsignal/releases/tag/v0.1.0