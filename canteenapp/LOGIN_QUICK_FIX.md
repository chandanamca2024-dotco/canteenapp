# 🚀 LOGIN FIX - QUICK ACTION PLAN

## ⏱️ Time Required: 5-10 minutes

## 🎯 What's Wrong?
Your login isn't working because the Row Level Security (RLS) policies on the `profiles` table are missing or misconfigured. This prevents:
1. Users from creating profiles during signup
2. Users from reading their profile during login
3. Proper role-based navigation (admin, staff, student)

## 📝 Step-by-Step Fix

### STEP 1: Open Supabase Console
Go to: https://app.supabase.com

### STEP 2: Open SQL Editor
1. Click "SQL Editor" in the left sidebar
2. Click "New Query"

### STEP 3: Run the Fix
1. Open the file: `FIX_LOGIN_COMPLETE.sql` in VS Code
2. Copy ALL the content
3. Paste it into the Supabase SQL Editor
4. Click "Run" button (or press Ctrl+Enter)
5. Wait for success message

You should see output showing policies are created successfully.

### STEP 4: Verify the Fix
1. In Supabase SQL Editor click "New Query"
2. Copy and paste this:
```sql
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
```
3. Click "Run"
4. You should see 6-8 policies listed

### STEP 5: Test Login in Your App
1. Restart your app (close and reopen)
2. Tap "Sign up"
3. Create a test account:
   - Name: Test User  
   - Email: test123@example.com
   - Phone: 1234567890
   - Password: Test1234
   - Role: Student
4. After signup, try logging in with the email and password
5. You should see: "✅ Welcome - Logged in successfully!"
6. You should go to the User Dashboard

## ✅ Success Indicators

After the fix, you should be able to:
- ✅ Register a new account
- ✅ See "Registration Successful" message
- ✅ Login with the new credentials
- ✅ See "Welcome" alert after login
- ✅ Be navigated to the appropriate dashboard

## 🐛 If It Still Doesn't Work

### Check 1: Did the SQL run successfully?
- Look for a green checkmark and success message
- If there's a red error, check the error message
- Run the SQL again

### Check 2: Verify the policies exist
In Supabase SQL Editor, run:
```sql
SELECT COUNT(*) as policy_count FROM pg_policies WHERE tablename = 'profiles';
```
- Expected result: Should be at least 6

### Check 3: Check app logs
When you try to login, watch for console messages:
- Look for: "Attempting login for:" followed by your email
- Look for: "✅ Login successful for:" if successful
- Look for error messages starting with "❌"

### Check 4: Clear app cache
Sometimes the app caches old settings:
- Close the app completely
- Delete app data/cache from your device settings
- Reopen the app and try again

### Check 5: Verify your Supabase credentials
In VS Code, open: `src/lib/supabase.ts`
- Check that SUPABASE_URL and SUPABASE_ANON_KEY are not empty
- Verify they match your actual Supabase project keys

## 📊 What Gets Fixed

| Issue | Fix | Impact |
|-------|-----|--------|
| Cannot insert profile during signup | Added INSERT policy | Users can register |
| Cannot read profile during login | Added SELECT policy | Users can login and see dashboard |
| Role-based navigation not working | Added profile fetch with proper RLS | Correct dashboard shown |
| Admin/Staff cannot see profiles | Added policies for admin/staff roles | Role-based access works |

## 📚 Files Created for You

1. **FIX_LOGIN_COMPLETE.sql** - Complete RLS fix (run this in Supabase)
2. **VERIFY_DATABASE_SETUP.sql** - Verification queries to test the database
3. **LOGIN_FIX_GUIDE.md** - Detailed guide with troubleshooting

## 🆘 Need More Help?

### Check These Files for More Info:
- `LOGIN_FIX_GUIDE.md` - Full troubleshooting guide
- `VERIFY_DATABASE_SETUP.sql` - Database verification queries
- `src/screens/auth/LoginScreen.tsx` - Enhanced with better error messages

### Check Supabase Status:
- https://status.supabase.com - Is Supabase down?

## 🎓 Understanding the Fix

**The Problem:**
- RLS (Row Level Security) is like a firewall for your database
- Without proper RLS policies, users can't insert/read data
- Login needs to: (1) authenticate user (2) read their profile to get role

**The Solution:**
- Added INSERT policy so users can create profiles during signup
- Added SELECT policies so users can read their own profile
- Added admin/staff policies for role-based access

**Why It Works:**
- When user registers → profile is created (INSERT policy)
- When user logs in → profile is read to determine role (SELECT policy)
- Navigation happens based on role (admin/staff/student)
