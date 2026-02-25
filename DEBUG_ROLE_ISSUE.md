# Debug Role Issue - Step by Step

## Step 1: Check Database Role Value

1. Go to Supabase Dashboard → SQL Editor
2. Run this query to see your user's actual role:

```sql
SELECT 
  id,
  email,
  full_name,
  role,
  is_active
FROM profiles
WHERE email = 'your-email@example.com';  -- Replace with your email
```

**Expected Result:**
- Role should be: `'Staff'`, `'College Staff'`, `'college staff'`, or `'canteen staff'`
- If it shows `'Student'`, that's the problem!

## Step 2: Check Console Logs

1. Open your Metro bundler terminal (where `npm start` or `expo start` is running)
2. Login to the app as college staff user
3. Look for these console logs:

```
UserDashboard - Raw profile data from DB: { full_name: "...", role: "..." }
UserDashboard - Fetched role from database: "..."
StudentHomeTab received userRole: "..."
Role check - userRole: "..." | isCollegeStaff: true/false
```

**What to check:**
- Does `Raw profile data from DB` show the correct role?
- Is `isCollegeStaff` showing `true` or `false`?

## Step 3: Fix Based on Results

### If database shows role = 'Student':
You need to update the database:

```sql
UPDATE profiles 
SET role = 'Staff'
WHERE email = 'your-email@example.com';
```

### If database shows correct role but app still shows "Student":
- Check if the console shows the correct role
- Verify `isCollegeStaff` is returning true
- Clear app cache and reload

### Common Role Values:
- ✅ `'Staff'` - Will work
- ✅ `'College Staff'` - Will work
- ✅ `'college staff'` - Will work
- ✅ `'canteen staff'` - Will work
- ❌ `'Student'` - Wrong for staff users

## Step 4: Clear Cache and Reload

After fixing the database:
1. Close the app completely
2. Clear Metro bundler cache:
   ```bash
   npm start -- --reset-cache
   ```
3. Restart the app and login again

## Quick Test:

Go to Profile page in the app - does it show:
- Badge: "College Staff" or "Student"?
- If badge shows "College Staff" but homepage shows "Student", it's a prop passing issue
- If badge shows "Student", the database role is wrong
