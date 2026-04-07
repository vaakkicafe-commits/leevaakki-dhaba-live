# Quick Reference Card

## Commands to Run

### 1. Push to GitHub
```bash
cd /Users/vaakki/Documents/flutter_web_app
git remote add origin https://github.com/YOUR_USERNAME/flutter-web-app.git
git branch -M main
git push -u origin main
```

### 2. Update GitHub Pages Settings
```
Settings → Pages → Deploy from a branch → gh-pages branch
```

### 3. Deploy to Vercel
```
vercel.com → Add New Project → Import flutter-web-app
```

### 4. Make Future Updates
```bash
cd /Users/vaakki/Documents/flutter_web_app
git add .
git commit -m "Your message"
git push origin main
# Both platforms auto-deploy in 2-5 minutes
```

---

## Key File Locations

| File | Purpose |
|------|---------|
| `lib/main.dart` | Your Flutter app code |
| `vercel.json` | Vercel build config |
| `pubspec.yaml` | Flutter dependencies |
| `.github/workflows/flutter-deploy.yml` | GitHub Actions ci/cd |
| `build/web/` | Production build output |

---

## Live URLs

After setup:
- **GitHub Pages**: `https://YOUR_USERNAME.github.io/flutter-web-app`
- **Vercel**: `https://flutter-web-app.vercel.app`

---

## Common Issues

| Issue | Fix |
|-------|-----|
| "Permission denied" on git push | Check username/password, use HTTPS |
| Build fails on GitHub | Check Flutter dependencies in pubspec.yaml |
| App won't load | Refresh page, wait 30 seconds, check console |
| 404 on GitHub Pages | Wait 5 minutes, ensure gh-pages branch exists |

---

## Support Docs

- **Complete Setup**: Open `COMPLETE_SETUP_GUIDE.md`
- **GitHub Pages Only**: Open `GITHUB_PAGES_DEPLOY.md`
- **Vercel Only**: Open `DEPLOY_GUIDE.md`