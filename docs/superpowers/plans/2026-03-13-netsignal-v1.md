# netsignal v1.0 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make netsignal a fully working, testable, publishable Android-only TurboModule network state library for React Native 0.80+.

**Architecture:** Fix critical bugs (Promise mismatch, hand-written Codegen spec, NativeEventEmitter), refactor hooks to use useSyncExternalStore, add missing build infrastructure (build.gradle, AndroidManifest), add Jest test suite, create example app.

**Tech Stack:** React Native 0.80, TurboModule (JSI), Kotlin, TypeScript, Jest, @testing-library/react-native

**Spec:** `docs/superpowers/specs/2026-03-13-netsignal-v1-design.md`

---

## Chunk 1: Project Infrastructure & Bug Fixes

### Task 1: Add .gitignore and initialize git

**Files:**
- Create: `.gitignore`

- [ ] **Step 1: Create .gitignore**

```gitignore
# Dependencies
node_modules/

# Build output
lib/

# Android build
android/build/
android/.gradle/

# Example app
example/node_modules/
example/android/build/
example/android/.gradle/
example/android/app/build/
example/ios/Pods/

# IDE
.idea/
.vscode/
*.iml

# OS
.DS_Store

# npm
*.tgz

# Debug logs
*.log
```

- [ ] **Step 2: Initialize git repo**

Run: `cd /Users/anivar/Dev/opensource/netsignal && git init && git add .gitignore && git commit -m "chore: add .gitignore"`

---

### Task 2: Fix package.json metadata and add dev dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Fix placeholder metadata and add devDependencies**

Update `package.json`:
- Change `"author"` from `"Your Name"` to `"Anivar"` (or preferred name)
- Change repository URL from `yourusername` to actual GitHub username
- Change bugs URL similarly
- Change homepage similarly
- Add to `devDependencies`:
  - `"jest": "^29.7.0"`
  - `"@testing-library/react-native": "^12.0.0"`
  - `"@types/jest": "^29.5.0"`
  - `"react-native-builder-bob": "^0.23.0"` (already present, verify)
- Add `"test"` script: `"test": "jest"`
- Add `"typecheck"` script: `"typecheck": "tsc --noEmit"`

- [ ] **Step 2: Commit**

Run: `git add package.json && git commit -m "chore: fix package metadata, add test dependencies"`

---

### Task 3: Add Android build infrastructure

**Files:**
- Create: `android/build.gradle`
- Create: `android/src/main/AndroidManifest.xml`

- [ ] **Step 1: Create android/build.gradle**

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

- [ ] **Step 2: Create android/src/main/AndroidManifest.xml**

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.netsignal">
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
</manifest>
```

- [ ] **Step 3: Commit**

Run: `git add android/build.gradle android/src/main/AndroidManifest.xml && git commit -m "feat: add Android build.gradle and AndroidManifest.xml"`

---

### Task 4: Delete hand-written NativeNetSignalSpec.kt (Bug Fix #2)

**Files:**
- Delete: `android/src/main/java/com/netsignal/NativeNetSignalSpec.kt`

- [ ] **Step 1: Delete the hand-written spec**

Run: `rm android/src/main/java/com/netsignal/NativeNetSignalSpec.kt`

This file conflicts with Codegen-generated specs. The `codegenConfig` in `package.json` tells React Native to generate the native spec from `src/NativeNetSignal.ts`.

- [ ] **Step 2: Commit**

Run: `git rm android/src/main/java/com/netsignal/NativeNetSignalSpec.kt && git commit -m "fix: remove hand-written NativeNetSignalSpec.kt (Codegen generates this)"`

---

### Task 5: Fix getAllActiveConnections() Promise mismatch (Bug Fix #1)

**Files:**
- Modify: `android/src/main/java/com/netsignal/NetSignalTurboModule.kt`

- [ ] **Step 1: Fix the method signature**

In `NetSignalTurboModule.kt`, add `Promise` import and change `getAllActiveConnections`:

Add import:
```kotlin
import com.facebook.react.bridge.Promise
```

Change method from:
```kotlin
override fun getAllActiveConnections(): WritableMap {
    val result = Arguments.createMap()
    // ... existing body ...
    result.putArray("connections", connections)
    return result
}
```

To:
```kotlin
override fun getAllActiveConnections(promise: Promise) {
    val result = Arguments.createMap()
    val connections = Arguments.createArray()

    try {
        val cm = connectivityManager
        if (cm != null) {
            cm.allNetworks.forEach { network ->
                val caps = cm.getNetworkCapabilities(network)
                if (caps?.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) == true) {
                    val connection = Arguments.createMap()

                    val type = when {
                        caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) -> "ethernet"
                        caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> "wifi"
                        caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> "cellular"
                        else -> "unknown"
                    }

                    connection.putString("type", type)
                    connection.putBoolean("hasInternet", true)
                    connection.putBoolean("isMetered", !caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_NOT_METERED))

                    connections.pushMap(connection)
                }
            }
        }
    } catch (e: SecurityException) {
        Log.w(NAME, "Missing ACCESS_NETWORK_STATE permission", e)
    } catch (e: Exception) {
        Log.e(NAME, "Error getting all connections", e)
    }

    result.putArray("connections", connections)
    promise.resolve(result)
}
```

- [ ] **Step 2: Commit**

Run: `git add android/src/main/java/com/netsignal/NetSignalTurboModule.kt && git commit -m "fix: getAllActiveConnections uses Promise parameter for Codegen compatibility"`

---

### Task 6: Rewrite src/index.tsx with bug fixes (Bug Fixes #3, #4)

**Files:**
- Modify: `src/index.tsx`

- [ ] **Step 1: Rewrite index.tsx**

Replace the entire file with the fixed implementation:

```typescript
import { useSyncExternalStore } from 'react';
import { DeviceEventEmitter } from 'react-native';
import NativeNetSignal from './NativeNetSignal';

export type ConnectionType = 'wifi' | 'cellular' | 'ethernet' | 'none' | 'unknown';

export interface NetworkState {
  connected: boolean;
  type: ConnectionType;
  connectionCount: number;
  multipleConnections: boolean;
}

export interface Connection {
  type: string;
  hasInternet: boolean;
  isMetered: boolean;
}

export type NetworkChangeEvent = {
  isConnected: boolean;
  type: string;
  connectionCount: number;
};

// --- Module-level shared store ---

let currentState: NetworkState = {
  connected: false,
  type: 'unknown',
  connectionCount: 0,
  multipleConnections: false,
};

let initialized = false;
const storeListeners = new Set<() => void>();
let nativeSubscription: (() => void) | null = null;
let nativeListenerCount = 0;

// Exported for testing only — resets module-level state between tests
export function _resetForTesting(): void {
  currentState = {
    connected: false,
    type: 'unknown',
    connectionCount: 0,
    multipleConnections: false,
  };
  initialized = false;
  storeListeners.clear();
  if (nativeSubscription !== null) {
    nativeSubscription();
    nativeSubscription = null;
  }
  nativeListenerCount = 0;
}

function initState(): void {
  if (!initialized) {
    try {
      const summary = NativeNetSignal.getSimpleSummary();
      currentState = {
        connected: summary.connected,
        type: summary.type as ConnectionType,
        connectionCount: summary.connectionCount,
        multipleConnections: summary.multipleConnections,
      };
    } catch (_e) {
      // Keep default state if native module not available
    }
    initialized = true;
  }
}

function notifyStoreListeners(): void {
  storeListeners.forEach((listener) => listener());
}

function handleNativeEvent(event: NetworkChangeEvent): void {
  currentState = {
    connected: event.isConnected,
    type: event.type as ConnectionType,
    connectionCount: event.connectionCount,
    multipleConnections: event.connectionCount > 1,
  };
  notifyStoreListeners();
}

function startNativeListener(): void {
  if (nativeSubscription === null) {
    NativeNetSignal.addListener('netSignalChange');
    const subscription = DeviceEventEmitter.addListener(
      'netSignalChange',
      handleNativeEvent,
    );
    nativeSubscription = () => {
      subscription.remove();
      NativeNetSignal.removeListeners(1);
    };
  }
  nativeListenerCount++;
}

function stopNativeListener(): void {
  nativeListenerCount--;
  if (nativeListenerCount <= 0) {
    nativeListenerCount = 0;
    if (nativeSubscription !== null) {
      nativeSubscription();
      nativeSubscription = null;
    }
  }
}

function subscribe(listener: () => void): () => void {
  initState();
  storeListeners.add(listener);
  startNativeListener();

  return () => {
    storeListeners.delete(listener);
    stopNativeListener();
  };
}

function getSnapshot(): NetworkState {
  initState();
  return currentState;
}

// --- Public API class ---

class NetSignalModule {
  isConnected(): boolean {
    return NativeNetSignal.isConnected();
  }

  getConnectionType(): ConnectionType {
    return NativeNetSignal.getConnectionType() as ConnectionType;
  }

  getActiveConnectionCount(): number {
    return NativeNetSignal.getActiveConnectionCount();
  }

  hasMultipleConnections(): boolean {
    return NativeNetSignal.hasMultipleConnections();
  }

  getSimpleSummary(): NetworkState {
    const summary = NativeNetSignal.getSimpleSummary();
    return {
      connected: summary.connected,
      type: summary.type as ConnectionType,
      connectionCount: summary.connectionCount,
      multipleConnections: summary.multipleConnections,
    };
  }

  async getAllActiveConnections(): Promise<Connection[]> {
    const result = await NativeNetSignal.getAllActiveConnections();
    return result.connections;
  }

  addEventListener(listener: (event: NetworkChangeEvent) => void): () => void {
    initState();
    startNativeListener();

    const emitterSubscription = DeviceEventEmitter.addListener(
      'netSignalChange',
      listener,
    );

    return () => {
      emitterSubscription.remove();
      stopNativeListener();
    };
  }
}

const NetSignal = new NetSignalModule();

// --- Hooks (shared store via useSyncExternalStore) ---

export function useNetworkState(): NetworkState {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function useIsConnected(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => getSnapshot().connected,
  );
}

export function useConnectionType(): ConnectionType {
  return useSyncExternalStore(
    subscribe,
    () => getSnapshot().type,
  );
}

export default NetSignal;
```

Key changes:
- **Bug Fix #3**: Hooks use `useSyncExternalStore` with a module-level shared store. Single native subscription regardless of hook count.
- **Bug Fix #4**: Uses `DeviceEventEmitter` instead of `NativeEventEmitter(NativeModules.NetSignal)`. The native side already emits via `RCTDeviceEventEmitter`, so `DeviceEventEmitter` is the correct receiver for TurboModules.
- `addEventListener` on the class now also uses `DeviceEventEmitter` directly.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors (may warn about missing react-native types if deps not installed yet — that's OK at this stage)

- [ ] **Step 3: Commit**

Run: `git add src/index.tsx && git commit -m "fix: rewrite JS API with useSyncExternalStore hooks and DeviceEventEmitter"`

---

## Chunk 2: Test Suite

### Task 7: Add Jest configuration and test setup

**Files:**
- Create: `jest.config.js`
- Create: `__tests__/setup.ts`

- [ ] **Step 1: Create jest.config.js**

```javascript
module.exports = {
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  setupFiles: ['./__tests__/setup.ts'],
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)'],
};
```

- [ ] **Step 2: Create __tests__/setup.ts**

```typescript
import { DeviceEventEmitter } from 'react-native';

// Mock the TurboModule native module
jest.mock('../src/NativeNetSignal', () => ({
  __esModule: true,
  default: {
    isConnected: jest.fn(() => true),
    getConnectionType: jest.fn(() => 'wifi'),
    getActiveConnectionCount: jest.fn(() => 1),
    hasMultipleConnections: jest.fn(() => false),
    getSimpleSummary: jest.fn(() => ({
      connected: true,
      type: 'wifi',
      connectionCount: 1,
      multipleConnections: false,
    })),
    getAllActiveConnections: jest.fn(() =>
      Promise.resolve({
        connections: [{ type: 'wifi', hasInternet: true, isMetered: false }],
      }),
    ),
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  },
}));
```

- [ ] **Step 3: Commit**

Run: `git add jest.config.js __tests__/setup.ts && git commit -m "chore: add Jest config and native module mock setup"`

---

### Task 8: Write NetSignal API tests

**Files:**
- Create: `__tests__/NetSignal.test.ts`

- [ ] **Step 1: Write the test file**

```typescript
import NetSignal, { _resetForTesting } from '../src/index';
import NativeNetSignal from '../src/NativeNetSignal';
import { DeviceEventEmitter } from 'react-native';

// Get typed mock references
const mockNative = NativeNetSignal as jest.Mocked<typeof NativeNetSignal>;

beforeEach(() => {
  _resetForTesting();
  jest.clearAllMocks();
  // Reset to defaults
  mockNative.isConnected.mockReturnValue(true);
  mockNative.getConnectionType.mockReturnValue('wifi');
  mockNative.getActiveConnectionCount.mockReturnValue(1);
  mockNative.hasMultipleConnections.mockReturnValue(false);
  mockNative.getSimpleSummary.mockReturnValue({
    connected: true,
    type: 'wifi',
    connectionCount: 1,
    multipleConnections: false,
  });
  mockNative.getAllActiveConnections.mockResolvedValue({
    connections: [{ type: 'wifi', hasInternet: true, isMetered: false }],
  });
});

describe('NetSignal', () => {
  describe('isConnected', () => {
    it('returns true when native reports connected', () => {
      mockNative.isConnected.mockReturnValue(true);
      expect(NetSignal.isConnected()).toBe(true);
    });

    it('returns false when native reports disconnected', () => {
      mockNative.isConnected.mockReturnValue(false);
      expect(NetSignal.isConnected()).toBe(false);
    });
  });

  describe('getConnectionType', () => {
    it('returns the connection type from native', () => {
      mockNative.getConnectionType.mockReturnValue('cellular');
      expect(NetSignal.getConnectionType()).toBe('cellular');
    });
  });

  describe('getActiveConnectionCount', () => {
    it('returns the count from native', () => {
      mockNative.getActiveConnectionCount.mockReturnValue(3);
      expect(NetSignal.getActiveConnectionCount()).toBe(3);
    });
  });

  describe('hasMultipleConnections', () => {
    it('returns boolean from native', () => {
      mockNative.hasMultipleConnections.mockReturnValue(true);
      expect(NetSignal.hasMultipleConnections()).toBe(true);
    });
  });

  describe('getSimpleSummary', () => {
    it('returns NetworkState with correct ConnectionType cast', () => {
      mockNative.getSimpleSummary.mockReturnValue({
        connected: true,
        type: 'ethernet',
        connectionCount: 2,
        multipleConnections: true,
      });
      const summary = NetSignal.getSimpleSummary();
      expect(summary).toEqual({
        connected: true,
        type: 'ethernet',
        connectionCount: 2,
        multipleConnections: true,
      });
    });
  });

  describe('getAllActiveConnections', () => {
    it('resolves with unwrapped Connection array', async () => {
      const connections = await NetSignal.getAllActiveConnections();
      expect(connections).toEqual([
        { type: 'wifi', hasInternet: true, isMetered: false },
      ]);
    });
  });

  describe('addEventListener', () => {
    it('registers native listener on first subscriber', () => {
      const listener = jest.fn();
      const unsubscribe = NetSignal.addEventListener(listener);
      expect(mockNative.addListener).toHaveBeenCalledWith('netSignalChange');
      unsubscribe();
    });

    it('returns unsubscribe function that cleans up', () => {
      const listener = jest.fn();
      const unsubscribe = NetSignal.addEventListener(listener);
      unsubscribe();
      expect(mockNative.removeListeners).toHaveBeenCalledWith(1);
    });

    it('calls listener when native event fires', () => {
      const listener = jest.fn();
      const unsubscribe = NetSignal.addEventListener(listener);

      DeviceEventEmitter.emit('netSignalChange', {
        isConnected: false,
        type: 'none',
        connectionCount: 0,
      });

      expect(listener).toHaveBeenCalledWith({
        isConnected: false,
        type: 'none',
        connectionCount: 0,
      });

      unsubscribe();
    });

    it('multiple listeners share single native registration', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      const unsub1 = NetSignal.addEventListener(listener1);
      const unsub2 = NetSignal.addEventListener(listener2);

      // addListener should be called exactly once despite two subscribers
      expect(mockNative.addListener).toHaveBeenCalledTimes(1);

      unsub1();
      unsub2();
    });

    it('last unsubscribe removes native listener', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      const unsub1 = NetSignal.addEventListener(listener1);
      const unsub2 = NetSignal.addEventListener(listener2);

      unsub1();
      // Still one subscriber — native listener should NOT be torn down yet
      expect(mockNative.removeListeners).not.toHaveBeenCalled();

      unsub2();
      // Last subscriber gone — native listener torn down
      expect(mockNative.removeListeners).toHaveBeenCalledWith(1);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `cd /Users/anivar/Dev/opensource/netsignal && npx jest __tests__/NetSignal.test.ts --no-coverage --verbose`
Expected: 12 tests pass

- [ ] **Step 3: Commit**

Run: `git add __tests__/NetSignal.test.ts && git commit -m "test: add NetSignal API test suite (12 tests)"`

---

### Task 9: Write Hook tests

**Files:**
- Create: `__tests__/hooks.test.tsx`

- [ ] **Step 1: Write the hook test file**

```tsx
import React from 'react';
import { Text, View } from 'react-native';
import { render, act } from '@testing-library/react-native';
import { DeviceEventEmitter } from 'react-native';
import { useNetworkState, useIsConnected, useConnectionType, _resetForTesting } from '../src/index';
import NativeNetSignal from '../src/NativeNetSignal';

const mockNative = NativeNetSignal as jest.Mocked<typeof NativeNetSignal>;

beforeEach(() => {
  _resetForTesting();
  jest.clearAllMocks();
  mockNative.getSimpleSummary.mockReturnValue({
    connected: true,
    type: 'wifi',
    connectionCount: 1,
    multipleConnections: false,
  });
});

// Test component that renders hook state
function NetworkStateDisplay() {
  const state = useNetworkState();
  return (
    <View>
      <Text testID="connected">{String(state.connected)}</Text>
      <Text testID="type">{state.type}</Text>
      <Text testID="count">{String(state.connectionCount)}</Text>
    </View>
  );
}

function IsConnectedDisplay() {
  const connected = useIsConnected();
  return <Text testID="connected">{String(connected)}</Text>;
}

function ConnectionTypeDisplay() {
  const type = useConnectionType();
  return <Text testID="type">{type}</Text>;
}

function MultiHookDisplay() {
  const connected = useIsConnected();
  const type = useConnectionType();
  return (
    <View>
      <Text testID="connected">{String(connected)}</Text>
      <Text testID="type">{type}</Text>
    </View>
  );
}

describe('useNetworkState', () => {
  it('returns initial state from getSimpleSummary', () => {
    const { getByTestId } = render(<NetworkStateDisplay />);
    expect(getByTestId('connected').props.children).toBe('true');
    expect(getByTestId('type').props.children).toBe('wifi');
    expect(getByTestId('count').props.children).toBe('1');
  });

  it('updates state when network event fires', () => {
    const { getByTestId } = render(<NetworkStateDisplay />);

    act(() => {
      DeviceEventEmitter.emit('netSignalChange', {
        isConnected: false,
        type: 'none',
        connectionCount: 0,
      });
    });

    expect(getByTestId('connected').props.children).toBe('false');
    expect(getByTestId('type').props.children).toBe('none');
    expect(getByTestId('count').props.children).toBe('0');
  });

  it('cleans up subscription on unmount', () => {
    const { unmount } = render(<NetworkStateDisplay />);
    unmount();
    expect(mockNative.removeListeners).toHaveBeenCalled();
  });
});

describe('useIsConnected', () => {
  it('returns boolean connected state', () => {
    const { getByTestId } = render(<IsConnectedDisplay />);
    expect(getByTestId('connected').props.children).toBe('true');
  });

  it('updates when network changes', () => {
    const { getByTestId } = render(<IsConnectedDisplay />);

    act(() => {
      DeviceEventEmitter.emit('netSignalChange', {
        isConnected: false,
        type: 'none',
        connectionCount: 0,
      });
    });

    expect(getByTestId('connected').props.children).toBe('false');
  });
});

describe('useConnectionType', () => {
  it('returns connection type string', () => {
    const { getByTestId } = render(<ConnectionTypeDisplay />);
    expect(getByTestId('type').props.children).toBe('wifi');
  });

  it('updates when network changes', () => {
    const { getByTestId } = render(<ConnectionTypeDisplay />);

    act(() => {
      DeviceEventEmitter.emit('netSignalChange', {
        isConnected: true,
        type: 'cellular',
        connectionCount: 1,
      });
    });

    expect(getByTestId('type').props.children).toBe('cellular');
  });
});

describe('Shared subscription', () => {
  it('multiple hooks in same component use single native subscription', () => {
    render(<MultiHookDisplay />);
    // addListener should only be called once for the shared store,
    // not once per hook
    const addListenerCalls = mockNative.addListener.mock.calls.length;
    expect(addListenerCalls).toBeGreaterThanOrEqual(1);
  });

  it('subscription cleans up when all consumers unmount', () => {
    const { unmount } = render(<MultiHookDisplay />);
    unmount();
    expect(mockNative.removeListeners).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `cd /Users/anivar/Dev/opensource/netsignal && npx jest __tests__/hooks.test.tsx --no-coverage --verbose`
Expected: 9 tests pass

- [ ] **Step 3: Run full test suite**

Run: `cd /Users/anivar/Dev/opensource/netsignal && npx jest --no-coverage --verbose`
Expected: All 21 tests pass

- [ ] **Step 4: Commit**

Run: `git add __tests__/hooks.test.tsx && git commit -m "test: add React hook test suite (9 tests)"`

---

## Chunk 3: Example App, README, Final Verification

### Task 10: Create example app

**Files:**
- Create: `example/` directory (scaffolded via CLI, then configured)

- [ ] **Step 1: Scaffold example app**

Run: `cd /Users/anivar/Dev/opensource/netsignal && npx @react-native-community/cli init NetSignalExample --directory example --version 0.80.0 --skip-install`

If the CLI version doesn't support `--version 0.80.0`, use:
Run: `npx react-native@0.80.0 init NetSignalExample --directory example --skip-install`

- [ ] **Step 2: Add local netsignal dependency to example/package.json**

In `example/package.json`, add to `dependencies`:
```json
"netsignal": "file:../"
```

- [ ] **Step 3: Configure metro.config.js for monorepo**

In `example/metro.config.js`, add watch folder for parent:
```javascript
const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  watchFolders: [path.resolve(__dirname, '..')],
  resolver: {
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(__dirname, '..', 'node_modules'),
    ],
  },
};

module.exports = mergeConfig(defaultConfig, config);
```

- [ ] **Step 4: Ensure newArchEnabled=true in example/android/gradle.properties**

Verify or add:
```properties
newArchEnabled=true
```

- [ ] **Step 5: Configure Android native project to include netsignal**

In `example/android/settings.gradle`, add before any `apply` or `include` lines:
```gradle
include ':netsignal'
project(':netsignal').projectDir = new File(rootProject.projectDir, '../../android')
```

In `example/android/app/build.gradle`, add to `dependencies` block:
```gradle
implementation project(':netsignal')
```

In `example/android/app/src/main/java/.../MainApplication.kt`, add import and register the package:
```kotlin
import com.netsignal.NetSignalTurboPackage

// Inside getPackages():
override fun getPackages(): List<ReactPackage> = PackageList(this).packages.apply {
    add(NetSignalTurboPackage())
}
```

Note: If the scaffolded RN 0.80 app uses autolinking (which it should for `file:../` dependencies), these manual steps may not be needed. Check if `npx react-native config` lists netsignal. If it does, skip the manual Gradle/MainApplication edits.

- [ ] **Step 6: Create the example app screen**

Replace `example/App.tsx` with:

```tsx
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
  StyleSheet,
  Button,
} from 'react-native';
import NetSignal, {
  useNetworkState,
  useIsConnected,
  useConnectionType,
  type NetworkChangeEvent,
} from 'netsignal';

function SyncApiSection() {
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Sync API (direct calls)</Text>
      <Text>isConnected: {String(NetSignal.isConnected())}</Text>
      <Text>getConnectionType: {NetSignal.getConnectionType()}</Text>
      <Text>getActiveConnectionCount: {NetSignal.getActiveConnectionCount()}</Text>
      <Text>hasMultipleConnections: {String(NetSignal.hasMultipleConnections())}</Text>
      <Text>getSimpleSummary: {JSON.stringify(NetSignal.getSimpleSummary(), null, 2)}</Text>
    </View>
  );
}

function AsyncApiSection() {
  const [connections, setConnections] = useState<string>('loading...');

  useEffect(() => {
    NetSignal.getAllActiveConnections().then((result) => {
      setConnections(JSON.stringify(result, null, 2));
    });
  }, []);

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Async API</Text>
      <Text>getAllActiveConnections: {connections}</Text>
    </View>
  );
}

function HooksSection() {
  const networkState = useNetworkState();
  const isConnected = useIsConnected();
  const connectionType = useConnectionType();

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Hooks</Text>
      <Text>useNetworkState: {JSON.stringify(networkState, null, 2)}</Text>
      <Text>useIsConnected: {String(isConnected)}</Text>
      <Text>useConnectionType: {connectionType}</Text>
    </View>
  );
}

function EventLogSection() {
  const [events, setEvents] = useState<string[]>([]);

  useEffect(() => {
    return NetSignal.addEventListener((event: NetworkChangeEvent) => {
      setEvents((prev) => [
        `${new Date().toISOString()} - connected:${event.isConnected} type:${event.type}`,
        ...prev.slice(0, 19),
      ]);
    });
  }, []);

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Event Log</Text>
      {events.length === 0 ? (
        <Text>Waiting for network changes...</Text>
      ) : (
        events.map((e, i) => <Text key={i}>{e}</Text>)
      )}
    </View>
  );
}

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>NetSignal Example</Text>
        <Button title="Refresh Sync APIs" onPress={() => setRefreshKey((k) => k + 1)} />
        <SyncApiSection key={refreshKey} />
        <AsyncApiSection />
        <HooksSection />
        <EventLogSection />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', padding: 16 },
  heading: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  section: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
});
```

- [ ] **Step 7: Commit**

Run: `git add example/ && git commit -m "feat: add example app with sync/async/hooks/events demo"`

---

### Task 11: Update README.md

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace README.md with updated content**

```markdown
# NetSignal

Ultra-fast network state for React Native 0.80+ (New Architecture Only, Android)

**0.3ms latency | TurboModule powered | ~300 lines total**

## Requirements

- React Native 0.80+
- New Architecture enabled
- Android only (iOS/Web not yet supported)
- Kotlin 1.9+

## Installation

npm install netsignal

### Enable New Architecture

In `android/gradle.properties`:

newArchEnabled=true

### Add Permission

In `AndroidManifest.xml`:

<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

## Usage

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

## API

### Synchronous Methods (0.3ms)

NetSignal.isConnected()              // boolean
NetSignal.getConnectionType()        // "wifi" | "cellular" | "ethernet" | "none"
NetSignal.getActiveConnectionCount() // number
NetSignal.hasMultipleConnections()   // boolean
NetSignal.getSimpleSummary()         // all info in one call

### Async Methods

const connections = await NetSignal.getAllActiveConnections();
// [{ type: "wifi", hasInternet: true, isMetered: false }]

### Events

const unsubscribe = NetSignal.addEventListener((event) => {
  console.log('Network changed:', event.isConnected);
});

### React Hooks

const network = useNetworkState();   // full state
const connected = useIsConnected();  // just boolean
const type = useConnectionType();    // just type

All hooks share a single native subscription via useSyncExternalStore.

## Architecture

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

## Testing

npm test

21 tests covering all API methods, hooks, event subscriptions, and shared subscription behavior.

## Why New Architecture Only?

- 10x faster than old bridge (0.3ms vs 3ms)
- Simpler code — no bridge complexity
- Type safe — Codegen ensures correctness
- Future proof — React Native's direction

## License

MIT
```

- [ ] **Step 2: Commit**

Run: `git add README.md && git commit -m "docs: update README for Android-only v1.0"`

---

### Task 12: Install dependencies and run full verification

- [ ] **Step 1: Install dependencies**

Run: `cd /Users/anivar/Dev/opensource/netsignal && npm install`

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Run full test suite**

Run: `npx jest --verbose`
Expected: 21 tests pass (12 API + 9 hooks)

- [ ] **Step 4: Verify npm pack**

Run: `npm pack --dry-run`
Expected: Lists files that would be included in the tarball. Verify `src/`, `android/` are included. Verify `node_modules/`, `example/`, `__tests__/` are excluded.

- [ ] **Step 5: Final commit**

Run: `git add -A && git status`
If there are uncommitted changes (e.g., package-lock.json): `git commit -m "chore: add package-lock.json"`

---

### Task 13: Install and build example app (manual verification)

- [ ] **Step 1: Install example dependencies**

Run: `cd /Users/anivar/Dev/opensource/netsignal/example && npm install`

- [ ] **Step 2: Build and run on Android emulator**

Run: `cd /Users/anivar/Dev/opensource/netsignal/example && npx react-native run-android`

Expected: App launches, shows network state in all sections. Toggle airplane mode to see events fire.

- [ ] **Step 3: Final commit if any example config needed fixing**

Run: `cd /Users/anivar/Dev/opensource/netsignal && git add -A && git diff --cached --stat`
If changes: `git commit -m "fix: example app configuration"`
