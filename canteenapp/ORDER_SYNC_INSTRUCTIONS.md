# 🔄 Order Sync Setup - Step by Step

## What This Does
Enables **real-time order synchronization**:
- ✅ User places order → Instantly appears in Admin
- ✅ Admin updates status → User sees it in real-time
- ✅ All data stored in Supabase database

---

## 📋 Prerequisites
- Supabase project already set up
- DineDesk app already has user login working
- Both user and admin apps deployed

---

## 🚀 STEP 1: Create Database Tables (5 minutes)

### Option A: Copy-Paste Method (Easiest)

1. **Open Supabase Dashboard**
   - Go to: https://app.supabase.com
   - Select your DineDesk project

2. **Open SQL Editor**
   - Left sidebar → Click **SQL Editor**
   - Click **New Query** button (top right)

3. **Copy SQL Code**
   - Open file: `SETUP_ORDERS_DATABASE.sql` in this folder
   - Select ALL content (Ctrl+A)
   - Copy (Ctrl+C)

4. **Paste & Run**
   - Paste into Supabase SQL editor (Ctrl+V)
   - Click **RUN** button (bottom right)
   - Wait for **green checkmark** ✅

5. **Verify Success**
   - You should see message: `Success. No rows returned`
   - This means all tables are created!

### Option B: Manual Check
```sql
-- Paste these one at a time to verify:

SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('orders', 'order_items');

SELECT schemaname, tablename, rowsecurity 
FROM pg_tables WHERE tablename IN ('orders', 'order_items');
```

---

## 🎯 STEP 2: Test on Your App (10 minutes)

### A. Rebuild the App
```bash
# Terminal 1: Start Metro server
npx react-native start

# Terminal 2: Run on your device/emulator
npx react-native run-android    # For Android
# OR
npx react-native run-ios        # For iOS
```

### B. Test User → Order Flow
1. **Open User App**
2. **Go to Menu Tab** (🍽️ icon)
3. **Add Items to Cart**
   - Tap items to add them
   - Click "Add to Cart"
4. **Place Order**
   - Scroll down
   - Tap "Place Order" button
   - Should see: ✅ "Order placed successfully!"

### C. Verify in Admin
1. **Open Admin App** (separate build or switch user)
2. **Go to Orders Tab**
3. **Check Results**
   - New order should appear **immediately**
   - Shows: Order #, Items, Price, Status (Pending)

### D. Test Status Update
1. **In Admin App**
   - Click on the order from Step B
   - Status cycles: Pending → Preparing → Ready → Completed
   - Each click updates the status

2. **Back to User App**
   - Go to Orders Tab
   - Order status updates automatically ✨

---

## 📊 What Gets Created

### orders table
| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Unique order ID |
| `user_id` | UUID | Who placed the order |
| `total_price` | DECIMAL | Order amount |
| `status` | TEXT | Current status |
| `token_number` | INTEGER | Display number (e.g., #001) |
| `created_at` | TIMESTAMP | When order was placed |

### order_items table
| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Unique item ID |
| `order_id` | UUID | Which order this belongs to |
| `menu_item_id` | UUID | Which menu item was ordered |
| `quantity` | INTEGER | How many ordered |

---

## 🔒 Security Features Included

✅ **Row Level Security (RLS)**
- Users can only see THEIR orders
- Admins can see ALL orders
- Users can only create orders for themselves
- Only admins can change order status

✅ **Automatic Relationships**
- Deleting order automatically deletes items
- Deleting menu item blocks deletion if it has orders

✅ **Data Validation**
- Status must be one of: Pending, Preparing, Ready, Completed
- Total price is decimal (2 decimal places)
- Token number auto-increments

---

## ✅ Testing Checklist

After setup, verify:

- [ ] Tables created in Supabase (see step 1)
- [ ] User app places order without errors
- [ ] Order appears in admin Orders tab
- [ ] Order shows correct items and total price
- [ ] Admin can click to change status
- [ ] Status changes cycle correctly
- [ ] User sees status updates (may need to refresh Orders tab)

---

## 🐛 Troubleshooting

### Error: "Failed to place order"
**Solution:**
1. Check internet connection
2. Verify you're logged in
3. Check Supabase Status: https://status.supabase.com
4. Rebuild app: `npx react-native run-android`

### Error: "Table does not exist"
**Solution:**
1. Run SQL setup again in Supabase SQL Editor
2. Check for error messages in red
3. Verify all tables exist (see verification query above)

### Orders not appearing in admin
**Solution:**
1. Refresh admin app
2. Check that both user and admin are using same Supabase project
3. Make sure admin user has `role: 'admin'` in metadata
4. Check browser console for errors

### Status not updating
**Solution:**
1. Make sure you're clicking on an order (background changes)
2. Check that admin is logged in correctly
3. Try logging out and back in

---

## 🆘 Need Help?

Check these files:
- **ORDER_SYNC_SETUP.md** - Detailed guide with troubleshooting
- **SETUP_ORDERS_DATABASE.sql** - SQL script (commented)
- **ORDER_SYNC_QUICK_START.md** - Quick reference

---

## 🎉 You're All Set!

Your order system is now live and synced!

**What works now:**
- 📱 Users place orders from app
- 🏪 Admin sees them immediately
- 📊 Real-time status updates
- 💾 All data persisted in database
