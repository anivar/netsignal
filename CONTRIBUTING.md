# Contributing to NetSignal

Thank you for your interest in contributing to NetSignal! This document provides guidelines for contributing to the project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## How to Contribute

### Reporting Issues

1. Check if the issue already exists in the [issue tracker](https://github.com/anivar/netsignal/issues)
2. If not, create a new issue with:
   - Clear description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (React Native version, platform, etc.)

### Submitting Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Commit with clear messages (`git commit -m 'Add amazing feature'`)
7. Push to your fork (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/netsignal.git
cd netsignal

# Install dependencies
npm install

# Run tests
npm test

# Check TypeScript
npm run typescript

# Lint code
npm run lint
```

## Code Style

- Follow existing code patterns
- Use TypeScript for all new code
- Add JSDoc comments for public APIs
- Keep the library lean - no unnecessary dependencies

## Testing

- Write tests for all new functionality
- Ensure existing tests pass
- Aim for >80% code coverage

## Philosophy

NetSignal is designed to be:
- **Lean**: Minimal code, no bloat
- **Fast**: Instant responses, no polling
- **Simple**: Clear API, easy to use
- **Reliable**: Production-ready, well-tested

Please ensure your contributions align with these principles.

## Questions?

Feel free to open an issue for any questions about contributing.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.