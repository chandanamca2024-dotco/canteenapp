# Email Receipt Setup Guide

## Overview
This guide helps you set up email functionality for sending receipts to users automatically.

## Method 1: Using Supabase Edge Function (Recommended for Production)

### Step 1: Install Supabase CLI
```bash
npm install -g supabase
```

### Step 2: Create Edge Function
Navigate to your Supabase project directory and create a new edge function:

```bash
supabase functions new send-receipt-email
```

### Step 3: Edge Function Code
Create/update `supabase/functions/send-receipt-email/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') // or use SendGrid, Mailgun, etc.

serve(async (req) => {
  try {
    const { to, subject, html, attachments } = await req.json()

    // Using Resend (https://resend.com) - Free tier: 100 emails/day
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'DineDesk <receipts@yourdomain.com>',
        to: [to],
        subject: subject,
        html: html,
        attachments: attachments || []
      })
    })

    const data = await res.json()

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

### Step 4: Deploy Edge Function
```bash
supabase functions deploy send-receipt-email
```

### Step 5: Set Environment Variables
In Supabase Dashboard → Project Settings → Edge Functions → Secrets:
```
RESEND_API_KEY=your_resend_api_key_here
```

### Step 6: Get Resend API Key
1. Go to https://resend.com
2. Sign up for free account
3. Get API key from dashboard
4. Add to Supabase secrets

## Method 2: Using Direct Email Service (Alternative)

If you don't want to use Edge Functions, you can use alternative email services:

### Option A: Nodemailer with Backend API
Create a backend API that uses Nodemailer to send emails.

### Option B: EmailJS (Client-side, easiest for testing)
1. Go to https://www.emailjs.com
2. Sign up and get API keys
3. Update the app to use EmailJS

## Method 3: Email Client Fallback (Current Implementation)

The app currently has a fallback that opens the user's email client with pre-filled receipt data. This works without any backend setup but requires manual sending.

## Testing Email Functionality

After setup, test the email feature:

1. Complete an order in the app
2. Go to Receipt screen
3. Click "Send to Email" button
4. Check the registered email

## Troubleshooting

### Email not sending
- Check Supabase Edge Function logs
- Verify RESEND_API_KEY is set correctly
- Check email service quota limits

### Permission issues
- Ensure user has verified email in profiles table
- Check Row Level Security policies on profiles table

## Email Services Comparison

| Service | Free Tier | Setup Difficulty | Recommended For |
|---------|-----------|------------------|-----------------|
| Resend | 100/day | Easy | Production |
| SendGrid | 100/day | Medium | Production |
| EmailJS | 200/month | Very Easy | Testing |
| Mailgun | 5000/month | Medium | Production |
| AWS SES | 62,000/month | Hard | Enterprise |

## Next Steps

1. Choose an email service provider
2. Set up Edge Function or backend API
3. Add email verification to user registration
4. Test thoroughly before production deployment

## Security Notes

⚠️ **Important Security Considerations:**
- Never expose API keys in client-side code
- Always use environment variables for sensitive data
- Implement rate limiting to prevent abuse
- Validate email addresses before sending
- Use verified sender domains in production
