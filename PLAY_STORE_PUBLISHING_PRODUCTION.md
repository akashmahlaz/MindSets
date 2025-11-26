# MindHeal - Play Store Publishing Guide

## 🎯 PRODUCTION READINESS STATUS

### ✅ COMPLETED
- [x] App name finalized: "MindHeal"
- [x] Package name updated: com.mindheal.app
- [x] Firebase rules enhanced and secured
- [x] Privacy Policy created
- [x] Terms of Service created
- [x] Expo packages updated
- [x] Security improvements implemented

### ⚠️ IN PROGRESS
- [ ] Generate signing keystore
- [ ] Build release APK/AAB
- [ ] Test production build

### ❌ TODO
- [ ] Create Play Store assets
- [ ] Complete Play Console setup
- [ ] Submit for review

---

## STEP 1: Fix Dependencies (DO THIS FIRST)

```powershell
# Run in PowerShell
cd C:\Users\akash\upwork\MindHeal

# Remove bun.lock if exists
Remove-Item bun.lock -ErrorAction SilentlyContinue

# Clean install
Remove-Item -Recurse -Force node_modules
npm install

# Verify no issues
npx expo-doctor
```

**Expected Result:** All checks should pass

---

## STEP 2: Generate Signing Keystore

```powershell
# Generate upload keystore (KEEP THIS SECURE!)
keytool -genkeypair -v -storetype PKCS12 -keystore upload-keystore.jks -alias mindheal-upload -keyalg RSA -keysize 2048 -validity 10000

# You'll be prompted for:
# - Keystore password (SAVE THIS!)
# - Your name
# - Organization: MindHeal
# - City/State/Country

# Move keystore to android/app directory
Move-Item upload-keystore.jks android\app\
```

**CRITICAL:** Save the password somewhere secure!

---

## STEP 3: Configure Gradle for Signing

Create file: `android/gradle.properties` (add these lines):

```properties
MYAPP_UPLOAD_STORE_FILE=upload-keystore.jks
MYAPP_UPLOAD_KEY_ALIAS=mindheal-upload
MYAPP_UPLOAD_STORE_PASSWORD=YOUR_KEYSTORE_PASSWORD
MYAPP_UPLOAD_KEY_PASSWORD=YOUR_KEY_PASSWORD
```

Update `android/app/build.gradle`:

```groovy
android {
    ...
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                storeFile file(MYAPP_UPLOAD_STORE_FILE)
                storePassword MYAPP_UPLOAD_STORE_PASSWORD
                keyAlias MYAPP_UPLOAD_KEY_ALIAS
                keyPassword MYAPP_UPLOAD_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

---

## STEP 4: Build Release APK/AAB

```powershell
# Build release bundle (AAB - recommended for Play Store)
cd android
.\gradlew bundleRelease

# Or build APK for testing
.\gradlew assembleRelease

# Output locations:
# AAB: android\app\build\outputs\bundle\release\app-release.aab
# APK: android\app\build\outputs\apk\release\app-release.apk
```

---

## STEP 5: Test Release Build

```powershell
# Install release APK on device
adb install android\app\build\outputs\apk\release\app-release.apk

# Test everything:
# - Sign in/Sign up
# - Video calls
# - Chat messages
# - Profile updates
# - All screens work
```

---

## STEP 6: Create Play Store Assets

### Required Assets:

1. **App Icon** (512x512 PNG)
   - High-res version of your icon
   - Must be uploaded to Play Console

2. **Feature Graphic** (1024x500 PNG)
   - Promotional banner
   - Create using Canva or Figma

3. **Screenshots** (Minimum 2, Recommend 8)
   Required sizes:
   - Phone: 320-3840 pixels (width or height)
   - Tablet: 1280-3840 pixels (width or height)
   
   Take screenshots of:
   - [ ] Home/Dashboard screen
   - [ ] Sign in screen
   - [ ] Counselor browse screen
   - [ ] Video call screen
   - [ ] Chat interface
   - [ ] Profile screen
   - [ ] Session booking
   - [ ] Settings screen

---

## STEP 7: Play Console Setup

### A. Create Developer Account
1. Go to https://play.google.com/console
2. Pay $25 one-time registration fee
3. Complete account verification

### B. Create New App
1. Click "Create app"
2. Fill in details:
   - **App name:** MindHeal
   - **Default language:** English (United States)
   - **App or game:** App
   - **Free or paid:** Free (or Paid if charging)

### C. Store Listing
```
Short description (80 characters):
"Connect with licensed mental health professionals anytime, anywhere."

Full description (4000 characters):
MindHeal - Your Mental Health Support Platform

Take control of your mental health journey with MindHeal, the trusted platform connecting you with licensed mental health professionals for video counseling, chat support, and personalized care.

🌟 KEY FEATURES:

✓ Verified Counselors - Connect with licensed, verified mental health professionals
✓ Video & Audio Calls - High-quality, secure video and audio sessions
✓ Secure Messaging - Private, encrypted chat with your counselor
✓ Find Your Match - Browse counselors by specialization and expertise
✓ Flexible Scheduling - Book sessions that fit your schedule
✓ Privacy First - Your data is encrypted and secure

🎯 WHO IS IT FOR?

MindHeal is perfect for anyone seeking:
- Anxiety and stress management
- Depression support
- Relationship counseling
- Life transitions guidance
- General mental wellness

🔒 PRIVACY & SECURITY:

Your privacy is our priority. All communications are encrypted, and we never share your personal information.

⚠️ IMPORTANT DISCLAIMER:

MindHeal is not a substitute for emergency services. If you're experiencing a mental health crisis, call 988 (US) or your local emergency services.

📱 EASY TO USE:

1. Create your profile
2. Browse verified counselors
3. Connect via video, audio, or chat
4. Start your mental health journey

Start your journey to better mental health today.
```

---

## STEP 8: Content Rating

Complete IARC questionnaire:

**Key Answers:**
- Violence: No
- Sexual content: No
- Language: May contain (user-generated)
- Controlled substances: No (may be discussed therapeutically)
- Gambling: No
- User interaction: Yes (chat/video)
- Shares location: No
- Shares personal info: Yes (with counselors only)
- Health-related: Yes

**Expected Rating:** Teen (13+)

---

## STEP 9: Data Safety

**Data collected:**
- ✓ Email address (required)
- ✓ Name (required)
- ✓ Profile photo (optional)
- ✓ Chat messages (encrypted)
- ✓ Video call logs (metadata only)

**Data usage:**
- Account creation
- Communication with counselors
- Service improvement

**Data sharing:**
- None with third parties
- Only with chosen counselor

**Security:**
- Data encrypted in transit (TLS)
- Data encrypted at rest
- Secure authentication

---

## STEP 10: Submit for Review

### Pre-Submission Checklist:
- [ ] Release build tested thoroughly
- [ ] All screenshots uploaded
- [ ] Store listing complete
- [ ] Content rating done
- [ ] Data safety filled
- [ ] Privacy policy URL added
- [ ] App category selected: Health & Fitness
- [ ] Contact email provided

### Submit:
1. Go to "Production" track
2. Create new release
3. Upload AAB file
4. Add release notes:
   ```
   Initial release of MindHeal - Your mental health support platform
   
   Features:
   - Connect with licensed counselors
   - Video and audio calling
   - Secure messaging
   - Browse counselors by specialization
   - Privacy-first design
   ```
5. Review and roll out to production

---

## STEP 11: Post-Submission

### Review Timeline
- Google typically reviews in 1-3 days
- Check email for updates
- Monitor Play Console for status

### After Approval
- [ ] Test download from Play Store
- [ ] Monitor crash reports
- [ ] Respond to user reviews
- [ ] Track key metrics:
  - Downloads
  - Active users
  - Crash-free rate
  - Rating

---

## IMPORTANT URLS TO ADD IN PLAY CONSOLE

### Privacy Policy URL:
Host the PRIVACY_POLICY.md file and provide URL:
```
https://yourdomain.com/privacy-policy
```

### Terms of Service URL:
```
https://yourdomain.com/terms-of-service
```

**CRITICAL:** These must be publicly accessible URLs before submission!

---

## TROUBLESHOOTING

### Issue: Build fails
**Solution:**
```powershell
cd android
.\gradlew clean
.\gradlew bundleRelease --stacktrace
```

### Issue: Keystore password forgotten
**Solution:** You'll need to create a new keystore (can't recover)

### Issue: App rejected
**Common reasons:**
1. Privacy policy missing or incomplete
2. Permissions not justified
3. Content rating incorrect
4. Health claims without disclaimers

**Action:** Check rejection email, fix issues, resubmit

---

## MAINTENANCE

### Regular Updates
- Bug fixes: As needed
- Feature updates: Monthly
- Security patches: Immediately

### Version Bumping
In `app.json`:
```json
{
  "version": "1.0.1",  // User-visible version
  "android": {
    "versionCode": 2   // Increment for each release
  }
}
```

---

## MONITORING

### Key Metrics
- Crash-free rate: Target >99%
- ANR rate: Target <0.5%
- Rating: Target >4.0
- Response time: <24 hours

### Tools
- Firebase Crashlytics
- Play Console vitals
- User reviews
- Analytics

---

## SUPPORT

### Contact Information
- Developer email: support@mindheal.app
- Website: https://mindheal.app
- Support hours: 24/7

---

## ⚠️ CRITICAL REMINDERS

1. **NEVER commit keystore to Git**
2. **ALWAYS backup keystore securely**
3. **Test release build before submitting**
4. **Keep privacy policy updated**
5. **Respond to crashes within 24 hours**
6. **Monitor reviews daily**
7. **Update security patches immediately**

---

## TIMELINE

| Phase | Duration |
|-------|----------|
| Dependencies fix | 30 minutes |
| Keystore generation | 15 minutes |
| Build configuration | 30 minutes |
| Release build | 15 minutes |
| Testing | 2 hours |
| Assets creation | 4 hours |
| Play Console setup | 2 hours |
| Submission | 30 minutes |
| Review wait | 1-3 days |
| **TOTAL** | **~2 days + review** |

---

**READY TO PUBLISH!** 🚀

Follow the steps above sequentially. Do not skip any step.

Good luck with your launch!
