# Payment & Token Flow Implementation

## Overview
Implemented a complete payment and token flow for the DineDesk app:
1. User adds items to cart → "Place Order" navigates to **PaymentScreen**
2. PaymentScreen simulates payment → creates order with auto-generated **token_number** → routes to **OrderTokenScreen**
3. OrderTokenScreen displays the token and listens for real-time status updates (Pending → Preparing → Ready → Completed)
4. User taps Done → returns to UserDashboard with the new order appended and cart cleared

## Files Modified

### 1. **src/navigation/RootNavigator.tsx**
- Added imports for `PaymentScreen` and `OrderTokenScreen`
- Extended `RootStackParamList` with:
  - `UserDashboard`: Now accepts optional `newOrder` and `clearCart` params
  - `Payment`: Requires `items` array and `totalPrice`
  - `OrderToken`: Requires `orderId`, `tokenNumber`, and optional `newOrder`/`clearCart` params
- Registered both new screens in the Navigator stack

### 2. **src/screens/user/UserDashboard.tsx**
- Modified `placeOrder()` to navigate to PaymentScreen instead of directly inserting orders
  - Passes cart items and total price as route params
- Added route param handling via `route.params`:
  - Detects `newOrder` and `clearCart` flags
  - Appends new order to orders list
  - Clears cart on return
  - Cleans params after processing to prevent re-execution
- Menu fetch logic preserved

### 3. **src/screens/user/PaymentScreen.tsx** (NEW)
- Displays checkout amount and item count
- "Pay Now" button with loading state (simulates 1.2s delay)
- On success:
  - Queries existing orders created today to get last `token_number`
  - Generates next token: `nextToken = lastToken + 1`
  - Creates order with `token_number` and `status: 'Pending'`
  - Inserts order items
  - Routes to OrderTokenScreen and then back to UserDashboard with `newOrder` and `clearCart` params
- Error handling with user-facing alerts

### 4. **src/screens/user/OrderTokenScreen.tsx** (NEW)
- Displays large token number (e.g., #1, #2, etc.)
- Shows current status badge (Pending → yellow, Preparing → blue, Ready → green, Completed → purple)
- Real-time subscription to order updates via Supabase realtime
- Automatic status color change as admin updates order status
- "Done" button navigates back to UserDashboard with newOrder/clearCart params
- Loading indicator shows realtime listener is active

## Database Schema Used
- **orders** table now populated with:
  - `token_number`: Integer auto-generated per day
  - `status`: 'Pending' | 'Preparing' | 'Ready' | 'Completed'
  - `total_price`: Amount charged
  - `user_id`: User reference
  - `created_at`: Timestamp

## Token Number Logic
- Query orders created **today** (using `getStartOfTodayISO()`)
- Find the maximum `token_number` already assigned
- Auto-increment for next order: `nextToken = max(lastToken, 0) + 1`
- Resets daily (new day = new token sequence starting from 1)

## Real-time Updates
- **User side**: OrderTokenScreen subscribes to its order and updates status in real-time
- **Admin side**: AdminDashboard already displays token_number and listens for order updates
- Flow is seamless: Admin changes status → User's token screen updates automatically without page reload

## User Flow (End-to-End)
1. User adds items to cart in MenuTab
2. User taps "Place Order" → Navigates to PaymentScreen
3. User taps "Pay Now" → Payment simulated (replace with real gateway later)
4. Success → Order created with token_number
5. OrderTokenScreen displays token with live status updates
6. User taps "Done" → Returns to UserDashboard
   - New order appended to orders list
   - Cart cleared
   - User can now see order in OrdersTab with the same token number
7. Admin sees real-time order in AdminDashboard with token_number
8. Admin taps order to update status → User's OrderTokenScreen updates automatically

## Admin Visibility
- AdminDashboard.tsx already reads `token_number` from orders
- Admin Orders.tsx displays: `{order.tokenNumber ? #${order.tokenNumber} : #${order.id}}`
- Real-time subscription in AdminDashboard picks up new orders and status updates
- Notification toast shows token number for new orders

## Notes
- Payment is currently mocked (1.2s delay). Replace `handlePayNow()` with real payment gateway (Razorpay, Stripe, etc.)
- Token numbers are sequential per day (1, 2, 3... reset each day)
- Error handling for order creation, item insertion, and token generation included
- All TypeScript errors resolved; code compiles successfully
