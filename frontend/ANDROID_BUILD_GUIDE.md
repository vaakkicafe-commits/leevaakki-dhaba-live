# Lee Vaakki Dhaba - Android App Build Guide

## Project Setup Complete ✅

The Android project is fully configured with:
- ✅ Capacitor Android platform
- ✅ App icons (all densities)
- ✅ Splash screens (portrait & landscape)
- ✅ App configuration (package: com.leevaakkidhaba.app)

## To Build APK (On Your Computer)

### Prerequisites
1. Install **Android Studio**: https://developer.android.com/studio
2. Install **Java JDK 11+**: https://adoptium.net/

### Build Steps

#### Option 1: Using Android Studio (Recommended)
1. Open Android Studio
2. Click "Open" and select: `/app/frontend/android`
3. Wait for Gradle sync to complete
4. Go to **Build → Build Bundle(s) / APK(s) → Build APK(s)**
5. Find APK at: `android/app/build/outputs/apk/debug/app-debug.apk`

#### Option 2: Command Line
```bash
cd frontend/android
./gradlew assembleDebug
```

### For Play Store (Release APK)
```bash
cd frontend/android
./gradlew assembleRelease
```

Note: Release builds need a signing key. See below.

## Creating Signing Key (Required for Play Store)

```bash
keytool -genkey -v -keystore lee-vaakki-release-key.keystore -alias lee-vaakki -keyalg RSA -keysize 2048 -validity 10000
```

Add to `android/app/build.gradle`:
```gradle
android {
    signingConfigs {
        release {
            storeFile file('lee-vaakki-release-key.keystore')
            storePassword 'your-password'
            keyAlias 'lee-vaakki'
            keyPassword 'your-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

## Play Store Publishing

### Requirements:
1. Google Play Developer Account (₹1,750 one-time)
2. Signed Release APK or AAB
3. App listing details:
   - Title: Lee Vaakki Dhaba
   - Short description: Order authentic North Indian food online
   - Full description: (See below)
   - Screenshots (phone & tablet)
   - Feature graphic (1024x500)
   - App icon (512x512) ✅ Already created
   - Privacy Policy URL

### App Description:
```
Lee Vaakki Dhaba - Authentic North Indian Cuisine

Order delicious food online for delivery, takeaway, or dine-in!

Features:
🍛 Browse our extensive menu with 20+ authentic dishes
🛒 Easy ordering with cart management
📍 Multiple delivery addresses
💰 UPI & Cash on Delivery payment options
📱 Real-time order tracking
🎫 Apply discount coupons

Menu Categories:
• Starters - Paneer Tikka, Chicken Tikka, Aloo Tikki
• Main Course - Butter Chicken, Dal Makhani, Biryani
• Breads - Butter Naan, Garlic Naan, Kulcha
• Combos - Veg Thali, Non-Veg Thali
• Beverages - Lassi, Masala Chai
• Desserts - Gulab Jamun, Kulfi

Download now and enjoy the taste of Punjab!
```

## App Details

| Property | Value |
|----------|-------|
| Package Name | com.leevaakkidhaba.app |
| App Name | Lee Vaakki Dhaba |
| Version | 1.0.0 |
| Min SDK | 22 (Android 5.1) |
| Target SDK | 33 (Android 13) |

## File Structure

```
frontend/
├── android/                    # Android project
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── res/
│   │   │   │   ├── mipmap-*/    # App icons
│   │   │   │   ├── drawable-*/  # Splash screens
│   │   │   │   └── values/      # Strings, colors
│   │   │   └── assets/public/   # Web app files
│   │   └── build.gradle
│   └── build.gradle
├── capacitor.config.json       # Capacitor config
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── service-worker.js       # Service worker
│   └── icons/                  # PWA icons
└── build/                      # Built web app
```

## Quick Commands

```bash
# Rebuild web app
yarn build

# Sync changes to Android
npx cap sync android

# Open in Android Studio
npx cap open android

# Build debug APK (requires Android SDK)
cd android && ./gradlew assembleDebug

# Build release AAB for Play Store
cd android && ./gradlew bundleRelease
```

## Support

For help with Play Store publishing:
- Google Play Console: https://play.google.com/console
- Android Developers: https://developer.android.com/distribute

---
Generated for Lee Vaakki Dhaba
Package: com.leevaakkidhaba.app
