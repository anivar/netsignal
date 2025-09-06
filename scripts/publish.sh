#!/bin/bash

# NetSignal NPM Publish Script
# Ensures everything is built and tested before publishing

set -e

echo "🚀 NetSignal - Preparing for NPM publish..."

# Check if on clean branch
if [[ -n $(git status -s) ]]; then
  echo "❌ Error: Working directory is not clean. Commit or stash changes first."
  exit 1
fi

# Run tests
echo "🧪 Running tests..."
npm test

# Run TypeScript check
echo "📝 Checking TypeScript..."
npm run typescript

# Build the package
echo "🔨 Building package..."
npm run prepare

# Check package contents
echo "📦 Package contents:"
npm pack --dry-run

# Prompt for version
echo ""
echo "Current version: $(node -p "require('./package.json').version")"
echo "Enter new version (or press enter to skip version bump):"
read VERSION

if [ ! -z "$VERSION" ]; then
  npm version $VERSION
fi

# Publish
echo ""
echo "Ready to publish to NPM!"
echo "Run: npm publish"
echo ""
echo "Or for dry run: npm publish --dry-run"