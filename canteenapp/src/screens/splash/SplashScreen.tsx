import React, { useEffect } from 'react';
import {
  Image,
  StyleSheet,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

const logoSource = require('../../assets/logo.png');

const Splash = ({ navigation }: { navigation: any }) => {
  // Always use white background
  const bgColor = '#FFF';

  useEffect(() => {
    const timer = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        // Redirect to dashboard based on user role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        // Normalize role
        const normalizeRole = (role: string | null | undefined) => {
          if (!role) return null;
          const normalized = role.toLowerCase();
          if (normalized === 'canteen staff') return 'canteen staff';
          if (normalized === 'staff' || normalized === 'student') return 'student';
          if (normalized === 'admin') return 'admin';
          return normalized;
        };
        const role = normalizeRole(profile?.role);
        if (role === 'admin') {
          navigation.replace('AdminDashboard');
        } else if (role === 'canteen staff') {
          navigation.replace('StaffDashboard');
        } else if (role === 'student') {
          navigation.replace('UserDashboard');
        } else {
          navigation.replace('Login');
        }
      } else {
        navigation.replace('Login');
      }
    }, 5000); // 5 seconds
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}> 
      <View style={styles.brand}>
        <View style={styles.logoContainer}>
          <Image source={logoSource} style={styles.logoImage} resizeMode="contain" />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  logoImage: {
    width: 220,
    height: 220,
  },
});

export default Splash;
