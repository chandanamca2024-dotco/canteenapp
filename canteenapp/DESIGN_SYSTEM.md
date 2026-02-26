# 🍽️ DineDesk - Complete Design System & Architecture

## 📱 App Structure Overview

### **Navigation Flow**
```
┌─────────────────────────────────────────────────┐
│                    APP START                     │
│  (Splash Screen / Auth State Checker)            │
└────────────────────┬────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
    ┌──────────────┐    ┌──────────────────┐
    │  LOGIN FLOW  │    │  NOT LOGGED IN    │
    │              │    │                   │
    │ - OTP Auth   │    │ - Register        │
    │ - Google OAuth│    │ - Login           │
    └──────┬───────┘    └──────┬────────────┘
           │                   │
           └───────────┬───────┘
                       ▼
          ┌────────────────────────┐
          │   ROLE DETECTION       │
          │  (user_metadata.role)  │
          └────────┬────────┬──────┘
                   │        │
        ┌──────────┘        └──────────┐
        ▼                              ▼
    ┌─────────────┐          ┌──────────────────┐
    │   USER      │          │     ADMIN        │
    │  DASHBOARD  │          │   DASHBOARD      │
    └─────────────┘          └──────────────────┘
```

---

## 👤 USER DASHBOARD

### **Bottom Navigation Tabs (5 Tabs)**

#### 🏠 **HOME Tab**
**Features:**
- Personalized greeting with user name
- Quick Stats Cards (3 metrics):
  - 💰 Wallet Balance (₹500)
  - 🍽️ Total Orders (count)
  - ⏱️ Orders Ready Now (count)
- Featured Menu Section (horizontal scroll)
- Recent Orders Preview (last 2 orders)
- Side Menu (hamburger ☰) with:
  - User Profile
  - Notifications
  - Help & Support
  - About
  - Logout
  - Dark/Light Mode Toggle

**Color Scheme:**
- Header: Primary Color (#4F46E5 Indigo)
- Stat cards use success, primary, warning colors
- Cards: Surface color with elevation
- Text: Primary text color with secondary for subtitles

---

#### 🍽️ **MENU Tab**
**Features:**
- Live cart preview (sticky at top when items added)
  - Show cart count badge
  - List all items with quantities
  - Remove button for each item
  - Total price calculation
  - "Place Order" button
  
- 2-Column Grid of Menu Items:
  - Food emoji/icon
  - Item name
  - Category badge
  - Price (₹)
  - Add button (+) per item
  - Unavailable items: greyed out with "Out" badge
  - 6 sample items: Veg/Chicken Biryani, Samosa, Dosa, Idli, Paneer Tikka

**Cart Workflow:**
1. User browses menu items
2. Taps "+" to add to cart
3. Cart expands at top showing all items
4. Can adjust quantity or remove
5. Sees total price
6. Taps "Place Order"
7. Order created with "Pending" status
8. Cart clears
9. Success confirmation

---

#### 📦 **ORDERS Tab**
**Features:**
- List of all user's orders (past + present)
- Each order card shows:
  - Order ID (#1001, #1002, etc.)
  - Timestamp
  - Status badge (color-coded):
    - 🟡 Pending (warning orange)
    - 🟣 Preparing (primary indigo)
    - 🟢 Ready (success green)
    - ⚫ Completed (grey)
  - Items ordered (bullet list with quantities)
  - Total price
- Tap order to see more details (planned)

---

#### 💰 **WALLET Tab**
**Features:**
- Large balance card with Primary color background
  - "Available Balance" label
  - Large amount display (₹500)
  - "+ Add Money" button
  
- Recent Transactions section:
  - Transaction type indicator (📥 in, 📤 out)
  - Description (Order #, Added money, etc.)
  - Amount with color (red for debits, green for credits)
  - Sample transactions:
    - Debit: Order #1001 (-₹150)
    - Credit: Added money (+₹500)
    - Debit: Order #1002 (-₹260)

---

#### 👤 **PROFILE Tab**
**Features:**
- Avatar circle with first letter initial
  - Avatar background: Primary color with 20% opacity
- User name (large, bold)
- Email address
- Profile info cards:
  - 📞 Phone: +91 98765 43210
  - 👤 Role: Student
- 🚪 Logout button (red, danger color)
- Edit buttons (planned for future)

---

## 👨‍💼 ADMIN DASHBOARD

### **Bottom Navigation Tabs (4 Tabs)**

#### 📊 **DASHBOARD Tab**
**Features:**
- Admin greeting header
- Key Metrics Cards (3 metrics):
  - 💰 Total Revenue (sum of all orders)
  - ⏳ Pending Orders (count)
  - ✅ Ready Orders (count)
  
- Active Orders Section:
  - Shows only Pending, Preparing, Ready orders (not completed)
  - Each order card is **TAPPABLE** to cycle through statuses
  - Status flow: Pending → Preparing → Ready → Completed → Pending
  - Shows:
    - Order ID
    - Customer name
    - Items with quantities
    - Status (color-coded)
    - Timestamp
    - Total amount
    - Hint: "Tap to update status →"

---

#### 📋 **ORDERS Tab**
**Features:**
- Complete order list (all statuses)
- Same order card design as dashboard but longer list
- Filterable/searchable (planned)
- Tap to update status

---

#### 🍽️ **MENU Tab**
**Features:**
- List of all menu items
- "+ Add Item" button (floating action button, primary color)
- Each menu item card:
  - Item name
  - Category (Rice, Curry, South Indian, etc.)
  - Price (₹)
  - Status toggle (✓ Available / ✗ Unavailable)
    - Green background when available
    - Red background when unavailable
  - Delete button (🗑️)

- **Add Menu Item Modal** (bottom sheet):
  - Item Name input
  - Price input (₹)
  - Category selector (6 categories):
    - Rice
    - Curry
    - South Indian
    - Starters
    - Bread
    - Beverage
  - "+ Add Item" button

---

#### ⚙️ **SETTINGS Tab**
**Features:**
- Business Settings Section:
  - Opening Time: 08:00 AM
  - Closing Time: 08:00 PM
  - Minimum Order Value: ₹50
  - Each tappable to edit (planned)
  
- App Settings Section:
  - About DineDesk
  - Terms & Conditions
  
- 🚪 Logout button (red, danger color)

---

## 🎨 **THEME SYSTEM**

### **Light Theme Colors**
```javascript
{
  primary: '#4F46E5',        // Indigo (main action color)
  secondary: '#8B5CF6',      // Purple (accents)
  success: '#10B981',        // Green (positive, completed)
  warning: '#F59E0B',        // Amber (pending, alerts)
  danger: '#EF4444',         // Red (errors, delete)
  background: '#F9FAFB',     // Light grey (main bg)
  surface: '#FFFFFF',        // White (cards, modals)
  text: '#111827',           // Dark grey (main text)
  textSecondary: '#6B7280',  // Medium grey (secondary text)
  border: '#E5E7EB',         // Light grey (borders)
  shadow: '#00000010',       // Semi-transparent black
}
```

### **Dark Theme Colors**
```javascript
{
  primary: '#6366F1',        // Lighter Indigo
  secondary: '#A78BFA',      // Lighter Purple
  success: '#34D399',        // Lighter Green
  warning: '#FBBF24',        // Lighter Amber
  danger: '#F87171',         // Lighter Red
  background: '#111827',     // Dark grey (main bg)
  surface: '#1F2937',        // Slightly lighter grey (cards)
  text: '#F3F4F6',           // Light grey (main text)
  textSecondary: '#9CA3AF',  // Medium grey (secondary text)
  border: '#374151',         // Dark grey (borders)
  shadow: '#00000030',       // Darker shadow
}
```

### **Theme Toggle**
- Available in side drawer
- Shows: "Light Mode" or "Dark Mode" based on current state
- Uses system emoji: ☀️ (sun) for light, 🌙 (moon) for dark
- Theme changes dynamically across entire app

---

## 🧩 **COMPONENT ARCHITECTURE**

### **ThemeContext.tsx**
- Provides theme colors throughout app
- `useTheme()` hook for components
- `toggleTheme()` function
- Light/dark color definitions
- React Context API based

### **BottomNavigation.tsx**
- Reusable tab component
- Props:
  - `tabs`: Array of tab items
  - `activeTab`: Current active tab ID
  - `onTabPress`: Callback when tab pressed
- Features:
  - Emoji icons for each tab
  - Active tab underline indicator
  - Colored based on theme
  - Fixed at bottom (height: ~70px)

### **SideDrawer.tsx**
- Modal-based slide-out drawer
- Props:
  - `visible`: Boolean to show/hide
  - `onClose`: Callback to close
  - `items`: Array of menu items
  - `userName`: Display user name
  - `userEmail`: Display email
- Features:
  - User profile header with avatar
  - Menu items list
  - Theme toggle in menu
  - Logout button with danger styling
  - Smooth animations

### **AppInput.tsx**
- Reusable input component
- Theme-aware styling
- Used in auth screens

### **AppButton.tsx**
- Reusable button component
- Supports primary, secondary, danger variants
- Theme-aware

---

## 📐 **Design Patterns**

### **Card Layout**
- Rounded corners: 12-20px
- Soft shadows: elevation 1-3
- Padding: 12-16px
- White/surface background
- Subtle borders when needed

### **Button Styles**
- Primary buttons: Full color, white text
- Secondary buttons: Outlined or subtle
- Icon buttons: Circular, centered emoji/icon
- Disabled state: 50% opacity

### **Input Fields**
- Border: 1px light grey
- Border radius: 8px
- Padding: 10-12px
- Placeholder: secondary color text
- Focus state: primary color border

### **Typography**
- Headers: 18-24px, fontWeight 700
- Labels: 13-14px, fontWeight 600
- Body: 14px, fontWeight 400-500
- Small: 11-12px, secondary color

### **Spacing**
- Section padding: 16px horizontal, 12px vertical
- Item gap: 8-12px
- Card margin: 12px
- Safe area respected

### **Icons**
- All emoji-based for simplicity
- Food items: 🍚 🥘 🍽️
- Actions: ✨ ✓ ✕ + 🗑️
- Navigation: 🏠 🍽️ 📦 💰 👤
- Status: 🟡 🟢 🟣 ⚫
- UI: ☰ ✕ → 🌙 ☀️

---

## 📊 **Database Schema (Planned)**

### **Users Table**
```
user_id (UUID, PK)
email (VARCHAR, UNIQUE)
name (VARCHAR)
phone (VARCHAR)
role (ENUM: 'user', 'admin')
wallet_balance (DECIMAL)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### **Menu Items Table**
```
item_id (UUID, PK)
admin_id (UUID, FK)
name (VARCHAR)
description (TEXT)
category (VARCHAR)
price (DECIMAL)
image_url (VARCHAR)
available (BOOLEAN)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### **Orders Table**
```
order_id (UUID, PK)
user_id (UUID, FK)
admin_id (UUID, FK)
items (JSON: [{item_id, quantity, price}, ...])
total_price (DECIMAL)
status (ENUM: 'Pending', 'Preparing', 'Ready', 'Completed')
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### **Wallet Transactions Table**
```
transaction_id (UUID, PK)
user_id (UUID, FK)
amount (DECIMAL)
type (ENUM: 'credit', 'debit')
description (VARCHAR)
created_at (TIMESTAMP)
```

---

## ✨ **Key Features Implemented**

✅ **Authentication**
- OTP via email (Supabase)
- Google OAuth
- Role-based access control
- Error handling with try-catch

✅ **User Features**
- Browse menu with 2-column grid
- Add/remove items to cart
- Place orders
- View order history with status
- Wallet balance view
- Transaction history
- Profile management
- Dark/Light theme toggle

✅ **Admin Features**
- View active orders with real-time metrics
- Update order status by tapping
- Add menu items with modal form
- Toggle item availability
- Delete items
- View all orders
- Business settings
- Logout

✅ **UI/UX**
- Bottom tab navigation
- Side drawer menu
- Theme system (light/dark)
- Color-coded status badges
- Responsive design
- Proper spacing and typography
- Emoji icons throughout

---

## 🚀 **Next Steps for Database Integration**

1. **Connect Supabase to Dashboards**
   - Fetch real menu items from database
   - Store orders in `orders` table
   - Fetch user's order history
   - Real-time order status updates

2. **Implement Search & Filter**
   - Filter menu by category
   - Search for menu items
   - Filter orders by status

3. **Add Image Support**
   - Menu item images
   - User profile pictures
   - Image upload from device/camera

4. **Notifications**
   - Order status notifications
   - Push notifications when order is ready
   - Email confirmations

5. **Payment Integration**
   - Wallet recharge via Razorpay/PhonePe
   - UPI integration
   - Transaction receipts

6. **Advanced Features**
   - Order tracking with location
   - Ratings & reviews
   - Favorites/wishlist
   - Seasonal menu items
   - Analytics for admins

---

## 📱 **Current Status**

**Complete & Tested:**
- ✅ Auth system (OTP + Google OAuth)
- ✅ User Dashboard with 5 tabs
- ✅ Admin Dashboard with 4 tabs
- ✅ Theme system (light/dark)
- ✅ Bottom navigation
- ✅ Side drawer
- ✅ Mock data implementation
- ✅ Navigation flow
- ✅ UI components styling

**Ready for Database Integration:**
- 🟡 All components built and styled
- 🟡 API endpoints ready to be connected
- 🟡 Data structures designed
- 🟡 Mock data can be replaced with real DB queries

---

## 🎯 **Design Philosophy**

1. **Modern & Clean**: Minimalist card-based design
2. **Consistent**: Unified theme system and component patterns
3. **Accessible**: Large touch targets, clear labels, emoji icons
4. **Responsive**: Works on all screen sizes
5. **User-Centric**: Intuitive navigation, quick actions
6. **Admin-Friendly**: Clear metrics, easy order management
7. **Themeable**: Light/dark mode support everywhere

---

*Last Updated: January 2024*
*App Version: 1.0.0*
*Status: Ready for Database Integration*
