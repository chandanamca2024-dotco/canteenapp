# 🔐 LOGIN FIX - COMPLETE GUIDE

## 🎯 Problem Identified
Your login system has issues with:
1. **RLS Policies** - The profiles table RLS is too restrictive
2. **Profile Creation** - Users can't create profiles during registration
3. **Profile Reading** - Logged-in users can't read their own profile to determine their role

## ⚡ Quick Fix (5 minutes)

### Step 1: Run SQL in Supabase Console
1. Go to your Supabase dashboard: https://app.supabase.com
2. Open the **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents from `FIX_LOGIN_COMPLETE.sql`
5. Click **Run** (or Ctrl+Enter)

### Step 2: Verify the Fix
After running the SQL, you should see output showing these policies exist:
- `Users can insert own profile`
- `Anonymous users can create profile`
- `Users can view own profile`
- `Admins can view all profiles`
- `Staff can view all profiles`
- `Users can update own profile`
- `Admins can update all profiles`

## 🧪 Test Your Login

### Register a New Account
1. Open the app
2. Tap "Sign up"
3. Fill in all fields:
   - Name: Test User
   - Email: test@example.com
   - Phone: 1234567890
   - Password: Password123
   - Confirm: Password123
4. Select role: **Student**
5. Tap **Create Account**
6. You should see: "Registration Successful! Redirecting to login..."

### Login with the New Account
1. Email: test@example.com
2. Password: Password123
3. Tap **Login**
4. You should see: "✅ Welcome - Logged in successfully!"
5. You should be navigated to the **User Dashboard**

### Test Role-Based Navigation
- **Student/User** → Should go to **UserDashboard**
- **Canteen Staff** → Should go to **StaffDashboard**
- **Admin** → Should go to **AdminDashboard**

## 🐛 Debugging - If Login Still Fails

### Check Browser Console (if testing in web/emulator)
Look for error messages like:
- `❌ Profile fetch error` → RLS policy issue
- `❌ Session setup error` → Supabase connection issue
- `Invalid login credentials` → Wrong email/password

### Common Error Fixes

**Error: "RLS policy missing"**
- Run the `FIX_LOGIN_COMPLETE.sql` again
- Make sure you see success output

**Error: "Cannot insert profile"**
- The INSERT policy is missing
- Check if the policy `"Users can insert own profile"` exists
- Run the SQL fix again

**Error: "Cannot read profile"**
- The SELECT policy is missing
- Check if the policy `"Users can view own profile"` exists
- May need to wait 5-10 seconds after registration before login

**Error: "Timeout - please try again"**
- Check your internet connection
- Make sure Supabase is accessible
- Check if Supabase is down: https://status.supabase.com

## 📋 What Changed in LoginScreen.tsx

### Enhanced Error Messages
- More specific error messages for:
  - Invalid credentials
  - Network timeouts
  - Connection errors

### Better Logging
- Added detailed console logs showing:
  - When profile is being fetched
  - What role was found
  - Which dashboard the user is being navigated to
  - Profile fetch errors with details

### Improved Navigation
- Better error handling if profile fetch fails
- Falls back to UserDashboard if errors occur
- Shows helpful alerts with retry options

## ✅ Expected Login Flow

```
User enters email/password
        ↓
Client sends to Supabase Auth
        ↓
Supabase validates credentials
        ↓
If valid: Returns user object
        ↓
App fetches user's role from profiles table
        ↓
Navigate based on role:
  - admin → AdminDashboard
  - canteen staff → StaffDashboard
  - Student/User → UserDashboard
        ↓
✅ Login Complete
```

## 🔑 Key Points

1. **RLS Policies are CRITICAL**
   - Without proper INSERT policy, users can't create profiles during registration
   - Without proper SELECT policy, users can't read their role during login

2. **The profiles table MUST exist**
   - It should have: id, email, name, phone, role, is_active, created_at, updated_at
   - The `id` should be a foreign key to `auth.users(id)`

3. **Authentication vs Profile**
   - Supabase Auth handles email/password ✓
   - Your profiles table stores additional user data (role, name, phone)
   - Login needs to check BOTH

## 📞 If Issues Persist

Check these in order:
1. ✅ Run `FIX_LOGIN_COMPLETE.sql` again
2. ✅ Wait 10 seconds, then try logging in
3. ✅ Check Supabase status: https://status.supabase.com
4. ✅ Clear app cache and restart the app
5. ✅ Check that the profiles table exists in Supabase
6. ✅ Verify the SUPABASE_URL and SUPABASE_ANON_KEY are correct in `src/lib/supabase.ts`

## 📝 Files Modified

- `FIX_LOGIN_COMPLETE.sql` - New SQL file with complete RLS fix
- `src/screens/auth/LoginScreen.tsx` - Enhanced error handling and logging
