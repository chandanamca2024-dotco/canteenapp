# Opening & Closing Time Setup Guide

## Overview
The canteen opening and closing times control when users can place orders. The system shows:
- ✅ "Open Now" + countdown to closing when canteen is operating
- ⏰ "Opening Soon" + time until opening if current time is before opening time
- 🔒 "Closed" message if current time is after closing time

## How to Set Opening & Closing Times

### Method 1: Admin Panel (Easy) ⭐ RECOMMENDED

1. **Open DineDesk Admin App**
2. **Navigate to Settings Tab**
3. **Find "Business Hours" section**
4. **Update the times:**
   - **Opening Time:** E.g., `9:00 AM`
   - **Closing Time:** E.g., `4:45 PM`
5. **Tap Save**

The format should be: `H:MM AM` or `HH:MM AM` (e.g., `9:00 AM`, `10:30 PM`)

### Method 2: Database (For Admins)

Run this SQL in Supabase:

```sql
UPDATE business_settings 
SET opening_time = '9:00 AM', 
    closing_time = '4:45 PM' 
WHERE id = (SELECT id FROM business_settings LIMIT 1);
```

Or create initial settings if table is empty:

```sql
INSERT INTO business_settings (opening_time, closing_time)
SELECT '9:00 AM', '4:45 PM'
WHERE NOT EXISTS (SELECT 1 FROM business_settings);
```

## Expected Behavior

### Example 1: Current time is 10:00 AM
- Opening time: 9:00 AM
- Closing time: 4:45 PM
- **Display:** ✅ Open Now | Closes in 6h 45m

### Example 2: Current time is 7:00 AM
- Opening time: 9:00 AM
- Closing time: 4:45 PM
- **Display:** ⏰ Opening Soon | Opens in 2h 0m

### Example 3: Current time is 5:00 PM
- Opening time: 9:00 AM
- Closing time: 4:45 PM
- **Display:** 🔒 Closed | Closed for today

## Debugging

If times don't appear correct:

1. **Check browser console** (Press F12 in web version)
2. **Look for "=== TIME CHECK ===" logs** showing:
   - Current time
   - Opening minutes
   - Closing minutes
   - Status (OPEN/CLOSED/OPENING SOON)

3. **Verify database:**
   - Open Supabase dashboard
   - Go to Tables → business_settings
   - Confirm opening_time and closing_time columns have values

4. **Common issues:**
   - ❌ Times in 24-hour format (must be 12-hour with AM/PM)
   - ❌ Invalid format like "9.00 AM" (must use colon "9:00 AM")
   - ❌ Table doesn't exist yet (run SETUP_BUSINESS_SETTINGS.sql)

## Time Format Reference

| ✅ Correct | ❌ Wrong |
|-----------|---------|
| 9:00 AM | 09:00 |
| 10:30 AM | 10.30 AM |
| 12:00 PM | 12:00 |
| 4:45 PM | 16:45 |
| 11:59 PM | 23:59 |

## Testing the Countdown

### Test Case 1: Before Opening
1. Set opening time to **2 minutes from now**
2. Refresh app
3. Should show "⏰ Opening Soon" with countdown

### Test Case 2: During Hours
1. Set opening time to **30 minutes ago**
2. Set closing time to **1 hour from now**
3. Refresh app
4. Should show "✅ Open Now" with countdown to closing

### Test Case 3: After Closing
1. Set closing time to **30 minutes ago**
2. Refresh app
3. Should show "🔒 Closed | Closed for today"

## User Experience

When users see:

### ✅ Open Now
- They can place orders
- Real-time countdown to closing shows urgency
- Encourages quick ordering

### ⏰ Opening Soon
- Orders are blocked
- Shows how long until they can order
- Encourages them to return at opening time

### 🔒 Closed
- Orders are completely disabled
- Shows reopening time (next day at opening_time)
- Calendar message: "Tomorrow at 9:00 AM"

## Need Help?

If the times aren't working:
1. First, run the SETUP_BUSINESS_SETTINGS.sql file
2. Then go to Admin Settings and set the times
3. Check console logs for time parsing errors
4. Verify times are in correct format with AM/PM

All times are 12-hour format for user-friendly display! ⏰
