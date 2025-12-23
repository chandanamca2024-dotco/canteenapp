import React, { useState } from 'react';
import {
  View,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import AppButton from '../../components/AppButton';
import { supabase } from '../../lib/supabase';
import { verifyOtpCode, resendOtpCode } from '../../lib/otpService';

export default function Otp({ route, navigation }: any) {
  const { email = '', mode = 'login', name = '', phone = '', role = 'Student' } = route.params || {};
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const verifyOtp = async () => {
    if (!email || !otp) {
      Alert.alert('Error', 'Email and OTP required');
      return;
    }

    setLoading(true);

    try {
      // Verify OTP using custom function
      const result = await verifyOtpCode(email, otp);

      if (!result.success) {
        setLoading(false);
        Alert.alert('❌ OTP Verification Failed', result.message);
        return;
      }

      // For registration, create user in auth
      if (mode === 'register') {
        try {
          // Create auth user
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: Math.random().toString(36).slice(-12), // Temporary password, won't be used
            options: {
              data: {
                name: name,
                phone: phone,
                role: role,
              },
            },
          });

          if (authError && authError.message !== 'User already registered') {
            throw authError;
          }

          // Create or update profile
          if (authData?.user) {
            const { error: profileError } = await supabase
              .from('profiles')
              .upsert({
                id: authData.user.id,
                email: email,
                name: name,
                phone: phone,
                role: role,
                is_admin: false,
                is_active: true,
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }, {
                onConflict: 'id'
              });

            if (profileError) {
              console.error('Profile creation error:', profileError);
              throw profileError;
            }
          }

          setLoading(false);
          Alert.alert('✅ Success', 'Registration completed! Please login.');
          await supabase.auth.signOut();
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        } catch (err: any) {
          console.error('Registration error:', err);
          setLoading(false);
          Alert.alert('Error', 'Registration failed: ' + err.message);
        }
      } else {
        // For login
        try {
          // Get user profile data
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', email)
            .single();

          if (profileError || !profile) {
            throw new Error('User profile not found');
          }

          // Sign in the user with a temporary password (this creates the session)
          // The password doesn't matter since OTP is already verified
          const tempPassword = Math.random().toString(36).slice(-16) + Math.random().toString(36).slice(-16);
          
          // Try to sign in with existing account
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: email,
            password: tempPassword,
          }).catch(async () => {
            // If sign in fails, user might not have password set, create one
            const { data: updateData, error: updateError } = await supabase.auth.updateUser({
              password: tempPassword,
            });
            
            if (updateError) {
              // User doesn't exist in auth, need to create
              const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: email,
                password: tempPassword,
              });
              
              if (signUpError) throw signUpError;
              return { data: signUpData, error: null };
            }
            
            // Now try signing in again
            return await supabase.auth.signInWithPassword({
              email: email,
              password: tempPassword,
            });
          });

          if (signInError) {
            throw signInError;
          }

          setLoading(false);

          if (profile.is_admin) {
            Alert.alert('✅ Login Successful', `Welcome back, ${profile.name || 'Admin'}!`);
            navigation.reset({ index: 0, routes: [{ name: 'AdminDashboard' }] });
          } else {
            Alert.alert('✅ Login Successful', `Welcome back, ${profile.name}!`);
            navigation.reset({ index: 0, routes: [{ name: 'UserDashboard' }] });
          }
        } catch (err: any) {
          console.error('Login error:', err);
          setLoading(false);
          Alert.alert('❌ Login Failed', err.message || 'Please try again');
        }
      }
    } catch (error: any) {
      setLoading(false);
      console.error('Error:', error);
      Alert.alert('Error', error.message || 'Verification failed');
    }
  };

  const resendOtp = async () => {
    if (!email) {
      Alert.alert('Error', 'Missing email to resend OTP');
      return;
    }

    setResendLoading(true);
    const result = await resendOtpCode(email, mode === 'register' ? 'register' : 'login');
    setResendLoading(false);

    if (result.success) {
      Alert.alert('✅ OTP Sent', result.message);
    } else {
      Alert.alert('❌ Error', result.message);
    }
  };

  const renderOtpBoxes = () => {
    const digits = otp.split('');
    return Array.from({ length: 6 }).map((_, index) => (
      <View
        key={index}
        style={[
          styles.otpBox,
          digits[index] ? styles.otpBoxFilled : null,
        ]}
      >
        <Text style={styles.otpText}>
          {digits[index] || ''}
        </Text>
      </View>
    ));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to{'\n'}{email}
        </Text>

        {/* Hidden Input */}
        <TextInput
          style={styles.hiddenInput}
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={(text) => {
            const digits = text.replace(/\D/g, '').slice(0, 6);
            setOtp(digits);
          }}
          autoFocus
        />

        {/* OTP BOXES */}
        <View style={styles.otpRow}>
          {renderOtpBoxes()}
        </View>

        <AppButton
          title={loading ? '⏳ Verifying...' : '✅ Verify'}
          onPress={verifyOtp}
          disabled={loading || otp.length !== 6}
        />

        <TouchableOpacity
          style={styles.resendBtn}
          onPress={resendOtp}
          disabled={resendLoading}
        >
          <Text style={styles.resendText}>
            {resendLoading ? '⏳ Resending...' : "Didn't receive code? Resend"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 26,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  otpBox: {
    width: 46,
    height: 54,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  otpBoxFilled: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  otpText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
  },
  resendBtn: {
    marginTop: 14,
    alignItems: 'center',
  },
  resendText: {
    color: '#4F46E5',
    fontWeight: '600',
  },
});
