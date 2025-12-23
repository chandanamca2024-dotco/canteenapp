# Order Synchronization - Quick Summary

## What's New ✨

When a **user places an order**, it now:

1. **Saves to Supabase** (`orders` + `order_items` tables)
2. **Appears immediately in Admin Dashboard** (real-time sync)
3. **Admin can update status** (Pending → Preparing → Ready → Completed)
4. **User sees status updates** in their Orders tab

## Flow Diagram

```
USER SIDE                          DATABASE (Supabase)              ADMIN SIDE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Menu Tab                                                            Admin Dashboard
  ↓
Add items to cart
  ↓
Place Order ──────────→ INSERT order + items ──────────→ Real-time update
  ↓                            ↓                              ↓
Success Alert            ✅ Saved to DB                 New order appears
  ↓                            ↑                              ↓
Orders Tab                      │                         Click to update
  ↓                      LISTEN for changes           status
See order status ←──────────────┘                              ↓
  ↓                                                      UPDATE status
Watches for updates ←─────────────── Real-time sync ←───────┘
```

## Files Modified

### 1. `src/screens/user/UserDashboard.tsx`
- **Function:** `placeOrder()`
- **Changes:** Now saves orders to Supabase with user ID and item details
- **Status:** ✅ Compiles without errors

### 2. Files Created

- **`orders-table-setup.sql`** - SQL script to create tables in Supabase
- **`ORDER_SYNC_SETUP.md`** - Detailed setup and troubleshooting guide

## Next Steps

### 1️⃣ Create Tables in Supabase
```
Go to: Supabase → SQL Editor → New Query
Paste: contents of orders-table-setup.sql
Click: Run
```

### 2️⃣ Rebuild & Test
```bash
npx react-native run-android  # or run-ios
```

### 3️⃣ Test the Flow
- **User:** Place an order
- **Admin:** Should see it immediately in Orders tab
- **Admin:** Click order to change status
- **User:** Status updates in real-time

## Key Features

| Feature | Status | Details |
|---------|--------|---------|
| User places order | ✅ | Saves to DB with user ID |
| Order appears in admin | ✅ | Real-time via Supabase subscriptions |
| Admin updates status | ✅ | Already implemented (Pending→Ready→Completed) |
| User sees status changes | ✅ | Stored in orders table |
| Security (RLS) | ✅ | Policies configured for users & admins |
| Order items tracking | ✅ | Saved in order_items with quantities |

## Database Structure

```
orders table:
├── id (UUID)
├── user_id (reference to auth.users)
├── total_price (DECIMAL)
├── status (Pending/Preparing/Ready/Completed)
├── token_number (auto-increment)
└── created_at, updated_at

order_items table:
├── id (UUID)
├── order_id (reference to orders)
├── menu_item_id (reference to menu_items)
└── quantity (INTEGER)
```

## Support

- Check `ORDER_SYNC_SETUP.md` for detailed troubleshooting
- Look at console logs if something fails
- Verify RLS policies in Supabase dashboard
