# 🍽️ DineDesk - Complete Setup Guide

## ✅ Prerequisites
- Node.js >= 20
- npm or yarn
- Android Studio (for Android) or Xcode (for iOS)
- Supabase account (free at https://supabase.com)

## 🚀 Quick Start (5 Minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

Then edit `.env` and add your Supabase credentials:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
ADMIN_EMAIL=admin@yourcompany.com
```

### 3. Database Setup
Run these SQL scripts in your Supabase SQL Editor:

**Option A: Complete Setup (Recommended)**
Copy and run: `supabase-admin-complete-setup.sql`

**Option B: Manual Setup**
1. `ADD_USER_STATUS_MIGRATION.sql`
2. `SETUP_ORDERS_DATABASE.sql`
3. `create-menu-items-table.sql`

### 4. Run the App

**Android:**
```bash
npm run android
```

**iOS:**
```bash
npm run ios
```

## 🔐 OTP Authentication Flow

### How It Works
1. User enters email → **Send OTP** button
2. OTP sent via Supabase (check spam folder)
3. User enters 6-digit code
4. Verified → Dashboard access

### Testing OTP Locally
Supabase console shows OTP codes if email not configured:
1. Go to Supabase Dashboard
2. Authentication → Users
3. Check "Verify OTP" column

### Troubleshooting

| Issue | Solution |
|-------|----------|
| OTP not received | Check spam folder, verify email in Supabase |
| "Invalid OTP" error | Code expires after 10 minutes, resend OTP |
| "User already registered" | Use login instead of register |

## 👤 User Types

### Regular User
- Register with email
- View menu
- Place orders
- Track order status
- View profile

### Admin User
- Set admin email in `.env` → `ADMIN_EMAIL`
- Login with admin email
- Add/edit menu items
- View all orders
- Update order status
- Manage business settings

## 📱 Running on Device

### Android
```bash
adb devices  # Verify device connected
npm run android
```

### iOS
```bash
npm run ios
```

## 🧪 Testing Checklist

- [ ] Register with email → receive OTP
- [ ] Login with OTP
- [ ] View menu items
- [ ] Add items to cart
- [ ] Place order
- [ ] View order in admin panel
- [ ] Update order status (admin only)

## 📚 Project Structure

```
canteenapp/
├── src/
│   ├── screens/
│   │   ├── auth/         (Login, Register, OTP)
│   │   ├── user/         (User dashboard & menu)
│   │   ├── admin/        (Admin dashboard & orders)
│   │   └── splash/       (Loading screen)
│   ├── components/       (Reusable UI components)
│   ├── navigation/       (App routing)
│   ├── theme/           (Colors, styles)
│   ├── config/          (Admin email, branding)
│   ├── lib/             (Supabase client)
│   └── utils/           (Helper functions)
├── android/             (Native Android code)
├── ios/                 (Native iOS code)
└── .env                 (Environment variables - add this!)
```

## 🆘 Getting Help

1. Check browser console: Press F12 in admin web view
2. Check Supabase logs: Dashboard → Logs
3. Verify tables exist: Dashboard → SQL Editor → Check tables
4. Check user metadata: Dashboard → Authentication → Users

## 🎉 You're Ready!

Once you:
1. ✅ Run `npm install`
2. ✅ Create and fill `.env`
3. ✅ Run SQL setup scripts
4. ✅ Run `npm run android` or `npm run ios`

The app will work with full OTP authentication!
