# 🧪 Authentication Testing Guide

## Quick Test Checklist

### 1. Email Login Test
```
Steps:
1. Click "Login" on auth screen
2. Enter email: test@example.com
3. Enter password: testpass123
4. Click "Login"

Expected:
✅ Within 2-3 seconds: Dashboard appears
❌ If hung for 30+ seconds: Something is wrong
❌ If error after 8 seconds: Network issue (this is correct behavior)
```

### 2. Email Signup Test
```
Steps:
1. Click "Sign up" on auth screen
2. Fill in:
   - Name: Test User
   - Email: newuser@example.com
   - Phone: 1234567890
   - Password: testpass123 (min 6 chars)
   - Confirm Password: testpass123
   - Role: Student
3. Click "Sign Up"

Expected:
✅ Within 3-5 seconds: "Registration Successful" message
✅ Can then login with email/password
❌ If hung: Something is wrong
```

### 3. Google Login Test
```
Steps:
1. Click "Continue with Google" on login screen
2. Browser opens to Google login
3. Select your Google account
4. Grant permissions
5. Browser redirects back to app

Expected:
✅ Browser opens within 1 second
✅ App reopens within 5 seconds after Google auth
✅ Dashboard appears (role-based routing)
❌ If hung after step 5: Check deep link setup
```

### 4. Google Signup Test
```
Steps:
1. Click "Sign up" on auth screen
2. Scroll down and look for "Continue with Google" button
3. Browser opens to Google login
4. Select your Google account
5. You should be redirected to role selection screen

Expected:
✅ Browser opens within 1 second
✅ Role selection screen appears after auth
✅ Can select Student or Staff role
✅ Dashboard appears after role selection
```

### 5. Navigation Test (After Login)
```
Expected Routes:
- Admin user → AdminDashboard
- Canteen staff user → StaffDashboard
- Student/regular user → UserDashboard

Test:
1. Login with different user roles
2. Verify correct dashboard appears
```

## Console Log Monitoring

Open DevTools/Logcat and look for these logs during auth:

### Successful Email Login
```
✅ Attempting login for: user@example.com
✅ Login successful for: user@example.com
✅ Profile lookup (or timeout handled)
✅ Navigation to UserDashboard
```

### Successful Google Login
```
✅ Starting Google OAuth flow
✅ OAuth URL received from Supabase
✅ OAuth URL opened successfully
✅ After selecting your Google account, app should reopen automatically
✅ Auth event: SIGNED_IN
✅ Google user detected - navigating to role selection
```

### Timeout (This is OK - Better than hanging!)
```
❌ Profile lookup timeout (this is expected if DB is slow)
⚠️ Proceeding anyway: navigating to UserDashboard
```

## Common Issues & Fixes

### Issue: "Network Error - Cannot reach Supabase"
```
Causes:
- No internet connection
- Firewall blocking Supabase
- Wrong SUPABASE_URL or ANON_KEY

Fix:
1. Check internet connectivity
2. Check firewall/VPN settings
3. Verify SUPABASE_URL and ANON_KEY in src/lib/supabase.ts
4. Check Supabase dashboard is accessible from browser
```

### Issue: "Login timed out" (after 8 seconds)
```
Causes:
- Very slow internet (>8 seconds to auth)
- Supabase database slow
- Network latency

Fix:
1. Check internet speed (speedtest.net)
2. Check Supabase performance in dashboard
3. If consistently >8s, adjust timeout in code (search for "8000" in LoginScreen.tsx)
```

### Issue: "No OAuth URL received"
```
Causes:
- Supabase Google OAuth not configured
- Missing credentials in Supabase dashboard
- Network issue preventing OAuth

Fix:
1. Go to Supabase dashboard
2. Settings → Authentication → Providers
3. Verify Google is enabled
4. Verify Client ID and Client Secret are correct
5. Check that http://localhost:3000 or your domain is in redirect URIs
```

### Issue: Google Auth Opens But App Doesn't Reopen
```
Causes:
- Deep link handler not working
- Wrong redirect URL configured
- Bundle ID/package name mismatch

Fix (for iOS):
1. Check Info.plist has correct URL schemes
2. Verify app.json has correct scheme: "dinedesk://"

Fix (for Android):
1. Check AndroidManifest.xml has deep link intent
2. Verify package name matches Supabase config

Test:
Run: npx expo configure (for Expo projects)
This auto-configures deep links from app.json
```

## Performance Benchmarks

### Expected Timing (with good internet)
- Email login: 1-2 seconds
- Google OAuth request: 0.5-1 second  
- Google auth completion: 3-5 seconds
- Email signup: 2-3 seconds
- Navigation: Instant (<500ms)

### Timeout Thresholds (When we give up)
- Email login: 8 seconds
- Email signup: 10 seconds
- Google OAuth: 8 seconds
- Profile lookup: 5 seconds (won't block UI)

If you hit the timeout threshold, you'll get an error. This is GOOD because it means we're not hanging the app.

## Debug Mode

To enable verbose logging, search LoginScreen.tsx for `console.log` and make sure they're not commented out. All logs starting with ✅, ❌, 🚀, etc. will appear in:
- React Native debugger
- Android Logcat
- iOS Console.app
- Browser DevTools (for web version)

## Test Accounts

After signing up with email/password, those credentials will work for login.

For testing Google OAuth:
- Use your own Google account
- Test both new and existing users
- Test switching between roles

---

**Last Updated:** After auth performance fix
**Status:** Ready to test
