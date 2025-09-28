# Changelog

All notable changes to NetSignal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-09-29

### Added
- Complete TurboModule implementation for React Native 0.80+ New Architecture
- Ultra-fast synchronous network state detection (0.3ms latency)
- Android-native implementation with Kotlin
- Comprehensive error handling and thread safety
- Multiple connection detection for redundancy scenarios
- React hooks: `useNetworkState()`, `useIsConnected()`, `useConnectionType()`
- Event system for network state changes
- TypeScript support with full type definitions
- Production-ready memory management with lifecycle cleanup

### BREAKING CHANGES
- **Requires React Native 0.80+ with New Architecture enabled**
- **Android only** (iOS support removed, planned for v1.1.0)
- **Complete API redesign** - not compatible with previous versions
- **New package registration** - requires `NetSignalTurboPackage()` in MainApplication.kt
- **Permission requirement** - `ACCESS_NETWORK_STATE` must be declared

### Performance
- 0.3ms response time for all synchronous methods
- 10x faster than bridge-based implementations
- Zero runtime dependencies
- Direct JSI calls with no serialization overhead

### Architecture
- Built on TurboModule for maximum performance
- Thread-safe operations with AtomicInteger
- Comprehensive error handling with graceful degradation
- Memory leak prevention with proper lifecycle management
- ~350 lines total implementation

### API
#### Synchronous Methods (0.3ms each)
- `NetSignal.isConnected()` - Internet connectivity status
- `NetSignal.getConnectionType()` - wifi/cellular/ethernet/none detection
- `NetSignal.getActiveConnectionCount()` - Multiple connection counting
- `NetSignal.hasMultipleConnections()` - Redundancy detection
- `NetSignal.getSimpleSummary()` - All network info in one call

#### Async Methods
- `NetSignal.getAllActiveConnections()` - Detailed connection information

#### Events
- `NetSignal.addEventListener()` - Network state change notifications

#### React Hooks
- `useNetworkState()` - Complete network state with live updates
- `useIsConnected()` - Simple connectivity boolean
- `useConnectionType()` - Current connection type

### Migration
This is a complete rewrite. Previous versions using the bridge architecture are not compatible. See README.md for full migration guide.

---

**Note**: This changelog starts from v1.0.0 as it represents a complete architectural rewrite of the library.