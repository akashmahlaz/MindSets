# MindHeal Play Store Publishing Guide

## Pre-Submission Checklist

### ✅ Security Fixes Applied
1. **API Keys Protected** - Stream API key now reads from environment variables
2. **Debug Functions Protected** - Only execute in `__DEV__` mode
3. **Unsafe Code Fixed** - Timestamp handling now has proper null checks
4. **Error Boundaries Added** - App won't crash on uncaught errors
5. **Cloud Functions Secured** - Stream credentials now use Firebase Config

### ✅ Code Quality
1. ErrorBoundary component wraps entire app
2. Safe timestamp handling in userService.ts
3. Disabled broken chatNotificationService API calls
4. Improved release signing configuration

---

## Step 1: Generate Release Keystore

Open PowerShell in the project root and run:

```powershell
cd android/app

# Generate a new keystore (KEEP THIS FILE SAFE - NEVER LOSE IT!)
keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias mindheal -keyalg RSA -keysize 2048 -validity 10000

# You'll be prompted for:
# - Keystore password (remember this!)
# - Key password (can be same as keystore password)
# - Your name, organization, etc.
```

**IMPORTANT:** 
- Store the keystore file securely (NOT in git)
- Store the passwords securely (use a password manager)
- You'll need this keystore for ALL future app updates

---

## Step 2: Configure Gradle Properties

Create or edit `android/gradle.properties` and add:

```properties
# Release signing configuration
MINDHEAL_UPLOAD_STORE_FILE=release.keystore
MINDHEAL_UPLOAD_STORE_PASSWORD=your_keystore_password
MINDHEAL_UPLOAD_KEY_ALIAS=mindheal
MINDHEAL_UPLOAD_KEY_PASSWORD=your_key_password

# Enable bundle compression for smaller APK
android.enableBundleCompression=true
```

**⚠️ Add `gradle.properties` to `.gitignore` if it contains passwords!**

---

## Step 3: Configure Firebase Functions

Set Stream credentials securely:

```bash
# In the functions directory
cd functions

# Set the Stream configuration
firebase functions:config:set stream.api_key="egq2n55kb4yn" stream.api_secret="YOUR_STREAM_SECRET"

# Deploy the updated functions
firebase deploy --only functions
```

---

## Step 4: Create .env File

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:
- `EXPO_PUBLIC_STREAM_API_KEY` - Your Stream Chat API key
- Firebase service account credentials (for server-side operations)

---

## Step 5: Update App Configuration

### app.json
Verify these settings:
- `expo.android.package`: `com.akashmahlax.streams`
- `expo.version`: Update for each release (e.g., "1.0.1")
- `expo.android.versionCode`: Increment for each upload (must be unique)

### Update Version for Release
```json
{
  "expo": {
    "version": "1.0.0",
    "android": {
      "versionCode": 1
    }
  }
}
```

---

## Step 6: Build Release AAB

### Option A: Using EAS Build (Recommended)

```bash
# Install EAS CLI if not already installed
npm install -g eas-cli

# Login to Expo
eas login

# Configure the build
eas build:configure

# Build for Android (production)
eas build --platform android --profile production
```

### Option B: Local Build

```bash
# Navigate to android folder
cd android

# Clean previous builds
./gradlew clean

# Build release AAB (for Play Store)
./gradlew bundleRelease

# The AAB will be at: android/app/build/outputs/bundle/release/app-release.aab
```

---

## Step 7: Test the Release Build

Before uploading to Play Store:

```bash
# Build a release APK for testing
cd android
./gradlew assembleRelease

# Install on device
adb install app/build/outputs/apk/release/app-release.apk
```

Test these critical flows:
- [ ] User registration/login
- [ ] Chat messaging
- [ ] Video/voice calling
- [ ] Push notifications
- [ ] Profile management
- [ ] Counsellor verification flow

---

## Step 8: Play Store Console Setup

### 1. Create App Listing
- Go to [Google Play Console](https://play.google.com/console)
- Create new app
- App name: **MindSets** (or your preferred name)
- Default language: English
- App type: App
- Category: Health & Fitness or Medical

### 2. Store Listing Requirements
Prepare these assets:
- **App icon**: 512x512 PNG (already configured in app.json)
- **Feature graphic**: 1024x500 PNG
- **Screenshots**: 
  - Phone: 2-8 screenshots (1080x1920 or similar)
  - 7" tablet: Optional but recommended
  - 10" tablet: Optional but recommended
- **Short description**: Up to 80 characters
- **Full description**: Up to 4000 characters

### 3. Content Rating
Complete the content rating questionnaire:
- Violence: None
- Sexual content: None
- Language: None or Mild
- Controlled substances: None
- Mental health topics: Yes (mention counselling features)

### 4. Data Safety
Required declarations for this app:
- **Data collected**: 
  - Personal info (name, email, profile photo)
  - Health info (if storing mental health data)
  - Messages (chat content)
  - Device identifiers (FCM tokens)
- **Data shared**: None with third parties
- **Security practices**: 
  - Data encrypted in transit (yes - Firebase uses HTTPS)
  - Data deletion request supported (implement if not done)

### 5. App Access
Since this app has login:
- Provide test credentials for review
- Create a demo/test account

### 6. Ads Declaration
- This app does NOT contain ads (confirm)

### 7. Target Audience
- App is NOT designed for children
- Target age: 18+ (due to mental health content)

---

## Step 9: Upload and Release

### 1. Upload AAB
- Go to Release > Production > Create new release
- Upload the `app-release.aab` file
- Add release notes

### 2. Rollout
- Start with staged rollout (e.g., 10% of users)
- Monitor for crashes in Play Console
- Gradually increase to 100%

---

## Post-Launch Monitoring

### Firebase Crashlytics
Already integrated - monitor for:
- Crash-free users percentage
- Top crash issues
- ANRs (App Not Responding)

### Play Console Vitals
Monitor:
- Crash rate (should be < 1.09%)
- ANR rate (should be < 0.47%)
- Startup time
- Rendering issues

---

## Future Updates

For each update:
1. Increment `versionCode` in app.json
2. Update `version` string if user-visible changes
3. Build new AAB
4. Upload to Play Console
5. Add release notes describing changes

---

## Troubleshooting

### Build Fails
```bash
# Clean and rebuild
cd android
./gradlew clean
./gradlew bundleRelease
```

### Signing Issues
- Ensure keystore path is correct in gradle.properties
- Verify passwords are correct
- Check keystore is not corrupted: `keytool -list -v -keystore release.keystore`

### App Crashes on Release
- Check Crashlytics for error details
- Ensure all environment variables are set
- Test with release build before uploading

---

## Important Files to Backup

**NEVER LOSE THESE:**
1. `android/app/release.keystore` - Upload keystore
2. Keystore passwords - Store in password manager
3. `google-services.json` - Firebase configuration
4. `.env` file - Environment variables

---

## Security Reminders

- ✅ Never commit `.env` files to git
- ✅ Never commit keystore files to git
- ✅ Use Firebase Config for Cloud Function secrets
- ✅ Enable Play App Signing for key recovery options
- ✅ Rotate API keys periodically
