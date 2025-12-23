# 🎯 ORDER SYNC - QUICK REFERENCE CARD

## What It Does
```
User places order → Saved to database → Admin sees it instantly → Admin updates status → User sees update
```

---

## 3 Steps to Deploy

### Step 1️⃣ Database (5 min)
```
Supabase Dashboard
  ↓
SQL Editor → New Query
  ↓
Copy: SETUP_ORDERS_DATABASE.sql
  ↓
Paste & RUN
  ↓
✅ Done!
```

### Step 2️⃣ Rebuild (5 min)
```bash
npx react-native start
npx react-native run-android  # or run-ios
```

### Step 3️⃣ Test (5 min)
```
User: Place Order
  ↓
Admin: See it appear
  ↓
Admin: Click to change status
  ↓
User: See update
  ↓
✅ Works!
```

---

## Code Changes

**File:** `src/screens/user/UserDashboard.tsx`  
**Function:** `placeOrder()`  
**Change:** Now saves to Supabase with user ID  
**Status:** ✅ No errors  

---

## Database Tables

### orders
```
id  user_id  total_price  status          token_number  created_at
─────────────────────────────────────────────────────────────────
abc 123      450         'Pending'        1            2024-12-22
```

### order_items
```
id  order_id  menu_item_id  quantity
────────────────────────────────────
x1  abc       item1         2
x2  abc       item2         3
```

---

## Real-Time Flow

```
USER SIDE          DATABASE          ADMIN SIDE
──────────────────────────────────────────────
Place Order ──→ INSERT ──→ REALTIME EVENT ──→ Update UI
               
Update Status ←─ UPDATE ←─ REALTIME EVENT ←─ User clicks
```

---

## File Reference

| File | Size | When |
|------|------|------|
| SETUP_ORDERS_DATABASE.sql | 2 KB | Copy to Supabase |
| START_HERE_ORDER_SYNC.md | Quick | Read first |
| ORDER_SYNC_COMPLETE_GUIDE.md | Full | Deep dive |
| ORDER_SYNC_INSTRUCTIONS.md | Step-by-step | Follow exactly |
| ORDER_SYNC_SETUP.md | Troubleshooting | If issues |

---

## Common Errors & Fixes

| Error | Fix |
|-------|-----|
| "Failed to place order" | Check login + rebuild |
| "Order not in admin" | Refresh admin, check tables exist |
| "Can't update status" | Click order directly, not background |
| "Doesn't sync in real-time" | Check internet + rebuild |

---

## Testing Checklist

- [ ] User can place order
- [ ] No error message appears
- [ ] Order appears in admin (< 1 sec)
- [ ] Admin can click order
- [ ] Status changes: Pending → Preparing
- [ ] Can click again: Preparing → Ready
- [ ] User sees updated status
- [ ] Multiple orders work

---

## Security

✅ Users see only their orders  
✅ Admins see all orders  
✅ Database enforced  
✅ Can't bypass from app  

---

## Status Workflow

```
⏳ Pending
   ↓
👨‍🍳 Preparing (cooking)
   ↓
✅ Ready (done cooking, wait to pick up)
   ↓
📦 Completed (picked up)
   ↓
⏳ Pending (cycles back)
```

---

## Key Features

| Feature | Status |
|---------|--------|
| Real-time sync | ✅ Yes |
| Order history | ✅ Yes |
| Item tracking | ✅ Yes |
| Status updates | ✅ Yes |
| Multi-order support | ✅ Yes |
| Security | ✅ RLS |

---

## First Time Setup

1. Have Supabase open
2. Copy SQL script
3. Paste & run in Supabase
4. Rebuild app
5. Test

**That's it!** ⚡

---

## Need Help?

1. **Read:** START_HERE_ORDER_SYNC.md
2. **Follow:** ORDER_SYNC_INSTRUCTIONS.md
3. **Stuck?** ORDER_SYNC_SETUP.md troubleshooting
4. **Understand?** ORDER_SYNC_COMPLETE_GUIDE.md

---

## Next Steps

```
✅ Code ready
✅ Docs ready  
✅ SQL script ready

→ Run SQL in Supabase
→ Rebuild app
→ Test it!
```

**You're ready to go!** 🚀
