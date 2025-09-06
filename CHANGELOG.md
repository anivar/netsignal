# Changelog

All notable changes to NetSignal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-09-06

### Added
- 🎯 **Tree-shakable architecture** - Platform-specific code is automatically excluded
- 📦 **Reduced bundle sizes**:
  - Web-only: ~5KB (80% smaller than v0.1.0)
  - Native-only: ~8KB (70% smaller than v0.1.0)
  - Automatic: 5-8KB based on detected platform
- 🏗️ **Platform-specific entry points**:
  - `netsignal/web` - Web-only implementation, no React Native dependencies
  - `netsignal/native` - Native-only implementation, no web polyfills
  - `netsignal` - Automatic platform detection with tree-shaking
- 📖 Comprehensive tree-shaking guide with bundler configurations
- ⚡ Build-time platform detection for zero runtime overhead

### Changed
- Refactored monolithic implementation into platform-specific modules
- Improved conditional exports for better bundler compatibility
- Separated web and native implementations completely
- Updated TypeScript configurations for modular builds

### Performance Improvements
- 80% bundle size reduction for web-only builds
- 70% bundle size reduction for native-only builds
- Zero runtime platform detection overhead
- Improved tree-shaking with proper module boundaries

### Developer Experience
- Explicit platform imports for better control
- Automatic platform detection works out of the box
- Compatible with all major bundlers (Webpack, Vite, Metro, Rollup)
- Full backward compatibility - no API changes

## [0.1.0] - 2025-09-06

### Added
- Initial release
- Instant network detection using native OS callbacks
- Support for React Native New Architecture (Turbo Modules)
- Synchronous `isConnected()` and `getType()` methods
- Asynchronous `probe()` for endpoint reachability testing
- Real-time network change events via `onChange()`
- React Hook support via `useNetSignal()`
- Cross-platform support (iOS 12+, Android API 24+, Web)
- TypeScript definitions
- Comprehensive test suite
- Zero external dependencies

### Platform Support
- React Native 0.72.0+
- React 18.0.0+ and React 19.0.0+
- Node.js 20.0.0+
- iOS 12.0+
- Android API 24+ (Android 7.0)

### Performance
- Network status check: <1ms
- Connection type check: <1ms
- Change detection: <100ms
- Bundle size: ~28KB (packed), ~10KB gzipped