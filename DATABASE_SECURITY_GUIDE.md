# 🔒 Database Security Setup Guide

## ⚠️ CRITICAL SECURITY ISSUE

Your Supabase database currently has **Row Level Security (RLS) disabled**, which means:
- ❌ Anyone with your API URL can read/write data
- ❌ All tables are publicly accessible
- ❌ No authentication checks are enforced

## ✅ SOLUTION: Enable RLS

Follow these steps to secure your database:

---

## 📋 Step 1: Run the Security SQL Script

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Paste the SQL Script**
   - Open the file: `ENABLE_RLS_SECURITY.sql`
   - Copy ALL the contents
   - Paste into the SQL Editor

4. **Execute the Script**
   - Click "Run" button (or press Ctrl/Cmd + Enter)
   - Wait for all commands to complete
   - You should see "Success" messages

---

## 📋 Step 2: Verify RLS is Enabled

After running the script, check the verification queries at the bottom:

### Check RLS Status
```sql
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'business_settings', 'menu_items')
ORDER BY tablename;
```

**Expected Result:** All tables should show `rls_enabled = true`

### Check Policies
```sql
SELECT 
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Expected Result:** You should see multiple policies for each table

---

## 📋 Step 3: Set Your Admin User

Make sure your admin account has the `is_admin` flag set:

```sql
-- Replace with your actual admin email
UPDATE profiles 
SET is_admin = true 
WHERE email = 'your-admin@email.com';

-- Verify it worked
SELECT email, is_admin FROM profiles;
```

---

## 📋 Step 4: Test the App

1. **Restart your React Native app**
   ```bash
   # Stop the current instance (Ctrl+C)
   # Then restart
   npx react-native run-android
   ```

2. **Test User Login**
   - Regular users should be able to:
     ✅ View menu items
     ✅ View business settings
     ✅ Place orders
     ❌ NOT edit menu items
     ❌ NOT edit business settings

3. **Test Admin Login**
   - Admin users should be able to:
     ✅ Do everything users can do
     ✅ Edit menu items
     ✅ Edit business settings
     ✅ View admin dashboard

---

## 🔍 What Each Policy Does

### Profiles Table
- **Select**: Users can only see their own profile
- **Insert**: Users can create their profile during signup
- **Update**: Users can only update their own profile

### Business Settings Table
- **Select**: Everyone (authenticated) can view settings
- **Update/Insert**: Only admins can modify settings

### Menu Items Table
- **Select**: Everyone (authenticated) can view menu
- **Insert/Update/Delete**: Only admins can manage menu items

---

## 🚨 Common Issues and Solutions

### Issue: "Permission denied" or "Row level security prevents..."
**Solution:** Make sure you're logged in with an authenticated user

### Issue: Admin can't update settings
**Solution:** Verify admin flag is set:
```sql
SELECT email, is_admin FROM profiles WHERE email = 'your-admin@email.com';
```

### Issue: Nobody can access data
**Solution:** Check if policies were created correctly:
```sql
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

---

## ✅ Security Checklist

- [ ] RLS enabled on all tables
- [ ] Policies created for all tables
- [ ] Admin user has `is_admin = true`
- [ ] App tested with regular user account
- [ ] App tested with admin account
- [ ] No "Data is publicly accessible" warning in Supabase

---

## 📞 Need Help?

If you encounter issues:
1. Check the Supabase logs: Dashboard → Database → Logs
2. Verify your policies: Dashboard → Authentication → Policies
3. Test queries manually in SQL Editor

---

## 🎯 Next Steps After Securing

Once RLS is enabled and working:
1. Consider adding rate limiting
2. Set up API key restrictions
3. Enable 2FA for admin accounts
4. Regular security audits
5. Monitor access logs

**🔒 Your database will now be secure and protected!**
