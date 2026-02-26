# User Module Files - Complete Implementation Guide

## 📋 Overview
This document provides a complete guide to the recreated user module files for the DineDesk mobile application. All files have been created based on the UI design screenshots and existing documentation (MD/SQL files).

---

## 📁 Files Created

### Tab Components (6 files)
Located in: `src/screens/user/`

#### 1. **HomeTab.tsx** (717 lines)
**Purpose**: Main landing screen with overview and quick actions

**Features**:
- ✅ Personalized greeting header (Hi, {userName})
- ✅ Search bar with navigation
- ✅ Welcome card with "Fresh & Healthy" carousel
- ✅ Popular picks horizontal scroll (6 items)
- ✅ Canteen open/closed status with countdown timer
- ✅ Quick access grid (6 action buttons):
  - 📋 My Orders
  - 👨‍🍳 New Order
  - ❤️ Wishlist
  - 💰 Wallet
  - 🎁 Rewards
  - 💬 Support
- ✅ Recent orders preview section

**Props**:
```typescript
{
  colors: ColorScheme;
  onNavigateToMenu: () => void;
  onNavigateToOrders: () => void;
  onNavigateToLoyalty: () => void;
  onOpenDrawer: () => void;
}
```

**Data Loading**:
- User profile from `profiles` table
- Popular menu items (limit 6) from `menu_items` table
- Recent orders (limit 1) from `orders` table with `order_items` join

---

#### 2. **MenuTab.tsx** (456 lines)
**Purpose**: Browse and search menu items with filtering

**Features**:
- ✅ Header with drawer button and item count
- ✅ Search bar with clear button
- ✅ Food type filter chips:
  - All items
  - 🟢 Veg
  - 🔴 Non-veg
- ✅ Category browse cards with counts
- ✅ Items grid (2 columns)
- ✅ Veg/non-veg dot indicators
- ✅ Add to cart and wishlist buttons

**Props**:
```typescript
{
  colors: ColorScheme;
  onAddToCart: (item: MenuItem) => void;
  onAddToWishlist: (item: MenuItem) => void;
  onOpenDrawer: () => void;
}
```

**State**:
- `menuItems[]` - All menu items from Supabase
- `searchQuery` - Search input text
- `selectedFilter` - 'all' | 'veg' | 'non-veg'

**Category Icons Mapping**:
- ☕ Beverages
- 🍛 South Indian
- 🍜 Main Course
- 🥡 Chinese
- 🍚 Rice
- 🍢 Starters
- 🍰 Desserts

---

#### 3. **CartTab.tsx** (298 lines)
**Purpose**: Shopping cart management and checkout

**Features**:
- ✅ Empty state with "Browse Menu" button
- ✅ Cart items list with images
- ✅ Veg/non-veg indicators
- ✅ Quantity controls (+/- buttons)
- ✅ Remove button with confirmation dialog
- ✅ Order summary section with subtotal
- ✅ Pickup time display (current time + 30 mins)
- ✅ Canteen closing time notice
- ✅ Place order button with loading state

**Props**:
```typescript
{
  colors: ColorScheme;
  cart: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onPlaceOrder: () => Promise<void>;
  onBackToMenu: () => void;
}
```

**Confirmation Dialogs**:
- Remove item alert
- Place order confirmation

---

#### 4. **OrdersTab.tsx** (585 lines)
**Purpose**: Order tracking with real-time status updates

**Features**:
- ✅ Header with notification badge
- ✅ Status summary cards:
  - ⏱️ Pending
  - 👨‍🍳 Preparing
  - ✅ Ready
- ✅ Latest order highlight card
- ✅ Filter tabs (All/Pending/Preparing/Ready)
- ✅ Date selector with prev/next buttons
- ✅ Orders list with expandable items
- ✅ Pull-to-refresh functionality
- ✅ Real-time updates via Supabase subscription

**Props**:
```typescript
{
  colors: ColorScheme;
  onOpenDrawer: () => void;
}
```

**Status Color Mapping**:
- Pending: #F59E0B (Amber)
- Preparing: #8B5CF6 (Purple)
- Ready: #10B981 (Green)
- Completed: #6B7280 (Gray)
- Cancelled: #EF4444 (Red)

**Real-time Subscription**:
```typescript
supabase
  .channel('orders_changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'orders' },
    () => loadOrders()
  )
```

---

#### 5. **WishlistTab.tsx** (336 lines)
**Purpose**: Manage favorite menu items

**Features**:
- ✅ Header with wishlist count badge
- ✅ Empty state with heart emoji
- ✅ Wishlist items cards (large style)
- ✅ Veg/non-veg indicators
- ✅ Unavailable badge for out-of-stock items
- ✅ "Add to Order" button (disabled if unavailable)
- ✅ Remove button (heart icon)
- ✅ Pull-to-refresh functionality

**Props**:
```typescript
{
  colors: ColorScheme;
  onAddToCart: (item: MenuItem) => void;
  onOpenDrawer: () => void;
}
```

**Data Source**:
- Loads from `wishlist` table with `menu_items` join
- Data transformation handles Supabase relationship (array vs object)

---

#### 6. **ProfileTab.tsx** (473 lines)
**Purpose**: User profile and app settings

**Features**:
- ✅ Profile card with:
  - Avatar circle with initial letter
  - Name and email
  - Stats row (Orders/Wishlist/Points)
- ✅ Personal information section (phone, role)
- ✅ Settings sections:
  - **Account Settings**: Edit Profile, Change Password, Language
  - **Preferences**: Notifications toggle, Dark Mode toggle
  - **Support**: Help, Privacy Policy, Terms, About
- ✅ Logout button with confirmation
- ✅ App version footer

**Props**:
```typescript
{
  colors: ColorScheme;
  onLogout: () => void;
  onOpenDrawer: () => void;
}
```

**Theme Integration**:
- Uses `useTheme()` hook
- Dark mode toggle updates theme context
- Immediately reflects across all tabs

---

### Custom Hooks (2 files)
Located in: `src/hooks/`

#### 7. **useCart.ts** (152 lines)
**Purpose**: Cart state management with AsyncStorage persistence

**Functions**:
- `addToCart(item)` - Add item or increase quantity
- `removeFromCart(itemId)` - Remove item from cart
- `updateQuantity(itemId, quantity)` - Update item quantity
- `clearCart()` - Clear entire cart
- `getTotalPrice()` - Calculate cart total
- `getTotalItems()` - Count total items
- `placeOrder()` - Create order in Supabase and clear cart

**Storage**:
- AsyncStorage key: `@dinedesk_cart`
- Auto-save on every cart change
- Auto-load on hook mount

**Order Flow**:
1. Get current user from Supabase auth
2. Insert into `orders` table
3. Insert each cart item into `order_items` table
4. Clear cart and AsyncStorage
5. Show success alert

**Returns**:
```typescript
{
  cart: CartItem[];
  loading: boolean;
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  placeOrder: () => Promise<boolean>;
}
```

---

#### 8. **useWishlist.ts** (116 lines)
**Purpose**: Wishlist state management with Supabase integration

**Functions**:
- `isInWishlist(itemId)` - Check if item is in wishlist
- `addToWishlist(item)` - Add item to wishlist
- `removeFromWishlist(itemId)` - Remove item from wishlist
- `toggleWishlist(item)` - Add or remove based on current state

**State**:
- `wishlistIds[]` - Array of menu_item_id strings for quick lookups
- Auto-loads on hook mount from Supabase

**CRUD Operations**:
- **SELECT**: Load wishlist IDs on mount
- **INSERT**: Add item to wishlist table (with duplicate check)
- **DELETE**: Remove item from wishlist table

**Returns**:
```typescript
{
  wishlistIds: string[];
  loading: boolean;
  isInWishlist: (itemId: string) => boolean;
  addToWishlist: (item: MenuItem) => Promise<void>;
  removeFromWishlist: (itemId: string) => Promise<void>;
  toggleWishlist: (item: MenuItem) => Promise<void>;
}
```

---

### Main Dashboard (1 file)

#### 9. **UserDashboardModular.tsx** (155 lines)
**Purpose**: Clean, modular implementation of user dashboard

**Features**:
- ✅ Uses all modular tab components
- ✅ Integrates useCart and useWishlist hooks
- ✅ Bottom navigation with cart count badge
- ✅ Side drawer navigation
- ✅ Tab state management
- ✅ Clean switch statement for tab rendering
- ✅ Proper prop passing to all tabs

**Tab Types**:
```typescript
type TabType = 'home' | 'menu' | 'cart' | 'orders' | 'wishlist' | 'wallet' | 'profile';
```

**Navigation Flow**:
- Bottom nav controls main tab switching
- Quick actions navigate between tabs
- Drawer provides additional navigation
- Cart count updates in real-time

---

### Index Files (2 files)

#### 10. **src/screens/user/index.ts**
Exports all tab components for cleaner imports:
```typescript
export { HomeTab } from './HomeTab';
export { MenuTab } from './MenuTab';
export { CartTab } from './CartTab';
export { OrdersTab } from './OrdersTab';
export { WishlistTab } from './WishlistTab';
export { WalletTab } from './WalletTab';
export { ProfileTab } from './ProfileTab';
export { default as UserDashboard } from './UserDashboard';
export { default as UserDashboardModular } from './UserDashboardModular';
```

#### 11. **src/hooks/index.ts**
Exports all custom hooks:
```typescript
export { useCart } from './useCart';
export { useWishlist } from './useWishlist';
export { useLoyaltyRewards } from './useLoyaltyRewards';
```

---

## 🎯 Integration Guide

### Option 1: Replace UserDashboard.tsx (Recommended)
1. Backup current `UserDashboard.tsx`
2. Rename `UserDashboardModular.tsx` to `UserDashboard.tsx`
3. Update imports in navigation files if needed

### Option 2: A/B Testing
1. Keep both versions
2. Switch between them in navigation:
```typescript
import UserDashboard from './screens/user/UserDashboard'; // Old monolithic version
// OR
import UserDashboard from './screens/user/UserDashboardModular'; // New modular version
```

---

## 🗄️ Database Requirements

### Wishlist Table
Already exists in project: `CREATE_WISHLIST_TABLE.sql`

**Structure**:
```sql
CREATE TABLE wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL,
  item_name TEXT NOT NULL,
  item_price DECIMAL NOT NULL,
  item_image TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, menu_item_id)
);
```

**RLS Policies**:
- ✅ Users can view their own wishlist
- ✅ Users can add to their wishlist
- ✅ Users can delete from their wishlist

**To Apply** (if not already done):
1. Open Supabase SQL Editor
2. Run `CREATE_WISHLIST_TABLE.sql`

---

## 📊 Code Statistics

**Total Files Created**: 11
**Total Lines of Code**: ~3,288

### Breakdown:
| File | Lines | Type |
|------|-------|------|
| HomeTab.tsx | 717 | Component |
| MenuTab.tsx | 456 | Component |
| CartTab.tsx | 298 | Component |
| OrdersTab.tsx | 585 | Component |
| WishlistTab.tsx | 336 | Component |
| ProfileTab.tsx | 473 | Component |
| useCart.ts | 152 | Hook |
| useWishlist.ts | 116 | Hook |
| UserDashboardModular.tsx | 155 | Dashboard |
| **Total** | **3,288** | |

---

## 🎨 UI/UX Features

### Design System Compliance
- ✅ Material Design elevation system
- ✅ Consistent color scheme with theme support
- ✅ Proper spacing (4px, 8px, 12px, 16px, 24px)
- ✅ Border radius standards (8px, 12px, 20px)
- ✅ Icon consistency (MaterialIcons throughout)
- ✅ Typography hierarchy

### User Experience
- ✅ Real-time order updates
- ✅ Pull-to-refresh on lists
- ✅ Loading states
- ✅ Empty states with helpful messages
- ✅ Confirmation dialogs for destructive actions
- ✅ Success/error alerts
- ✅ AsyncStorage cart persistence
- ✅ Smooth tab transitions
- ✅ Responsive grid layouts

### Accessibility
- ✅ Clear visual indicators (veg/non-veg dots)
- ✅ Status color coding
- ✅ Large touch targets (40px minimum)
- ✅ Readable text sizes
- ✅ Dark mode support

---

## 🔄 Data Flow

### Cart Flow
```
User adds item → useCart.addToCart()
                ↓
        Cart state updated
                ↓
        AsyncStorage saved
                ↓
        UI re-renders
                ↓
User places order → useCart.placeOrder()
                ↓
        Supabase: Insert order
                ↓
        Supabase: Insert order_items
                ↓
        Clear cart & storage
                ↓
        Navigate to Orders tab
```

### Wishlist Flow
```
User adds to wishlist → useWishlist.addToWishlist()
                       ↓
               Supabase: Insert into wishlist table
                       ↓
               Reload wishlistIds
                       ↓
               UI updates (heart filled)
```

### Orders Real-time Flow
```
OrdersTab mounts → Load orders from Supabase
                 ↓
         Subscribe to orders_changes channel
                 ↓
         Listen for INSERT/UPDATE/DELETE
                 ↓
         Auto-reload on changes
                 ↓
         UI updates with new status
```

---

## 🚀 Next Steps

### Immediate
1. ✅ **Test UserDashboardModular.tsx**
   - Launch app and navigate through all tabs
   - Test add to cart functionality
   - Test wishlist add/remove
   - Verify order placement
   - Check real-time order updates

2. ✅ **Apply wishlist table migration** (if not done)
   - Run `CREATE_WISHLIST_TABLE.sql` in Supabase

3. ✅ **Update navigation** (if needed)
   - Ensure navigation points to correct dashboard file

### Optional Enhancements
- Add search functionality to orders tab
- Implement filter persistence (remember last selected filter)
- Add animations for tab transitions
- Implement skeleton loaders
- Add image caching for menu items
- Implement infinite scroll for large lists
- Add biometric authentication option

---

## 📝 Notes

### Design Decisions
1. **Modular Architecture**: Each tab is a separate component for better maintainability
2. **Custom Hooks**: Centralized cart and wishlist logic for reusability
3. **AsyncStorage for Cart**: Persists cart across app restarts
4. **Supabase for Wishlist**: Uses database for cross-device sync
5. **Real-time Orders**: Immediate updates when kitchen updates order status
6. **Theme Support**: Full dark/light mode integration
7. **TypeScript**: Strong typing throughout for better DX

### Known Dependencies
- `react-native-vector-icons/MaterialIcons`
- `@react-native-async-storage/async-storage`
- `@supabase/supabase-js`
- `ThemeContext` (src/theme/ThemeContext)
- `BottomNavigation` component
- `SideDrawer` component

### File Organization
```
src/
├── screens/
│   └── user/
│       ├── HomeTab.tsx ✅ NEW
│       ├── MenuTab.tsx ✅ NEW
│       ├── CartTab.tsx ✅ NEW
│       ├── OrdersTab.tsx ✅ NEW
│       ├── WishlistTab.tsx ✅ NEW
│       ├── ProfileTab.tsx ✅ NEW
│       ├── WalletTab.tsx ✅ EXISTING
│       ├── UserDashboard.tsx ✅ EXISTING (old)
│       ├── UserDashboardModular.tsx ✅ NEW (clean)
│       └── index.ts ✅ NEW
└── hooks/
    ├── useCart.ts ✅ NEW
    ├── useWishlist.ts ✅ NEW
    ├── useLoyaltyRewards.ts ✅ EXISTING
    └── index.ts ✅ NEW
```

---

## ✨ Summary

All requested user folder files have been successfully created with:
- ✅ Complete TypeScript typing
- ✅ Supabase integration
- ✅ Theme support
- ✅ Real-time functionality
- ✅ Proper error handling
- ✅ User feedback (alerts, loading states)
- ✅ AsyncStorage persistence
- ✅ Material Design compliance
- ✅ Modular architecture
- ✅ Clean code organization

The implementation matches all 6 UI design screenshots provided and follows the patterns documented in the project's MD and SQL files. Ready for integration and testing! 🎉
