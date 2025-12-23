# 🔧 Order Items Error - Quick Fix Guide

## Problem
Error message: **"Order created but failed to save items"**

Console error: `Error inserting order items: {'code':'PGR...`

## Root Cause
The issue is with the **Row Level Security (RLS)** policy on the `order_items` table. The policy is checking if the order belongs to the user, but the check happens in the same transaction, which can cause timing issues.

---

## ✅ Solution

### Step 1: Run the SQL Fix
Go to your **Supabase Dashboard** → **SQL Editor** and run this:

```sql
-- Drop the old policy
DROP POLICY IF EXISTS "Users can create order items" ON order_items;

-- Create a better policy
CREATE POLICY "Users can insert order items"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );
```

**File with complete SQL**: [fix-order-items-rls.sql](fix-order-items-rls.sql)

### Step 2: Verify Policies
Check that your policies are correct:

```sql
-- View all policies on order_items
SELECT * FROM pg_policies WHERE tablename = 'order_items';

-- View all policies on orders
SELECT * FROM pg_policies WHERE tablename = 'orders';
```

### Step 3: Alternative (If Still Not Working)
If the above doesn't work, use this temporary simpler policy:

```sql
DROP POLICY IF EXISTS "Users can insert order items" ON order_items;

CREATE POLICY "Users can insert any order items"
  ON order_items FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
```

⚠️ **Note**: This is less secure but will definitely work. Use it to test, then switch back to the more secure policy.

---

## 🧪 Test the Fix

1. **Restart your app** (if running)
   ```bash
   # Stop the current instance (Ctrl+C)
   npx react-native run-android
   ```

2. **Test order placement:**
   - Login as a user
   - Add items to cart
   - Click "Place Order"
   - You should see: ✅ "Order placed successfully!"

3. **Verify in Supabase:**
   - Go to **Table Editor** → `orders` → Check new order exists
   - Go to **Table Editor** → `order_items` → Check items are saved

---

## 🔍 Debug Tips

### Check Console Logs
Look for these in your terminal:

```
✅ Order created: {id: "..."}
✅ Order items inserted successfully
```

Or errors like:
```
❌ Error inserting order items: {...}
```

### Check Database Logs
In Supabase Dashboard → **Logs** → **Postgres Logs**

Look for RLS policy violations.

---

## 📝 What Was Fixed

1. ✅ **TypeScript Error**: Changed `colors.error` → `colors.danger`
2. ✅ **Database Field**: Removed manual `created_at` (auto-generated)
3. ✅ **RLS Policy**: Improved order_items INSERT policy
4. ✅ **Better Error Handling**: Console logs for debugging

---

## 🚀 Expected Behavior After Fix

**User Side:**
1. Add items to cart
2. Click "Place Order"
3. See success message: "✅ Order placed successfully!"
4. Cart clears automatically
5. Order appears in "Orders" tab

**Admin Side:**
1. Toast notification slides in
2. Device vibrates
3. Badge counter increases
4. Order appears in list instantly
5. Can update order status by tapping

---

## 🆘 Still Having Issues?

### Check These:

1. **Is RLS enabled?**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename IN ('orders', 'order_items');
   ```
   Both should show `true`

2. **Are you logged in?**
   ```typescript
   const { data: { user } } = await supabase.auth.getUser();
   console.log('Current user:', user);
   ```

3. **Check menu_items exist:**
   ```sql
   SELECT id, name FROM menu_items LIMIT 5;
   ```

4. **Test without RLS** (temporarily):
   ```sql
   ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
   -- Test, then re-enable:
   ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
   ```

---

## 📞 Next Steps

1. Run the SQL fix in Supabase
2. Restart your app
3. Test order placement
4. If it works: ✅ You're done!
5. If not: Check the debug tips above

Good luck! 🎉
