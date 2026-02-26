# Admin Data Setup Guide

## 🚀 Quick Start - 3 Steps to Set Up Admin

### Step 1: Create Database Tables in Supabase

Go to your **Supabase Dashboard** → **SQL Editor** → Create a new query and paste this:

```sql
-- Create profiles table (if not exists)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'User',
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create admin_logins table for tracking
CREATE TABLE IF NOT EXISTS admin_logins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  device TEXT,
  app_version TEXT,
  success BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_menu_items_updated_at ON menu_items;
CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logins ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Allow authenticated users to read profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow insert for authenticated users"
  ON profiles FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow users to update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create policies for menu_items
CREATE POLICY "Allow anyone to read menu items"
  ON menu_items FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to insert menu items"
  ON menu_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update menu items"
  ON menu_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete menu items"
  ON menu_items FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for admin_logins
CREATE POLICY "Allow authenticated users to log admin logins"
  ON admin_logins FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

### Step 2: Create Admin Storage Bucket

In **Supabase Dashboard**:
1. Go to **Storage**
2. Create new bucket: `menu-images`
3. Make it **Public**
4. Add policy for public uploads (optional for testing)

### Step 3: Create Admin User

#### Option A: Using the Seed Script (Recommended)

**On Windows PowerShell:**

```powershell
# Set environment variables
$env:SUPABASE_URL="https://drhkxyhffyndzvsgdufd.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
$env:ADMIN_EMAIL="admin@dinedesk.com"
$env:ADMIN_PASSWORD="StrongAdminPassword123!"

# Run the seed script
node scripts/seed-admin.js
```

> **Where to find Service Role Key?**
> Supabase Dashboard → Settings → API → Service Role Key (the long one, not the anon key)

#### Option B: Manual Admin Creation in Supabase

1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Click **"Add User"**
3. Enter email: `admin@dinedesk.com`
4. Enter password: `StrongAdminPassword123!`
5. Confirm email
6. Go to **SQL Editor** and run:

```sql
-- Make the user an admin
UPDATE profiles 
SET role = 'Admin', is_admin = true 
WHERE email = 'admin@dinedesk.com';
```

---

## 📱 Using the App with Admin Data

### 1. Login as Admin
- Email: `admin@dinedesk.com`
- Password: `StrongAdminPassword123!`

### 2. Add Menu Items
1. Go to **Admin Dashboard** → **Add Items** tab
2. Click the **"+"** button
3. Fill in the form:
   - **Item Name** (required): e.g., "Butter Chicken"
   - **Price** (required): e.g., "250"
   - **Category**: Choose from the list
   - **Description** (optional): "Tender chicken in butter sauce"
   - **Image** (optional): Tap to upload
4. Click **"✓ Add Item"**

### 3. Menu Items Auto-Save to Database
The app now automatically:
- ✅ Saves items to `menu_items` table
- ✅ Stores images in `menu-images` bucket
- ✅ Updates item timestamps
- ✅ Tracks admin actions in `admin_logins` table

---

## 🔧 Using the Admin Data Helper Functions

The new `adminDataHelper.ts` file provides these functions:

```typescript
import {
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getAllMenuItems,
  getMenuItemsByCategory,
  toggleMenuItemAvailability,
  uploadMenuItemImage,
  seedSampleMenuItems,
  isUserAdmin,
  getAdminProfile,
} from '../../lib/adminDataHelper';

// Add a menu item
const newItem = await addMenuItem({
  name: 'Paneer Tikka',
  price: 180,
  category: 'Starters',
  description: 'Marinated paneer grilled to perfection',
  available: true,
});

// Get all items
const items = await getAllMenuItems();

// Update an item
await updateMenuItem('item-id', { price: 200 });

// Delete an item
await deleteMenuItem('item-id');

// Get items by category
const curries = await getMenuItemsByCategory('Curry');

// Toggle availability
await toggleMenuItemAvailability('item-id', false);

// Seed sample data (for testing)
await seedSampleMenuItems();
```

---

## 📊 Database Schema

### `profiles` Table
Stores user profile information including admin status.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key (references auth.users) |
| `email` | TEXT | Unique email |
| `role` | TEXT | 'Admin' or 'User' |
| `is_admin` | BOOLEAN | true for admins |
| `created_at` | TIMESTAMP | Auto-set |
| `updated_at` | TIMESTAMP | Auto-updated |

### `menu_items` Table
Stores all menu items with prices, categories, descriptions, and images.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `name` | TEXT | Item name (required) |
| `price` | INTEGER | Price in paisa/cents |
| `category` | TEXT | Category (required) |
| `description` | TEXT | Optional description |
| `image_url` | TEXT | URL to stored image |
| `available` | BOOLEAN | Item availability |
| `created_at` | TIMESTAMP | Auto-set |
| `updated_at` | TIMESTAMP | Auto-updated |

### `admin_logins` Table
Tracks admin login activity for security.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `admin_user` | UUID | References auth.users |
| `email` | TEXT | Admin email |
| `device` | TEXT | Device type |
| `app_version` | TEXT | App version |
| `success` | BOOLEAN | Login success status |
| `created_at` | TIMESTAMP | Auto-set |

---

## 🔐 Security Features

✅ **Row Level Security (RLS)** enabled on all tables
✅ **Admin verification** on login
✅ **Email confirmation** required for admin accounts
✅ **Admin action logging** in `admin_logins` table
✅ **Public storage** for menu images (no authentication needed)

---

## ✅ Verification Checklist

After setup, verify everything is working:

- [ ] Admin user created in Supabase
- [ ] Can login with admin credentials
- [ ] Can add menu items
- [ ] Menu items appear in database
- [ ] Menu items visible to regular users
- [ ] Can edit/delete menu items
- [ ] Images upload successfully (if added)
- [ ] Admin login is logged in database

---

## 🆘 Troubleshooting

### "Login failed" error
- Check email and password are correct
- Verify user exists in Supabase → Authentication
- Confirm email is verified
- Check user has `is_admin = true` in profiles table

### "Not authorized" error
- User exists but `is_admin` is not set to true
- Run this in SQL Editor:
```sql
UPDATE profiles SET is_admin = true WHERE email = 'admin@dinedesk.com';
```

### Menu items not saving
- Check profiles table RLS policies are correct
- Verify user is authenticated
- Check browser console for error messages
- Ensure `menu_items` table exists

### Image upload fails
- Check `menu-images` storage bucket exists and is public
- Verify image file is valid (jpg, png)
- Check bucket policies allow uploads

---

## 📝 Next Steps

1. ✅ Run the SQL setup script
2. ✅ Create admin user
3. ✅ Test login with admin credentials
4. ✅ Add some menu items through the app
5. ✅ Verify items appear in Supabase database
6. ✅ Test regular user can see menu items

**Your admin panel is now fully connected to the database!** 🎉
