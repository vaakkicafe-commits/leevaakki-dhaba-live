#!/bin/bash
set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     FLUTTER WEB APP - SETUP FOR BOTH GITHUB PAGES & VERCEL    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

GITHUB_USERNAME="$1"
REPO_NAME="flutter-web-app"
PROJECT_DIR="/Users/vaakki/Documents/flutter_web_app"

if [ -z "$GITHUB_USERNAME" ]; then
    echo "❌ Error: GitHub username required"
    echo ""
    echo "Usage: ./setup-both-deployments.sh YOUR_GITHUB_USERNAME"
    echo ""
    echo "Example: ./setup-both-deployments.sh john-doe"
    echo ""
    echo "Don't have a GitHub account? Create one free at https://github.com"
    exit 1
fi

cd "$PROJECT_DIR"

echo "✓ Project location: $PROJECT_DIR"
echo "✓ Repository name: $REPO_NAME"
echo "✓ GitHub username: $GITHUB_USERNAME"
echo ""

# Step 1: Configure Git
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Configuring Git..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

git config user.email "deploy@flutter.local" || true
git config user.name "Flutter Deployer" || true

echo "✓ Git configured"
echo ""

# Step 2: Show GitHub setup instructions
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Create GitHub Repository"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  ACTION REQUIRED:"
echo ""
echo "1. Go to: https://github.com/new"
echo "2. Enter Repository name: $REPO_NAME"
echo "3. Select 'Public' (required for free GitHub Pages)"
echo "4. Click 'Create repository'"
echo ""
echo "Press ENTER when done..."
read

# Step 3: Add remote and push
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3: Pushing to GitHub..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

REPO_URL="https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"

git remote remove origin 2>/dev/null || true
git remote add origin "$REPO_URL"
git branch -M main
git push -u origin main

echo "✓ Code pushed to GitHub!"
echo ""

# Step 4: Enable GitHub Pages
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 4: Enable GitHub Pages"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  ACTION REQUIRED:"
echo ""
echo "1. Go to: https://github.com/$GITHUB_USERNAME/$REPO_NAME/settings"
echo "2. Click 'Pages' in left sidebar"
echo "3. Under 'Build and deployment':"
echo "   - Source: Select 'Deploy from a branch'"
echo "   - Branch: Select 'gh-pages' and '/ (root)' folder"
echo "   - Click 'Save'"
echo ""
echo "4. Go to 'Actions' tab:"
echo "   - Wait for 'Build and Deploy' workflow to finish"
echo "   - This takes ~2-3 minutes"
echo ""
echo "Press ENTER when you see green ✓ in Actions..."
read

echo "✓ GitHub Pages enabled!"
echo ""

# Step 5: Vercel setup
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 5: Deploy to Vercel"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  ACTION REQUIRED:"
echo ""
echo "1. Go to: https://vercel.com"
echo "2. Sign in with GitHub (click 'Continue with GitHub')"
echo "3. Authorize Vercel to access your repositories"
echo "4. Click 'Add New' → 'Project'"
echo "5. Import your repository: $REPO_NAME"
echo "6. Click 'Deploy'"
echo ""
echo "Your Vercel deployment will be live in ~1-2 minutes!"
echo ""
echo "Press ENTER when done..."
read

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    🎉 SETUP COMPLETE! 🎉                      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Your Flutter app is now deployed to BOTH platforms:"
echo ""
echo "🌐 GitHub Pages:"
echo "   https://$GITHUB_USERNAME.github.io/$REPO_NAME"
echo ""
echo "⚡ Vercel:"
echo "   https://$REPO_NAME.vercel.app"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "To make updates:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Edit your app in: lib/main.dart"
echo "2. Commit and push:"
echo "   git add ."
echo "   git commit -m 'Update app'"
echo "   git push"
echo ""
echo "3. Both platforms auto-deploy! (takes ~2-5 minutes)"
echo ""
echo "✨ Happy coding!"