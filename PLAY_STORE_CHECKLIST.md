# Play Store Publishing Checklist

## Pre-Submission Checklist

### ✅ = Completed | ⚠️ = In Progress | ❌ = Not Started

### 1. Security & Privacy ⚠️
- [x] Environment variables for sensitive data
- [x] Firebase credentials protected
- [ ] Security audit completed
- [x] Privacy Policy created
- [x] Terms of Service created
- [ ] Data deletion feature implemented
- [ ] GDPR compliance verified

### 2. App Requirements ❌
- [ ] Release APK/AAB generated with signing key
- [ ] ProGuard enabled and configured
- [ ] App tested on multiple devices
- [ ] Performance testing completed
- [ ] Network condition testing done
- [ ] Battery usage optimized

### 3. Store Listing Assets ❌
- [ ] App name finalized: "MindHeal" or "MindConnect"
- [ ] Short description (80 characters)
- [ ] Full description (4000 characters)
- [ ] High-res icon (512x512)
- [ ] Feature graphic (1024x500)
- [ ] Screenshots (minimum 2, recommend 8)
  - [ ] Home screen
  - [ ] Counselor browse
  - [ ] Chat interface
  - [ ] Video call
  - [ ] Profile screen
  - [ ] Admin dashboard (if public)
  - [ ] Sign in screen
  - [ ] Sign up screen

### 4. Content Rating ❌
- [ ] IARC questionnaire completed
- [ ] Age rating confirmed (recommend 13+)
- [ ] Content warnings added if needed

### 5. Data Safety Section ❌
- [ ] Data collection disclosed
  - [ ] Email
  - [ ] Name
  - [ ] Profile photo
  - [ ] Chat messages
  - [ ] Call logs
- [ ] Data usage explained
- [ ] Data sharing practices disclosed
- [ ] Security practices documented
- [ ] Data deletion policy stated

### 6. App Content ⚠️
- [x] Disclaimers added (not medical advice)
- [ ] Emergency resources accessible in-app
- [ ] Crisis hotline information prominent
- [ ] User reporting system implemented
- [ ] Content moderation policies in place
- [ ] Community guidelines published

### 7. Legal Documents ⚠️
- [x] Privacy Policy URL ready
- [x] Terms of Service URL ready
- [ ] Privacy Policy hosted publicly
- [ ] Terms of Service hosted publicly
- [ ] HIPAA disclaimer included
- [ ] Liability waivers clear

### 8. Technical Requirements ✅
- [x] Target SDK 34 or higher
- [x] minSdkVersion 24
- [x] 64-bit support enabled
- [x] Permissions justified
- [ ] App size under 150MB
- [ ] Startup time under 5 seconds

### 9. Testing ❌
- [ ] Unit tests written
- [ ] Integration tests completed
- [ ] Manual testing on:
  - [ ] Android 10
  - [ ] Android 11
  - [ ] Android 12
  - [ ] Android 13
  - [ ] Android 14
- [ ] Device testing:
  - [ ] Samsung
  - [ ] Google Pixel
  - [ ] OnePlus
  - [ ] Xiaomi
- [ ] Network testing:
  - [ ] WiFi
  - [ ] 4G
  - [ ] 3G
  - [ ] Offline mode

### 10. Accessibility ✅
- [x] Touch targets 44x44 minimum
- [x] Accessibility labels present
- [x] Screen reader support
- [ ] Color contrast ratios verified
- [ ] Font scaling supported

### 11. Localization ❌
- [ ] English (US) - Primary
- [ ] Spanish (Optional)
- [ ] French (Optional)

### 12. Developer Account ❌
- [ ] Google Play Developer Account created ($25)
- [ ] Developer profile completed
- [ ] Payment profile set up (for paid apps)

---

## Play Store Submission Steps

### Step 1: Create Release Build
```bash
# Generate upload keystore (KEEP SECURE!)
keytool -genkeypair -v -storetype PKCS12 -keystore upload-keystore.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000

# Build release AAB
cd android
./gradlew bundleRelease

# AAB location: android/app/build/outputs/bundle/release/app-release.aab
```

### Step 2: Play Console Setup
1. Go to https://play.google.com/console
2. Create new app
3. Fill in app details
4. Set up store listing
5. Upload content rating certificate
6. Complete data safety form

### Step 3: Upload Build
1. Go to Production > Create new release
2. Upload AAB file
3. Add release notes
4. Review and roll out

### Step 4: Submit for Review
1. Review all sections
2. Submit for review
3. Wait 1-3 days for approval

---

## Store Listing Copy Templates

### Short Description (80 chars max)
"Connect with licensed counselors for mental health support anytime, anywhere."

### Full Description (4000 chars max)

**MindHeal - Your Mental Health Support Platform**

Take control of your mental health journey with MindHeal, the trusted platform connecting you with licensed mental health professionals for video counseling, chat support, and personalized care.

**🌟 KEY FEATURES:**

✓ **Verified Counselors** - Connect with licensed, verified mental health professionals
✓ **Video & Audio Calls** - High-quality, secure video and audio sessions
✓ **Secure Messaging** - Private, encrypted chat with your counselor
✓ **Find Your Match** - Browse counselors by specialization and expertise
✓ **Flexible Scheduling** - Book sessions that fit your schedule
✓ **Privacy First** - Your data is encrypted and secure

**🎯 WHO IS IT FOR?**

MindHeal is perfect for anyone seeking:
- Anxiety and stress management
- Depression support
- Relationship counseling
- Life transitions guidance
- General mental wellness

**🔒 PRIVACY & SECURITY:**

Your privacy is our priority. All communications are encrypted, and we never share your personal information. Our counselors are bound by professional confidentiality.

**⚠️ IMPORTANT DISCLAIMER:**

MindHeal is not a substitute for emergency services. If you're experiencing a mental health crisis, call 988 (US) or your local emergency services.

**📱 EASY TO USE:**

1. Create your profile
2. Browse verified counselors
3. Connect via video, audio, or chat
4. Start your mental health journey

**🌍 AVAILABLE 24/7:**

Access support when you need it, from the comfort of your home.

**Start your journey to better mental health today. Download MindHeal now.**

---

### Keywords (30 max)
mental health, therapy, counseling, anxiety, depression, video therapy, online counseling, telehealth, mental wellness, stress management, licensed therapist, online therapy, virtual counseling, mental health support, therapy app

---

## Content Rating Questionnaire Answers

### Violence
- Q: Does your app contain violence?
- A: No

### Sexual Content
- Q: Does your app contain sexual content?
- A: No

### Language
- Q: Does your app contain profanity?
- A: May contain user-generated content with profanity (chat messages)

### Drugs/Alcohol/Tobacco
- Q: References to drugs/alcohol/tobacco?
- A: May be discussed in therapeutic context

### Gambling
- Q: Gambling content?
- A: No

### User Interaction
- Q: Users can communicate with each other?
- A: Yes - Chat and video calls between users and counselors

### Personal Info
- Q: Shares user location?
- A: No

- Q: Shares personal information?
- A: Yes - Users can share information with counselors

### Health Information
- Q: Contains health-related content?
- A: Yes - Mental health counseling platform

**Expected Rating:** Teen (13+) with content warning

---

## Launch Day Checklist

### Day Before Launch
- [ ] Final build tested
- [ ] All team members notified
- [ ] Support email monitored
- [ ] Social media posts scheduled
- [ ] Press release ready (if applicable)

### Launch Day
- [ ] Monitor Play Console for approval
- [ ] Check for user reviews
- [ ] Monitor crash reports
- [ ] Be ready for support requests
- [ ] Announce launch on social media

### Week After Launch
- [ ] Gather user feedback
- [ ] Monitor metrics (downloads, crashes, reviews)
- [ ] Address critical bugs immediately
- [ ] Plan first update

---

## Post-Launch Monitoring

### Key Metrics to Track:
- Downloads/Installs
- Active users (DAU/MAU)
- Crash-free rate (target: >99%)
- ANR rate (target: <0.5%)
- Rating (target: >4.0)
- User reviews
- Session length
- Call quality metrics

### Update Schedule:
- Bugfix updates: As needed
- Feature updates: Every 4-6 weeks
- Major updates: Every 3-6 months

---

## Support Resources

### Google Play Console
https://play.google.com/console

### Play Store Policies
https://play.google.com/about/developer-content-policy/

### App Review Status
https://support.google.com/googleplay/android-developer/answer/9859751

### Developer Support
https://support.google.com/googleplay/android-developer

---

**Last Updated:** November 23, 2025  
**Version:** 1.0
