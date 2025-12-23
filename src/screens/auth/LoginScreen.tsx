import React, { useState } from 'react';
import {
  View,
  Text,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import { supabase } from '../../lib/supabase';
import { sendOtpCode } from '../../lib/otpService';

export default function Login({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // 🔐 EMAIL OTP LOGIN / SIGNUP
  const sendOtp = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    setLoading(true);

    try {
      // First, create auth user if doesn't exist
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
        },
      });

      if (authError && authError.message !== 'User already registered') {
        throw authError;
      }

      // Then send custom OTP code
      const result = await sendOtpCode(email.trim(), 'login');

      setLoading(false);

      if (result.success) {
        Alert.alert('✅ OTP Sent', `Check your email at ${email.trim()}\n\nCode valid for 10 minutes`);
        navigation.navigate('Otp', { email: email.trim(), mode: 'login' });
      } else {
        Alert.alert('❌ Error', result.message);
      }
    } catch (error: any) {
      setLoading(false);
      Alert.alert('❌ Error', error.message || 'Failed to send OTP');
      console.error('Send OTP error:', error);
    }
  };

  // 🔑 GOOGLE LOGIN / SIGNUP
  const continueWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'com.dinedeskapp://oauth-callback',
      },
    });

    if (error) {
      Alert.alert('❌ Google Error', error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>🍽️ DineDesk</Text>
      <Text style={styles.subtitle}>Login or create account with email</Text>

      {/* EMAIL */}
      <AppInput
        placeholder="Email address"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        editable={!loading}
      />

      {/* SEND OTP */}
      <AppButton
        title={loading ? '⏳ Sending OTP...' : '📧 Send OTP'}
        onPress={sendOtp}
        disabled={loading || !email.trim()}
      />

      {/* OR */}
      <Text style={styles.or}>OR</Text>

      {/* GOOGLE */}
      <AppButton
        title="🔑 Continue with Google"
        type="secondary"
        onPress={continueWithGoogle}
        disabled={loading}
      />

      {/* ADMIN LOGIN */}
      <TouchableOpacity
        style={styles.adminBtn}
        onPress={() => navigation.navigate('AdminLogin')}
        disabled={loading}
      >
        <Text style={styles.adminText}>👤 Admin Login</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  or: {
    textAlign: 'center',
    marginVertical: 16,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  adminBtn: {
    marginTop: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  adminText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 16,
  },
});
