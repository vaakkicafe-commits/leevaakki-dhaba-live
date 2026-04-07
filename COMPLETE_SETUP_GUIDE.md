# Complete Setup Guide - Both GitHub Pages & Vercel

## Summary

Your Flutter web app is configured for **BOTH** deployments:
- **GitHub Pages**: Free, automatic CI/CD via GitHub Actions
- **Vercel**: Professional hosting, faster builds, better analytics

---

## Prerequisites

- A GitHub account (free at https://github.com)
- 10 minutes of your time

---

## Part 1: Create GitHub Repository

### Step 1: Create the Repo

1. Go to https://github.com/new
2. Enter **Repository name**: `flutter-web-app`
3. Select **Public** (required for free GitHub Pages)
4. Leave other options as default
5. Click **"Create repository"**

### Step 2: Get Your Repository URL

After creating, copy this URL format:
```
https://github.com/YOUR_USERNAME/flutter-web-app.git
```

Replace `YOUR_USERNAME` with your actual GitHub username.

---

## Part 2: Push Code to GitHub

Run these commands in terminal:

```bash
cd /Users/vaakki/Documents/flutter_web_app

git remote add origin https://github.com/YOUR_USERNAME/flutter-web-app.git
git branch -M main
git push -u origin main
```

**Expected output:**
```
Enumerating objects: ...
Counting objects: ...
...
To https://github.com/YOUR_USERNAME/flutter-web-app.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

---

## Part 3: Enable GitHub Pages + GitHub Actions

### Step 1: Enable GitHub Pages

1. Go to: `https://github.com/YOUR_USERNAME/flutter-web-app/settings`
2. Click **"Pages"** in the left sidebar
3. Under "Build and deployment":
   - Source: Select **"Deploy from a branch"**
   - Branch: Select **"gh-pages"**
   - Folder: Select **"/ (root)"**
4. Click **"Save"**

The workflow file is already in `.github/workflows/flutter-deploy.yml`

### Step 2: Wait for First Deploy

1. Go to **"Actions"** tab
2. You'll see "Build and Deploy" workflow running
3. Wait 2-3 minutes for it to complete (✓ green checkmark)
4. Once complete, your site is live at:

```
https://YOUR_USERNAME.github.io/flutter-web-app
```

**Try it now!** Open that URL in your browser.

---

## Part 4: Deploy to Vercel

### Step 1: Create Vercel Account

1. Go to https://vercel.com
2. Click **"Continue with GitHub"**
3. Authorize Vercel to access your GitHub repositories

### Step 2: Import Your Project

1. Click **"Add New"** → **"Project"**
2. You'll see your `flutter-web-app` repository listed
3. Click to select it
4. Click **"Import"**

### Step 3: Configure Build Settings

Default settings should work:
- **Framework Preset**: Other
- **Build Command**: `flutter build web --release --web-renderer canvaskit`
- **Output Directory**: `build/web`

Click **"Deploy"**

### Step 4: Wait for Deployment

Vercel will build and deploy automatically. Takes ~1-2 minutes.

Once done, your app is live at:
```
https://flutter-web-app.vercel.app
```

(The exact URL will be shown on the deployment screen)

---

## You're Done! 🎉

Your Flutter web app is now deployed to **BOTH** platforms:

### GitHub Pages
```
https://YOUR_USERNAME.github.io/flutter-web-app
```
- Auto-deploys on every push
- Free forever
- Uses GitHub Actions CI/CD

### Vercel
```
https://flutter-web-app.vercel.app
```
- Faster builds
- Better performance
- Analytics & monitoring included

---

## Making Updates

To update your app:

1. Edit your Flutter code in `lib/main.dart`
2. Commit and push:
   ```bash
   cd /Users/vaakki/Documents/flutter_web_app
   git add .
   git commit -m "Update: fix bug in homepage"
   git push origin main
   ```
3. Both platforms auto-deploy! (takes 2-5 minutes)

Check progress:
- **GitHub Pages**: Go to Actions tab
- **Vercel**: Go to Deployments tab

---

## Comparison

| Feature | GitHub Pages | Vercel |
|---------|-------------|--------|
| Cost | Free | Free tier |
| Setup time | 10 min | 5 min |
| Deploy speed | 2-3 min | 1-2 min |
| Custom domain | ✓ | ✓ |
| CI/CD | GitHub Actions | Built-in |
| Analytics | ✗ | ✓ |
| Recommended | For beginners | For production |

---

## Troubleshooting

**Q: "Permission denied" when pushing to GitHub**
- Make sure your username and repo name are correct
- Check internet connection

**Q: Build fails on GitHub Actions**
- Check Actions tab for error logs
- Ensure all dependencies are in `pubspec.yaml`

**Q: Vercel says "No Function routes detected"**
- This is normal! Static sites don't need functions
- Your app will still deploy correctly

**Q: App shows blank page**
- Wait 30 seconds and refresh
- Check browser console (F12) for errors
- Verify `build/web/index.html` exists

---

## What's Deployed

Both platforms deploy the contents of `build/web/`:

```
build/web/
├── index.html              # Entry point
├── main.dart.js           # Your Flutter app (compiled)
├── flutter.js             # Flutter runtime
├── flutter_bootstrap.js   # Bootstrap code
├── canvaskit/             # Rendering engine
├── assets/                # Images, fonts, etc
├── icons/                 # App icons
└── manifest.json          # PWA metadata
```

---

## Next Steps

✓ App deployed to GitHub Pages
✓ App deployed to Vercel
⏭️ Add a custom domain (optional)
⏭️ Enable HTTPS (automatic)
⏭️ Configure analytics (Vercel)

---

## Need Help?

- **Flutter Web Docs**: https://docs.flutter.dev/development/platform-integration/web
- **GitHub Pages**: https://pages.github.com
- **Vercel Docs**: https://vercel.com/docs

Happy deploying! 🚀