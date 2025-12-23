# User Registration & Database Setup Guide ✅

## What I Fixed

### 1. **Registration Now Saves Users to Database**
When a user registers:
- ✅ User is created in Supabase Auth
- ✅ User profile is saved to `profiles` table
- ✅ User is marked as **active** (`is_active: true`)
- ✅ User status is set to **'active'** (`status: 'active'`)
- ✅ Timestamps are recorded (`created_at`, `updated_at`)

### 2. **Enhanced Profiles Table**
Added new fields to track user status:
- `is_active` - Boolean (true/false) - quick status check
- `status` - Text field ('active', 'inactive', 'suspended') - flexible status

---

## 🚀 Setup Instructions

### Step 1: Update Your Supabase Database

**Option A: If you're starting fresh**
1. Go to Supabase Dashboard → SQL Editor
2. Run the complete schema from: `supabase-setup.sql`
3. Done! New tables will have the status fields

**Option B: If you already have data**
1. Go to Supabase Dashboard → SQL Editor
2. Copy and run: `ADD_USER_STATUS_MIGRATION.sql`
3. This safely adds the new columns without losing data

---

## ✅ Verify Registration is Working

### Check Registered Users in Database

**To view all users:**
```sql
SELECT 
  id, email, name, role, is_active, status, created_at 
FROM profiles 
ORDER BY created_at DESC;
```

**Or use the provided script:**
1. Go to Supabase Dashboard → SQL Editor
2. Run: `CHECK_REGISTERED_USERS.sql`
3. View all registered users with their details

---

## 📊 User Registration Flow

```
User Registers (RegisterScreen.tsx)
    ↓
User submits name, email, phone, role
    ↓
OTP sent via Supabase
    ↓
User verifies OTP (OtpScreen.tsx)
    ↓
Auth user created in Supabase Auth
    ↓
Profile saved to database with:
  • is_active: true
  • status: 'active'
  • all user details (name, phone, role, email)
    ↓
User can now Login
```

---

## 🔍 What Each Field Does

| Field | Type | Purpose | Default |
|-------|------|---------|---------|
| `id` | UUID | User's unique ID | - |
| `email` | TEXT | User's email | Required |
| `name` | TEXT | User's full name | - |
| `phone` | TEXT | User's phone | - |
| `role` | TEXT | Student/Staff | 'Student' |
| `is_admin` | BOOLEAN | Admin flag | false |
| **`is_active`** | **BOOLEAN** | **User is active** | **true** |
| **`status`** | **TEXT** | **User status** | **'active'** |
| `created_at` | TIMESTAMP | Registration time | NOW() |
| `updated_at` | TIMESTAMP | Last update time | NOW() |

---

## 📋 Useful Queries

### Get all active users
```sql
SELECT * FROM profiles WHERE is_active = true;
```

### Get users by role
```sql
SELECT * FROM profiles WHERE role = 'Student';
```

### Count users registered today
```sql
SELECT COUNT(*) FROM profiles 
WHERE created_at >= NOW() - INTERVAL '24 hours';
```

### Find inactive users
```sql
SELECT * FROM profiles WHERE is_active = false;
```

---

## ✨ Next Steps

1. ✅ Update your database with migration script
2. ✅ Test registration in your app
3. ✅ Check registered users appear in database
4. ✅ Verify `is_active` and `status` fields are populated
5. ✅ Users should now be able to login after registration

---

## 🆘 Troubleshooting

**Problem:** User registered but not showing in database
- **Fix:** Check if migration script was run. Run `ADD_USER_STATUS_MIGRATION.sql`

**Problem:** Registration succeeds but login fails
- **Fix:** Ensure OTP verification passed and profile was created
- Check Supabase logs for errors

**Problem:** is_active/status fields not in database
- **Fix:** Run the migration script from Step 1, Option B

---

## 📝 Files Updated

- ✅ `src/screens/auth/OtpScreen.tsx` - Now saves user as active
- ✅ `supabase-setup.sql` - Added status fields to schema
- ✅ `USER_PROFILE_SETUP.sql` - Updated profiles table definition
- ✅ `ADD_USER_STATUS_MIGRATION.sql` - Migration for existing databases
- ✅ `CHECK_REGISTERED_USERS.sql` - Query to verify registered users

