# Order Synchronization Setup Guide

## Overview
This guide shows how to set up real-time order synchronization between the user app and admin dashboard using Supabase.

## What Changed

### User Side (`UserDashboard.tsx`)
- `placeOrder()` function now:
  - Gets the current authenticated user
  - Creates an order record in the `orders` table
  - Saves order items in the `order_items` table
  - Notifies admin in real-time via Supabase subscriptions

### Admin Side (`AdminDashboard.tsx`)
- Already has code to:
  - Fetch orders from `orders` table
  - Listen for real-time updates via Supabase subscriptions
  - Update order status (Pending → Preparing → Ready → Completed)

## Setup Steps

### Step 1: Create Database Tables

Go to your Supabase dashboard:
1. Click **SQL Editor** in the left sidebar
2. Click **New Query**
3. Copy the entire content from `orders-table-setup.sql`
4. Paste into the SQL editor
5. Click **Run**

This creates:
- ✅ `orders` table (stores order metadata)
- ✅ `order_items` table (stores items for each order)
- ✅ Indexes for fast queries
- ✅ RLS policies for security

### Step 2: Verify Table Structure

Check if tables exist:
```sql
SELECT * FROM orders LIMIT 1;
SELECT * FROM order_items LIMIT 1;
```

### Step 3: Test the Flow

#### On User App:
1. Open the app
2. Go to **Menu tab**
3. Add items to cart
4. Tap **Place Order**
5. Confirm success message appears

#### On Admin App:
1. Open Admin Dashboard
2. Go to **Orders tab**
3. You should **immediately see** the new order from Step 3
4. Click the order to cycle through statuses:
   - Pending → Preparing → Ready → Completed

#### Back on User App:
- Go to **Orders tab** to see order status updates in real-time

## Database Schema

### orders table
```
id              UUID (primary key)
user_id         UUID (foreign key to auth.users)
total_price     DECIMAL(10, 2)
status          TEXT ('Pending' | 'Preparing' | 'Ready' | 'Completed')
token_number    INTEGER (auto-increment, optional display number)
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### order_items table
```
id              UUID (primary key)
order_id        UUID (foreign key to orders)
menu_item_id    UUID (foreign key to menu_items)
quantity        INTEGER
created_at      TIMESTAMP
```

## Real-Time Features

Both user and admin have real-time subscriptions:

**Admin Side:**
- Listens for new orders (`INSERT` events)
- Listens for status changes (`UPDATE` events)
- Updates UI instantly

**User Side:**
- Your order status updates automatically when admin changes it
- See live order history

## Troubleshooting

### "Failed to place order" error
1. Check that you're logged in
2. Verify `orders` and `order_items` tables exist in Supabase
3. Check browser console for detailed error message
4. Make sure user has `user_id` in auth.users

### Orders not appearing in admin
1. Check that both tables were created successfully
2. Verify RLS policies are in place (check Supabase SQL Editor logs)
3. Ensure admin is logged in with `role: 'admin'` in user metadata
4. Check real-time subscriptions in browser console

### Can't update order status
1. Verify admin user has `role: 'admin'` in raw_user_meta_data
2. Check RLS policy for UPDATE permissions

## Optional: Set Admin Role

If admin orders aren't appearing, ensure the admin user has the correct role:

```sql
-- Update admin user's metadata
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  raw_user_meta_data,
  '{role}',
  '"admin"'
)
WHERE email = 'admin@example.com';
```

Replace `admin@example.com` with your actual admin email.

## Testing Checklist

- [ ] Tables created successfully in Supabase
- [ ] User can place order from menu
- [ ] Order appears immediately in admin Orders tab
- [ ] Admin can click order to change status
- [ ] User sees status updates in Orders tab
- [ ] Token number displays in admin (optional)
- [ ] Multiple orders appear correctly in admin
