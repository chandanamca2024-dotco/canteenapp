# 🔴 CRITICAL FIX: Google OAuth Blank Page Issue

## 📍 Your Supabase Project Reference:
```
drhkxyhffyndzvsgdufd
```

Your Supabase URL is:
```
https://drhkxyhffyndzvsgdufd.supabase.co
```

---

## ⚠️ THE PROBLEM

The blank page you're seeing means:
1. The redirect URL in Supabase is NOT configured correctly
2. OR Google provider credentials are missing
3. OR the callback URL path is wrong

---

## ✅ EXACT STEPS TO FIX (DO THIS NOW!)

### Step 1: Go to Supabase Dashboard
1. Open: **https://app.supabase.com**
2. Log in with your account
3. Select your project (should show `drhkxyhffyndzvsgdufd`)

### Step 2: Configure Redirect URLs
1. In the left sidebar, click: **Authentication**
2. Click: **URL Configuration**
3. Under **Redirect URLs** section, you'll see an input field
4. **Add EXACTLY these two lines:**
```
https://drhkxyhffyndzvsgdufd.supabase.co/auth/v1/callback
dinedesk://auth/callback
```

**IMPORTANT:** 
- First line is for the browser (HTTPS callback from Supabase)
- Second line is for the mobile app (deep link)

5. Click the **"Save"** button at the bottom (very important!)

### Step 3: Enable Google Provider
1. Still in **Authentication**, click **Providers** (left sidebar)
2. Look for **Google** in the list
3. If it says "Disabled", click **Enable**
4. Fill in:
   - **Client ID**: Your Google OAuth Client ID
   - **Client Secret**: Your Google OAuth Client Secret
   
   (Get these from https://console.cloud.google.com/apis/credentials)

5. Click **Save**

### Step 4: Google Cloud Console Setup
1. Go to: **https://console.cloud.google.com**
2. Find **Credentials** → **OAuth 2.0 Client IDs**
3. Click your Web application credential
4. Under **Authorized redirect URIs**, make sure you have:
```
https://drhkxyhffyndzvsgdufd.supabase.co/auth/v1/callback
```
5. Click **Save**

---

## 🧹 Clear Everything & Rebuild

```bash
# Terminal 1: Clear app
adb uninstall com.canteenapp
adb shell pm clear com.canteenapp

# Clear all caches
cd canteenapp
rm -rf node_modules/.cache
rm -rf ~/.gradle/caches
npx react-native start --reset-cache
```

```bash
# Terminal 2: Rebuild app
cd canteenapp
npx react-native run-android
```

---

## 🧪 Test Again

1. Open app
2. Go to **Login Screen**
3. Tap **"Continue with Google"**
4. Should see Google sign-in (NOT blank page!)
5. After signing in, app should reopen automatically
6. You should see Dashboard

---

## 🔍 If Still Blank

Check Metro console for these logs:

```
✅ OAuth URL received from Supabase
🔗 Opening OAuth URL: https://accounts.google.com/o/oauth2/...
```

If you see:
```
❌ No OAuth URL received from Supabase
```

Then **Google provider is not enabled** in Supabase. Go back to Step 3!

---

## ✨ Quick Checklist

- [ ] Supabase Redirect URLs contains `https://drhkxyhffyndzvsgdufd.supabase.co/auth/v1/callback`
- [ ] Supabase Redirect URLs contains `dinedesk://auth/callback`
- [ ] Clicked **"Save"** button in Supabase
- [ ] Google Provider is **Enabled** in Supabase
- [ ] Google Client ID and Secret filled in Supabase
- [ ] Google Cloud Console has `https://drhkxyhffyndzvsgdufd.supabase.co/auth/v1/callback` in redirect URIs
- [ ] App cleared and rebuilt

---

## 📲 What Should Happen

**BEFORE (Wrong):**
```
User taps "Continue with Google" 
→ Browser opens blank page
→ Nothing happens
```

**AFTER (Correct):**
```
User taps "Continue with Google"
→ Browser opens Google sign-in page
→ User selects their Google account
→ Browser redirects automatically
→ App reopens with dashboard
```

---

Let me know once you've done these steps! The blank page is definitely the Supabase redirect URL configuration. 🚀
