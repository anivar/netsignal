# Contributing to NetSignal

## Development Setup

### Prerequisites

- Node.js 20.0.0+
- npm 10.0.0+
- Xcode 14+ (for iOS development)
- Android Studio (for Android development)
- React Native development environment configured

### Initial Setup

```bash
# Clone repository
git clone https://github.com/anivar/netsignal.git
cd netsignal

# Install dependencies
npm install

# iOS setup
cd ios && pod install && cd ..

# Build library
npm run build
```

## Project Structure

```
netsignal/
├── src/
│   ├── implementations/      # Platform-specific implementations
│   │   ├── base.ts           # Abstract base class
│   │   ├── native.ts         # React Native implementation
│   │   └── web.ts            # Web implementation
│   ├── utils/                # Utility functions
│   │   └── network-quality.ts # Network quality algorithms
│   ├── __tests__/            # Test files
│   ├── index.ts              # Universal entry point
│   ├── index.native.ts       # React Native entry
│   ├── index.web.ts          # Web entry
│   ├── types.ts              # TypeScript definitions
│   ├── errors.ts             # Custom error classes
│   ├── constants.ts          # Configuration constants
│   └── hooks.ts              # React hooks
├── ios/                      # iOS native module (Objective-C++)
├── android/                  # Android native module (Java)
└── lib/                      # Build output (gitignored)
```

## Development Workflow

### 1. Code Standards

#### TypeScript
- Strict mode enabled
- All public APIs must be typed
- Use branded types for domain concepts
- Export all types from index

#### Code Style
```typescript
// Good: Explicit types
export function getQualityFromLatency(latency: number): NetworkQuality {
  if (latency < 0) return 'unknown';
  // ...
}

// Bad: Implicit any
export function getQuality(latency) {
  // ...
}
```

#### Error Handling
```typescript
// Use custom error types
throw new InvalidURLError(url, 'Protocol not supported');

// Not generic errors
throw new Error('Invalid URL');
```

### 2. Testing Requirements

#### Unit Tests
```bash
# Run all tests
npm test

# Run with coverage (must meet 80% threshold)
npm run test:coverage

# Watch mode for development
npm run test:watch

# Single test file
npm test -- src/__tests__/network-quality.test.ts
```

#### Test Structure
```typescript
describe('Component/Function', () => {
  describe('method', () => {
    it('should handle specific case', () => {
      // Arrange
      const input = createTestData();

      // Act
      const result = functionUnderTest(input);

      // Assert
      expect(result).toMatchExpectedOutput();
    });
  });
});
```

### 3. Native Module Development

#### iOS (Objective-C++)
```objc
// ios/NetSignal.mm
RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSNumber *, isConnected)
{
  // Synchronous methods must return immediately
  return @(_isConnected);
}
```

#### Android (Java)
```java
// android/src/main/java/com/netsignal/NetSignalModule.java
@ReactMethod(isBlockingSynchronousMethod = true)
public boolean isConnected() {
  // Return cached state, no blocking operations
  return mIsConnected;
}
```

### 4. Performance Guidelines

- Synchronous methods must complete in <1ms
- No blocking I/O in synchronous methods
- Cache native state, update via callbacks
- Use weak references for event listeners
- Clean up resources in unmount/cleanup methods

### 5. Build Process

```bash
# TypeScript check
npm run typescript

# Lint code
npm run lint

# Fix lint issues
npm run lint:fix

# Build all targets
npm run build

# Clean build artifacts
npm run clean
```

## Submitting Changes

### 1. Branch Strategy

```bash
# Feature branch
git checkout -b feature/network-quality-detection

# Bug fix
git checkout -b fix/memory-leak-web

# Performance improvement
git checkout -b perf/reduce-bundle-size
```

### 2. Commit Messages

Follow conventional commits format:

```
type(scope): subject

body

footer
```

Examples:
```
feat(hooks): add useNetworkQuality hook

Implements network quality monitoring with configurable
sample size and interval. Returns quality rating, latency,
and jitter metrics.

Closes #123
```

```
fix(web): prevent memory leak in event listeners

Store cleanup functions and call them when component
unmounts to prevent memory leaks.
```

```
perf(native): cache network state in native module

Eliminates async bridge calls by maintaining cached
state updated via OS callbacks.
```

### 3. Pull Request Process

#### Before Submitting

1. **Tests Pass**
   ```bash
   npm test
   ```

2. **TypeScript Compiles**
   ```bash
   npm run typescript
   ```

3. **Lint Clean**
   ```bash
   npm run lint
   ```

4. **Coverage Met**
   ```bash
   npm run test:coverage
   ```

5. **Build Succeeds**
   ```bash
   npm run build
   ```

#### PR Description Template

```markdown
## Summary
Brief description of changes

## Changes
- [ ] Feature/Fix/Performance improvement
- [ ] Tests added/updated
- [ ] Documentation updated

## Performance Impact
- Bundle size before: X KB
- Bundle size after: Y KB
- Synchronous method timing: <1ms ✓

## Testing
- [ ] iOS tested
- [ ] Android tested
- [ ] Web tested

## Breaking Changes
None / Description of breaking changes
```

### 4. Review Process

PRs require:
- All CI checks passing
- Code review approval
- Performance benchmarks maintained
- No increase in bundle size without justification

## Architecture Decisions

### Why Synchronous API?

Network state is already cached by the OS. Async wrappers add unnecessary overhead:

```typescript
// Unnecessary async (adds ~5-10ms overhead)
await NetSignal.isConnected();

// Direct synchronous (< 1ms)
NetSignal.isConnected();
```

### Why Multiple Entry Points?

Tree-shaking efficiency:
- Web apps don't need React Native code
- Native apps don't need web polyfills
- Bundlers automatically select correct entry

### Why Custom Error Types?

Better debugging and error handling:
```typescript
catch (error) {
  if (error instanceof InvalidURLError) {
    // Handle invalid URL
  } else if (error instanceof NetworkTimeoutError) {
    // Handle timeout
  }
}
```

## Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Run full test suite
4. Build all targets
5. Create git tag
6. Publish to npm

```bash
npm version patch/minor/major
npm run build
npm publish
git push --tags
```

## Getting Help

- GitHub Issues: Bug reports and feature requests
- GitHub Discussions: Questions and ideas
- Email: ping@anivar.net

## License

By contributing, you agree that your contributions will be licensed under the MIT License.