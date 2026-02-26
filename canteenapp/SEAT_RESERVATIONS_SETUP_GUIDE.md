# 🪑 Seat Reservation Feature - Setup Guide

## ✨ Overview

A complete seat reservation system has been added to your DineDesk app, allowing students and staff to book seats in advance at the canteen. This feature includes:

- 📅 **User Reservation Booking** - Students and regular staff can reserve seats for specific dates and time slots
- 👨‍🍳 **Canteen Staff View** - Kitchen staff can VIEW today's reservations (read-only) to prepare for guests
- 👨‍💼 **Admin Management** - Complete administrative control over all reservations
- 🔄 **Real-time Sync** - Instant updates across all devices using Supabase real-time
- 🔒 **Secure Access** - Row-level security ensures users can only see their own reservations
- 📊 **Status Management** - Track reservations as Confirmed, Cancelled, Completed, or No-show

**Who can do what:**
- ✅ **Students & Regular Staff** → Book and manage their own reservations
- 👀 **Canteen Staff** → View today's reservations only (read-only, no booking)
- 🔧 **Admin** → Full access to view, manage, and delete all reservations

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Create the Database Table

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor** (left sidebar)
3. Click **"New Query"**
4. Open the file: `CREATE_SEAT_RESERVATIONS_TABLE.sql`
5. Copy **ALL** the contents
6. Paste into the SQL Editor
7. Click **"RUN"** button
8. Wait for success message ✅

**What this creates:**
- ✅ `seat_reservations` table with all fields
- ✅ Indexes for fast queries
- ✅ Row-level security policies
- ✅ Auto-updating timestamps
- ✅ Helper functions

### Step 2: Rebuild Your App

```bash
# Navigate to your project folder
cd canteenapp

# Install any missing dependencies (if needed)
npm install

# For iOS (Mac only)
cd ios && pod install && cd ..
npx react-native run-ios

# For Android
npx react-native run-android
```

### Step 3: Test the Feature

**For Users (Students/Staff):**
1. Login to the app
2. Open the side drawer menu (☰)
3. Tap on **"Seat Reservations"**
4. Tap **"📅 New Reservation"**
5. Select date, time slot, seat, and purpose
6. Tap **"Confirm Reservation"**
7. Your reservation appears in the list ✅

**For Admin:**
1. Login to admin dashboard
2. Tap the **"Reservations"** tab at the bottom
3. View all reservations from all users
4. Use filters to search and manage reservations
5. Update status or delete reservations

---

## 📋 Features in Detail

### User Features

#### 1. View Reservations
- See all your upcoming and past reservations
- Color-coded status badges
- Detailed information including date, time, seat, and purpose

#### 2. Make New Reservations
- **Date Selection**: Choose from next 7 days
- **Time Slots**: 8 available slots from 9:00 AM to 5:00 PM
- **Seat Selection**: 12 seats available (A1-A3, B1-B3, C1-C3, D1-D3)
- **Number of Seats**: Reserve 1-6 seats at once
- **Purpose**: Specify reason (Study, Meeting, Lunch, etc.)
- **Special Requests**: Add any additional requirements

#### 3. Manage Reservations
- Cancel reservations before the scheduled time
- View reservation history
- Real-time status updates

### Admin Features

#### 1. Overview Statistics
- Total reservations count
- Today's reservations
- Confirmed reservations
- Upcoming reservations

#### 2. Advanced Filtering
- **By Status**: All, Confirmed, Cancelled, Completed, No-show
- **By Date**: All, Today, Upcoming, Past
- **Search**: Find by user name, email, seat number, or purpose

#### 3. Reservation Management
- View all user details (name, email, role)
- Mark as Completed when reservation is fulfilled
- Mark as No-show if user doesn't show up
- Cancel reservations if needed
- Delete reservations permanently

#### 4. Real-time Updates
- Instant notifications when new reservations are made
- Automatic list refresh

---

## 🗄️ Database Schema

### `seat_reservations` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Unique reservation ID (auto-generated) |
| `user_id` | UUID | References auth.users (who made the reservation) |
| `seat_number` | VARCHAR(10) | Seat identifier (e.g., 'A1', 'B2') |
| `reservation_date` | DATE | Date of the reservation |
| `reservation_time_slot` | VARCHAR(20) | Time slot (e.g., '9:00-10:00') |
| `number_of_seats` | INTEGER | Number of seats (1-6) |
| `purpose` | TEXT | Reason for reservation |
| `status` | VARCHAR(20) | Confirmed, Cancelled, Completed, No-show |
| `special_requests` | TEXT | Optional additional notes |
| `created_at` | TIMESTAMP | When reservation was created |
| `updated_at` | TIMESTAMP | Last update timestamp |

### Security (Row Level Security)

**Users can:**
- ✅ View their own reservations
- ✅ Create new reservations
- ✅ Update their own reservations (cancel)

**Admins can:**
- ✅ View all reservations
- ✅ Update any reservation
- ✅ Delete any reservation

---

## 📱 User Interface

### User Side

#### Navigation Options:
1. **Side Drawer** → "Seat Reservations"
2. Opens the reservations screen with your bookings

#### Reservations Screen:
- **Header**: Shows "Seat Reservations" title
- **New Reservation Button**: Blue button at the top
- **Reservations List**: All your reservations with status badges

#### New Reservation Modal:
- **Date Selector**: Horizontal scroll with next 7 days
- **Time Slots Grid**: 8 time slots to choose from
- **Seat Grid**: 12 seats displayed as buttons
- **Input Fields**: Number of seats, purpose, special requests
- **Action Buttons**: Cancel or Confirm

### Admin Side

#### Navigation:
- **Bottom Tab Bar** → "Reservations" (between Orders and Menu)

#### Reservations Dashboard:
- **Stats Cards**: Quick overview of reservation metrics
- **Search Bar**: Search by name, email, seat, or purpose
- **Filter Buttons**: Status and date filters
- **Reservations List**: Detailed cards with all information
- **Action Buttons**: Complete, No-show, Cancel, Delete

---

## 🔧 Technical Implementation

### Files Created

1. **`CREATE_SEAT_RESERVATIONS_TABLE.sql`**
   - Complete database setup script
   - Creates table, indexes, triggers, and policies
   - Includes helper functions for seat availability

2. **`src/screens/user/ReservationsTab.tsx`**
   - User-facing reservation component
   - Booking modal with form
   - Real-time subscription for updates
   - ~700 lines of React Native code

3. **`src/screens/admin/Reservations.tsx`**
   - Admin management interface
   - Advanced filtering and search
   - Status management actions
   - ~650 lines of React Native code

### Files Modified

1. **`src/screens/user/UserDashboard.tsx`**
   - Added ReservationsTab import
   - Added "reservations" to drawer items
   - Added tab rendering logic

2. **`src/screens/admin/AdminDashboard.tsx`**
   - Added Reservations import
   - Added "reservations" to tabs array
   - Added tab rendering logic

---

## 🎨 Customization Options

### Modify Available Seats

Edit [ReservationsTab.tsx](src/screens/user/ReservationsTab.tsx#L30):
```typescript
const [availableSeats] = useState([
  'A1', 'A2', 'A3', 
  'B1', 'B2', 'B3',
  // Add more seats as needed
]);
```

### Modify Time Slots

Edit [ReservationsTab.tsx](src/screens/user/ReservationsTab.tsx#L31):
```typescript
const [timeSlots] = useState([
  '9:00-10:00',
  '10:00-11:00',
  // Add or modify time slots
]);
```

### Change Date Range

Edit [ReservationsTab.tsx](src/screens/user/ReservationsTab.tsx#L217):
```typescript
const getNextSevenDays = () => {
  const dates = [];
  for (let i = 0; i < 7; i++) {  // Change 7 to any number
    // ...
  }
  return dates;
};
```

---

## 🐛 Troubleshooting

### Issue: "Table seat_reservations does not exist"

**Solution:**
- Make sure you ran the SQL script from `CREATE_SEAT_RESERVATIONS_TABLE.sql`
- Check Supabase Dashboard → Table Editor → Verify `seat_reservations` table exists

### Issue: "No reservations showing up"

**Solution:**
1. Check if user is logged in
2. Verify Row Level Security policies are created
3. Check Supabase logs for errors
4. Try creating a test reservation manually in Table Editor

### Issue: "Can't create reservation"

**Solution:**
1. Verify `profiles` table exists with `is_admin` column
2. Check that RLS policies reference `profiles` table correctly
3. Ensure user has proper authentication token

### Issue: "Admin can't see reservations"

**Solution:**
1. Verify admin user has `is_admin = true` in `profiles` table
2. Check RLS policies allow admin access
3. Verify `profiles` table join in the query

---

## ✅ Testing Checklist

### User Testing
- [ ] Can access reservations from side drawer
- [ ] Can view existing reservations
- [ ] Can create a new reservation
- [ ] Can select date, time slot, and seat
- [ ] Can cancel own reservations
- [ ] Status badges display correctly
- [ ] Real-time updates work (test with 2 devices)

### Admin Testing
- [ ] Can access reservations tab
- [ ] Can view all user reservations
- [ ] Statistics display correctly
- [ ] Search functionality works
- [ ] Status filters work
- [ ] Date filters work
- [ ] Can mark reservation as Completed
- [ ] Can mark reservation as No-show
- [ ] Can cancel reservations
- [ ] Can delete reservations
- [ ] Real-time updates work

### Security Testing
- [ ] User A cannot see User B's reservations
- [ ] User cannot modify other users' reservations
- [ ] Admin can see all reservations
- [ ] Unauthenticated users cannot access reservations

---

## 📊 Sample Queries

### Check All Reservations
```sql
SELECT * FROM seat_reservations
ORDER BY reservation_date DESC, reservation_time_slot;
```

### Get Today's Reservations
```sql
SELECT 
  sr.*,
  p.name,
  p.email,
  p.role
FROM seat_reservations sr
JOIN profiles p ON sr.user_id = p.id
WHERE sr.reservation_date = CURRENT_DATE
ORDER BY sr.reservation_time_slot;
```

### Get Confirmed Reservations Count
```sql
SELECT 
  COUNT(*) as total,
  reservation_date
FROM seat_reservations
WHERE status = 'Confirmed'
GROUP BY reservation_date
ORDER BY reservation_date;
```

### Check Seat Availability
```sql
SELECT check_seat_availability(
  '2026-01-15'::DATE,
  '10:00-11:00',
  'A1'
) as is_available;
```

---

## 🚀 Future Enhancements

Consider adding these features:

1. **Email Notifications**
   - Send confirmation emails when reservation is made
   - Reminder emails before reservation time
   - Cancellation notifications

2. **QR Code Check-in**
   - Generate QR code for each reservation
   - Scan QR code at canteen entrance
   - Automatic status update to "Completed"

3. **Recurring Reservations**
   - Allow weekly recurring bookings
   - Useful for regular study groups

4. **Seat Layout View**
   - Visual map of canteen layout
   - Click on seats to reserve
   - See which seats are occupied

5. **Reservation Analytics**
   - Most popular time slots
   - Peak booking times
   - User reservation patterns

6. **Waitlist Feature**
   - Join waitlist if slot is full
   - Auto-assign when slot becomes available

---

## 🎉 Success!

Your seat reservation system is now fully functional! 

**What you have:**
- ✅ Complete database schema with security
- ✅ User interface for booking seats
- ✅ Admin interface for management
- ✅ Real-time synchronization
- ✅ Comprehensive filtering and search
- ✅ Status management system

**Next steps:**
1. Test with real users
2. Gather feedback
3. Customize seats and time slots for your canteen
4. Add any additional features you need

---

## 📞 Support

If you encounter any issues or need help:

1. Check the **Troubleshooting** section above
2. Review Supabase logs for database errors
3. Check React Native console for frontend errors
4. Verify all files were created correctly

---

## 📝 Change Log

**Version 1.0** (January 12, 2026)
- Initial release
- User reservation booking
- Admin management interface
- Real-time synchronization
- Status tracking system

---

Made with ❤️ for DineDesk Canteen Management System
