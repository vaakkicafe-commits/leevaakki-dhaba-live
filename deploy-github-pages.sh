#!/bin/bash
set -e

# GitHub Pages deployment script for Flutter web app

FLUTTER_SDK="/Users/vaakki/Documents/flutter_sdk"
REPO_NAME="flutter-web-app"
BUILD_DIR="build/web"
DEPLOY_DIR=".deploy"

echo "🚀 Building Flutter web app for GitHub Pages..."

# Clean and build
rm -rf "$BUILD_DIR" "$DEPLOY_DIR"
"$FLUTTER_SDK/bin/flutter" build web --release --web-renderer canvaskit

if [ ! -f "$BUILD_DIR/index.html" ]; then
    echo "❌ Build failed!"
    exit 1
fi

# Prepare deployment
mkdir -p "$DEPLOY_DIR"
cp -r "$BUILD_DIR"/* "$DEPLOY_DIR/"

# Create CNAME for custom domain (optional)
echo "# .deploy/CNAME (optional - for custom domain)" > "$DEPLOY_DIR/CNAME.txt"

echo "✅ Build successful!"
echo ""
echo "📁 Deployment files ready in: $DEPLOY_DIR"
echo ""
echo "🚀 To deploy to GitHub Pages:"
echo ""
echo "1. Create a GitHub repository called: $REPO_NAME"
echo "   Go to https://github.com/new"
echo ""
echo "2. Run these commands:"
echo "   cd /Users/vaakki/Documents/flutter_web_app"
echo "   git remote add origin https://github.com/YOUR_USERNAME/$REPO_NAME.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. Enable GitHub Pages:"
echo "   - Go to repository Settings"
echo "   - Select 'Pages' in left menu"
echo "   - Choose 'Deploy from a branch'"
echo "   - Select 'main' branch and '/root' folder"
echo "   - Click 'Save'"
echo ""
echo "4. Your site will be live at:"
echo "   https://YOUR_USERNAME.github.io/$REPO_NAME"
echo ""
echo "✨ Done!"