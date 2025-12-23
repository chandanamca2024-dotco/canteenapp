# Admin Food Management Setup

## Overview
The admin panel now allows you to:
- ✅ Add new food items with name, price, category, and description
- ✅ Upload food images (optional)
- ✅ Edit existing food items
- ✅ Delete food items
- ✅ Toggle item availability
- ❌ All dummy data has been removed

## What Changed

### 1. **Removed Dummy Data**
- **AdminDashboard.tsx**: Removed hardcoded menu items and orders
- **UserDashboard.tsx**: Removed hardcoded menu items and orders
- **AddItems.tsx**: Updated to support images and descriptions

### 2. **Enhanced AddItems Component**
- Image picker UI (currently showing placeholder - requires image picker library)
- Form fields: Name, Price, Stock, Category, Description, Image
- Edit functionality for existing items
- Delete functionality with confirmation

### 3. **Database Schema Updates Needed**

Your Supabase database should have a `menu_items` table with:

```sql
CREATE TABLE menu_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

And a storage bucket for images:
```
Bucket name: menu-images
Public: true
```

## How to Use the Admin Panel

### Adding a Food Item
1. Go to **Admin Dashboard** → **Add Items** tab
2. Click the **"+"** button in the top-right corner
3. Fill in the form:
   - **Item Name*** (required): e.g., "Butter Chicken"
   - **Price*** (required): e.g., "250"
   - **Category**: Select from Rice, Curry, South Indian, Starters, Bread, Beverage
   - **Stock Quantity** (optional): e.g., "50"
   - **Description** (optional): e.g., "Tender chicken in creamy sauce"
   - **Image** (optional): Tap to add food photo
4. Click **"✓ Add Item"**

### Editing a Food Item
1. Find the item in the list
2. Click **"✏️ Edit"** button
3. Update the fields
4. Click **"✓ Update Item"**

### Deleting a Food Item
1. Find the item in the list
2. Click **"🗑️ Delete"** button
3. Confirm deletion

### Toggling Availability
1. Go to **Menu** tab
2. Find the item
3. Click the toggle to make it available/unavailable

## Next Steps: Enable Image Uploads

To enable actual image uploads, you need to install an image picker:

```bash
npm install react-native-image-picker
# or
npm install expo-image-picker
```

Then update `AddItems.tsx` line 89:

```typescript
const pickImage = async () => {
  try {
    const result = await ImagePicker.launchImageLibrary({ ... });
    if (result.assets?.[0]) {
      setFormData({ ...formData, imageUri: result.assets[0].uri });
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to pick image');
  }
};
```

## Database Integration

To connect with Supabase:

1. Apply full admin schema (veg-only): in Supabase SQL editor, run the file `supabase-admin-complete-setup.sql`. This creates `menu_items`, `orders`, `order_items`, `daily_sales`, `raw_inventory`, `consumption_map`, `app_settings`, and `admin_broadcasts` plus triggers for daily tokens and stock deduction.
2. Update `AdminDashboard.tsx` to fetch items:

```typescript
useEffect(() => {
  const fetchMenuItems = async () => {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*');
    if (error) console.error(error);
    else setMenuItems(data);
  };
  fetchMenuItems();
}, []);
```

3. Update `onAddItem` callback to save to database:

```typescript
const addMenuItem = async (item: MenuItem) => {
  const { error } = await supabase
    .from('menu_items')
    .insert([{ ...item, image_url: item.image }]);
  if (error) Alert.alert('Error', error.message);
  else setMenuItems([...menuItems, item]);
};
```

## Single Admin Configuration (No in-app creation)

- Set your admin email in the app:

  - Edit `src/config/admin.ts` and set `ADMIN_EMAIL` to the only admin email.

- Create the admin user in Supabase Dashboard (Auth → Users). Set the same email and a password. If email confirmation is enabled, confirm the user.

- Enforce admin at the database level (optional but recommended):

  - In Supabase SQL editor, execute:
    ```sql
    SELECT set_config('app.admin_email', 'admin@college.edu', false);
    ```
    Replace with your admin email. This enables RLS policies to allow admin-only updates.

- Admin route protection:
  - Navigating to Admin Dashboard is guarded in `src/navigation/RootNavigator.tsx`. Only the configured admin can access.

## Daily Token Numbers

- Orders automatically receive a `token_number` that resets daily. Implement UI to display the token on the admin orders screen and user order receipt.

## Veg-only Menu

- The seeded items are all veg. Ensure you do not add non-veg categories in UI. Supported categories: Breakfast, Lunch, Snacks, Beverages.

## File Changes Summary

| File | Changes |
|------|---------|
| `src/screens/admin/AddItems.tsx` | Added image picker UI, Supabase integration template, image display |
| `src/screens/admin/AdminDashboard.tsx` | Removed dummy orders and menu items |
| `src/screens/user/UserDashboard.tsx` | Removed dummy orders and menu items |

## Testing Checklist

- [ ] Admin can add a new food item
- [ ] New item appears in the menu list
- [ ] Admin can edit an item
- [ ] Admin can delete an item
- [ ] Item availability can be toggled
- [ ] User dashboard shows added items
- [ ] Images display correctly (when enabled)

---

**Questions?** Check the component code for inline comments or Supabase documentation for schema setup.
