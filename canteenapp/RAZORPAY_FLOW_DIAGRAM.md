# Razorpay Payment Flow Diagram

## 🔄 Complete User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  USER SIDE                                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Menu Tab                                                        │
│  ├─ Browse items                                                │
│  ├─ Tap + button → Add to cart                                  │
│  └─ Cart preview shows (items, qty, total price)               │
│                                                                  │
│  [Place Order] button tapped                                   │
│       ↓                                                          │
│  🎯 PaymentScreen                                               │
│  ├─ Display checkout amount (₹XYZ)                             │
│  ├─ Show item count                                            │
│  ├─ Input Razorpay test key                                   │
│  └─ Choose payment method:                                     │
│     ├─ 💳 Pay with Razorpay (opens payment modal)            │
│     └─ 🧪 Test Payment (instant mock)                         │
│       ↓                                                          │
│  📱 Razorpay Payment Modal (if SDK installed)                 │
│  ├─ Test card: 4111 1111 1111 1111                           │
│  ├─ Expiry: Any future date                                  │
│  ├─ CVV: Any 3 digits                                        │
│  └─ OTP: 000000                                              │
│       ↓                                                          │
│  ✅ Payment Success                                             │
│       ↓                                                          │
│  🎫 OrderTokenScreen                                            │
│  ├─ Display large token: #123                                 │
│  ├─ Show status badge (Pending/Preparing/Ready)              │
│  ├─ Listen for real-time status updates                      │
│  └─ [Done] button → Return to dashboard                      │
│       ↓                                                          │
│  📱 UserDashboard                                               │
│  ├─ Cart cleared ✓                                            │
│  ├─ New order appended to list                               │
│  ├─ Order visible in "Orders" tab                            │
│  └─ Shows: Token #, Items, Status, Total                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↕️ Real-time via Supabase
┌─────────────────────────────────────────────────────────────────┐
│  ADMIN SIDE                                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  AdminDashboard                                                  │
│  ├─ Orders tab                                                 │
│  ├─ NEW ORDER appears in real-time:                          │
│  │  ├─ Token: #123                                            │
│  │  ├─ Customer: User                                         │
│  │  ├─ Items: Dosa (2), Rice (1)                             │
│  │  ├─ Total: ₹450                                           │
│  │  ├─ Status: Pending                                       │
│  │  └─ Payment ID: razorpay_payment_xxxx                    │
│  │                                                             │
│  │  Tap order to update status:                              │
│  │  Pending → Preparing → Ready → Completed                │
│  │       ↓ (real-time notification)                          │
│  │  🔔 Toast: "New Order #123 - ₹450"                       │
│  │       ↓ (broadcast via realtime)                          │
│  └─ Notification sound plays 🔊                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↕️ Real-time Sync
         User's Token Screen Updates Live ↔️ Admin Status Updates
         
User sees status changes instantly as admin cooks and updates
```

---

## 🗄️ Database Schema

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  total_price DECIMAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  token_number INTEGER,  -- ← NEW: Auto-generated token (1, 2, 3...)
  payment_id TEXT,       -- ← NEW: Razorpay payment reference
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Token numbers reset daily and start from 1
-- Generated in: PaymentScreen.createOrderAfterPayment()
-- Displayed to: User (token screen) + Admin (orders list)
```

---

## 🔌 API Integration Points

```
┌──────────────────────────────┐
│  PaymentScreen.tsx           │
│  handleRazorpayPayment()     │
└──────────────────────────────┘
           ↓
    Opens Razorpay Modal
    (handled by SDK)
           ↓
User enters card details
           ↓
┌──────────────────────────────────────────┐
│  Razorpay Payment Gateway                │
│  (processes payment securely)            │
│  ✅ Success → returns payment_id         │
│  ❌ Failure → returns error              │
└──────────────────────────────────────────┘
           ↓
createOrderAfterPayment(userId, paymentId)
           ↓
┌──────────────────────────────────────────┐
│  Supabase Database                       │
│  INSERT INTO orders (                    │
│    user_id,      -- who bought           │
│    total_price,  -- how much             │
│    token_number, -- ticket #             │
│    payment_id,   -- Razorpay ref         │
│    status        -- Pending              │
│  )                                       │
└──────────────────────────────────────────┘
           ↓
Real-time Updates
(subscribe to orders table)
           ↓
┌──────────────────────────────────────────┐
│  User's OrderTokenScreen                 │
│  - Shows token_number                    │
│  - Listens for status updates            │
│  - Updates when admin changes status     │
│                                          │
│  Admin's AdminDashboard                  │
│  - Shows all orders with tokens          │
│  - Can update status                     │
│  - Broadcast to user in real-time        │
└──────────────────────────────────────────┘
```

---

## 🎯 Token Number Generation Logic

```javascript
// Happens in PaymentScreen.createOrderAfterPayment()

1. Get today's start time (00:00:00)
   const start = getStartOfTodayISO();

2. Query all orders created today with token_number
   SELECT token_number 
   FROM orders 
   WHERE created_at >= today_start
   ORDER BY token_number DESC
   LIMIT 1;

3. Get last token (default 0 if none exist)
   lastToken = rows[0]?.token_number || 0;

4. Calculate next token
   nextToken = lastToken + 1;

5. Insert order with token_number
   INSERT INTO orders (
     ..., 
     token_number: nextToken,
     ...
   );

6. Display to user: "Order #" + nextToken

Example Timeline:
   08:00 AM → Order 1 (token_number = 1)
   08:05 AM → Order 2 (token_number = 2)
   08:10 AM → Order 3 (token_number = 3)
   ...
   12:00 AM (next day) → Resets! Order 1 (token_number = 1)
```

---

## 🔄 Real-time Sync Flow

```
Admin updates order status:
   orders.status: "Pending" → "Preparing"
            ↓
Supabase realtime event triggered
            ↓
┌───────────────────────────────────┐
│ AdminDashboard subscription       │
│ (listens for UPDATE on orders)    │
│ Updates orders list + refreshes UI│
└───────────────────────────────────┘
            ↓
┌───────────────────────────────────┐
│ OrderTokenScreen subscription     │
│ (listens for this specific order) │
│ Updates status badge + color      │
└───────────────────────────────────┘
            ↓
User sees live status change (no page reload needed!)
```

---

## 📊 State Management

```
UserDashboard.tsx
├─ cart: CartItem[]
├─ orders: Order[]
├─ activeTab: string
├─ placeOrder() → navigates to PaymentScreen
└─ route.params listener:
   ├─ Detects newOrder → appends to orders list
   └─ Detects clearCart → empties cart

PaymentScreen.tsx
├─ processing: boolean
├─ keyInput: string (Razorpay test key)
├─ handleRazorpayPayment() → opens Razorpay modal
├─ handleMockPayment() → simulates payment
└─ createOrderAfterPayment() → inserts order

OrderTokenScreen.tsx
├─ status: string (live from database)
├─ useEffect: realtime subscription to order
└─ Updates status badge in real-time
```

---

## ✨ Testing Checklist

- [ ] Run app: `npx react-native run-android`
- [ ] Get test key from Razorpay dashboard
- [ ] Add items to cart (Menu tab)
- [ ] Tap "Place Order"
- [ ] Enter Razorpay test key
- [ ] Try "💳 Pay with Razorpay" OR "🧪 Test Payment"
- [ ] See order token displayed
- [ ] Go to Admin dashboard in another device/window
- [ ] See order appear in real-time
- [ ] Update order status to "Preparing"
- [ ] See user's token screen update live (no reload!)
- [ ] Continue: Preparing → Ready → Completed
- [ ] Verify token number increments next order
- [ ] Check orders appear in user's Orders tab

---

**Your Razorpay payment system is complete and ready! 🎉**
