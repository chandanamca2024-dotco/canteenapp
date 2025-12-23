import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';

import Splash from '../screens/splash/SplashScreen';
import Login from '../screens/auth/LoginScreen';
import Register from '../screens/auth/RegisterScreen';
import Otp from '../screens/auth/OtpScreen';
import AdminLogin from '../screens/auth/AdminLoginScreen';
import UserDashboard from '../screens/user/UserDashboard';
import AdminDashboard from '../screens/admin/AdminDashboard';
import { supabase } from '../lib/supabase';
import { ADMIN_EMAIL } from '../config/admin';
import { View, ActivityIndicator } from 'react-native';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  Otp: { email: string; mode: 'login' | 'register' };
  AdminLogin: undefined;
  UserDashboard: undefined;
  AdminDashboard: undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={Splash} />
        {/* User auth screens */}
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="Otp" component={Otp} />
        <Stack.Screen name="AdminLogin" component={AdminLogin} />
        <Stack.Screen name="UserDashboard" component={UserDashboard} />
        <Stack.Screen name="AdminDashboard" component={AdminGuard(AdminDashboard)} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function AdminGuard(Component: React.ComponentType<any>) {
  return function Guarded(props: any) {
    const [checking, setChecking] = React.useState(true);
    React.useEffect(() => {
      (async () => {
        const { data } = await supabase.auth.getUser();
        const email = (data?.user?.email || '').toLowerCase();
        if (!email || email !== ADMIN_EMAIL.toLowerCase()) {
          props.navigation.replace('AdminLogin');
        }
        setChecking(false);
      })();
    }, [props.navigation]);
    if (checking) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator />
        </View>
      );
    }
    return <Component {...props} />;
  };
}
