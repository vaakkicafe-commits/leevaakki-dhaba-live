# Flutter Web App for Vercel

A Flutter web application configured for deployment on Vercel.

## Local Development

### Prerequisites
- Flutter SDK installed at `/Users/vaakki/Documents/flutter_sdk`
- Chrome browser installed
- macOS 12.7.6 or compatible

### Run Locally

1. Start the development server:
   ```bash
   /Users/vaakki/Documents/flutter_sdk/bin/flutter run -d chrome
   ```

2. The app will open in Chrome at `http://localhost`

## Building for Production

Build the optimized web version:
```bash
/Users/vaakki/Documents/flutter_sdk/bin/flutter build web --release --web-renderer canvaskit
```

The output will be in `build/web/` directory.

## Deployment to Vercel

### Configuration Files

**vercel.json** - Deployment configuration
- Build command: Runs Flutter build for web
- Output directory: `build/web`

**package.json** - Contains build scripts

### Deploy Steps

#### Option 1: Vercel Web Interface
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import this repository
4. Vercel will auto-detect the configuration
5. Click "Deploy"

#### Option 2: Vercel CLI
```bash
vercel --prod
```

#### Option 3: Docker/Manual Deployment
```bash
# Build the app
npm run build

# The built files in build/web/ are ready to deploy
# Upload to any static hosting service
```

## Performance Optimization

- **Web Renderer**: Using CanvasKit for better performance
- **Tree-shaking**: Icons are optimized (99.5% reduction)
- **Release Mode**: Production builds use release configuration

## Troubleshooting

**"No Output Directory named 'web' found"**
- Solution: Ensure you're using `outputDirectory: "build/web"` in `vercel.json`

**Build takes too long**
- Make sure Flutter SDK is up to date
- First build may be slower due to dependency downloads

**App not loading on Vercel**
- Check that `vercel.json` has correct `buildCommand` and `outputDirectory`
- Verify all files in `build/web/` are deployed

## Project Structure

```
flutter_web_app/
├── lib/
│   └── main.dart          # Main app code
├── web/
│   ├── index.html         # Web entry point
│   ├── manifest.json      # PWA manifest
│   └── favicon.png        # App icon
├── pubspec.yaml           # Flutter dependencies
├── package.json           # Node.js scripts for Vercel
├── vercel.json            # Vercel deployment config
└── build/                 # Build output (not in git)
    └── web/               # Production build files
```

## Additional Resources

- [Flutter Web Documentation](https://docs.flutter.dev/development/platform-integration/web)
- [Vercel Documentation](https://vercel.com/docs)
- [Flutter Performance Best Practices](https://docs.flutter.dev/perf)
