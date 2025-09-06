# Changelog

All notable changes to NetSignal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-01-01

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