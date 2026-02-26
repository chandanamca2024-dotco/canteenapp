# User Profile System - Complete Setup ✅

## What's Included

### 1. **User Registration** 
When user registers via OTP:
- ✅ User account created in Supabase Auth
- ✅ Profile automatically saved to `profiles` table
- ✅ User marked as **active** (`is_active: true`, `status: 'active'`)
- ✅ All registration details stored (name, email, phone, role)

### 2. **User Profile Update**
Users can update their profile:
- ✅ Edit name and phone number
- ✅ View role and registration date
- ✅ Changes saved to Supabase instantly
- ✅ Auto-updates `updated_at` timestamp

---

## 🚀 One-Time Setup

### Step 1: Run the SQL Script
1. Open **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy and paste: **`COMPLETE_USER_PROFILE_SETUP.sql`**
4. Click **Run**

### Step 2: Test in Your App
1. Register a new user
2. Check Supabase → **Table Editor** → `profiles`
3. Verify user appears with all details
4. Login and go to Profile screen
5. Edit name/phone and save

---

## 📊 What the SQL Does

### Creates Profiles Table
```sql
- id (UUID) - Links to auth user
- email (TEXT) - User's email
- name (TEXT) - User's name (editable)
- phone (TEXT) - User's phone (editable)
- role (TEXT) - Student/Staff
- is_admin (BOOLEAN) - Admin flag
- is_active (BOOLEAN) - User status
- status (TEXT) - 'active', 'inactive', etc.
- avatar_url (TEXT) - Profile picture URL
- created_at (TIMESTAMP) - Registration date
- updated_at (TIMESTAMP) - Last update date
```

### Automatic Features
✅ **Auto-creates profile** when user registers  
✅ **Auto-updates timestamp** when profile changes  
✅ **Row-level security** - users can only edit their own profile  
✅ **Performance indexes** for fast queries  
✅ **Safe migration** - won't break existing data  

---

## 🔐 Security (RLS Policies)

The SQL sets up these security rules:

| Action | Who Can Do It | What They Can Do |
|--------|---------------|------------------|
| **Insert** | Authenticated users | Create their own profile |
| **View** | Authenticated users | See their own profile + all profiles |
| **Update** | Authenticated users | Update ONLY their own profile |
| **Delete** | Cascade | Auto-deletes when auth user is deleted |

---

## 📱 How It Works in App

### Registration Flow
```
User Registers (RegisterScreen.tsx)
    ↓
OTP sent to email
    ↓
User verifies OTP (OtpScreen.tsx)
    ↓
Auth user created
    ↓
Profile auto-saved to database with:
  • name, email, phone, role
  • is_active: true
  • status: 'active'
    ↓
User can now login
```

### Profile Update Flow
```
User opens Profile (ProfileScreen.tsx)
    ↓
Profile loads from database
    ↓
User clicks "Edit Profile"
    ↓
User updates name/phone
    ↓
User clicks "Save Changes"
    ↓
Profile updated in database
    ↓
updated_at timestamp auto-updated
```

---

## 🔍 Useful SQL Queries

### View all registered users
```sql
SELECT id, email, name, phone, role, is_active, created_at
FROM profiles
ORDER BY created_at DESC;
```

### Count active users
```sql
SELECT COUNT(*) FROM profiles WHERE is_active = true;
```

### Find user by email
```sql
SELECT * FROM profiles WHERE email = 'user@example.com';
```

### Recent registrations (last 7 days)
```sql
SELECT name, email, created_at
FROM profiles
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

---

## ✅ Files Updated/Created

**SQL Files:**
- ✅ `COMPLETE_USER_PROFILE_SETUP.sql` - Complete setup script
- ✅ `supabase-setup.sql` - Updated with status fields
- ✅ `USER_PROFILE_SETUP.sql` - Updated profiles table

**App Files:**
- ✅ `src/screens/auth/OtpScreen.tsx` - Saves user on registration
- ✅ `src/screens/ProfileScreen.tsx` - Loads and updates profile

---

## 🎯 Test Checklist

- [ ] Run `COMPLETE_USER_PROFILE_SETUP.sql` in Supabase
- [ ] Register a new user via app
- [ ] Check user appears in `profiles` table
- [ ] Verify `is_active = true` and `status = 'active'`
- [ ] Login with registered user
- [ ] Go to Profile screen
- [ ] Click "Edit Profile"
- [ ] Update name and phone
- [ ] Click "Save Changes"
- [ ] Verify changes saved in Supabase
- [ ] Check `updated_at` timestamp updated

---

## ✨ Result

Your app now has a **complete user profile system**:

✅ **Registration** → User data saved to Supabase  
✅ **Profile View** → Users can see their info  
✅ **Profile Edit** → Users can update name & phone  
✅ **Auto-sync** → All changes saved to database  
✅ **Secure** → Users can only edit their own profile  
✅ **Tracked** → Timestamps for all changes  

All done! 🎉
