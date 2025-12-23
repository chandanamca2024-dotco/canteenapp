# 🔐 User Profile Management with Magic Link OTP

## Problem Solved
Previously, when users signed up with Magic Link OTP, their information (name, phone, role) was **not stored** in the database. This meant:
- ❌ User data was lost after registration
- ❌ No way to retrieve or modify user information
- ❌ Admin couldn't see user details

## ✅ Solution Implemented

### **1. Database Auto-Profile Creation**

Created a **PostgreSQL trigger** that automatically creates a user profile whenever someone signs up.

**File**: [USER_PROFILE_SETUP.sql](USER_PROFILE_SETUP.sql)

**How it works:**
```
User signs up → Auth user created → Trigger fires → Profile created automatically
```

### **2. Manual Profile Creation on OTP Verification**

Updated the OTP verification flow to manually save user data to the `profiles` table.

**Files Modified:**
- [OtpScreen.tsx](src/screens/auth/OtpScreen.tsx) - Saves profile after OTP verification
- [RegisterScreen.tsx](src/screens/auth/RegisterScreen.tsx) - Passes user data to OTP screen

**Flow:**
```
Register → Enter details → Send OTP → Verify OTP → Save profile → Login
```

### **3. Profile Management Screen**

Created a dedicated screen where users can view and edit their profile.

**File**: [ProfileScreen.tsx](src/screens/ProfileScreen.tsx)

**Features:**
- ✅ View profile information
- ✅ Edit name and phone
- ✅ See role and join date
- ✅ Logout functionality

---

## 🚀 Setup Instructions

### **Step 1: Run the SQL Setup**

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run the SQL from [USER_PROFILE_SETUP.sql](USER_PROFILE_SETUP.sql)

This will:
- Create/update the `profiles` table
- Create a trigger function `handle_new_user()`
- Set up RLS (Row Level Security) policies
- Create helper functions

### **Step 2: Test the Flow**

#### **New User Registration:**
1. Open your app
2. Go to Register screen
3. Fill in:
   - Name: "John Doe"
   - Email: "john@example.com"
   - Phone: "1234567890"
   - Role: "Student"
4. Tap "Send OTP"
5. Enter OTP from email
6. Verify

**What happens:**
- ✅ Auth user created in `auth.users`
- ✅ Profile created in `profiles` table (via trigger)
- ✅ Manual upsert happens in OTP screen (backup)
- ✅ User data is saved!

#### **Verify in Database:**
```sql
-- Check if profile was created
SELECT * FROM profiles WHERE email = 'john@example.com';
```

You should see:
```
id          | email              | name      | phone      | role    | is_admin
------------|-------------------|-----------|------------|---------|----------
<user_id>   | john@example.com  | John Doe  | 1234567890 | Student | false
```

### **Step 3: Add Profile Screen to Navigation**

You need to add the ProfileScreen to your navigation. Here's an example:

**In your main navigation file:**
```typescript
import ProfileScreen from './src/screens/ProfileScreen';

// Add to your stack navigator
<Stack.Screen name="Profile" component={ProfileScreen} />
```

**Access from UserDashboard:**
```typescript
// In side drawer or settings
navigation.navigate('Profile');
```

---

## 📋 Database Schema

### **Profiles Table**
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'Student',
  is_admin BOOLEAN DEFAULT false,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Trigger Function**
```sql
CREATE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'Student')
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 🔄 How the System Works

### **Registration Flow:**

```
1. User fills registration form
   ↓
2. App sends OTP to email (Supabase Auth)
   ↓
3. User enters OTP
   ↓
4. OTP verified → Auth user created
   ↓
5. Database trigger fires → Profile created automatically
   ↓
6. App also does manual upsert (backup safety)
   ↓
7. User data is now in 'profiles' table
```

### **Login Flow:**

```
1. User enters email
   ↓
2. App sends OTP to email
   ↓
3. User enters OTP
   ↓
4. OTP verified → User logged in
   ↓
5. App checks profile table for is_admin
   ↓
6. Navigate to UserDashboard or AdminDashboard
```

### **Profile Update Flow:**

```
1. User navigates to Profile screen
   ↓
2. App loads profile from 'profiles' table
   ↓
3. User taps "Edit Profile"
   ↓
4. User modifies name/phone
   ↓
5. User taps "Save"
   ↓
6. App updates 'profiles' table
   ↓
7. Success! Profile updated
```

---

## 🛡️ Security (RLS Policies)

### **What Users Can Do:**
- ✅ View their own profile
- ✅ Update their own profile
- ✅ Insert their own profile (first time)
- ❌ Cannot view other users' profiles
- ❌ Cannot modify other users' data

### **What Admins Can Do:**
- ✅ View all profiles
- ✅ View user list
- ❌ Cannot directly modify other users' profiles (security)

---

## 🧪 Testing Checklist

### **1. New User Registration**
- [ ] Register with name, email, phone, role
- [ ] Verify OTP
- [ ] Check database: Profile exists
- [ ] Login again: Data persists

### **2. Profile Management**
- [ ] Navigate to Profile screen
- [ ] See correct user info
- [ ] Edit name and phone
- [ ] Save changes
- [ ] Reload: Changes persist

### **3. Login Flow**
- [ ] Login with existing account
- [ ] OTP verification works
- [ ] Navigate to correct dashboard
- [ ] Profile data loads correctly

### **4. Edge Cases**
- [ ] Try registering with same email twice (should fail)
- [ ] Try updating profile without login (should redirect)
- [ ] Try invalid OTP (should show error)

---

## 🐛 Troubleshooting

### **Profile Not Created After Registration**

**Check:**
1. Is the SQL trigger installed?
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```

2. Check for errors in Supabase logs:
   - Go to **Dashboard** → **Logs** → **Postgres Logs**

3. Manually create profile:
   ```sql
   INSERT INTO profiles (id, email, name, phone, role)
   VALUES (
     '<user_id>',
     'user@example.com',
     'User Name',
     '1234567890',
     'Student'
   );
   ```

### **Profile Update Fails**

**Check RLS policies:**
```sql
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

**Test without RLS (temporarily):**
```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
-- Test update
-- Then re-enable:
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

### **Can't Load Profile**

**Debug query:**
```typescript
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user?.id);

const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user?.id)
  .single();

console.log('Profile data:', data);
console.log('Profile error:', error);
```

---

## 📊 Alternative Approaches

### **Option 1: Store in User Metadata (Current)**
```typescript
// During OTP send
await supabase.auth.signInWithOtp({
  email,
  options: {
    data: {  // This goes to user_metadata
      name,
      phone,
      role,
    }
  }
});

// Access later
const { data: { user } } = await supabase.auth.getUser();
console.log(user.user_metadata.name);
```

**Pros:**
- ✅ Automatic storage
- ✅ No extra table needed

**Cons:**
- ❌ Can't query users by name/role
- ❌ Can't do complex filtering
- ❌ Limited to user session

### **Option 2: Separate Profiles Table (Recommended - Implemented)**
```typescript
// Store in profiles table
await supabase
  .from('profiles')
  .insert({ id, email, name, phone, role });
```

**Pros:**
- ✅ Can query and filter
- ✅ Can add more fields easily
- ✅ Better for admin management
- ✅ Persistent across sessions

**Cons:**
- ❌ Requires trigger or manual insert
- ❌ Extra table to maintain

### **Option 3: Hybrid Approach (Best)**
```
Store basic info in user_metadata
+ 
Store extended info in profiles table
```

This is what we've implemented! ✅

---

## 🎯 Summary

You now have a complete user profile management system with:

1. **Auto-Profile Creation** - Database trigger creates profiles automatically
2. **Manual Backup** - OTP screen creates profile if trigger fails
3. **Profile Management** - Users can view and edit their information
4. **Security** - RLS policies protect user data
5. **Persistent Storage** - Data survives sessions and app restarts

**Next Steps:**
1. Run the SQL setup
2. Test registration flow
3. Add Profile screen to navigation
4. Test profile editing

🎉 **Your user data is now properly stored and manageable!**
