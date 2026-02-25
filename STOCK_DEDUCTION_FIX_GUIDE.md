# 🔧 STOCK DEDUCTION FIX - Complete Guide

## ❌ What Was Wrong

The database trigger function was **using the wrong column name**:

```sql
-- OLD (WRONG) - Uses 'quantity' which doesn't exist
UPDATE menu_items
SET stock_quantity = stock_quantity - NEW.quantity  ❌
WHERE id = NEW.menu_item_id;
```

But the actual column in `order_items` table is **`qty`** not `quantity`:

```tsx
// In PaymentScreen.tsx - we insert using 'qty'
const orderItems = items.map((i) => ({ 
  qty: i.quantity  ✅ This is the correct column
}));
```

**Result:** When you place an order, `NEW.quantity` was `undefined`, so stock was NOT being deducted!

---

## ✅ The Fix

Run this SQL in your Supabase SQL Editor:

**File: [FIX_STOCK_DEDUCTION_TRIGGER.sql](FIX_STOCK_DEDUCTION_TRIGGER.sql)**

### What it does:
1. ✅ Drops the old broken trigger
2. ✅ Creates a new function using the **correct column name** `NEW.qty`
3. ✅ Adds safety with `GREATEST()` to prevent negative stock
4. ✅ Re-creates the trigger

### The corrected function:
```sql
CREATE OR REPLACE FUNCTION update_stock_on_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Uses NEW.qty (correct column name)
  UPDATE menu_items
  SET stock_quantity = GREATEST(COALESCE(stock_quantity, 0) - NEW.qty, 0)
  WHERE id = NEW.menu_item_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 🚀 How to Apply the Fix

### Step 1: Open Supabase Dashboard
- Go to your Supabase project
- Click **SQL Editor**

### Step 2: Run the SQL
- Copy all content from [FIX_STOCK_DEDUCTION_TRIGGER.sql](FIX_STOCK_DEDUCTION_TRIGGER.sql)
- Paste into the SQL Editor
- Click **Run**

### Step 3: Verify
- Check the verification query at the bottom of the SQL file
- You should see the trigger is now active
- Stock values should be visible in menu_items

---

## 🧪 Testing After Fix

### Test 1: Place an Order
1. Open the app
2. Go to Menu tab
3. Add items to cart
4. Place order
5. **Expected:** Stock should decrease in database

### Test 2: Check Stock in Supabase
```sql
-- Run this query to see current stock
SELECT id, name, stock_quantity FROM menu_items ORDER BY name;
```

### Test 3: Verify Order Items
```sql
-- See what was ordered
SELECT oi.*, mi.name, mi.stock_quantity 
FROM order_items oi
JOIN menu_items mi ON oi.menu_item_id = mi.id
ORDER BY oi.created_at DESC
LIMIT 5;
```

---

## 📊 Expected Behavior

**Before placing order:**
- Dosa: `stock_quantity = 25`

**After ordering 1 Dosa:**
- Dosa: `stock_quantity = 24` ✅

**After ordering 3 more Dosa:**
- Dosa: `stock_quantity = 21` ✅

---

## ⚠️ Important Notes

1. **Run this fix immediately** - Your stock deduction is currently broken
2. **Past orders won't retroactively deduct** - Only NEW orders after the fix will deduct stock
3. **If you need to fix past orders**, you can manually adjust stock using the Staff Inventory page
4. **The trigger runs automatically** - No code changes needed in your app

---

## 🔍 Column Name Reference

| Table | Old Wrong Name | New Correct Name |
|-------|---|---|
| `order_items` | `quantity` | `qty` ✅ |
| Trigger reads | `NEW.quantity` ❌ | `NEW.qty` ✅ |

This mismatch was causing silent failures!

---

## 💡 Future Prevention

To avoid this in the future:
- Always use consistent column naming (`qty` or `quantity`, not both)
- Test triggers with sample data after creation
- Check PostgreSQL logs for any function errors
