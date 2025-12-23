import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import { supabase } from '../../lib/supabase';
import { isUserAdmin } from '../../lib/adminDataHelper';

export default function AdminLogin({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = async () => {
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
        // Add helpful message for network errors
        if (errorMessage.includes('network') || errorMessage.includes('request failed')) {
          errorMessage += '\n\nPlease check your internet connection and try again.';
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

      // Check if user is admin
      const adminStatus = await isUserAdmin();
      
      if (!adminStatus) {
        // Sign out non-admin users
        await supabase.auth.signOut();
        setError('Not authorized');
        Alert.alert('Access Denied', 'You are not authorized as an admin');
        setLoading(false);
        return;
      }

      // Store admin login record
      const loginRecord = await supabase.from('admin_logins').insert({
        admin_user: data.user.id,
        email: email.toLowerCase(),
        device: 'mobile',
        app_version: '1.0.0',
        success: true,
      });
      
      if (loginRecord.error) {
        // Silent fail - not critical
        console.log('Login record not saved:', loginRecord.error);
      }

      // Navigate to admin dashboard
      navigation.replace('AdminDashboard');
    } catch (err: any) {
      let message = err?.message || 'An error occurred during login';
      // Add helpful message for network errors
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
        <Text style={styles.title}>Admin Login</Text>
        <Text style={styles.subtitle}>
          Login to manage canteen operations
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <AppInput
          placeholder="Admin Email"
          value={email}
          onChangeText={(text: string) => {
            setEmail(text);
            setError('');
          }}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!loading}
        />

        <AppInput
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={(text: string) => {
            setPassword(text);
            setError('');
          }}
          editable={!loading}
        />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>Verifying credentials...</Text>
          </View>
        ) : (
          <AppButton
            title="Login"
            onPress={login}
            disabled={!email.trim() || !password || loading}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
    fontWeight: '500',
  },
});
