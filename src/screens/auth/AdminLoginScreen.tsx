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

export default function AdminLogin({ navigation }: any) {
  const [email, setEmail] = useState('admin@dinedesk.com'); // Pre-filled for easier testing
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('🔐 Attempting admin login for:', email.trim());
      
      // Add timeout to prevent infinite loading (10 seconds)
      const loginTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Login timed out - please check your internet connection')), 10000)
      );

      // Sign in with email and password
      const loginPromise = supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      const { data, error: signInError } = await Promise.race([loginPromise, loginTimeout]) as any;

      if (signInError) {
        let errorMessage = signInError.message || 'Login failed';
        console.error('❌ Sign in error:', errorMessage);
        setError(errorMessage);
        Alert.alert('Login Error', errorMessage);
        setLoading(false);
        return;
      }

      if (!data?.user) {
        setError('No user found');
        Alert.alert('Error', 'No user found');
        setLoading(false);
        return;
      }

      console.log('✅ Sign in successful, checking admin role...');

      // Fast admin check - just verify role from profiles table (with timeout)
      const profileTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile check timed out')), 5000)
      );

      const profilePromise = supabase
        .from('profiles')
        .select('role, email')
        .eq('id', data.user.id)
        .maybeSingle();

      let profile: any = null;
      try {
        const result = await Promise.race([profilePromise, profileTimeout]) as any;
        profile = result?.data;
      } catch (err) {
        console.warn('⚠️ Profile check timed out, proceeding anyway');
      }

      // Check if user is admin (by role or email)
      const isAdmin = profile?.role?.toLowerCase() === 'admin' || 
                      data.user.email?.toLowerCase() === 'admin@dinedesk.com';
      
      if (!isAdmin) {
        console.error('❌ Not authorized as admin');
        // Sign out non-admin users
        await supabase.auth.signOut();
        setError('Not authorized');
        Alert.alert('Access Denied', 'You are not authorized as an admin');
        setLoading(false);
        return;
      }

      console.log('✅ Admin verified, logging in...');

      // Store admin login record (non-blocking, with timeout)
      supabase.from('admin_logins').insert({
        admin_user: data.user.id,
        email: email.toLowerCase(),
        device: 'mobile',
        app_version: '1.0.0',
        success: true,
      }).then(() => {
        console.log('📝 Login record saved');
      }).catch((err) => {
        console.warn('⚠️ Failed to save login record:', err);
      });

      setLoading(false);
      
      // Navigate to admin dashboard
      console.log('🎯 Navigating to AdminDashboard');
      navigation.replace('AdminDashboard');
    } catch (err: any) {
      console.error('❌ Login error:', err);
      let message = err?.message || 'An error occurred during login';
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

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.backText}>← Back to main login</Text>
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>ℹ️ Default Admin Credentials</Text>
          <Text style={styles.infoText}>
            Email: admin@dinedesk.com{'\n'}
            Password: (check Supabase Dashboard)
          </Text>
          <Text style={styles.infoSubtext}>
            Create admin user in Supabase if it doesn't exist
          </Text>
        </View>
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
    fontFamily: 'monospace',
  },
  infoSubtext: {
    fontSize: 11,
    color: '#60A5FA',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
