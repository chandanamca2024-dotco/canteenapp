# Google OAuth Debug Checklist

## Current Issue
After selecting Google account, flow stops at "Signed in to Google as" screen. App doesn't reopen.

## Root Cause
Supabase isn't redirecting to your app because the deep link isn't whitelisted or saved correctly.

---

## ✅ Verification Steps

### 1. Supabase Dashboard - Redirect URLs
Go to: **Authentication → URL Configuration → Redirect URLs**

**MUST have these EXACT URLs (copy-paste to verify):**
```
dinedesk://auth/callback
```
```
https://drhkxyhffyndzvsgdufd.supabase.co/auth/v1/callback
```

**After adding, click "Save changes" button at the bottom!**

### 2. Supabase Dashboard - Google Provider
Go to: **Authentication → Providers → Google**

**Callback URL (for OAuth) should be:**
```
https://drhkxyhffyndzvsgdufd.supabase.co/auth/v1/callback
```

**Click "Save" after verifying!**

### 3. Google Cloud Console
Go to: https://console.cloud.google.com/apis/credentials

- Find your OAuth 2.0 Client ID (the one used in Supabase)
- Check **Authorized redirect URIs** - should ONLY have:
```
https://drhkxyhffyndzvsgdufd.supabase.co/auth/v1/callback
```

### 4. App Code - Verify Deep Link Scheme
Already configured in:
- `android/app/src/main/AndroidManifest.xml` - intent filter for `dinedesk://auth/callback` ✓
- `src/screens/auth/LoginScreen.tsx` - redirectTo: `dinedesk://auth/callback` ✓
- `src/screens/auth/RegisterScreen.tsx` - redirectTo: `dinedesk://auth/callback` ✓

---

## 🧪 Test Deep Link Handler

**Test if app can receive deep links:**

1. Install the app on device
2. Run this command in terminal:
```bash
adb shell am start -W -a android.intent.action.VIEW -d "dinedesk://auth/callback?test=true"
```

3. **Expected:** App should open and log "📲 Deep link received" in Metro logs

4. If app doesn't open, the intent filter might have issues

---

## 🔧 Clean Test Steps

**After verifying ALL settings above:**

1. **Uninstall app completely:**
```bash
adb uninstall com.canteenapp
```

2. **Clear Metro cache and reinstall:**
```bash
cd canteenapp
npx react-native start --reset-cache
```

3. **In another terminal, rebuild:**
```bash
cd canteenapp
npx react-native run-android
```

4. **Test OAuth flow:**
   - Tap "Continue with Google"
   - Select account
   - **Expected:** App reopens, shows dashboard
   - **Check Metro logs for:** "📲 Deep link received", "Auth event: SIGNED_IN"

---

## 🚨 Common Mistakes

- ❌ Added URL but didn't click "Save changes" in Supabase dashboard
- ❌ Typo in `dinedesk://auth/callback` (missing colon, wrong spelling)
- ❌ Wrong Google OAuth client selected (must match Supabase config)
- ❌ App has stale state - always uninstall before testing
- ❌ Multiple redirect URLs in Google Console (should only be the HTTPS one)

---

## 📱 What Should Happen

1. Tap button → Opens browser
2. Select Google account → Google redirects to Supabase HTTPS callback
3. Supabase validates → Redirects to `dinedesk://auth/callback`
4. Android intent filter catches it → App opens
5. LoginScreen deep link handler → Creates session
6. onAuthStateChange fires → Creates profile → Navigate to dashboard

---

## 🐛 If Still Stuck

Check Metro logs for errors, or run this to see all app logs:
```bash
adb logcat *:S ReactNative:V ReactNativeJS:V
```

Look for:
- "Opening OAuth URL"
- "Deep link received"
- "Auth event: SIGNED_IN"
- Any Supabase error messages
