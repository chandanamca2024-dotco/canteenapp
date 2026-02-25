import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Linking,
  AppState,
} from 'react-native';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '../../lib/supabase';

export default function Login({ navigation, route }: any) {
  const [email, setEmail] = useState(route?.params?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  // Track if login was triggered by password form
  const isPasswordLoginRef = React.useRef(false);
  const appStateRef = React.useRef(AppState.currentState);
  const isOAuthInProgressRef = React.useRef(false);

  const normalizeRole = (role?: string | null) => {
    if (!role) return null;
    const normalized = role.toLowerCase();
    if (normalized === 'staff' || normalized === 'canteen staff') return 'canteen staff';
    if (normalized === 'student') return 'Student';
    if (normalized === 'admin') return 'admin';
    return role;
  };

  // Helper: parse URL query & hash params into URLSearchParams
  const parseUrlParams = (rawUrl: string) => {
    try {
      const qp = new URL(rawUrl).search || '';
      const hashIndex = rawUrl.indexOf('#');
      const hash = hashIndex >= 0 ? rawUrl.slice(hashIndex + 1) : '';
      const combined = (qp ? qp.replace(/^\?/, '') + '&' : '') + hash;
      return new URLSearchParams(combined);
    } catch (err) {
      console.error('parseUrlParams error:', err, rawUrl);
      return new URLSearchParams('');
    }
  };

  // Re-check session (used after OAuth deep-link polling)
  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (profile?.role === 'admin') {
            navigation.navigate('AdminDashboard');
          } else if (profile?.role === 'canteen staff') {
            navigation.navigate('StaffDashboard');
          } else {
            // user role (student or staff designation) goes to UserDashboard
            navigation.navigate('UserDashboard');
          }
        } catch (err) {
          console.error('Profile lookup error:', err);
          navigation.navigate('UserDashboard');
        }
      }
    } catch (err) {
      console.error('checkAuth error:', err);
    }
  };

  // Handle deep links for OAuth callback (supports PKCE and implicit)
  const handleDeepLink = async (event: { url: string }) => {
    if (event.url) {
      console.log('📲 Deep link received:', event.url);
      console.log('🔍 Checking if this is an OAuth callback...');

      const params = parseUrlParams(event.url);
      const hasAccessToken = params.has('access_token');

      if (hasAccessToken) {
        // Mobile implicit flow: use setSession with tokens
        console.log('✅ Implicit flow detected (tokens present).');
        try {
          const access_token = params.get('access_token') || '';
          const refresh_token = params.get('refresh_token') || '';
          const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) {
            console.error('❌ Session setup error:', error);
            Alert.alert('Login Error', error.message);
          } else if (data?.session) {
            console.log('✅ Session established via implicit:', data.user?.email);
          } else {
            console.log('⏳ No session returned yet, rechecking...');
            setTimeout(() => checkAuth(), 1000);
          }
        } catch (err) {
          console.error('❌ Implicit session setup error:', err);
          Alert.alert('Login Error', 'Failed to complete Google sign-in');
        } finally {
          setLoading(false);
        }
      } else {
        // Not a valid OAuth callback for mobile
        console.log('ℹ️ Deep link is not an OAuth callback, ignoring.');
        setLoading(false);
      }
    }
  };

  // Listen for OAuth callback
  useEffect(() => {
    // We keep a listener for auth state changes and deep link handling.
    // Do NOT auto-navigate here on mount; show Login first so user can
    // explicitly log in. Post-sign-in navigation is handled in the
    // onAuthStateChange handler below.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      console.log('Auth event:', event);
      console.log('OAuth in progress?', isOAuthInProgressRef.current);
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ User signed in:', session.user.email);
        try {
          setLoading(true);
          // ⚡ FAST: Reduced timeout to 1 second for quick navigation
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Profile lookup timeout')), 1000)
          );
          // Check if profile already exists (with timeout)
          const profilePromise = supabase
            .from('profiles')
            .select('id, role')
            .eq('id', session.user.id)
            .single();
          let existingProfile = null;
          try {
            const result: any = await Promise.race([profilePromise, timeoutPromise]);
            existingProfile = result?.data;
          } catch (err) {
            console.warn('Profile lookup timeout or error, proceeding anyway:', err);
          }
          // For Google OAuth users, ask them to select Student or Staff only once
          const isGoogleUser = session.user.app_metadata?.providers?.includes('google');
          const metadataRole = normalizeRole(
            session.user.user_metadata?.role || session.user.app_metadata?.role || null
          );

          if (isGoogleUser && !existingProfile) {
            let effectiveRole = metadataRole;

            if (!effectiveRole) {
              try {
                const { data: latestUser } = await supabase.auth.getUser();
                effectiveRole = normalizeRole(latestUser?.user?.user_metadata?.role || null);
              } catch (err) {
                console.warn('Unable to refresh user metadata:', err);
              }
            }

            if (effectiveRole) {
              // Backfill profile from metadata so we don't prompt again
              console.log('Creating profile for Google user...');
              // ⚡ FAST: Create profile in background with 2-second timeout
              const insertPromise = supabase
                .from('profiles')
                .insert([
                  {
                    id: session.user.id,
                    name:
                      session.user.user_metadata?.full_name ||
                      session.user.email?.split('@')[0] ||
                      'User',
                    email: session.user.email,
                    role: effectiveRole,
                    is_active: true,
                  },
                ]);

              const insertTimeout = new Promise((resolve) =>
                setTimeout(() => resolve({ error: null }), 2000)
              );

              try {
                const { error: insertError } = await Promise.race([insertPromise, insertTimeout]) as any;
                if (insertError) {
                  console.error('Profile insert error:', insertError);
                } else {
                  console.log('✅ Profile saved successfully');
                }
              } catch (err) {
                console.warn('Profile insert timed out, continuing anyway');
              }

              setLoading(false);
              isOAuthInProgressRef.current = false;
              console.log('🎯 Navigating to dashboard based on role:', effectiveRole);
              if (effectiveRole === 'admin') {
                navigation.replace('AdminDashboard');
              } else if (effectiveRole === 'canteen staff') {
                navigation.replace('StaffDashboard');
              } else {
                navigation.replace('UserDashboard');
              }
              return;
            }

            // No role known yet - go to SelectRole once
            setLoading(false);
            isOAuthInProgressRef.current = false;
            console.log('🎯 Navigating to SelectRole');
            navigation.replace('SelectRole', { userId: session.user.id });
            return;
          }

          // If profile exists, navigate to appropriate dashboard
          if (existingProfile?.role) {
            setLoading(false);
            isOAuthInProgressRef.current = false;
            const existingRole = normalizeRole(existingProfile.role);
            console.log('🎯 Navigating to dashboard based on existing profile:', existingRole);
            if (existingRole === 'admin') {
              navigation.replace('AdminDashboard');
            } else if (existingRole === 'canteen staff') {
              navigation.replace('StaffDashboard');
            } else {
              navigation.replace('UserDashboard');
            }
            return;
          }
          
          // For new non-Google users without profile, create one
          if (!existingProfile && !isGoogleUser) {
            console.log('Creating default profile for new user...');
            // ⚡ FAST: Create profile with 1-second timeout
            const insertPromise = supabase
              .from('profiles')
              .insert([
                {
                  id: session.user.id,
                  name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
                  email: session.user.email,
                  role: 'Student',
                  is_active: true,
                },
              ]);
            
            const insertTimeout = new Promise((resolve) =>
              setTimeout(() => resolve({ error: null }), 1000)
            );

            try {
              const { error: insertError } = await Promise.race([insertPromise, insertTimeout]) as any;
              if (insertError) {
                console.error('Profile insert error:', insertError);
              } else {
                console.log('✅ Profile saved successfully');
              }
            } catch (err) {
              console.warn('Profile insert timed out, continuing anyway');
            }
          }
          setLoading(false);
          // Navigation and success alert for password login handled in handleLogin
        } catch (err: any) {
          console.error('Auth handler error:', err);
          setLoading(false);
          // Still navigate even if there's an error
          // Navigation for password login handled in handleLogin
        }
      }
    });

    // Handle deep links for OAuth callback (supports PKCE and implicit)
    const handleDeepLink = async (event: { url: string }) => {
      if (event.url) {
        console.log('📲 Deep link received:', event.url);
        console.log('🔍 Checking if this is an OAuth callback...');
        console.log('🔍 OAuth in progress?', isOAuthInProgressRef.current);
        
        // Skip if we're already in the middle of OAuth (handled by InAppBrowser)
        if (isOAuthInProgressRef.current) {
          console.log('⏩ OAuth already in progress, ignoring deep link');
          return;
        }
        
        // Parse both query and hash params
        const params = parseUrlParams(event.url);
        const hasAccessToken = params.has('access_token');
        const hasCode = params.has('code');

        if (hasAccessToken) {
          // Mobile implicit flow: use setSession with tokens
          console.log('✅ Implicit flow detected (tokens present).');
          try {
            const access_token = params.get('access_token') || '';
            const refresh_token = params.get('refresh_token') || '';
            console.log('🔑 Setting session with access token...');
            const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
            if (error) {
              console.error('❌ Session setup error:', error);
              isOAuthInProgressRef.current = false;
              setLoading(false);
              Alert.alert('Login Error', error.message);
            } else if (data?.session) {
              console.log('✅ Session established via implicit:', data.user?.email);
              isOAuthInProgressRef.current = false;
              // Don't set loading=false here - let onAuthStateChange handler navigate
              // Auth state change handler will navigate immediately
            } else {
              console.log('⏳ No session returned yet, rechecking...');
              isOAuthInProgressRef.current = false;
              checkAuth();
            }
          } catch (err) {
            console.error('❌ Implicit session setup error:', err);
            isOAuthInProgressRef.current = false;
            setLoading(false);
            Alert.alert('Login Error', 'Failed to complete Google sign-in');
          }
        } else if (hasCode) {
          // PKCE flow: exchange code for session
          console.log('✅ PKCE flow detected (code present).');
          try {
            const code = params.get('code') || '';
            console.log('🔑 Exchanging code for session...');
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
              console.error('❌ Code exchange error:', error);
              isOAuthInProgressRef.current = false;
              setLoading(false);
              Alert.alert('Login Error', error.message);
            } else if (data?.session) {
              console.log('✅ Session established via PKCE:', data.user?.email);
              isOAuthInProgressRef.current = false;
              // Don't set loading=false here - let onAuthStateChange handler navigate
              // Auth state change handler will navigate immediately
            } else {
              console.log('⏳ No session returned yet, rechecking...');
              isOAuthInProgressRef.current = false;
              checkAuth();
            }
          } catch (err: any) {
            console.error('❌ PKCE code exchange error:', err);
            isOAuthInProgressRef.current = false;
            setLoading(false);
            Alert.alert('Login Error', err.message || 'Failed to complete Google sign-in');
          }
        } else {
          // Check for error in callback
          if (params.has('error')) {
            const error = params.get('error');
            const errorDescription = params.get('error_description') || error;
            console.error('❌ OAuth error in callback:', error, errorDescription);
            isOAuthInProgressRef.current = false;
            setLoading(false);
            Alert.alert('Google Sign-In Error', errorDescription || 'Authentication failed');
          } else {
            // Not a valid OAuth callback
            console.log('ℹ️ Deep link is not an OAuth callback, ignoring.');
            // Don't modify loading state for non-OAuth links
          }
        }
      }
    };

    const linkSubscription = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription?.unsubscribe();
      linkSubscription.remove();
    };
  }, [navigation]);

  // 🔐 PASSWORD LOGIN
  const handleLogin = async () => {
    isPasswordLoginRef.current = true;
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    // Preflight reachability check to surface network/DNS issues clearly
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
        headers: { apikey: SUPABASE_ANON_KEY },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) {
        console.warn('Supabase preflight non-OK:', res.status);
      }
    } catch (e: any) {
      console.error('Supabase reachability error:', e?.message || e);
      setLoading(false);
      Alert.alert(
        'Network Error',
        'Cannot reach Supabase. Check internet/VPN/firewall and the SUPABASE_URL/ANON key in src/lib/supabase.ts.\n\nDetails: ' + (e?.message || 'unknown error')
      );
      return;
    }
    
    try {
      console.log('Attempting login for:', email.trim());
      // ⚡ OPTIMIZATION: Add timeout to prevent hanging (8 seconds)
      const loginTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Login timed out - please try again')), 8000)
      );
      const loginPromise = supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });
      const { data, error } = (await Promise.race([loginPromise, loginTimeout])) as any;
      setLoading(false);
      if (error) {
        console.error('Login error:', error);
        // More helpful error messages
        if (error.message.includes('Invalid login credentials')) {
          Alert.alert(
            '❌ Login Failed', 
            'Invalid email or password.\n\nIf you don\'t have an account, please tap "Sign up" below to register.',
            [
              { text: 'OK', style: 'cancel' },
              { text: 'Sign Up', onPress: () => navigation.navigate('Register') }
            ]
          );
        } else {
          Alert.alert('❌ Login Failed', error.message);
        }
        return;
      }
      if (data.user) {
        console.log('Login successful for:', data.user.email);
        // Show non-blocking success message
        setTimeout(() => {
          Alert.alert('✅ Welcome', 'Logged in successfully!');
        }, 100);
        // Navigate immediately based on role
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();
          if (profile?.role === 'admin') {
            navigation.reset({ index: 0, routes: [{ name: 'AdminDashboard' }] });
          } else if (profile?.role === 'canteen staff') {
            navigation.reset({ index: 0, routes: [{ name: 'StaffDashboard' }] });
          } else {
            navigation.reset({ index: 0, routes: [{ name: 'UserDashboard' }] });
          }
        } catch {
          navigation.reset({ index: 0, routes: [{ name: 'UserDashboard' }] });
        }
      }
    } catch (err: any) {
      setLoading(false);
      console.error('Login error:', err);
      Alert.alert('❌ Error', err.message || 'Login failed');
    }
  };

  // 🔑 GOOGLE LOGIN
  const continueWithGoogle = async () => {
    try {
      if (isOAuthInProgressRef.current) {
        return;
      }

      setLoading(true);
      isOAuthInProgressRef.current = true;

      console.log('🚀 Starting Google OAuth flow...');
      console.log('📱 Redirect URL: dinedesk://auth/callback');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'dinedesk://auth/callback',
          skipBrowserRedirect: false,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        console.error('❌ OAuth error:', error);
        isOAuthInProgressRef.current = false;
        setLoading(false);
        Alert.alert('Error', 'Failed to start Google sign-in: ' + error.message);
        return;
      }

      if (!data?.url) {
        console.error('❌ No OAuth URL received');
        isOAuthInProgressRef.current = false;
        setLoading(false);
        Alert.alert('Error', 'Google OAuth not configured. Please check Supabase settings.');
        return;
      }

      console.log('✅ Opening in-app browser...');

      // ⚡ Open in-app browser WITHOUT warmup (warmup was causing the delay)
      const result = await InAppBrowser.openAuth(
        data.url,
        'dinedesk://auth/callback',
        {
          dismissButtonStyle: 'cancel',
          preferredBarTintColor: '#ffffff',
          preferredControlTintColor: '#000000',
          readerMode: false,
          animated: true,
          modalPresentationStyle: 'fullScreen',
          modalTransitionStyle: 'coverVertical',
          modalEnabled: true,
          enableBarCollapsing: false,
          ephemeralWebSession: false,
        }
      );

      console.log('InAppBrowser result:', result.type);

      if (result.type === 'cancel') {
        console.log('User cancelled OAuth');
        isOAuthInProgressRef.current = false;
        setLoading(false);
        return;
      }

      if (result.type === 'success' && result.url) {
        console.log('OAuth callback received:', result.url);
        const params = parseUrlParams(result.url);
        
        if (params.has('access_token')) {
          const access_token = params.get('access_token') || '';
          const refresh_token = params.get('refresh_token') || '';
          console.log('Setting session with access token');
          const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
          if (sessionError) {
            console.error('❌ Session error:', sessionError);
            isOAuthInProgressRef.current = false;
            setLoading(false);
            Alert.alert('Error', 'Failed to establish session');
            return;
          }
          console.log('✅ Session set successfully, waiting for auth state change...');
          // Wait a moment for onAuthStateChange to fire and handle navigation
          await new Promise(resolve => setTimeout(resolve, 500));
          // If still here after 500ms, auth state change should have handled it
        } else if (params.has('code')) {
          const code = params.get('code') || '';
          console.log('Exchanging code for session');
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error('❌ Code exchange error:', exchangeError);
            isOAuthInProgressRef.current = false;
            setLoading(false);
            Alert.alert('Error', 'Failed to exchange code for session');
            return;
          }
          console.log('✅ Code exchanged successfully, waiting for auth state change...');
          // Wait a moment for onAuthStateChange to fire and handle navigation
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          console.error('❌ No tokens or code in callback URL');
          isOAuthInProgressRef.current = false;
          setLoading(false);
          Alert.alert('Error', 'Invalid OAuth callback');
        }
      } else {
        console.log('InAppBrowser closed without success, resetting state');
        isOAuthInProgressRef.current = false;
        setLoading(false);
      }
    } catch (err: any) {
      console.error('❌ Google login error:', err);
      isOAuthInProgressRef.current = false;
      setLoading(false);
      Alert.alert('Error', err.message || 'Failed to initiate Google login');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome Back</Text>
          <Text style={styles.subtitle}>Login to your account</Text>

          <AppInput
            placeholder="Email address"
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
            title={loading ? 'Logging in...' : 'Login'}
            onPress={handleLogin}
            disabled={loading}
          />

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.or}>OR</Text>
            <View style={styles.line} />
          </View>

          <AppButton
            title="Continue with Google"
            type="secondary"
            onPress={continueWithGoogle}
            disabled={loading}
          />

          <Text style={styles.signupText}>
            Don't have an account?{' '}
            <Text
              style={styles.signupLink}
              onPress={() => navigation.navigate('Register')}
            >
              Sign up
            </Text>
          </Text>

          <TouchableOpacity
            style={styles.adminBtn}
            onPress={() => navigation.navigate('AdminLogin')}
            disabled={loading}
          >
            <Text style={styles.adminBtnText}>👨‍💼 Admin Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.staffBtn}
            onPress={() => navigation.navigate('StaffLogin')}
            disabled={loading}
          >
            <Text style={styles.staffBtnText}>👨‍🍳 Canteen Staff Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    fontSize: 60,
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
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
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 22,
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  or: {
    marginHorizontal: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  signupText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 18,
  },
  signupLink: {
    color: '#3B82F6',
    fontWeight: '700',
  },
  adminBtn: {
    marginTop: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  adminBtnText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  staffBtn: {
    marginTop: 4,
    paddingVertical: 10,
    alignItems: 'center',
  },
  staffBtnText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '600',
  },
});
