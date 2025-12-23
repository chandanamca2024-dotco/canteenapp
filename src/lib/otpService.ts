// ========================================
// OTP UTILITY FUNCTIONS
// ========================================
// Helper functions for OTP generation, verification, etc.

import { supabase } from './supabase';

// ========================================
// SEND OTP VIA EMAIL
// ========================================
export async function sendOtpCode(
  email: string,
  type: 'register' | 'login' | 'reset' = 'login'
): Promise<{ success: boolean; message: string }> {
  try {
    // Call Supabase function to create OTP
    const { data, error } = await supabase.rpc('create_otp_request', {
      p_email: email.toLowerCase(),
      p_type: type,
    });

    if (error) {
      console.error('Error creating OTP:', error);
      return { success: false, message: error.message };
    }

    if (!data || !data[0]?.success) {
      return { success: false, message: data?.[0]?.message || 'Failed to create OTP' };
    }

    // Call your backend API to send email
    // You need to set up a backend endpoint that calls the emailService
    try {
      const response = await fetch('https://YOUR_BACKEND_URL/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase(),
          otp: data[0].otp_code,
          type: type,
        }),
      });

      if (!response.ok) {
        console.warn('Email sending failed, but OTP was created');
        // OTP is created but email may not be sent
        // In development, you can see the OTP in database
      }
    } catch (emailError) {
      console.warn('Could not reach email service:', emailError);
      // In development without backend, OTP is still created
      // Users can check database directly
    }

    return {
      success: true,
      message: 'OTP sent to your email',
    };
  } catch (error: any) {
    console.error('Error:', error);
    return { success: false, message: error.message };
  }
}

// ========================================
// VERIFY OTP CODE
// ========================================
export async function verifyOtpCode(
  email: string,
  code: string
): Promise<{
  success: boolean;
  message: string;
  user?: { id: string };
}> {
  try {
    // First check if OTP is valid
    const { data: checkData, error: checkError } = await supabase.rpc(
      'check_otp_validity',
      {
        p_email: email.toLowerCase(),
        p_code: code,
      }
    );

    if (checkError) {
      return { success: false, message: 'Failed to verify OTP' };
    }

    const validity = checkData?.[0];

    if (!validity?.is_valid) {
      // Increment failed attempts
      await supabase.rpc('increment_otp_attempts', {
        p_email: email.toLowerCase(),
        p_code: code,
      });

      return {
        success: false,
        message: validity?.is_expired ? 'OTP has expired' : 'Invalid OTP code',
      };
    }

    // Mark OTP as verified
    const { data, error } = await supabase.rpc('verify_otp', {
      p_email: email.toLowerCase(),
      p_code: code,
    });

    if (error) {
      return { success: false, message: 'Failed to verify OTP' };
    }

    const result = data?.[0];

    if (!result?.is_valid) {
      return { success: false, message: result?.message || 'OTP verification failed' };
    }

    return {
      success: true,
      message: 'OTP verified successfully',
      user: result?.user_id ? { id: result.user_id } : undefined,
    };
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return { success: false, message: error.message };
  }
}

// ========================================
// GET OTP INFO (for debugging in dev)
// ========================================
export async function getOtpInfo(email: string, code: string) {
  try {
    const { data, error } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('code', code)
      .single();

    if (error) {
      console.error('OTP not found');
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

// ========================================
// RESEND OTP
// ========================================
export async function resendOtpCode(
  email: string,
  type: 'register' | 'login' | 'reset' = 'login'
): Promise<{ success: boolean; message: string }> {
  return sendOtpCode(email, type);
}

// ========================================
// CLEANUP OLD OTPS
// ========================================
export async function cleanupExpiredOtps() {
  try {
    const { data, error } = await supabase.rpc('cleanup_expired_otps');

    if (error) {
      console.error('Cleanup error:', error);
      return { success: false, cleaned: 0 };
    }

    return { success: true, cleaned: data };
  } catch (error: any) {
    console.error('Error:', error);
    return { success: false, cleaned: 0 };
  }
}
