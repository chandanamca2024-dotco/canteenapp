# Order Items Table Schema Fix

## Problem
The app is failing with: **"null value in column 'name' of relation 'order_items' violates not-null constraint"**

This happens because the `order_items` table has a `name` column with a NOT NULL constraint, but the code is only inserting:
- order_id
- menu_item_id  
- quantity

The `name` column should NOT exist because:
- Item names are stored in the `menu_items` table
- We should join with `menu_items` to get the name when needed
- This avoids data duplication

## Root Cause
Multiple schema migration files created conflicting column definitions:
- Old migrations added a `name` column
- Later migrations tried to remove it but the constraint still exists in Supabase
- Schema cache wasn't cleared properly

## Solution
Run [FIX_ORDER_ITEMS_TABLE_FINAL.sql](FIX_ORDER_ITEMS_TABLE_FINAL.sql) in Supabase SQL Editor to:
1. Drop the `name` column entirely
2. Drop the `price` column (also unnecessary, stored in menu_items)
3. Drop the `qty` column if it exists (use `quantity` instead)
4. Ensure `quantity` column exists with proper defaults
5. Clear the schema cache

## Expected Final Schema for order_items
```sql
id UUID (primary key)
order_id UUID (foreign key -> orders.id)
menu_item_id UUID (foreign key -> menu_items.id)
quantity INTEGER (not null, default 1)
created_at TIMESTAMP
```

## How to Query Item Names After Fix
When you need item details (name, price, etc.), join with menu_items:
```sql
SELECT 
  oi.id, 
  oi.order_id, 
  oi.quantity,
  mi.name,
  mi.price,
  mi.name || ' x' || oi.quantity as display_name
FROM order_items oi
JOIN menu_items mi ON oi.menu_item_id = mi.id
```
