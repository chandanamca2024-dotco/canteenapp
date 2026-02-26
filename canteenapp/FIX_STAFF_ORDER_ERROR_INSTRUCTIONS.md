# Fix: Staff Order Completion Error - Missing "total_amount" Field

## Problem
When staff members try to mark orders as "Ready" or complete them, the app shows an error:
```
Error: record 'new' has no field 'total_amount'
```

## Root Cause
The database triggers on the `orders` table incorrectly reference `total_amount` (which doesn't exist), but the actual column name is `total_price`.

Two triggers are affected:
1. **loyalty_points_trigger** - Awards loyalty points when order is completed
2. **transaction_logging_trigger** - Logs transactions when payment is completed

## Solution
We need to fix these triggers to use the correct column name `total_price` instead of `total_amount`.

## How to Apply the Fix

### Step 1: Go to Supabase Console
1. Open your Supabase dashboard
2. Select your project
3. Go to **SQL Editor** (left sidebar)

### Step 2: Run the Migration Script
1. Copy all the SQL code from the file: `FIX_TOTAL_AMOUNT_FIELD_IN_TRIGGERS.sql`
2. Paste it into the SQL Editor
3. Click the **Run** button (▶ icon) in the top right

### Step 3: Verify the Fix
You should see a success message with the list of triggers:
```
loyalty_points_trigger  | UPDATE   | orders
transaction_logging_trigger | INSERT OR UPDATE | orders
```

### Step 4: Test in the App
1. Go back to the Staff Kitchen screen
2. Try marking an order as "Ready" or "Complete"
3. The error should be gone! ✅

## Technical Details

### Before (Incorrect):
```sql
FLOOR(NEW.total_amount / 10)  -- ❌ Field doesn't exist
NEW.total_amount              -- ❌ Wrong column name
```

### After (Correct):
```sql
FLOOR(NEW.total_price / 10)   -- ✅ Correct column name
NEW.total_price               -- ✅ Uses actual column
```

## Files Changed
- `FIX_TOTAL_AMOUNT_FIELD_IN_TRIGGERS.sql` - Migration script

## Impact
- ✅ Staff can now mark orders as "Ready" without errors
- ✅ Loyalty points calculation works correctly
- ✅ Transaction logging works correctly
- ✅ No data loss or breaking changes

## Troubleshooting

**If you see "function/trigger already exists" error:**
- This is normal - the script drops and recreates the triggers safely
- Just execute the script again

**If the error persists after running the fix:**
1. Check that you copied the entire SQL script
2. Make sure it ran without errors (no red error messages)
3. Refresh the app completely
4. Try again

---
**Status**: Ready to apply ✅
