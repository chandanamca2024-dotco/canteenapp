# 🚨 MENU NOT SHOWING - SOLUTION

## Problem
Menu items are not showing in the user app, even though you added items in the admin panel.

## Root Cause
The `menu_items` table doesn't exist in your Supabase database yet. You need to create it.

---

## ✅ SOLUTION - Step by Step

### Step 1: Go to Supabase Dashboard
1. Open your browser and go to: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in with your account
3. Select your project: **drhkxyhffyndzvsgdufd**

### Step 2: Open SQL Editor
1. In the left sidebar, click **SQL Editor**
2. Click **+ New query** button (top right)

### Step 3: Copy and Paste SQL
1. Open the file `create-menu-items-table.sql` in this project
2. Copy ALL the SQL code from that file
3. Paste it into the Supabase SQL Editor

### Step 4: Run the SQL
1. Click the **▶ RUN** button (or press `Ctrl+Enter`)
2. Wait for it to complete
3. You should see: **Query successful** ✅

### Step 5: Verify Table Created
1. Go to **Database** in the left sidebar
2. Expand **Tables**
3. You should see `menu_items` table with columns:
   - id
   - name
   - price
   - category
   - description
   - image
   - available
   - created_at
   - updated_at

---

## 📱 Now Test It

### In Admin App:
1. Open the Admin App
2. Go to **Add Items** tab
3. Add a new food item:
   - **Name**: "Chicken Biryani"
   - **Price**: "250"
   - **Category**: "Rice"
   - Click **+ Add Item**

### In User App:
1. Open the User App
2. Go to **Menu** tab
3. You should NOW see the item you added! 🎉

---

## 🔍 If Menu Still Not Showing

**Check Your Browser Console:**
1. After running the SQL, look at the bottom of your screen in the app
2. You should see logs like:
   ```
   🔄 Fetching menu items from database...
   📊 Query result: { data: [...], error: null }
   ✅ Found 6 items in database
   ```

**If you see errors:**
- Check that Supabase URL and Key are correct in `src/lib/supabase.ts`
- Verify the table was created in Supabase Dashboard
- Check that you're authenticated in the app

---

## 💡 Quick Reference

| Step | Action |
|------|--------|
| 1 | Go to Supabase Dashboard |
| 2 | Click SQL Editor |
| 3 | Create new query |
| 4 | Copy code from `create-menu-items-table.sql` |
| 5 | Run query |
| 6 | Add items in Admin App |
| 7 | See items in User App Menu tab |

---

## 📊 Database Structure

After setup, your menu_items table will look like:

```
menu_items
├── id (UUID) - Unique identifier
├── name (Text) - Item name (e.g., "Butter Rice")
├── price (Integer) - Price in rupees
├── category (Text) - Category (e.g., "Rice", "Starters")
├── description (Text) - Item description
├── image (Text) - Image URL
├── available (Boolean) - Is item available? (default: true)
├── created_at (Timestamp) - When item was added
└── updated_at (Timestamp) - When item was last updated
```

---

## ✨ Sample Data Included

The SQL script includes 6 sample items:
- 🍚 Butter Rice - ₹150
- 🍚 Biryani - ₹200
- 🥘 Samosa - ₹30
- 🥘 Pakora - ₹40
- 🍽️ Idli - ₹60
- 🍽️ Dosa - ₹80

These will appear in your User App's Menu tab immediately after setup!

---

## 🎯 Final Result

Once set up:
- ✅ Admin can add items via Admin Panel
- ✅ Items save to `menu_items` table in Supabase
- ✅ User sees items in Menu tab
- ✅ Items show in real-time as admin adds more

**Status**: Ready to set up! Follow the steps above.
