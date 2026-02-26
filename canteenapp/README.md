# 🍽️ DineDesk - College Canteen Management App

A React Native mobile app for managing college canteen orders with real-time updates, OTP authentication, and role-based access (User & Admin).

## 📖 Quick Start

**👉 START HERE**: Read [SETUP.md](SETUP.md) for complete setup instructions (5 minutes)

## 🎯 Key Features

- ✅ **OTP Authentication** - Email-based login with 6-digit OTP codes
- ✅ **User Dashboard** - Browse menu, add to cart, place orders
- ✅ **Admin Panel** - Manage menu items, view orders, update status
- ✅ **Real-time Updates** - Order status updates instantly
- ✅ **Role-based Access** - Different UI for users vs admins
- ✅ **Dark Mode** - Light and dark theme support
- ✅ **Database Backed** - Powered by Supabase

## 🚀 Quick Setup (5 Min)

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (copy .env.example to .env)
cp .env.example .env

# 3. Add your Supabase credentials to .env
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_ANON_KEY=your-key-here
# ADMIN_EMAIL=admin@yourcompany.com

# 4. Run SQL setup in Supabase
# Copy supabase-admin-complete-setup.sql to Supabase SQL Editor

# 5. Run the app
npm run android   # or: npm run ios
```

## 📁 What's Inside

| Folder | Purpose |
|--------|---------|
| `src/screens/auth` | Login, OTP, Register screens |
| `src/screens/user` | User dashboard & menu |
| `src/screens/admin` | Admin dashboard & management |
| `src/components` | Reusable UI components |
| `src/navigation` | App routing setup |
| `src/lib` | Supabase client & OTP service |
| `src/config` | Admin email, branding |
| `src/theme` | Colors, dark mode |

## 🔐 OTP Authentication

- Users enter email → receive 6-digit OTP code
- Code valid for 10 minutes
- One-time use verification
- Resend OTP option available
- Works with custom database (no email service needed initially)

## 👤 User Types

| Type | Access | Dashboard |
|------|--------|-----------|
| **Regular User** | Menu, cart, orders | 5 tabs |
| **Admin** | All management | 4 tabs (Orders, Menu, Items, Settings) |

Set admin email in `.env`:
```
ADMIN_EMAIL=admin@yourcompany.com
```

## ❓ Troubleshooting

**OTP not received?**
- Check spam folder
- See OTP in Supabase console: Dashboard → Authentication → Users

**"Invalid OTP" error?**
- Code expires after 10 minutes → request new one
- Check database for recent OTP codes

**App won't start?**
- Ensure `.env` file exists with credentials
- Run `npm install` again
- Check terminal for error messages

## 📚 Documentation

- **[SETUP.md](SETUP.md)** - Complete setup guide ⭐ START HERE
- **[CLEANUP_SUMMARY.md](CLEANUP_SUMMARY.md)** - What was fixed
- SQL scripts in root directory for database setup

## 🛠️ Technologies Used

- **React Native** - Mobile framework
- **TypeScript** - Type safety
- **Supabase** - Backend & authentication
- **React Navigation** - Screen routing
- **React Native Paper** - UI components

## 🧪 Testing

Before deploying:
1. Test OTP flow (register → OTP → dashboard)
2. Test user orders workflow
3. Test admin menu management
4. Verify order status updates
5. Test dark/light mode toggle

## 📞 Support

If something doesn't work:
1. Check **[SETUP.md](SETUP.md)** troubleshooting section
2. Verify `.env` credentials
3. Check Supabase dashboard for table/data issues
4. Review console logs: `Shift+F12` or `adb logcat`

## 📝 Notes

- This is a **secured version** with no hardcoded credentials
- All sensitive data goes in `.env` file (git-ignored)
- OTP service uses Supabase database
- Ready for production deployment

---

**👉 Next Step**: Open [SETUP.md](SETUP.md) and follow the 5-step guide!
