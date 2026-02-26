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

export default function Register({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Student');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignUp = async () => {
    if (!name || !email || !phone || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.trim())
        .maybeSingle();

      if (existingUser) {
        setLoading(false);
        Alert.alert(
          '❌ Email Already Registered',
          'This email is already in use. Please login instead.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Go to Login', onPress: () => navigation.navigate('Login') }
          ]
        );
        return;
      }

      // Sign up with password
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
      });

      if (signUpError) {
        setLoading(false);
        Alert.alert('❌ Sign Up Failed', signUpError.message);
        return;
      }

      if (authData?.user?.id) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              email: email.trim(),
              name: name.trim(),
              phone: phone.trim(),
              role: role,
              login_type: 'email',
            },
          ]);

        if (profileError) {
          setLoading(false);
          Alert.alert('❌ Profile Creation Failed', profileError.message);
          return;
        }

        setLoading(false);
        Alert.alert(
          '✅ Account Created Successfully!',
          'Your account has been created. Please login with your credentials.',
          [
            {
              text: 'Go to Login',
              onPress: () => {
                navigation.navigate('Login', { email: email.trim() });
              },
            },
          ]
        );
      }
    } catch (error: any) {
      setLoading(false);
      console.error('Sign up error:', error);
      Alert.alert('❌ Error', error.message || 'Failed to create account');
    }
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

        <AppInput
          placeholder="Password"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />

        <AppInput
          placeholder="Confirm Password"
          secureTextEntry={!showConfirmPassword}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
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
          title={loading ? 'Creating Account...' : 'Create Account'}
          onPress={handleSignUp}
        />

        <Text style={styles.loginLink}>
          Already have an account?{' '}
          <Text
            style={styles.loginText}
            onPress={() => navigation.navigate('Login')}
          >
            Login here
          </Text>
        </Text>
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
  loginLink: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 16,
    fontSize: 14,
  },
  loginText: {
    color: '#EF4444',
    fontWeight: '600',
  },
});
