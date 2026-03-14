# netsignal v1.0 Design Spec

Android-only TurboModule network state library for React Native 0.80+ (New Architecture).

## Scope

- Android only
- New Architecture only (TurboModule via JSI)
- Synchronous network checks (~0.3ms) + async detailed queries + event emitter
- Minimal example app for verification
- Publishable to npm
- Full Jest test suite

## Out of Scope

- iOS implementation
- Web fallback
- Old Architecture (Bridge) support
- Event debouncing

## Bug Fixes

### 1. getAllActiveConnections() Promise mismatch (Critical)

**Problem:** TypeScript spec declares `getAllActiveConnections(): Promise<{...}>` but Kotlin returns `WritableMap` synchronously. Codegen expects async native methods to accept a `Promise` parameter.

**Fix:** Change Kotlin signature from:
```kotlin
override fun getAllActiveConnections(): WritableMap {
    // ...
    return result
}
```
To:
```kotlin
override fun getAllActiveConnections(promise: Promise) {
    // ...
    promise.resolve(result)  // return type becomes Unit
}
```

The return type changes from `WritableMap` to `Unit` (void). The JS-side `Promise<...>` return type in `NativeNetSignal.ts` is already correct — Codegen translates it to the `Promise` parameter pattern on the native side.

### 2. Delete hand-written NativeNetSignalSpec.kt (Critical)

**Problem:** `NativeNetSignalSpec.kt` is hand-written but Codegen generates this file from the TypeScript spec. The hand-written version will conflict with the generated one.

**Fix:** Delete `android/src/main/java/com/netsignal/NativeNetSignalSpec.kt`. The `codegenConfig` in `package.json` already points Codegen to `./src`. `NetSignalTurboModule.kt` will extend the Codegen-generated spec class instead.

### 3. Hook redundant state computations (Minor)

**Problem:** `useIsConnected()` and `useConnectionType()` each call `useNetworkState()` internally, which creates independent `useState` + `addEventListener` calls per hook instance. The native subscription is already shared (the `NetSignalModule` class reference-counts listeners), but each hook instance creates its own JS-level state and event handler, causing redundant state computations when multiple hooks are used in the same component.

**Fix:** Use `useSyncExternalStore` (React 18+) with a module-level store. All hooks subscribe to the same store instance:

```typescript
// Module-level store
let currentState: NetworkState = ...;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) { ... }
function getSnapshot(): NetworkState { return currentState; }

// All hooks use the same store
export function useNetworkState(): NetworkState {
    return useSyncExternalStore(subscribe, getSnapshot);
}
export function useIsConnected(): boolean {
    return useSyncExternalStore(subscribe, () => currentState.connected);
}
```

This ensures a single native subscription and a single state regardless of how many hooks are mounted.

### 4. NativeEventEmitter compatibility with TurboModules (Critical)

**Problem:** The current code creates `NativeEventEmitter` with `NativeModules.NetSignal` (bridge accessor). In New Architecture-only mode, modules may not be accessible via `NativeModules`. RN 0.80 TurboModules should use the TurboModule reference directly.

**Fix:** Pass the TurboModule reference (from `TurboModuleRegistry.getEnforcing`) to `NativeEventEmitter`:

```typescript
import NativeNetSignal from './NativeNetSignal';
// ...
this.emitter = new NativeEventEmitter(NativeNetSignal as any);
```

If RN 0.80 `NativeEventEmitter` doesn't accept TurboModule refs, use `DeviceEventEmitter` as an alternative (the native side emits via `RCTDeviceEventEmitter` anyway).

## New Files

### android/build.gradle

```groovy
buildscript {
    ext.safeExtGet = {prop, fallback ->
        rootProject.ext.has(prop) ? rootProject.ext.get(prop) : fallback
    }
}

apply plugin: 'com.android.library'
apply plugin: 'org.jetbrains.kotlin.android'

android {
    namespace 'com.netsignal'
    compileSdkVersion safeExtGet('compileSdkVersion', 34)

    defaultConfig {
        minSdkVersion safeExtGet('minSdkVersion', 24)
        targetSdkVersion safeExtGet('targetSdkVersion', 34)
    }

    sourceSets {
        main {
            java.srcDirs += ['src/main/java']
        }
    }
}

dependencies {
    implementation "com.facebook.react:react-android"
}
```

The consumer app's `react-native-gradle-plugin` handles Codegen integration. The library just needs to declare the React Native dependency.

### android/src/main/AndroidManifest.xml

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.netsignal">
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
</manifest>
```

### .gitignore

Standard RN library ignores: `node_modules/`, `lib/`, `android/build/`, `example/android/build/`, `example/node_modules/`, `.gradle/`, `*.tgz`, etc.

### example/

Scaffold using `npx @react-native-community/cli init NetSignalExample --version 0.80.0`.

Configuration:
- `package.json`: Add `"netsignal": "file:../"` as dependency
- `metro.config.js`: Add `watchFolders: [path.resolve(__dirname, '..')]` for symlink resolution
- `android/gradle.properties`: Ensure `newArchEnabled=true`
- `android/settings.gradle`: Include `':netsignal'` project with correct path
- `android/app/build.gradle`: Add `implementation project(':netsignal')`
- `MainApplication.kt`: Register `NetSignalTurboPackage()`

The example app screen displays:
- All sync API results (isConnected, type, count, summary)
- Async getAllActiveConnections result
- Live event stream log

### jest.config.js

```javascript
module.exports = {
    preset: 'react-native',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
    setupFiles: ['./__tests__/setup.ts'],
    testPathPattern: '__tests__/.*\\.test\\.(ts|tsx)$',
};
```

### __tests__/setup.ts

Mocks for `react-native` event emitter and the native module.

## Existing File Changes

### src/NativeNetSignal.ts (Codegen spec)

No changes needed — the Promise return type for `getAllActiveConnections` is correct on the JS side. Codegen translates `Promise<T>` to a native `Promise` parameter automatically.

### src/index.tsx (JS API)

- Replace hook implementation with `useSyncExternalStore` pattern (Bug Fix #3)
- Fix `NativeEventEmitter` construction to use TurboModule ref (Bug Fix #4)
- Public API signatures remain unchanged

### android/.../NetSignalTurboModule.kt

- Fix `getAllActiveConnections` to accept `Promise` parameter, return `Unit` (Bug Fix #1)
- Add `com.facebook.react.bridge.Promise` import
- Extend Codegen-generated spec class (after deleting hand-written one)

### android/.../NetSignalTurboPackage.kt

No changes needed.

### package.json

- Fix repository URL (remove "yourusername" placeholder)
- Fix author field
- Verify codegenConfig is correct
- Add `jest`, `@testing-library/react-native`, `@types/jest`, `@types/react` to devDependencies

### tsconfig.json

No changes needed — current config is correct for RN 0.80 (`strict: true`, `jsx: react-native`, `moduleResolution: node`).

### README.md

- Update architecture diagram to reflect actual file structure
- Update line counts
- Explicitly state Android-only
- Add testing section

## Architecture

```
netsignal/
├── android/
│   ├── build.gradle
│   ├── src/main/
│   │   ├── AndroidManifest.xml
│   │   └── java/com/netsignal/
│   │       ├── NetSignalTurboModule.kt
│   │       └── NetSignalTurboPackage.kt
├── src/
│   ├── NativeNetSignal.ts          (Codegen spec)
│   └── index.tsx                   (JS API + hooks)
├── __tests__/
│   ├── setup.ts                    (mocks)
│   ├── NetSignal.test.ts           (API tests)
│   └── hooks.test.tsx              (hook tests)
├── example/                        (RN 0.80 test app)
├── jest.config.js
├── package.json
├── tsconfig.json
├── .gitignore
└── README.md
```

## API Surface (unchanged externally)

Public signatures are identical. Internal subscription behavior changes (shared store via useSyncExternalStore).

### Synchronous Methods
- `isConnected(): boolean`
- `getConnectionType(): ConnectionType`
- `getActiveConnectionCount(): number`
- `hasMultipleConnections(): boolean`
- `getSimpleSummary(): NetworkState`

### Async Methods
- `getAllActiveConnections(): Promise<Connection[]>`

### Events
- `addEventListener(listener): unsubscribe`

### Hooks
- `useNetworkState(): NetworkState`
- `useIsConnected(): boolean`
- `useConnectionType(): ConnectionType`

## Testing

### Test Framework

Jest with `@testing-library/react-native` for hook tests. Tests run without a native environment — all native module calls are mocked.

### Test Structure

```
__tests__/
├── setup.ts                  (shared mocks for native module + RN event emitter)
├── NetSignal.test.ts         (JS API class tests)
└── hooks.test.tsx            (React hook tests)
```

### Native Module Mock

The setup file mocks `./src/NativeNetSignal` with jest.fn() implementations:

- `isConnected()` → `true` (configurable per test)
- `getConnectionType()` → `'wifi'`
- `getActiveConnectionCount()` → `1`
- `hasMultipleConnections()` → `false`
- `getSimpleSummary()` → `{ connected: true, type: 'wifi', connectionCount: 1, multipleConnections: false }`
- `getAllActiveConnections()` → resolves `{ connections: [{ type: 'wifi', hasInternet: true, isMetered: false }] }`
- `addListener()` / `removeListeners()` → `jest.fn()`

Note: The mock returns the **native module shape** (object with `connections` key). The API tests verify that `index.tsx` correctly unwraps this to a flat `Connection[]` array.

### NetSignal API Tests (NetSignal.test.ts)

1. **isConnected()** — returns native module value (true case)
2. **isConnected()** — returns native module value (false case)
3. **getConnectionType()** — returns typed connection type string
4. **getActiveConnectionCount()** — returns numeric count
5. **hasMultipleConnections()** — returns boolean from native
6. **getSimpleSummary()** — returns full NetworkState object with correct ConnectionType cast
7. **getAllActiveConnections()** — resolves with unwrapped Connection array (not raw native object)
8. **addEventListener()** — registers native listener on first subscriber
9. **addEventListener()** — returns unsubscribe function that cleans up
10. **addEventListener()** — multiple listeners share single native registration
11. **addEventListener()** — last unsubscribe removes native listener

### Hook Tests (hooks.test.tsx)

1. **useNetworkState()** — returns initial state from getSimpleSummary()
2. **useNetworkState()** — updates state when network event fires
3. **useNetworkState()** — cleans up subscription on unmount
4. **useIsConnected()** — returns boolean connected state
5. **useIsConnected()** — updates when network changes
6. **useConnectionType()** — returns connection type string
7. **useConnectionType()** — updates when network changes
8. **Shared subscription** — multiple hooks in same component use single native subscription
9. **Shared subscription** — subscription cleans up when all consumers unmount

### Test Configuration

- `jest.config.js` at project root with `react-native` preset
- Setup file mocks `NativeEventEmitter` and `NativeNetSignal`
- TypeScript support via `@react-native/babel-preset`

## Success Criteria

1. `android/build.gradle` exists and Gradle resolves dependencies
2. `getAllActiveConnections` uses `Promise` parameter on native side (returns `Unit`)
3. No hand-written `NativeNetSignalSpec.kt` (Codegen generates it)
4. Hooks share a single event subscription via `useSyncExternalStore`
5. `NativeEventEmitter` uses correct reference for TurboModule
6. Example app builds, runs, and displays network state on Android emulator
7. Package metadata is correct (no placeholders)
8. `npm pack` produces a valid publishable tarball
9. All 20 Jest tests pass
10. TypeScript compiles with no errors (`tsc --noEmit`)
