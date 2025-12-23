import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { supabase } from '../../lib/supabase';
import { ADMIN_EMAIL } from '../../config/admin';

export default function Splash({ navigation }: any) {
  console.log('Splash screen rendering...');
  
  useEffect(() => {
    console.log('Splash useEffect triggered');
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('Checking auth...');
      const { data } = await supabase.auth.getSession();
      console.log('Session data:', data);
      
      // Display logo for 1.5 seconds
      setTimeout(() => {
        const email = (data.session?.user?.email || '').toLowerCase();
        const isAdminMeta = !!data.session?.user?.user_metadata?.is_admin;
        console.log('Navigating based on auth...');
        if (isAdminMeta || (email && email === ADMIN_EMAIL.toLowerCase())) {
          navigation.replace('AdminDashboard');
        } else if (data.session) {
          navigation.replace('UserDashboard');
        } else {
          navigation.replace('Login');
        }
      }, 1500);
    } catch (error) {
      console.log('Auth error:', error);
      setTimeout(() => navigation.replace('Login'), 1500);
    }
  };

  return (
    <View style={styles.container}>
      <Image 
        source={require('../../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#FFFFFF'
  },
  logo: {
    width: 200,
    height: 200
  }
});
