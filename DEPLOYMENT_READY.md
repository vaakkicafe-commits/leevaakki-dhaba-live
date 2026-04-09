# Lee Vaakki Dhaba - Deployment Guide

## Flutter Web App Deployment Readiness

### ✅ Health Check Results

| Check | Status | Notes |
|-------|--------|-------|
| Main code (lib/main.dart) | ✅ Pass | 62KB, all features implemented |
| pubspec.yaml | ✅ Pass | Dependencies: flutter, cupertino_icons, url_launcher |
| vercel.json | ✅ Pass | Configured for static Flutter web output |
| web/index.html | ✅ Pass | Flutter web entry point present |
| Hardcoded secrets | ✅ Pass | No API keys or secrets in code |
| Environment variables | ✅ Pass | No env vars needed (static app) |

### ⚠️ Items to Update Before Production

1. **WhatsApp Number** - Currently placeholder `919876543210`
   - File: `/app/lib/main.dart`
   - Search for: `wa.me/919876543210`
   - Replace with your actual WhatsApp business number

2. **Restaurant Address** - Currently sample address
   - Update in ContactPage class
   - Add your Google Maps location link

3. **Phone Number** - Currently placeholder
   - Update `tel:+919876543210` with real number

---

## Deployment Steps

### Option 1: Vercel (Recommended)

**Step 1: Build locally**
```bash
# On your local machine with Flutter SDK
cd /path/to/project
flutter pub get
flutter build web --release --web-renderer canvaskit
```

**Step 2: Deploy to Vercel**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (from project root)
vercel --prod
```

**Or via Vercel Dashboard:**
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Set:
   - Build Command: (leave empty)
   - Output Directory: `build/web`
5. Click Deploy

### Option 2: GitHub Pages

```bash
# Build
flutter build web --release --base-href "/your-repo-name/"

# Deploy build/web folder to gh-pages branch
```

### Option 3: Any Static Hosting

The `build/web` folder contains static files that can be deployed to:
- Netlify
- Firebase Hosting
- AWS S3 + CloudFront
- Any web server

---

## File Structure for Deployment

```
build/web/
├── index.html          # Entry point
├── main.dart.js        # Compiled Dart code
├── flutter.js          # Flutter engine
├── flutter_bootstrap.js
├── manifest.json       # PWA manifest
├── favicon.png
├── icons/
│   ├── Icon-192.png
│   └── Icon-512.png
├── assets/
│   └── fonts/
└── canvaskit/          # CanvasKit renderer
```

---

## Post-Deployment Checklist

- [ ] Test menu browsing on mobile
- [ ] Test cart add/remove functionality
- [ ] Test WhatsApp order button
- [ ] Test phone call button
- [ ] Test Google Maps link
- [ ] Verify all images load correctly
- [ ] Test on different screen sizes

---

## Troubleshooting

**App shows blank page:**
- Check browser console for errors
- Ensure all files in build/web are uploaded
- Verify index.html base href is correct

**WhatsApp not opening:**
- Verify phone number format (country code without +)
- Test on mobile device (desktop may not have WhatsApp)

**Images not loading:**
- Images use Unsplash URLs (require internet)
- Consider hosting images locally for production

---

## Status: ✅ READY FOR DEPLOYMENT

Build your Flutter app locally and deploy the `build/web` folder to Vercel!
