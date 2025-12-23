# 📱 DineDesk App - Navigation & Feature Guide

## 🎯 Quick Start Guide

### **For First-Time Users:**
1. Download and open the app
2. You'll see the Splash Screen (loading)
3. Then redirected to Auth Screen if not logged in
4. Choose: **Login** or **Register**

---

## 🔐 AUTHENTICATION FLOW

### **Register (New User)**
```
Register Screen
├─ Email input
├─ Name input  
├─ Phone input
├─ Role Picker (Student/Staff)
└─ "Send OTP" button
    ↓
OTP Screen (email)
├─ 6-digit OTP input
├─ "Verify OTP" button
├─ "Resend OTP" button
    ↓
If email already registered → Redirect to Login
If new user → Create account → Auto-login → Dashboard
```

### **Login (Existing User)**
```
Login Screen
├─ Email input
├─ "Send OTP" button
├─ "Login with Google" button
    ↓
OTP Screen
├─ 6-digit OTP input
├─ "Verify OTP" button
├─ "Resend OTP" button
    ↓
Role Check (admin vs user) → Appropriate Dashboard
```

### **Google OAuth**
```
Login Screen
├─ "Login with Google" button
    ↓
Google Sign-In
    ↓
Dashboard (auto-routed based on role)
```

---

## 👤 USER DASHBOARD

### **Access:** Tap 🏠 (Home) in bottom navigation

### **Features & How to Use:**

#### **1. HOME Tab (🏠)**
```
🏠 Home
├─ Greeting: "Good afternoon, Chandler 👋"
├─ Quick Stats (3 Cards):
│  ├─ 💰 Wallet Balance: ₹500
│  ├─ 🍽️ Total Orders: 2
│  └─ ⏱️ Ready Now: 1
├─ Featured Menu (Horizontal Scroll):
│  └─ Tap any item → Adds to cart
└─ Recent Orders:
   └─ Tap order → See details
```

**What's in the Drawer (☰)?**
- Notifications 🔔
- Wallet 💰
- Help & Support ❓
- About ℹ️
- Dark/Light Mode Toggle (☀️/🌙)
- Logout 🚪

---

#### **2. MENU Tab (🍽️)**
```
🍽️ Menu
├─ Browse 6 Menu Items (2-column grid)
│  ├─ Food emoji
│  ├─ Item name
│  ├─ Category
│  ├─ Price (₹)
│  └─ + Button (tap to add)
│
├─ Cart Preview (appears when you add items):
│  ├─ Cart count
│  ├─ List of items (with quantities)
│  ├─ Remove button (✕) for each item
│  ├─ Total price
│  └─ "Place Order" button
│
└─ Unavailable items:
   ├─ Greyed out (50% opacity)
   └─ "Out" badge on corner
```

**How to Order:**
1. Tap "+" on menu items to add to cart
2. Cart preview appears at top
3. Adjust quantities or remove items
4. See total price
5. Tap "Place Order"
6. ✅ Order confirmation
7. Cart resets

---

#### **3. ORDERS Tab (📦)**
```
📦 Orders
├─ All user's orders listed
├─ Each order shows:
│  ├─ Order ID: #1001
│  ├─ Timestamp: 2024-01-15 12:30 PM
│  ├─ Items: • Veg Biryani ×1
│  ├─ Status: 
│  │  ├─ 🟡 Pending (yellow)
│  │  ├─ 🟣 Preparing (blue)
│  │  ├─ 🟢 Ready (green)
│  │  └─ ⚫ Completed (grey)
│  └─ Total: ₹150
```

**Status Legend:**
- 🟡 **Pending** = Order received, waiting to prepare
- 🟣 **Preparing** = Kitchen is making your order
- 🟢 **Ready** = Order is ready to pickup!
- ⚫ **Completed** = Order has been picked up

---

#### **4. WALLET Tab (💰)**
```
💰 Wallet
├─ Big Balance Card:
│  ├─ "Available Balance"
│  ├─ ₹500
│  └─ "+ Add Money" button
│
└─ Recent Transactions:
   ├─ Transaction type (📥 in / 📤 out)
   ├─ Description
   ├─ Amount (green for +, red for -)
   └─ Examples:
      ├─ 📤 Order #1001: -₹150
      ├─ 📥 Added money: +₹500
      └─ 📤 Order #1002: -₹260
```

**Use Wallet To:**
- Track spending on orders
- Add money (planned: Razorpay, UPI)
- See transaction history

---

#### **5. PROFILE Tab (👤)**
```
👤 Profile
├─ Avatar: Large circle with initial "C"
├─ Name: Chandler
├─ Email: chandler@university.edu
├─ Info Cards:
│  ├─ 📞 Phone: +91 98765 43210
│  └─ 👤 Role: Student
└─ 🚪 Logout Button (Red)
```

**Profile Features:**
- View all user information
- Edit name, phone (planned)
- Toggle theme (dark/light)
- Logout

---

## 👨‍💼 ADMIN DASHBOARD

### **Access:** After login with admin role

### **Features & How to Use:**

#### **1. DASHBOARD Tab (📊)**
```
📊 Dashboard
├─ Overview Cards (3 Metrics):
│  ├─ 💰 Total Revenue: ₹570 (sum of all orders)
│  ├─ ⏳ Pending Orders: 1
│  └─ ✅ Ready Orders: 1
│
└─ Active Orders (Pending/Preparing/Ready):
   ├─ Each order is TAPPABLE ← Important!
   ├─ Shows:
   │  ├─ Order #1001
   │  ├─ Customer: John Doe
   │  ├─ Items: • Veg Biryani ×1
   │  ├─ Status: 🟡 Pending
   │  ├─ Time: 2024-01-15 01:10 PM
   │  ├─ Total: ₹150
   │  └─ Hint: "Tap to update status →"
   └─ Completed orders not shown here
```

**How to Update Order Status:**
1. Tap any active order card
2. Status cycles: Pending → Preparing → Ready → Completed
3. Tap again to continue cycling
4. Each tap updates the display

---

#### **2. ORDERS Tab (📋)**
```
📋 Orders
├─ Complete list of ALL orders
├─ Shows all statuses (including Completed)
├─ Same order cards as Dashboard
├─ Tap to update status (if not completed)
└─ Can see full order history
```

**Use This To:**
- View all order history
- Search/filter (planned)
- See completed orders

---

#### **3. MENU Tab (🍽️)**
```
🍽️ Menu
├─ "+ Add Item" Button (floating, primary color)
│
└─ Menu Items List:
   ├─ Item Name
   ├─ Category
   ├─ Price (₹)
   ├─ Status Toggle:
   │  ├─ Green: ✓ Available
   │  └─ Red: ✗ Unavailable
   └─ Delete Button: 🗑️
```

**How to Add Item:**
1. Tap "+ Add Item" button
2. Modal appears with form:
   - Item Name input
   - Price input
   - Category dropdown
3. Select category (Rice, Curry, etc.)
4. Tap "+ Add Item"
5. ✅ Item added to menu

**How to Toggle Availability:**
1. Tap "✓ Available" / "✗ Unavailable" button
2. Button color changes
3. Menu item availability updated

**How to Delete Item:**
1. Tap 🗑️ delete button
2. Item removed from menu

---

#### **4. SETTINGS Tab (⚙️)**
```
⚙️ Settings
├─ Business Settings:
│  ├─ Opening Time: 08:00 AM → (tap to edit)
│  ├─ Closing Time: 08:00 PM → (tap to edit)
│  └─ Minimum Order: ₹50 → (tap to edit)
│
├─ App Settings:
│  ├─ About DineDesk → (tap for info)
│  └─ Terms & Conditions → (tap to read)
│
└─ 🚪 Logout Button (Red)
```

**Manage Business:**
- Set opening/closing hours
- Set minimum order value
- View app information
- Read terms

---

## 🎨 THEME SWITCHING

### **How to Toggle Dark/Light Mode:**

1. **From User Dashboard:**
   - Tap ☰ (hamburger menu)
   - Tap theme button: "☀️ Light Mode" or "🌙 Dark Mode"
   - Theme switches immediately

2. **From Admin Dashboard:**
   - Same process via side drawer

3. **Colors Change:**
   - Backgrounds: Light (white) ↔ Dark (grey)
   - Text: Dark (black) ↔ Light (white)
   - Cards: Adjust for readability
   - All colors optimized for each theme

---

## 🔄 NAVIGATION TIPS

### **Bottom Tab Bar:**
- Always visible and accessible
- Current tab has colored underline
- User Dashboard: 5 tabs (Home, Menu, Orders, Wallet, Profile)
- Admin Dashboard: 4 tabs (Dashboard, Orders, Menu, Settings)

### **Side Drawer (☰):**
- Tap hamburger icon to open
- Tap outside or X to close
- User profile section at top
- Theme toggle in menu
- Logout option
- Help and support

### **Going Back:**
- Side drawer: Swipe left or tap X
- Modals: Tap X button or back button
- Dashboards: Use bottom nav tabs

---

## 💡 HELPFUL FEATURES

### **For Users:**
✅ Add items one-by-one or multiple times
✅ Remove any item from cart before ordering
✅ See order status in real-time
✅ Track wallet balance and spending
✅ Dark mode for night time

### **For Admins:**
✅ Quick status updates by tapping orders
✅ Add new menu items anytime
✅ Toggle item availability
✅ See revenue metrics at a glance
✅ Manage business hours and settings

---

## 📞 SAMPLE USER DATA

### **Test User:**
- **Email:** chandler@university.edu
- **Name:** Chandler
- **Role:** Student
- **Phone:** +91 98765 43210
- **Wallet Balance:** ₹500

### **Test Admin:**
- **Email:** admin@dinedesk.com
- **Name:** Admin
- **Role:** Admin
- **Manages:** Menu, Orders, Revenue

---

## 🚀 UPCOMING FEATURES (Planned)

- 📸 Food item photos
- 🔍 Menu search & filter by category
- ⭐ Ratings & reviews
- 📍 Order tracking with map
- 🔔 Push notifications
- 💳 Multiple payment methods
- 👥 Referral program
- 📊 Advanced analytics for admins

---

## ❓ FREQUENTLY ASKED QUESTIONS

**Q: How do I place an order?**
A: Go to Menu tab → Add items (+) → Cart appears → Tap "Place Order"

**Q: Can I change my order after placing it?**
A: Not yet (planned feature). Contact admin via Help & Support.

**Q: How long does order take?**
A: Time varies. Admin updates status as they prepare. You can see in Orders tab.

**Q: What if I need to refund?**
A: Contact admin through the app (Help & Support).

**Q: Can I customize menu items?**
A: Currently no. Order as-is. Customization coming soon.

**Q: How do I add money to wallet?**
A: Tap Wallet tab → "+ Add Money" → Choose payment method (coming soon)

---

*Last Updated: January 2024*
*DineDesk v1.0.0*
