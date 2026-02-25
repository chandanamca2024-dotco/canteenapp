# 🪑 Seat Reservations - Quick Reference

## 🚀 3-Step Setup

1. **Database**: Run `CREATE_SEAT_RESERVATIONS_TABLE.sql` in Supabase SQL Editor
2. **Build**: `cd canteenapp && npm install && npx react-native run-android`
3. **Test**: Open app → Side Drawer → "Seat Reservations"

---

## 📱 User Access

**Navigation:**
- Side Drawer (☰) → "Seat Reservations"

**Actions:**
- Tap "📅 New Reservation" to book
- Select: Date → Time Slot → Seat → Purpose
- Tap "Confirm Reservation"
- Cancel anytime before the reservation

---

## 👨‍💼 Admin Access

**Navigation:**
- Bottom Tab Bar → "Reservations" (4th tab)

**Features:**
- View all user reservations
- Search by name/email/seat/purpose
- Filter by status & date
- Mark as: Completed, No-show, Cancel, Delete

---

## 📊 Quick Stats

**Available:**
- 12 Seats (A1-A3, B1-B3, C1-C3, D1-D3)
- 8 Time Slots (9:00 AM - 5:00 PM)
- 7 Days advance booking
- 1-6 seats per reservation

---

## 🗄️ Database Table

**Table:** `seat_reservations`

**Key Fields:**
- `seat_number` - Seat ID (e.g., 'A1')
- `reservation_date` - Date of booking
- `reservation_time_slot` - Time (e.g., '9:00-10:00')
- `status` - Confirmed/Cancelled/Completed/No-show
- `purpose` - Reason for booking

---

## 🔒 Security

**Users can:**
- ✅ View their own reservations
- ✅ Create new bookings
- ✅ Cancel their bookings

**Admins can:**
- ✅ View all reservations
- ✅ Update any status
- ✅ Delete any reservation

---

## 📁 Files Created/Modified

**New Files:**
1. `CREATE_SEAT_RESERVATIONS_TABLE.sql` - Database setup
2. `src/screens/user/ReservationsTab.tsx` - User interface
3. `src/screens/admin/Reservations.tsx` - Admin interface
4. `SEAT_RESERVATIONS_SETUP_GUIDE.md` - Full documentation

**Modified Files:**
1. `src/screens/user/UserDashboard.tsx` - Added tab
2. `src/screens/admin/AdminDashboard.tsx` - Added tab

---

## 🎨 Customization

**Change Seats:**
```typescript
// ReservationsTab.tsx line 30
const [availableSeats] = useState([
  'A1', 'A2', 'A3', // Add more...
]);
```

**Change Time Slots:**
```typescript
// ReservationsTab.tsx line 31
const [timeSlots] = useState([
  '9:00-10:00', // Add more...
]);
```

---

## 🐛 Troubleshooting

**Problem:** Table doesn't exist
**Fix:** Run SQL script in Supabase

**Problem:** No reservations showing
**Fix:** Check user is logged in, verify RLS policies

**Problem:** Admin can't see reservations
**Fix:** Verify admin has `is_admin = true` in profiles table

---

## ✅ Test Checklist

**User:**
- [ ] Access from side drawer
- [ ] Create reservation
- [ ] View reservations
- [ ] Cancel reservation

**Admin:**
- [ ] View all reservations
- [ ] Filter & search work
- [ ] Update statuses
- [ ] Delete reservations

---

## 📞 Quick SQL Queries

**View all reservations:**
```sql
SELECT * FROM seat_reservations 
ORDER BY reservation_date, reservation_time_slot;
```

**Today's reservations:**
```sql
SELECT * FROM seat_reservations 
WHERE reservation_date = CURRENT_DATE;
```

**Check availability:**
```sql
SELECT check_seat_availability(
  '2026-01-15'::DATE,
  '10:00-11:00',
  'A1'
);
```

---

## 🎯 Status Values

- **Confirmed** - Reservation is active
- **Cancelled** - User/admin cancelled
- **Completed** - User showed up
- **No-show** - User didn't show up

---

Made with ❤️ for DineDesk | January 12, 2026
