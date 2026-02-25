# Create Canteen Staff Login

Follow these steps to create a canteen staff account:

## Step 1: Create Auth User in Supabase Dashboard

1. Open your Supabase project dashboard
2. Go to **Authentication** (left sidebar)
3. Click **Users** tab
4. Click **Add user** button (green button on top right)
5. Fill in:
   - **Email**: `staff@dinedesk.com` (or any email you want)
   - **Password**: `Staff@123` (or any password you want)
   - **Auto Confirm User**: ✓ Check this box
6. Click **Create user**

## Step 2: Set Role to Canteen Staff

1. Go to **Table Editor** (left sidebar)
2. Select **profiles** table
3. Find the row with email `staff@dinedesk.com`
4. Click on the **role** cell
5. Change it to: `canteen staff`
6. Press Enter to save

**OR** run this SQL in **SQL Editor**:

```sql
-- First, get the user ID from auth.users
DO $$
DECLARE
  user_id uuid;
BEGIN
  -- Get the user ID
  SELECT id INTO user_id FROM auth.users WHERE email = 'staff@dinedesk.com';
  
  IF user_id IS NOT NULL THEN
    -- Insert or update profile
    INSERT INTO public.profiles (id, email, name, role, is_active)
    VALUES (user_id, 'staff@dinedesk.com', 'Staff User', 'canteen staff', true)
    ON CONFLICT (id) 
    DO UPDATE SET role = 'canteen staff';
    
    RAISE NOTICE 'Profile updated successfully for user: %', user_id;
  ELSE
    RAISE EXCEPTION 'User not found with email: staff@dinedesk.com';
  END IF;
END $$;
```

## Step 3: Login in the App

1. Open the app
2. Tap **👨‍🍳 Canteen Staff Login** on the login screen
3. Enter:
   - Email: `staff@dinedesk.com`
   - Password: `Staff@123`
4. Tap **Login**

You should now be logged into the Staff Dashboard!

---

## Create Additional Staff Users

Repeat Step 1 and 2 with different emails:

```sql
-- After creating auth user in dashboard, run:
UPDATE public.profiles
SET role = 'canteen staff'
WHERE email = 'new-staff-email@example.com';
```

---

## Example Credentials (after you create them):

| Email | Password | Role |
|-------|----------|------|
| staff@dinedesk.com | Staff@123 | canteen staff |
| admin@dinedesk.com | Admin@123 | admin |
| user@dinedesk.com | User@123 | user |
