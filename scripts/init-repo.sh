#!/bin/bash

# NetSignal - Initialize Git Repository
# Author: Anivar A Aravind <ping@anivar.net>

set -e

echo "🚀 Initializing NetSignal repository..."

# Initialize git if not already
if [ ! -d .git ]; then
  git init
  echo "✅ Git repository initialized"
else
  echo "ℹ️  Git repository already exists"
fi

# Set up git config
git config user.name "Anivar A Aravind"
git config user.email "ping@anivar.net"

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: NetSignal v0.1.0

- Instant network detection for React Native
- Turbo Module support
- Cross-platform: iOS, Android, Web
- Zero dependencies
- MIT License" || echo "Already committed"

# Add remote origin
echo ""
echo "📝 Next steps:"
echo "1. Create repository on GitHub: https://github.com/new"
echo "   Repository name: netsignal"
echo "   Description: Instant network detection for React Native with Turbo Module support"
echo ""
echo "2. Add remote origin:"
echo "   git remote add origin https://github.com/anivar/netsignal.git"
echo ""
echo "3. Push to GitHub:"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "4. Configure NPM (if publishing):"
echo "   npm login"
echo "   npm publish"
echo ""
echo "✨ Repository ready for production!"