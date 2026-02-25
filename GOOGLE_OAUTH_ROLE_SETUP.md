✅ GOOGLE OAUTH SETUP - COMPLETE

## What Now Happens with Google Sign-In

### 1. Google Sign-Up (RegisterScreen)
- User clicks "Continue with Google"
- Opens Google login in browser
- After authentication, creates auth account
- Redirects back to app

### 2. Google Login (LoginScreen)
- User clicks "Continue with Google"
- Opens Google login in browser
- Authenticates with Google
- If NEW user → Shows SelectRole screen
- If EXISTING user → Routes to UserDashboard

### 3. New Google User Flow
1. User signs in with Google
2. SelectRoleScreen appears with options:
   - 📚 Student (Order food from canteen)
   - 👨‍💼 Staff (Staff member using canteen)
3. User selects role
4. Profile created in database with selected role
5. Redirects to UserDashboard

### 4. Existing Google User Flow
1. User logs in with Google
2. System finds existing profile
3. Routes based on role:
   - Admin → AdminDashboard
   - Canteen Staff → StaffDashboard
   - Student/Staff → UserDashboard

## Files Updated

✅ [LoginScreen.tsx](src/screens/auth/LoginScreen.tsx)
   - Added logic to detect Google users
   - Routes new Google users to SelectRole screen

✅ [SelectRoleScreen.tsx](src/screens/auth/SelectRoleScreen.tsx)
   - NEW FILE - Allows Google users to select Student or Staff role
   - Creates profile with selected role
   - Sets login_type to 'google'

✅ [RootNavigator.tsx](src/navigation/RootNavigator.tsx)
   - Added SelectRole to navigation stack
   - Added navigation parameter for userId

## Database Records for Google Users

When a Google user selects their role, this is saved:

```
profiles table:
├── id: (user uuid)
├── email: (google email)
├── name: (from Google profile)
├── role: 'Student' OR 'Staff' ✅
├── is_active: true
├── login_type: 'google' ✅
└── is_admin: false
```

## Testing Google OAuth Flow

### Test New Google User:
1. Uninstall/Clear app data
2. Open app, go to Login
3. Click "Continue with Google"
4. Sign in with new Google account
5. SelectRole screen appears ✅
6. Select Student or Staff
7. Profile saved to database ✅
8. Redirected to UserDashboard ✅

### Test Existing Google User:
1. Log out
2. Log back in with same Google account
3. Should skip SelectRole (profile exists)
4. Route based on stored role ✅

## Role Values in Database

Google OAuth users now have SAME roles as email/password users:
- 'Student'
- 'Staff'
- 'admin' (only if manually set)
- 'canteen staff' (only if manually set)

## Complete! 🎉

✓ Email/password registration → Default to Student (from RegisterScreen)
✓ Email/password login → Routes based on profile role
✓ Google OAuth signup → SelectRole screen (this feature)
✓ Google OAuth login → Routes based on profile role
✓ All users have consistent 'Student'/'Staff' roles in database
✓ Database has proper constraints and validation
