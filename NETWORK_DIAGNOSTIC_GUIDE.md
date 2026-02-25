# 🔧 Network Diagnostic Guide - Login Timeout Fix

## 🔴 Problem
Your app shows: **"Login timed out - please try again"** after 15 seconds

This means the app **cannot reach Supabase** to authenticate.

---

## ✅ Quick Diagnostic Checklist

### 1. **Check Supabase Project Status**
```
Your Supabase URL: https://drhkxyhffyndzvsgdufd.supabase.co
Your Supabase Project ID: drhkxyhffyndzvsgdufd
```

1. Open https://status.supabase.com in your browser
2. Is there a RED alert? ❌ = Supabase is DOWN
3. If DOWN, wait for it to come back online

---

### 2. **Verify Your Supabase Credentials**
1. Go to https://app.supabase.com
2. Sign in with your account
3. Select your project (should be `drhkxyhffyndzvsgdufd`)
4. Click **Settings** → **API**
5. Compare these values:
   ```
   Project URL: https://drhkxyhffyndzvsgdufd.supabase.co (should match)
   Anon Public Key: Copy from your settings
   ```

6. Check if the **anon key** in your code matches:
   - Open `src/lib/supabase.ts`
   - Compare the `SUPABASE_ANON_KEY` value
   - If different, **UPDATE IT** with the correct key from Supabase dashboard

---

### 3. **Verify Internet Connection on Android**
```bash
# If using Android Emulator:
1. Open Android Emulator Settings (three dots)
2. Check if internet is enabled
3. WiFi should show as connected

# If using Physical Device:
1. Check WiFi is ON and connected
2. Try opening Google.com in browser to verify internet works
```

---

### 4. **Check Supabase RLS Policies**
The profiles table might be blocking requests. Run this in Supabase:

1. Go to your Supabase dashboard
2. Open **SQL Editor**
3. Click **New Query**
4. Run this to check policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

5. You should see policies like:
   - `Users can insert own profile`
   - `Users can view own profile`
   - `Admins can view all profiles`

**If you see 0 rows:** Your RLS policies are missing! 
→ Run `FIX_LOGIN_COMPLETE.sql` to fix this

---

## 🛠️ Common Fixes (Try in Order)

### **Fix 1: Android Emulator Network Access**
```bash
# In Android Studio Terminal:
adb shell "settings put global http_proxy 0:0"  # Clear any proxy
adb reverse tcp:54321 tcp:54321  # If using localhost:54321
```

### **Fix 2: Verify Supabase is Reachable**
```bash
# On your computer terminal:
ping drhkxyhffyndzvsgdufd.supabase.co

# Should show times like "27ms" - if timeout, internet issue
```

### **Fix 3: Increase Timeout (Temporary)**
Edit `src/screens/auth/LoginScreen.tsx`:
```typescript
// Change line 427 from:
setTimeout(() => reject(new Error('Login timed out - please try again')), 15000)

// To (30 seconds):
setTimeout(() => reject(new Error('Login timed out - please try again')), 30000)
```

### **Fix 4: Re-apply RLS Policies**
1. Go to Supabase dashboard
2. Open SQL Editor
3. Run: `FIX_LOGIN_COMPLETE.sql`
4. Rebuild and test

---

## 🎯 If You're Using Android Emulator

### Add These Environment Settings:
```bash
# Set proxy bypass for local traffic
adb shell "settings put global http_proxy :0"

# Verify internet works
adb shell "ping -c 1 8.8.8.8"  # Should see response with ~50-100ms
```

---

## 📊 Debug Logs to Check
After trying to login, check the console for:

```
✅ GOOD LOGS (means network is working):
- "Attempting login for: user@example.com"
- Any network response (even if error)

❌ BAD LOGS (network timeout):
- No logs after "Attempting login"
- "Login error: Error: Login timed out"
```

---

## 🚀 Next Steps

**If Step 1-4 don't help:**
1. Check if you're behind a VPN or proxy
2. Try connecting to different WiFi network
3. Restart Android emulator with:
   ```bash
   adb kill-server
   adb start-server
   npx react-native run-android
   ```

**If still failing:**
- Check Supabase project is active (not paused)
- Verify no IP whitelist is blocking your connection
- Try clearing app cache: Settings → Apps → DineDesk → Clear Cache

---

## 📞 Supabase Status Resources
- **Status Page:** https://status.supabase.com
- **GitHub Issues:** https://github.com/supabase/supabase/issues
- **Community Forum:** https://github.com/orgs/supabase/discussions
