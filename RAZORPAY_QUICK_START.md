# 🚀 Razorpay Payment - Quick Start (5 Minutes)

## Get Test Key (2 min)
1. Go → https://dashboard.razorpay.com
2. Sign up/login
3. Settings → API Keys
4. Copy **Test Key ID** (starts with `rzp_test_`)

## Install SDK (2 min) - OPTIONAL
```bash
npm install react-native-razorpay
```
*Skip if you want to use mock payments*

## Test Payment (1 min)
1. Run app: `npx react-native run-android`
2. Add items to cart
3. "Place Order" → PaymentScreen
4. **Paste your test key** in the text field
5. Choose:
   - **💳 Pay with Razorpay** (if SDK installed)
   - **🧪 Test Payment** (instant, no SDK needed)

## Test Card
```
4111 1111 1111 1111
Expiry: Any future date
CVV: Any 3 digits
OTP: 000000
```

## Payment Success ✅
→ Token screen appears with your order token #
→ Admin sees order in real-time
→ Live status updates as admin changes it

## That's it! 🎉

**No SDK?** Use the "Test Payment" button instead - works perfectly for development.

**Issues?** Check RAZORPAY_SETUP.md for detailed troubleshooting.
