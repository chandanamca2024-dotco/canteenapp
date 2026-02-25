# Razorpay Integration Setup

## ✅ What's Been Implemented

Your DineDesk app now has **full Razorpay payment integration**:

1. **PaymentScreen** - Displays checkout with Razorpay test key input
2. **Real Razorpay Payments** - Integrates Razorpay SDK (when installed)
3. **Mock Payment Fallback** - Test without real Razorpay key
4. **Token Generation** - Auto-generates order token after payment
5. **Admin Visibility** - Admin sees paid orders with tokens in real-time

---

## 🚀 Setup Steps

### Step 1: Get Your Razorpay Test Key

1. Go to **https://dashboard.razorpay.com**
2. Sign up or log in
3. Navigate to **Settings → API Keys**
4. Copy your **Test Key ID** (starts with `rzp_test_`)
5. Keep this safe!

### Step 2: Install Razorpay SDK (Optional but Recommended)

```bash
npm install react-native-razorpay
```

Or with Yarn:
```bash
yarn add react-native-razorpay
```

**Note:** If you don't install the SDK, the app will automatically use the **Mock Payment** mode for testing.

### Step 3: Test the Payment Flow

1. **Run your app:**
   ```bash
   npx react-native run-android
   ```

2. **Add items to cart** (Menu tab → click + button)

3. **Tap "Place Order"** → Goes to PaymentScreen

4. **Enter your Razorpay test key** in the input field

5. **Two options:**

   **Option A: Real Razorpay Payment (if SDK installed)**
   - Tap "💳 Pay with Razorpay"
   - Razorpay payment modal opens
   - Use test card details below:
     - Card: `4111 1111 1111 1111`
     - Expiry: Any future date
     - CVV: Any 3 digits
     - OTP: `000000`
   - Payment processes → Token screen displays your order token
   - Admin sees order in real-time

   **Option B: Test Payment (Mock Mode)**
   - Tap "🧪 Test Payment (Instant)"
   - Payment simulated instantly
   - Token screen appears
   - No real money charged

6. **View token** on OrderTokenScreen with live status updates

7. **Return to dashboard** → Order appears in Orders tab

---

## 📋 Payment Flow Overview

```
User adds items
        ↓
Taps "Place Order"
        ↓
PaymentScreen (enter Razorpay key)
        ↓
Razorpay modal / Mock payment
        ↓
Payment success → Order created with token_number
        ↓
OrderTokenScreen (live status updates)
        ↓
Returns to UserDashboard (cart cleared, order visible)
        ↓
Admin sees order in real-time with token #
```

---

## 🔑 How Token Numbers Work

- **Auto-generated** starting from 1 each day
- **Sequential**: 1, 2, 3, 4, ...
- **Resets daily** at midnight
- **Stored** in database with order for reference
- **Real-time sync** between user and admin dashboards

---

## 🎯 Testing Without Real Money

### Use Mock Payment Button
- No key needed
- Instant payment
- Perfect for development

### Use Test Card in Razorpay
- Enter your test key
- Use card details above
- Razorpay handles it as test transaction
- No real charges

---

## 🔐 Security Notes

**IMPORTANT:**
- Never hardcode your **Key Secret** in the app
- Key ID (public) is safe to use
- In production, create orders on your backend server
- Backend sends payment key to client only when needed

---

## 📱 Database Changes

Your `orders` table now includes:
- `token_number` (integer) - Order token displayed to user
- `payment_id` (string) - Razorpay payment ID for reference

---

## 🐛 Troubleshooting

### "Razorpay SDK not installed"
- Install it: `npm install react-native-razorpay`
- Or use Test Payment button instead

### "Invalid test key"
- Check you copied the full key from dashboard
- Should start with `rzp_test_`

### Payment modal doesn't open
- Make sure SDK is installed
- Check your test key is correct
- Try Test Payment button as fallback

### Order not appearing in admin
- Check admin dashboard realtime subscription is active
- Verify Supabase realtime is enabled
- Refresh admin page

---

## ✨ Next Steps (Advanced)

1. **Use Live Keys** - Replace test keys with production keys
2. **Backend Order Creation** - Create orders on your server for security
3. **Webhook Handling** - Listen to Razorpay webhooks for payment confirmations
4. **Payment Verification** - Verify payments server-side before fulfilling orders
5. **Refund Handling** - Implement refund logic if needed

---

## 📞 Need Help?

Check Razorpay docs: https://razorpay.com/docs/
Visit Razorpay support: https://razorpay.com/support/

Enjoy your payment integration! 🎉
