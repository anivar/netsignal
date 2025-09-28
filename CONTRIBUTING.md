# Contributing to NetSignal

Thank you for your interest in contributing to NetSignal! This document provides guidelines for contributing to this React Native TurboModule library.

## Development Setup

### Prerequisites
- React Native 0.80+ development environment
- Android SDK and Android Studio
- Kotlin 1.9+
- Node.js 18+
- Git

### Setup
```bash
git clone https://github.com/anivar/netsignal.git
cd netsignal
npm install
```

## Project Structure

```
netsignal/
├── android/src/main/java/com/netsignal/    # Kotlin TurboModule implementation
│   ├── NetSignalTurboModule.kt              # Core functionality
│   ├── NetSignalTurboPackage.kt             # Package registration
│   └── NativeNetSignalSpec.kt               # Abstract base class
├── src/                                     # TypeScript implementation
│   ├── NativeNetSignal.ts                   # Codegen specification
│   └── index.tsx                            # Main export with hooks
├── example/                                 # Example app (if exists)
└── docs/                                    # Additional documentation
```

## Development Guidelines

### Code Style
- **Kotlin**: Follow Android Kotlin style guide
- **TypeScript**: Use Biome for linting and formatting
- **Git**: Conventional commit messages

### Performance Requirements
- All synchronous methods must complete within 1ms
- No memory leaks or retained references
- Thread-safe operations only
- Comprehensive error handling

### Testing
```bash
# TypeScript compilation
npm run typescript

# Biome linting and formatting
npm run check
npm run lint
npm run format

# Android build test
cd android && ./gradlew build

# Run example app
npm run example:android
```

## Making Changes

### 1. Fork and Branch
```bash
git checkout -b feature/your-feature-name
```

### 2. Development Process
1. Write code following existing patterns
2. Add comprehensive error handling
3. Ensure thread safety
4. Test on physical Android device
5. Update documentation if needed

### 3. Testing Guidelines
- Test on multiple Android versions (API 21+)
- Test with/without permissions
- Test network state changes
- Verify no memory leaks
- Performance benchmark critical paths

### 4. Commit Convention
Use conventional commits:
```bash
git commit -m "feat: add new network quality detection"
git commit -m "fix: resolve race condition in listener management"
git commit -m "docs: update API documentation"
git commit -m "perf: optimize connection type detection"
```

## Submitting Changes

### Pull Request Process
1. Update documentation for any API changes
2. Add tests for new functionality
3. Ensure all existing tests pass
4. Update CHANGELOG.md
5. Create detailed PR description

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested on Android device
- [ ] Performance verified
- [ ] Memory leaks checked
- [ ] All permissions scenarios tested

## Checklist
- [ ] Code follows project style
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
```

## Architecture Decisions

### TurboModule Design
- **Synchronous first**: Prioritize sync methods for performance
- **Error safety**: Never crash, always return safe defaults
- **Thread safety**: Use atomic operations and synchronized blocks
- **Memory safety**: Proper lifecycle management

### API Design Principles
- **Minimal surface area**: Only essential methods
- **TypeScript first**: Full type safety
- **React integration**: Hooks for easy React usage
- **Performance metrics**: Measurable latency targets

## Code Review Process

### Reviewer Checklist
- [ ] Performance impact assessed
- [ ] Thread safety verified
- [ ] Error handling comprehensive
- [ ] Memory management correct
- [ ] API design consistent
- [ ] Documentation accurate

### Performance Benchmarks
All changes must pass:
```kotlin
// Sync methods < 1ms
val start = System.nanoTime()
NetSignal.isConnected()
val duration = (System.nanoTime() - start) / 1_000_000.0
assert(duration < 1.0) { "Method too slow: ${duration}ms" }
```

## iOS Support (Future)

When contributing iOS implementation (v1.1.0+):
- Match Android API exactly
- Maintain same performance characteristics
- Use Swift with Objective-C++ bridge
- Follow iOS TurboModule patterns

## Release Process

### Version Strategy
- **Major (1.x.0)**: Breaking changes, new architecture
- **Minor (1.0.x)**: New features, iOS support
- **Patch (1.0.0.x)**: Bug fixes, performance improvements

### Release Checklist
- [ ] All tests passing
- [ ] Performance benchmarks verified
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json
- [ ] Git tagged
- [ ] npm published

## Getting Help

### Resources
- [React Native New Architecture](https://reactnative.dev/docs/the-new-architecture/landing-page)
- [TurboModule Documentation](https://reactnative.dev/docs/the-new-architecture/pillars-turbomodules)
- [Android ConnectivityManager](https://developer.android.com/reference/android/net/ConnectivityManager)

### Support Channels
- **Issues**: GitHub Issues for bugs and feature requests
- **Discussions**: GitHub Discussions for questions
- **Email**: For security issues only

## Code of Conduct

### Our Standards
- Professional and respectful communication
- Focus on technical merit
- Constructive feedback
- Inclusive environment

### Enforcement
Violations will result in temporary or permanent bans from the project.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to NetSignal! 🚀