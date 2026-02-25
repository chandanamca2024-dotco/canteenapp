# DineDesk - Complete Setup Guide
## Synopsis-Aligned Implementation

This guide will help you set up all the new features to align your DineDesk app with the project synopsis.

---

## 🗂️ Database Changes

### Step 1: Run SQL Scripts in Supabase

Execute the following SQL files in your Supabase SQL Editor **in this order**:

#### 1. Update Profiles Table for Role-Based Authentication
**File:** `UPDATE_PROFILES_ROLE.sql`

This adds:
- `role` column (user/staff/admin)
- `login_type` column (email/google)
- RLS policies for role-based access

```bash
# Run in Supabase SQL Editor
```

#### 2. Create Loyalty Rewards System
**File:** `CREATE_LOYALTY_REWARDS_TABLE.sql`

This creates:
- `loyalty_rewards` table
- Auto-reward trigger (1 point per ₹10 spent)
- Redemption functions
- RLS policies

#### 3. Create Transactions & Feedback Tables
**File:** `CREATE_TRANSACTIONS_FEEDBACK_TABLES.sql`

This creates:
- `transactions` table for payment tracking
- `feedback` table for user reviews
- Auto-logging triggers
- Helper functions

---

## 📱 Application Changes

### New Features Added:

#### ✅ 1. **Role-Based Authentication**
- **User Role**: Regular students/staff
- **Staff Role**: Canteen staff for order management
- **Admin Role**: Full system access

#### ✅ 2. **Staff Dashboard**
- Location: `src/screens/staff/StaffDashboard.tsx`
- Features:
  - View incoming orders in real-time
  - Update order status (Pending → Preparing → Ready → Completed)
  - Filter orders by status
  - Order statistics dashboard
  - Customer information display

#### ✅ 3. **Loyalty Rewards System**
- **Hook**: `src/hooks/useLoyaltyRewards.ts`
- **Component**: `src/components/LoyaltyPointsCard.tsx`
- **Logic**:
  - Earn 1 point for every ₹10 spent
  - 100 points = ₹10 discount
  - Auto-credit on order completion
  - Redeem points for discounts

#### ✅ 4. **Updated Navigation**
- Role-based routing from splash screen
- Staff guard for staff-only pages
- Auto-routing based on user role:
  - `admin` → AdminDashboard
  - `staff` → StaffDashboard  
  - `user` → UserDashboard

---

## 🚀 Setup Instructions

### 1. Database Setup

```bash
# Open Supabase Dashboard → SQL Editor

# Run these SQL files in order:
1. UPDATE_PROFILES_ROLE.sql
2. CREATE_LOYALTY_REWARDS_TABLE.sql
3. CREATE_TRANSACTIONS_FEEDBACK_TABLES.sql
```

### 2. Update Admin Email

In `UPDATE_PROFILES_ROLE.sql`, line 13:
```sql
UPDATE profiles
SET role = 'admin'
WHERE email IN ('admin@dinedesk.com', 'YOUR_ADMIN_EMAIL@example.com')
AND role != 'admin';
```

### 3. Assign Staff Roles

After database setup, assign staff roles:

```sql
-- Run this in Supabase SQL Editor
UPDATE profiles
SET role = 'staff'
WHERE email IN (
  'staff1@example.com',
  'staff2@example.com'
);
```

### 4. Test the Application

```bash
# Start the app
npm start

# Press 'a' for Android or 'i' for iOS
```

---

## 📊 Database Structure (Synopsis-Aligned)

### 1. profiles
- ✅ User ID
- ✅ Name (full_name)
- ✅ Email
- ✅ Password (handled by Supabase Auth)
- ✅ Login Type (email/google)
- ✅ Role (user/staff/admin)
- ✅ Created At
- ✅ Updated At

### 2. menu_items
- ✅ Item ID
- ✅ Item Name
- ✅ Price
- ✅ Image URL
- ✅ Availability Status
- ✅ Created At

### 3. orders
- ✅ Order ID
- ✅ User ID
- ✅ Total Amount
- ✅ Order Status
- ✅ Created At

### 4. order_items
- ✅ Order Item ID
- ✅ Order ID
- ✅ Item ID (menu_item_id)
- ✅ Quantity

### 5. transactions (NEW!)
- ✅ Transaction ID
- ✅ Order ID
- ✅ Amount
- ✅ Payment Status
- ✅ Payment Method

### 6. loyalty_rewards (NEW!)
- ✅ User ID
- ✅ Total Points
- ✅ Points Earned
- ✅ Points Redeemed

### 7. feedback (NEW!)
- ✅ Feedback ID
- ✅ User ID
- ✅ Rating
- ✅ Comments

---

## 🎯 Module Implementation Status

### ✅ 1. Authentication Module
- [x] Login
- [x] Registration
- [x] Logout
- [x] Session Handling
- [x] Google OAuth
- [x] Email/Password Auth

### ✅ 2. User Module
- [x] Browse Menu
- [x] Place Order
- [x] Online Payment (Razorpay)
- [x] Earn & Redeem Loyalty Points ⭐ NEW
- [x] View Order History

### ✅ 3. Canteen Staff Module ⭐ NEW
- [x] View Incoming Orders
- [x] Update Order Status
- [x] Manage Food Availability

### ✅ 4. Admin Module
- [x] Manage Users
- [x] Manage Menu Items
- [x] View Orders and Reports
- [x] Monitor Loyalty Usage ⭐ NEW

---

## 🔧 Configuration

### Set Admin Email
Update `src/config/admin.ts`:
```typescript
export const ADMIN_EMAIL = 'your-admin@example.com';
```

### Create Staff Accounts

1. Register normally in the app
2. Update role in Supabase:
```sql
UPDATE profiles
SET role = 'staff'
WHERE email = 'staff@example.com';
```

---

## 📱 User Flows

### For Users (Students/Staff)
1. Register/Login with Email or Google
2. Browse menu with categories
3. Add items to cart
4. Place order and pay (Razorpay/Wallet)
5. **Earn loyalty points automatically**
6. Track order status in real-time
7. View order history
8. **Redeem loyalty points for discounts**

### For Staff
1. Login with staff credentials
2. View incoming orders dashboard
3. Update order status:
   - Pending → Preparing → Ready → Completed
4. View customer details
5. Filter orders by status

### For Admin
1. Login with admin credentials
2. Access full admin dashboard
3. Manage menu items
4. View all orders
5. **Monitor loyalty rewards usage**
6. View user feedback
7. Generate reports

---

## 🎨 New Components

### LoyaltyPointsCard
**Location:** `src/components/LoyaltyPointsCard.tsx`

**Usage:**
```tsx
import { LoyaltyPointsCard } from '../../components/LoyaltyPointsCard';

<LoyaltyPointsCard onPress={() => {/* Navigate to details */}} />
```

### useLoyaltyRewards Hook
**Location:** `src/hooks/useLoyaltyRewards.ts`

**Usage:**
```tsx
import { useLoyaltyRewards } from '../hooks/useLoyaltyRewards';

const { loyaltyData, redeemPoints, getPointsForAmount } = useLoyaltyRewards();

// Display points
{loyaltyData?.total_points}

// Calculate points for order
const pointsToEarn = getPointsForAmount(totalAmount);

// Redeem points
await redeemPoints(100, orderId);
```

---

## 🐛 Troubleshooting

### 1. Staff Dashboard Not Showing
**Solution:** Make sure you've run the `UPDATE_PROFILES_ROLE.sql` and assigned the staff role:
```sql
UPDATE profiles SET role = 'staff' WHERE email = 'staff@example.com';
```

### 2. Loyalty Points Not Working
**Solution:** Run `CREATE_LOYALTY_REWARDS_TABLE.sql` and check if triggers are created:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'loyalty_points_trigger';
```

### 3. Transactions Not Logging
**Solution:** Check if the trigger exists:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'transaction_logging_trigger';
```

### 4. Role-Based Routing Not Working
**Solution:** Clear app cache and restart:
```bash
npx react-native start --reset-cache
```

---

## ✅ Testing Checklist

- [ ] Admin can login and access admin dashboard
- [ ] Staff can login and see staff dashboard
- [ ] Users can register and login
- [ ] Users can earn loyalty points on orders
- [ ] Loyalty points show on home screen
- [ ] Staff can update order status
- [ ] Transactions are logged automatically
- [ ] Feedback system works
- [ ] Role-based routing from splash screen works

---

## 📝 Next Steps

1. **Run all SQL scripts in Supabase**
2. **Set admin email in code**
3. **Create test staff accounts**
4. **Test all three user roles**
5. **Verify loyalty points auto-crediting**
6. **Test order flow from all perspectives**

---

## 🎉 What's New vs Synopsis

### Added Features:
✅ Role-based authentication (User/Staff/Admin)  
✅ Loyalty rewards system with auto-earning  
✅ Staff dashboard for order management  
✅ Proper transactions tracking  
✅ Feedback system with ratings  
✅ Real-time order updates  

### Matches Synopsis:
✅ All 7 database tables implemented  
✅ All 4 modules working (Auth, User, Staff, Admin)  
✅ Email & Google authentication  
✅ Razorpay payment integration  
✅ Loyalty rewards system  
✅ Real-time order tracking  

---

## 📧 Support

For issues or questions, check:
- [README.md](README.md)
- [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)
- [PROJECT_SYNOPSIS.md](PROJECT_SYNOPSIS.md)

---

**Last Updated:** January 3, 2026  
**Version:** 2.0 (Synopsis-Aligned)
