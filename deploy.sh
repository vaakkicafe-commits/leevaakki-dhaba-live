#!/bin/bash

# Flutter Web Deployment Script for Vercel
# This script builds the Flutter web app for Vercel deployment

set -e

FLUTTER_SDK="/Users/vaakki/Documents/flutter_sdk"
BUILD_DIR="build/web"

echo "🚀 Building Flutter web app for Vercel..."
echo ""

# Clean previous build
echo "📦 Cleaning previous build..."
rm -rf "$BUILD_DIR"

# Build the Flutter web app
echo "🔨 Building Flutter web with CanvasKit renderer..."
"$FLUTTER_SDK/bin/flutter" build web --release --web-renderer canvaskit

# Check if build was successful
if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ Build failed! Output directory not found."
    exit 1
fi

# Verify key files exist
if [ ! -f "$BUILD_DIR/index.html" ]; then
    echo "❌ Build incomplete! index.html not found."
    exit 1
fi

echo ""
echo "✅ Build successful!"
echo "📁 Build output location: $BUILD_DIR"
echo ""
echo "📊 Build statistics:"
ls -lh "$BUILD_DIR" | tail -n +2 | awk '{print "   " $9 " (" $5 ")"}'
echo ""
echo "🚀 Ready for Vercel deployment!"
echo ""
echo "To deploy to Vercel:"
echo "1. Commit this project to Git"
echo "2. Go to https://vercel.com"
echo "3. Import this project"
echo "4. Vercel will automatically detect vercel.json and deploy"
echo ""
echo "Or use Vercel CLI:"
echo "   vercel --prod"