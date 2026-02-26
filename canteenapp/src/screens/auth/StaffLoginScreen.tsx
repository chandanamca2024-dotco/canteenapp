import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import { supabase } from '../../lib/supabase';

export default function StaffLogin({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Sign in with email and password
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) {
        let errorMessage = signInError.message || 'Login failed';
        if (errorMessage.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password\n\nPlease check your credentials and try again.';
        }
        setError(errorMessage);
        Alert.alert('Login Error', errorMessage);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError('No user found');
        Alert.alert('Error', 'No user found');
        setLoading(false);
        return;
      }

      // Check if user has canteen staff role in profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        setError('Profile not found');
        Alert.alert('Error', 'Staff profile not found. Please contact admin.');
        setLoading(false);
        return;
      }

      // Check if role is canteen staff
      const normalizedRole = profile.role.toLowerCase();
      if (normalizedRole !== 'canteen staff' && normalizedRole !== 'staff') {
        await supabase.auth.signOut();
        setError('Not authorized as canteen staff');
        Alert.alert(
          'Access Denied',
          'You are not authorized as canteen staff.\n\nYour role: ' + profile.role
        );
        setLoading(false);
        return;
      }

      setLoading(false);
      
      // Show success message
      Alert.alert('✅ Welcome', 'Logged in successfully!', [
        {
          text: 'OK',
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'StaffDashboard' }],
            });
          },
        },
      ]);
    } catch (err: any) {
      let message = err?.message || 'An error occurred during login';
      if (message.includes('network') || message.includes('request failed')) {
        message += '\n\nPlease check your internet connection and try again.';
      }
      setError(message);
      Alert.alert('Error', message);
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.icon}>👨‍🍳</Text>
          <Text style={styles.title}>Canteen Staff Login</Text>
        </View>
        <Text style={styles.subtitle}>
          Access the kitchen management dashboard
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <AppInput
          placeholder="Staff Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
          icon="✉️"
        />

        <View style={styles.passwordContainer}>
          <AppInput
            placeholder="Password"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            editable={!loading}
            icon="🔒"
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={{ fontSize: 18 }}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        </View>

        <AppButton
          title={loading ? 'Logging in...' : 'Login as Staff'}
          onPress={login}
          disabled={loading}
        />

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.backText}>← Back to main login</Text>
        </TouchableOpacity>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
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
  header: {
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 10,
  },
  backButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  backText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    marginTop: 24,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 20,
  },
});
