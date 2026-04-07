# GitHub Pages Deployment Guide

## Quick Start - Copy & Paste Commands

### Prerequisites
1. GitHub account (free at https://github.com)
2. Your GitHub username ready

### Step 1: Create GitHub Repository

Go to https://github.com/new and create a repository called `flutter-web-app`

### Step 2: Push Your Code

Copy and paste these commands in your terminal:

```bash
cd /Users/vaakki/Documents/flutter_web_app

git remote add origin https://github.com/YOUR_USERNAME/flutter-web-app.git
git branch -M main
git push -u origin main
```

*Replace `YOUR_USERNAME` with your actual GitHub username*

### Step 3: Enable GitHub Pages

1. Go to: `https://github.com/YOUR_USERNAME/flutter-web-app/settings`
2. Click "Pages" in the left sidebar
3. Under "Build and deployment":
   - Source: Select "Deploy from a branch"
   - Branch: Select "main"
   - Folder: Select "/ (root)"
4. Click "Save"

### Step 4: Enable Actions (Required for Build)

For GitHub Pages to work, you need GitHub Actions to build your app:

1. Go to "Actions" tab in your repository
2. Click "New workflow" → "set up a workflow yourself"
3. Copy and paste this workflow:

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        with:
          channel: 'stable'
      
      - name: Get dependencies
        run: flutter pub get
      
      - name: Build web
        run: flutter build web --release --web-renderer canvaskit
      
      - name: Deploy to Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./build/web
```

4. Name it `flutter-deploy.yml` and commit

### Step 5: View Your App

After ~2 minutes, your app will be live at:

```
https://YOUR_USERNAME.github.io/flutter-web-app
```

Check the "Actions" tab to see the build progress.

## Troubleshooting

**"Permission denied" error**
- Make sure you have write access to the repository
- Check that you used the correct GitHub username

**App won't load**
- Check "Actions" tab for build errors
- Make sure workflow is enabled
- Wait 2-3 minutes for deployment to complete

**404 Not Found**
- You may need to wait a few minutes for GitHub Pages to activate
- Try accessing without the repository name: `https://YOUR_USERNAME.github.io`

## Rollback

To revert to old version:
```bash
git revert HEAD
git push origin main
```

## Update Your App

To make changes and redeploy:
```bash
# Make your changes to lib/main.dart
cd /Users/vaakki/Documents/flutter_web_app
git add .
git commit -m "Update app"
git push origin main
# GitHub Actions will automatically rebuild and deploy!
```

---

**Questions?** Check [Flutter Web Docs](https://docs.flutter.dev/development/platform-integration/web) or [GitHub Pages Docs](https://pages.github.com/)