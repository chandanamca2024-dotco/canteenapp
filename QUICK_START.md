# 🚀 DineDesk - Quick Start

## Before You Begin
Make sure you have:
- Node.js installed
- React Native environment set up
- Supabase account and project created
- Your admin email ready

---

## ⚡ 5-Minute Setup

### 1️⃣ Database Setup (2 minutes)

Open your **Supabase Dashboard** → **SQL Editor** and run these files **in order**:

#### File 1: Update Profiles
```sql
-- Copy content from: UPDATE_PROFILES_ROLE.sql
-- IMPORTANT: Change line 13 to your admin email!
-- WHERE email IN ('YOUR_EMAIL_HERE@example.com')
```

#### File 2: Create Loyalty System
```sql
-- Copy content from: CREATE_LOYALTY_REWARDS_TABLE.sql
-- No changes needed, just run it!
```

#### File 3: Create Transactions & Feedback
```sql
-- Copy content from: CREATE_TRANSACTIONS_FEEDBACK_TABLES.sql
-- No changes needed, just run it!
```

✅ **Database Setup Complete!**

---

### 2️⃣ Start the App (1 minute)

```bash
# Navigate to project folder
cd canteenapp

# Install dependencies (if not already done)
npm install

# Start the app
npm start

# Press 'a' for Android or 'i' for iOS
```

✅ **App Running!**

---

### 3️⃣ Test User Roles (2 minutes)

#### Test as Regular User:
1. Register a new account
2. Login with email or Google
3. You'll see **UserDashboard** with:
   - ✨ **Loyalty Points Card** (NEW!)
   - Menu browsing
   - Cart & Orders
   - Wallet

#### Test as Staff:
1. Register another account (or use existing)
2. In Supabase, run:
```sql
UPDATE profiles SET role = 'staff' WHERE email = 'staff@example.com';
```
3. Login again
4. You'll see **StaffDashboard** with:
   - 👨‍🍳 Incoming orders
   - Order status management
   - Real-time updates

#### Test as Admin:
1. Use your admin email (the one you set in Step 1)
2. Login
3. You'll see **AdminDashboard** with full access

✅ **All Roles Working!**

---

## 🎯 What's New?

### 🌟 Loyalty Rewards System
- Earn **1 point for every ₹10** spent
- **100 points = ₹10 discount**
- Automatic earning on order completion
- Beautiful card on home screen

### 👨‍🍳 Staff Dashboard
- Real-time order monitoring
- Update status: Pending → Preparing → Ready → Completed
- Filter by status
- View customer details

### 🔐 Role-Based Access
- **User**: Browse, order, earn points
- **Staff**: Manage orders
- **Admin**: Full system control

---

## 📊 Quick Reference

### Database Tables (7 Total)
1. ✅ profiles - User info + roles
2. ✅ menu_items - Food menu
3. ✅ orders - Order records
4. ✅ order_items - Order details
5. ✅ transactions - Payments (NEW!)
6. ✅ loyalty_rewards - Points (NEW!)
7. ✅ feedback - Reviews (NEW!)

### User Roles
- `user` - Regular customers
- `staff` - Canteen staff
- `admin` - Full access

---

## 🐛 Quick Fixes

### Issue: "Loyalty points not showing"
**Fix:**
```sql
-- Run in Supabase SQL Editor
SELECT * FROM loyalty_rewards;
-- If empty, the trigger will create entries on next order
```

### Issue: "Staff dashboard not accessible"
**Fix:**
```sql
-- Check role
SELECT email, role FROM profiles WHERE email = 'YOUR_EMAIL';

-- Set role to staff
UPDATE profiles SET role = 'staff' WHERE email = 'YOUR_EMAIL';
```

### Issue: "App won't start"
**Fix:**
```bash
# Clear cache and restart
npx react-native start --reset-cache
```

---

## 📱 User Flows

### Customer Journey:
```
Register → Login → Browse Menu → Add to Cart → 
Place Order → Pay → Earn Points → Track Order → 
Receive Order → Rate & Review
```

### Staff Journey:
```
Login → View Orders → Update Status → 
(Pending → Preparing → Ready → Completed)
```

### Admin Journey:
```
Login → Dashboard → Manage Menu → View Orders → 
View Analytics → Monitor Loyalty System
```

---

## 📚 Documentation

For detailed information, see:
- 📖 [SYNOPSIS_IMPLEMENTATION_GUIDE.md](SYNOPSIS_IMPLEMENTATION_GUIDE.md) - Complete setup
- 📋 [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - What was done
- 📄 [PROJECT_SYNOPSIS.md](PROJECT_SYNOPSIS.md) - Project overview

---

## ✅ Success Checklist

After setup, verify:
- [ ] App starts without errors
- [ ] Can register new user
- [ ] Can login with email
- [ ] Can login with Google
- [ ] Loyalty points card shows on home
- [ ] Can browse menu
- [ ] Can place order
- [ ] Order status updates in real-time
- [ ] Staff can see staff dashboard
- [ ] Admin can see admin dashboard

---

## 🎉 You're All Set!

Your DineDesk app is now fully aligned with the project synopsis and ready to use!

### What You Have:
✅ Complete food ordering system  
✅ Loyalty rewards program  
✅ Staff order management  
✅ Admin analytics  
✅ Real-time updates  
✅ Razorpay payments  

### Need Help?
Check the documentation files or review the SQL scripts for detailed information.

---

**Happy Coding! 🚀**
