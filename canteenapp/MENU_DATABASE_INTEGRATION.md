# Menu Items Database Integration - Update Guide

## ✅ Changes Made

### 1. **Database Integration**
The user menu now fetches items directly from the Supabase `menu_items` table instead of using hardcoded data.

### 2. **How It Works**

#### Admin Side (Adding Items)
1. Admin goes to **Admin Dashboard → Add Items** tab
2. Fills in item details:
   - **Name**: Name of the food item
   - **Price**: Price in ₹
   - **Category**: Rice, Starters, South Indian, etc.
   - **Image** (optional): Upload from device or add URL
   - **Description** (optional): Item details
3. Clicks **+ Add** to save to `menu_items` table
4. Item is saved with `available: true` by default

#### User Side (Viewing Menu)
1. User opens **User Dashboard → Menu** tab
2. App automatically fetches all available items from database
3. Shows items in a 2-column grid with:
   - Category emoji (🍚 Rice, 🥘 Starters, 🍽️ Other)
   - Item name
   - Category label
   - Price
   - Add to cart button (✓)

### 3. **Database Table Structure**
```sql
menu_items {
  id: UUID (Primary Key)
  name: TEXT (required)
  price: INTEGER (required)
  category: TEXT (required)
  available: BOOLEAN (default: true)
  image: TEXT (optional - URL)
  description: TEXT (optional)
  created_at: TIMESTAMP
}
```

### 4. **Features**

✅ **Real-time Data**: Menu shows only items where `available = true`
✅ **Image Support**: Displays images if uploaded, falls back to emojis
✅ **Category Support**: Organizes items by category
✅ **Loading State**: Shows "Loading Menu..." while fetching
✅ **Empty State**: Shows friendly message if no items added yet
✅ **Responsive Grid**: 2-column layout for mobile devices

### 5. **User Flow**

```
Admin Panel
  ↓
Add Items (AddItems.tsx)
  ↓
Save to Supabase (menu_items table)
  ↓
User App Fetches (useEffect hook)
  ↓
Display in Menu Tab (Grid Layout)
  ↓
Add to Cart → Place Order
```

### 6. **What Changed in Code**

**Before**: 
```tsx
const [menuItems] = useState<MenuItem[]>([]);  // Empty array
```

**After**:
```tsx
const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
const [loadingMenu, setLoadingMenu] = useState(true);

useEffect(() => {
  const fetchMenuItems = async () => {
    const { data, error } = await supabase
      .from('menu_items')
      .select('id, name, price, category, available, image, description')
      .eq('available', true)
      .order('name', { ascending: true });
    
    if (data) setMenuItems(data);
  };
  
  fetchMenuItems();
}, []);
```

### 7. **Testing the Integration**

**To Test**:
1. Go to Admin Dashboard
2. Click **Add Items** tab
3. Add a new food item with:
   - Name: "Butter Rice"
   - Price: "150"
   - Category: "Rice"
   - Click **+ Add**
4. Go to User Dashboard
5. Click **Menu** tab
6. You should see the newly added item in the grid! ✅

### 8. **Important Notes**

⚠️ **Only Available Items Show**: Only items with `available: true` are displayed
⚠️ **Image Format**: Images should be valid URLs or uploaded to Supabase storage
⚠️ **Category Emojis**: 
   - "Rice" → 🍚
   - "Starters" → 🥘
   - Other categories → 🍽️
⚠️ **Loading**: First load may take 1-2 seconds to fetch from database

### 9. **If Menu Still Not Showing**

**Check These**:
1. ✅ Verify admin added items in Admin Dashboard → Add Items
2. ✅ Check if items have `available = true` status
3. ✅ Ensure Supabase connection is working
4. ✅ Check browser console for errors
5. ✅ Refresh the app to reload menu

### 10. **Database Query**

The app runs this query to fetch menu:
```sql
SELECT id, name, price, category, available, image, description
FROM menu_items
WHERE available = true
ORDER BY name ASC
```

---

## 🎯 Summary

The menu is now **fully integrated with the Supabase database**. Whatever admin adds in the admin panel will automatically appear in the user's menu screen!

**Status**: ✅ **COMPLETE** - Menu showing from database

