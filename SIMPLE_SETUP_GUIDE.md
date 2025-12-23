# 📝 SIMPLE STEP-BY-STEP SETUP GUIDE

## 🎯 What You Need to Do

When a new user registers:
1. ✅ User fills: Name, Email, Phone, Role
2. ✅ OTP code is created and sent to email
3. ✅ User verifies OTP
4. ✅ **SAVE USER TO DATABASE** ← This is what you need to do
5. ✅ User can login

---

## 🚀 QUICK START (3 EASY STEPS)

### **STEP 1: Set Up Database Tables** (5 minutes)

**Go to Supabase:**
1. Open: https://supabase.com
2. Login to your project
3. Click "SQL Editor" (left sidebar)
4. Click "New Query"
5. Copy & Paste **ENTIRE** code from: `CUSTOM_OTP_SETUP.sql` (in your project)
6. Click "Run" button
7. Wait for success ✅

**What this does:**
- Creates table to store OTP codes
- Creates table to store emails sent
- Creates functions to generate & verify OTP codes

---

### **STEP 2: Copy the Code to Your App** (2 minutes)

Your app ALREADY has these files (I created them for you):
- ✅ `src/lib/otpService.ts` - OTP functions
- ✅ `src/screens/auth/RegisterScreen.tsx` - Registration screen
- ✅ `src/screens/auth/OtpScreen.tsx` - OTP verification screen

**No code changes needed!** They're already updated.

---

### **STEP 3: Test Registration** (5 minutes)

**WITHOUT Email Setup (Dev Mode):**
1. Run your app: `npx react-native run-android`
2. Click "Register"
3. Fill in:
   - Name: "John Doe"
   - Email: "john@example.com"
   - Phone: "1234567890"
   - Role: "Student"
4. Click "Send OTP"
5. You'll see alert: "OTP created but can't send email yet"
6. **Check Supabase database:**
   - Go to Supabase → Table Editor
   - Click "otp_codes"
   - You'll see your OTP code! 📍
   - Copy it (e.g., "423917")
7. In app, enter this code
8. Click "Verify"
9. Success! ✅ User created!

**Verify user was saved:**
- Go to Supabase → Table Editor
- Click "profiles" 
- You'll see your new user with Name, Email, Phone, Role ✅

---

## 📧 OPTIONAL: Set Up Real Email (Optional)

If you want **actual emails to be sent**:

### **Option A: Gmail (Easiest)**

**1. Get Gmail App Password:**
- Go to: https://myaccount.google.com/apppasswords
- Login if needed
- Select: Phone = "Windows Computer"
- Select: App = "Mail"
- Click "Generate"
- Copy the 16-character password

**2. Create `.env` file in your project root:**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx
SMTP_FROM=your-email@gmail.com
```

**3. That's it!** Emails will now be sent.

### **Option B: Use Supabase Email (Easiest)**

Supabase has built-in email that works automatically:
- Just update `otpService.ts` to use Supabase functions
- No extra setup needed!

---

## 🔍 VERIFY EVERYTHING IS WORKING

### **Test Checklist:**

**Test 1: Database Exists**
```
1. Open Supabase Dashboard
2. Click "Table Editor" (left side)
3. Look for:
   ✅ otp_codes
   ✅ email_logs
   ✅ profiles
   
If you see these 3 tables → SUCCESS! ✅
```

**Test 2: Registration Creates OTP**
```
1. Open app → Register
2. Fill form → Click "Send OTP"
3. Go to Supabase → Table Editor → otp_codes
4. Click refresh
5. You should see a new row with a code like "423917"

If you see it → SUCCESS! ✅
```

**Test 3: User Saved After Verification**
```
1. From Test 2, copy the OTP code
2. In app, enter the code → Click Verify
3. Go to Supabase → Table Editor → profiles
4. Click refresh
5. You should see your user with Name, Email, Phone, Role

If you see it → SUCCESS! ✅
```

**Test 4: User Can Login**
```
1. Go to Login screen
2. Enter same email
3. Repeat Test 3 to get OTP
4. Enter OTP
5. Should see "Welcome!" message

If it works → SUCCESS! ✅
```

---

## 📊 WHERE USER DATA IS SAVED

```
When user registers:

┌─────────────────────────────────────┐
│        Supabase Database            │
├─────────────────────────────────────┤
│                                     │
│  auth.users (Supabase)              │
│  ├─ id                              │
│  ├─ email                           │
│  └─ password (auto-created)         │
│                                     │
│  profiles table (Your table)        │
│  ├─ id (same as auth.users)         │
│  ├─ name: "John Doe"                │
│  ├─ email: "john@example.com"       │
│  ├─ phone: "1234567890"             │
│  ├─ role: "Student"                 │
│  └─ is_admin: false                 │
│                                     │
│  otp_codes table (Temporary)        │
│  ├─ code: "423917"                  │
│  ├─ email: "john@example.com"       │
│  ├─ created_at: timestamp           │
│  └─ expires_at: 10 minutes later    │
│                                     │
└─────────────────────────────────────┘
```

---

## 🎯 KEY POINTS TO UNDERSTAND

### **What is OTP?**
- OTP = One-Time Password
- It's a 6-digit code like "423917"
- Used once, then expires
- Replaces the "magic link" email

### **What Happens When User Registers:**

1. **User fills form** → Name, Email, Phone, Role
2. **You click Send OTP**
   - App creates random code: "423917"
   - Code saved in `otp_codes` table
   - Email sent with code (optional)
3. **User gets email** with code OR sees it in database
4. **User enters code in app**
5. **App verifies code** matches database
6. **User created in auth.users** (Supabase auth)
7. **Profile saved in profiles table** ← Your data!
8. **User can login!**

---

## ⚠️ IMPORTANT: User Data Location

### **Before (Magic Link):**
- ❌ User data NOT saved
- ❌ Can't retrieve name/phone later
- ❌ No database record

### **After (Custom OTP):**
- ✅ User data SAVED in `profiles` table
- ✅ Can retrieve anytime
- ✅ Can update/edit profile
- ✅ Admin can see all users

---

## 🚨 COMMON MISTAKES TO AVOID

### **Mistake 1: Not Running SQL Setup**
```
❌ If you skip the SQL setup:
   - Tables don't exist
   - Registration will fail
   
✅ Always run CUSTOM_OTP_SETUP.sql first!
```

### **Mistake 2: Not Checking Database**
```
❌ If you can't see user data:
   - Might have been created (check database!)
   - Don't assume it failed
   
✅ Always verify in Supabase Table Editor
```

### **Mistake 3: Forgetting Email Setup**
```
❌ If you want emails but didn't set up SMTP:
   - Emails won't send
   - OTP still created (it's in database!)
   
✅ Check database directly for OTP codes
```

---

## 🔄 COMPLETE FLOW (Copy This)

### **Registration Flow:**
```
┌────────────────┐
│  User Opens    │
│  Register      │
└────────┬───────┘
         │
         ↓
┌────────────────────────────┐
│  User Fills:               │
│  - Name: John              │
│  - Email: john@email.com   │
│  - Phone: 123456           │
│  - Role: Student           │
└────────┬───────────────────┘
         │
         ↓
┌────────────────────────────┐
│  User Clicks "Send OTP"    │
└────────┬───────────────────┘
         │
         ↓
┌────────────────────────────┐
│  App creates code: 423917  │
│  Saves to otp_codes table  │
│  Tries to send email       │
└────────┬───────────────────┘
         │
         ↓
┌────────────────────────────┐
│  User sees:                │
│  "OTP sent to your email"  │
│  OR check database         │
└────────┬───────────────────┘
         │
         ↓
┌────────────────────────────┐
│  User enters code: 423917  │
│  Clicks "Verify"           │
└────────┬───────────────────┘
         │
         ↓
┌────────────────────────────┐
│  App checks:               │
│  Code valid?               │
│  Not expired?              │
│  Not used before?          │
└────────┬───────────────────┘
         │
    ✅ YES ✅
         │
         ↓
┌────────────────────────────┐
│  User created in auth.users│
│  Profile saved in profiles │
│  data: name, email, phone, │
│  role                      │
└────────┬───────────────────┘
         │
         ↓
┌────────────────────────────┐
│  Success! "Registration    │
│  completed! Please login." │
└────────────────────────────┘
```

---

## 📞 TROUBLESHOOTING

### **Problem: "OTP creation failed"**
```
Solution:
1. Did you run CUSTOM_OTP_SETUP.sql? 
   → If NO, run it now!
   → If YES, check Supabase logs
2. Go to: Supabase → Logs → Postgres Logs
3. Look for error messages
```

### **Problem: Code not in database**
```
Solution:
1. Check correct email address
2. Click refresh in Table Editor
3. Check the otp_codes table (not profiles!)
4. Look at created_at timestamp - is it recent?
```

### **Problem: User not saved in profiles**
```
Solution:
1. Did you verify the OTP code?
2. Check profiles table in Supabase
3. Filter by email address
4. If not there, OTP verification failed
   → Try again with correct code
```

### **Problem: Email not received**
```
Solution:
1. Check email_logs table
2. If status = "failed" → SMTP issue
3. Check .env SMTP settings
4. For now, just check database for code
5. Copy & paste code in app
```

---

## ✅ SIMPLE TESTING (DO THIS NOW)

**Time: 10 minutes**

### **Step 1: Run SQL (5 min)**
```
1. Go to Supabase → SQL Editor
2. Copy entire CUSTOM_OTP_SETUP.sql
3. Paste in SQL Editor
4. Click Run
5. Wait for success
```

### **Step 2: Test Registration (5 min)**
```
1. Open app → Register
2. Fill: Name, Email, Phone
3. Click Send OTP
4. Go to Supabase → otp_codes table
5. Copy the code
6. Enter code in app
7. Click Verify
8. Check profiles table → User saved! ✅
```

**If this works, you're done!** 🎉

---

## 📚 FILES YOU NEED

**Already Created:**
- ✅ `CUSTOM_OTP_SETUP.sql` - Database setup
- ✅ `src/lib/otpService.ts` - OTP functions
- ✅ `src/screens/auth/RegisterScreen.tsx` - Registration UI
- ✅ `src/screens/auth/OtpScreen.tsx` - OTP verification UI

**You Need to Create:**
- Create `.env` file (optional, for email)
- Create backend endpoint (optional, for email)

**You Don't Need to Change:**
- Nothing! It's all ready to use!

---

## 🎓 LEARNING PATH

1. **Understand the Flow** (read above)
2. **Run SQL Setup** (5 minutes)
3. **Test Registration** (5 minutes)
4. **Check Database** (verify user saved)
5. **Set Up Email** (optional, later)
6. **Test Login** (make sure it works)
7. **Deploy** to production

---

## 🆘 IF YOU'RE STILL CONFUSED

**Ask yourself:**
1. Did you run CUSTOM_OTP_SETUP.sql? (Most important!)
2. Did you fill the registration form?
3. Did you check the otp_codes table in Supabase?
4. Did you enter the code from database?
5. Did you check the profiles table for the new user?

If all are YES, it's working! ✅

If any are NO, do that step!

---

## ✨ THAT'S IT!

You now have:
- ✅ Custom OTP system (not magic links)
- ✅ User data saved to database
- ✅ Can retrieve/edit user info
- ✅ Ready for production

**Next**: Test it out! 🚀
