# Google OAuth Setup Guide

## Critical: Supabase Configuration

### Step 1: Configure Redirect URL in Supabase

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **Authentication** → **URL Configuration**
4. Add these redirect URLs:

```
dinedesk://auth/callback
com.dinedeskapp://oauth-callback
```

5. Save the changes

### Step 2: Enable Google Provider

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Find **Google** and click **Enable**
3. Add your Google OAuth credentials:
   - **Client ID**: Get from Google Cloud Console
   - **Client Secret**: Get from Google Cloud Console
4. Save the configuration

### Step 3: Google Cloud Console Setup

1. Go to https://console.cloud.google.com
2. Create a new project or select existing one
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen:
   - App name: DineDesk
   - User support email: your email
   - Developer contact: your email
6. Create credentials:
   - Application type: **Web application**
   - Authorized JavaScript origins: 
     - `https://[YOUR-PROJECT-REF].supabase.co`
   - Authorized redirect URIs:
     - `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`
7. Copy the **Client ID** and **Client Secret**
8. Paste them into Supabase (Step 2 above)

### Step 4: Test the Flow

1. Rebuild the app:
```bash
cd canteenapp
npx react-native run-android
```

2. Click "Continue with Google"
3. Browser should open with Google sign-in
4. After signing in, you'll be redirected back to the app
5. Profile should be created automatically

## How It Works

1. User clicks "Continue with Google"
2. App opens browser with Supabase OAuth URL
3. User signs in with Google
4. Google redirects to Supabase
5. Supabase redirects to `dinedesk://auth/callback` with tokens
6. App catches the deep link
7. App extracts tokens and creates session
8. Profile is created automatically via `onAuthStateChange`
9. User is navigated to UserDashboard

## Troubleshooting

### Issue: "Cannot open browser"
- Make sure your device/emulator has a browser installed
- Check internet connection

### Issue: "No OAuth URL received"
- Check Supabase configuration
- Verify Google provider is enabled
- Check console logs for errors

### Issue: "Login successful but stuck on login screen"
- Check if redirect URL is configured correctly in Supabase
- Verify AndroidManifest.xml has the correct intent-filter
- Check deep link handling in LoginScreen.tsx

### Issue: "Profile setup had issues"
- Check `profiles` table exists in Supabase
- Verify RLS policies allow INSERT for authenticated users
- Check console logs for specific error

## Console Logs to Look For

Successful flow:
```
🔐 Attempting OAuth...
✅ OAuth URL opened successfully
📱 Deep link received: dinedesk://auth/callback...
🔐 Processing OAuth callback...
✅ Tokens found in URL, setting session...
✅ Session established, user: user@example.com
Auth event: SIGNED_IN
✅ Success: Logged in successfully!
```

## Additional Notes

- The redirect URL scheme `dinedesk://` is configured in AndroidManifest.xml
- Make sure no other app uses the same URL scheme
- For iOS, you'll need to configure URL scheme in Info.plist
- The auth flow uses Supabase's built-in OAuth handling
- Session tokens are stored securely by Supabase client
