import React, { useState } from 'react';
import {
  View,
  Text,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import { supabase } from '../../lib/supabase';
import { sendOtpCode } from '../../lib/otpService';

export default function Register({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Student');
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    if (!name || !email || !phone) {
      Alert.alert('Error', 'Fill all fields');
      return;
    }

    setLoading(true);

    try {
      // Check if user already exists
      const { data } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: 'dummy', // Will fail, just checking if user exists
      }).catch(() => ({ data: null }));

      // User might exist, try to verify
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.trim())
        .maybeSingle();

      if (existingUser) {
        setLoading(false);
        Alert.alert(
          'Email Already Registered',
          'This email is already in use. Please login instead.'
        );
        navigation.navigate('Login');
        return;
      }
    } catch (err) {
      console.log('Pre-check error:', err);
    }

    // Send custom OTP code via email
    const result = await sendOtpCode(email.trim(), 'register');

    setLoading(false);

    if (!result.success) {
      Alert.alert('Error', result.message);
      return;
    }

    Alert.alert('✅ OTP Sent', result.message);
    navigation.navigate('Otp', { 
      email: email.trim(), 
      mode: 'register',
      name: name.trim(),
      phone: phone.trim(),
      role: role,
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>
          Register to access DineDesk
        </Text>

        <AppInput
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
        />

        <AppInput
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <AppInput
          placeholder="Phone"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        {/* ROLE PICKER */}
        <View style={styles.pickerWrapper}>
          <Text style={styles.pickerLabel}>Select Role</Text>
          <Picker
            selectedValue={role}
            onValueChange={(value) => setRole(value)}
            style={styles.picker}
          >
            <Picker.Item label="Student" value="Student" />
            <Picker.Item label="Staff" value="Staff" />
          </Picker>
        </View>

        <AppButton
          title={loading ? 'Sending OTP...' : 'Send OTP'}
          onPress={sendOtp}
        />
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
    backgroundColor: '#FFFFFF',
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
    marginBottom: 22,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 18,
    overflow: 'hidden',
  },
  pickerLabel: {
    fontSize: 12,
    color: '#6B7280',
    paddingLeft: 12,
    paddingTop: 8,
  },
  picker: {
    height: 48,
    width: '100%',
  },
});
