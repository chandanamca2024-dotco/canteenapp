# DineDesk - Source Code Documentation

## 1.7 Project Modules Description

1. User (Students and Staff) Module
2. Canteen Staff Module
3. Authentication & User Management Module
4. Admin Module
5. Order and Payment Management Module
6. Loyalty and Feedback Module

---

## 6.3 Source Code Structure

### 6.3.1 Supabase Configuration
**File:** `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SUPABASE_URL = 'https://drhkxyhffyndzvsgdufd.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType: 'pkce',
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
```

---

### 6.3.2 Authentication & User Management Module Code
**File:** `src/screens/auth/LoginScreen.tsx` & `RegisterScreen.tsx`

#### User Login Function
```typescript
const handleLogin = async () => {
  if (!email.trim() || !password.trim()) {
    Alert.alert('Error', 'Please enter email and password');
    return;
  }

  setLoading(true);
  try {
    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });
    
    if (error) {
      Alert.alert('❌ Login Failed', error.message);
      setLoading(false);
      return;
    }
    
    if (data.user) {
      // Get user role from profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      // Navigate based on role
      if (profile?.role === 'admin') {
        navigation.navigate('AdminDashboard');
      } else if (profile?.role === 'canteen staff') {
        navigation.navigate('StaffDashboard');
      } else {
        navigation.navigate('UserDashboard');
      }
    }
  } catch (e: any) {
    Alert.alert('Error', e?.message || 'Login failed');
  } finally {
    setLoading(false);
  }
};
```

#### User Registration Function
```typescript
const handleRegister = async () => {
  setLoading(true);
  try {
    // 1. Create auth user with Supabase
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password: password.trim(),
      options: {
        data: {
          full_name: name.trim(),
          phone: phone.trim(),
          role: role,
        },
      },
    });

    if (signUpError) throw new Error(signUpError.message);
    if (!authData.user) throw new Error('Failed to create user');

    // 2. Create user profile in database
    const { error: profileError } = await supabase.from('profiles').insert([{
      id: authData.user.id,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role: role,
      is_active: true,
      created_at: new Date().toISOString(),
    }]);

    if (profileError) throw profileError;

    Alert.alert('✅ Registration Successful', 'You can now login');
    navigation.navigate('Login', { email: email.trim() });
  } catch (e: any) {
    Alert.alert('❌ Error', e?.message);
  } finally {
    setLoading(false);
  }
};
```

---

### 6.3.3 User (Students and Staff) Module Code
**File:** `src/screens/user/UserDashboard.tsx`

#### Main Function: Load User Data and Cart
```typescript
export default function UserDashboard({ navigation }: any) {
  const [user, setUser] = useState<any>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentTab, setCurrentTab] = useState<'home' | 'menu' | 'orders' | 'wallet' | 'profile' | 'cart'>('home');
  const { colors } = useTheme();

  // Load user data and cart on mount
  useEffect(() => {
    const loadUserAndCart = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();
          setUser(profile);
        }
        const storedCart = await loadStoredCart();
        setCart(storedCart);
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    loadUserAndCart();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {currentTab === 'home' && <HomeTab colors={colors} user={user} />}
      {currentTab === 'menu' && <MenuTab colors={colors} cart={cart} />}
      {currentTab === 'orders' && <OrdersTab colors={colors} />}
      {currentTab === 'wallet' && <WalletTab colors={colors} />}
      {currentTab === 'profile' && <ProfileTab colors={colors} user={user} />}
      {currentTab === 'cart' && (
        <CartTab
          colors={colors}
          cart={cart}
          removeFromCart={removeFromCart}
          updateCartQuantity={updateCartQuantity}
          getTotalPrice={getTotalPrice}
          placeOrder={placeOrder}
          goToMenu={() => setCurrentTab('menu')}
        />
      )}
      <BottomNavigation currentTab={currentTab} setCurrentTab={setCurrentTab} />
    </SafeAreaView>
  );
}
```

#### Add to Cart Function
```typescript
const addToCart = (item: MenuItem) => {
  setCart((prevCart) => {
    const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
    
    if (existingItem) {
      // If item already in cart, increase quantity
      return prevCart.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      );
    }
    
    // Add new item to cart
    return [...prevCart, { ...item, quantity: 1 }];
  });
  
  saveStoredCart([...cart, { ...item, quantity: 1 }]);
  Alert.alert('✅ Added', `${item.name} added to cart`);
};
```

---

### 6.3.4 Canteen Staff Module Code
**File:** `src/screens/auth/StaffLoginScreen.tsx`

#### Staff Authentication and Authorization
```typescript
export default function StaffLogin({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = async () => {
    setLoading(true);
    setError('');

    try {
      // Authenticate with Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) throw signInError;
      if (!data.user) throw new Error('No user found');

      // Verify staff role in profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, is_active')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) {
        throw new Error('Profile not found');
      }

      // Check if account is active
      if (profile.is_active === false) {
        await supabase.auth.signOut();
        throw new Error('Account is inactive');
      }

      // Verify staff role
      if (profile.role !== 'canteen staff' && profile.role !== 'admin') {
        await supabase.auth.signOut();
        throw new Error('Not authorized as canteen staff');
      }

      // Navigate to staff dashboard
      navigation.replace('StaffDashboard');
    } catch (err: any) {
      setError(err?.message || 'Login failed');
      Alert.alert('Login Error', err?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <Text style={styles.title}>Canteen Staff Login</Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
        
        <AppInput
          placeholder="Staff Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          editable={!loading}
        />
        
        <AppInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />
        
        <AppButton
          title={loading ? 'Logging in...' : 'Login'}
          onPress={login}
          disabled={loading}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
```

---

### 6.3.5 Admin Module Code
**File:** `src/screens/admin/DashboardHome.tsx`

#### Admin Dashboard Statistics and Orders
```typescript
export default function DashboardHome({ 
  orders, 
  onOpenDrawer, 
  onQuickActionPress, 
  pendingOrdersCount = 0 
}: Props) {
  const { colors } = useTheme();
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Calculate dashboard metrics
  const getTotalRevenue = () => orders.reduce((sum, o) => sum + o.totalPrice, 0);
  const getPendingOrders = () => orders.filter(o => o.status === 'Pending').length;
  const getCompletedOrders = () => orders.filter(o => o.status === 'Completed').length;

  return (
    <ScrollView style={[styles.content, { backgroundColor: colors.background }]}>
      {/* Header with Notifications */}
      <View style={styles.headerContainer}>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <TouchableOpacity onPress={onOpenDrawer} style={styles.menuButton}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.notificationBell}
            onPress={() => onQuickActionPress('orders')}
          >
            <Text style={styles.bellIcon}>🔔</Text>
            {pendingOrdersCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingOrdersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={styles.statEmoji}>💰</Text>
          <Text style={[styles.statValue, { color: colors.primary }]}>₹{getTotalRevenue()}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Revenue</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={styles.statEmoji}>📦</Text>
          <Text style={[styles.statValue, { color: colors.primary }]}>{orders.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Orders</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={styles.statEmoji}>⏳</Text>
          <Text style={[styles.statValue, { color: colors.primary }]}>{getPendingOrders()}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
        </View>
      </View>

      {/* Recent Orders List */}
      <View style={styles.ordersSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Orders</Text>
        {orders.map((order) => (
          <TouchableOpacity
            key={order.id}
            style={[styles.orderCard, { backgroundColor: colors.surface }]}
            onPress={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
          >
            <View style={styles.orderHeader}>
              <Text style={[styles.orderToken, { color: colors.text }]}>Token #{order.token_number}</Text>
              <Text style={[styles.orderStatus, { 
                color: order.status === 'Pending' ? colors.error : colors.success 
              }]}>
                {order.status}
              </Text>
            </View>
            <Text style={[styles.orderPrice, { color: colors.primary }]}>₹{order.totalPrice}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
```

---

### 6.3.6 Order and Payment Management Module Code
  const [user, setUser] = useState<any>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState<'home' | 'menu' | 'orders' | 'wallet' | 'profile' | 'cart'>('home');
  const { colors } = useTheme();

  // Load user data and cart on component mount
  useEffect(() => {
    const loadUserAndCart = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
        setUser(profile);
      }
      const storedCart = await loadStoredCart();
      setCart(storedCart);
    };
    loadUserAndCart();
  }, []);

  // Place order and manage order items
  const placeOrder = async (pickupHour?: number, pickupMinute?: number, pickupPeriod?: 'AM' | 'PM') => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const totalPrice = getTotalPrice();
      const { data: orderData } = await supabase
        .from('orders')
        .insert([{ user_id: authUser?.id, total_price: totalPrice, status: 'Pending' }])
        .select();

      // Add each item to order_items table
      for (const item of cart) {
        await supabase.from('order_items').insert([{
          order_id: orderData?.[0].id,
          menu_item_id: item.id,
          quantity: item.quantity,
        }]);
      }
      
      Alert.alert('✅ Success', 'Order placed successfully!');
      clearStoredCart();
      setCart([]);
      setCurrentTab('orders');
    } catch (error: any) {
      Alert.alert('❌ Error', error.message);
    }
  };

  // Render different tabs based on currentTab state
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {currentTab === 'home' && <HomeTab colors={colors} user={user} />}
      {currentTab === 'menu' && <MenuTab colors={colors} cart={cart} />}
      {currentTab === 'orders' && <OrdersTab colors={colors} />}
      {currentTab === 'wallet' && <WalletTab colors={colors} />}
      {currentTab === 'profile' && <ProfileTab colors={colors} user={user} />}
      {currentTab === 'cart' && (
        <CartTab
          colors={colors}
          cart={cart}
          removeFromCart={removeFromCart}
          updateCartQuantity={updateCartQuantity}
          getTotalPrice={getTotalPrice}
          placeOrder={placeOrder}
          goToMenu={() => setCurrentTab('menu')}
        />
      )}
      
      <BottomNavigation 
        colors={colors}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        cartItemCount={cart.length}
      />
      <SideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} user={user} colors={colors} />
    </SafeAreaView>
  );
}
```

**Key Features:**
- Multi-tab interface for browsing menu, viewing orders, managing wallet, and profile
- Shopping cart management with local storage persistence
- Order placement with requested pickup time
- Role-based tab visibility for students and staff

---

### 2. Canteen Staff Module
**File:** [src/screens/auth/StaffLoginScreen.tsx](src/screens/auth/StaffLoginScreen.tsx)

#### Main Function: StaffLogin
```typescript
export default function StaffLogin({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = async () => {
    setLoading(true);
    setError('');

    try {
      // Authenticate with Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) throw signInError;
      if (!data.user) throw new Error('No user found');

      // Verify staff role and active status
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_active')
        .eq('id', data.user.id)
        .single();

      if (profile?.is_active === false) {
        await supabase.auth.signOut();
        Alert.alert('Access Denied', 'Your staff account is inactive');
        return;
      }

      if (profile?.role !== 'canteen staff') {
        await supabase.auth.signOut();
        Alert.alert('Access Denied', 'Not authorized as canteen staff');
        return;
      }

      // Navigate to staff dashboard
      navigation.replace('StaffDashboard');
    } catch (err: any) {
      setError(err?.message || 'An error occurred');
      Alert.alert('Login Error', err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Canteen Staff Login</Text>
        <Text style={styles.subtitle}>Login to manage incoming orders</Text>
        
        {error && <Text style={styles.errorText}>{error}</Text>}
        
        <AppInput
          placeholder="Staff Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          editable={!loading}
        />
        
        <AppInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />
        
        <AppButton
          title={loading ? 'Logging in...' : 'Login'}
          onPress={login}
          disabled={loading}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
```

**Key Features:**
- Role-based authentication restricted to canteen staff
- Account active status verification
- Error handling for invalid credentials or inactive accounts
- Secure password authentication

---

### 3. Authentication & User Management Module
**Files:** [src/screens/auth/LoginScreen.tsx](src/screens/auth/LoginScreen.tsx) & [src/screens/auth/RegisterScreen.tsx](src/screens/auth/RegisterScreen.tsx)

#### Main Function: User Login
```typescript
const handleLogin = async () => {
  if (!email.trim() || !password.trim()) {
    Alert.alert('Error', 'Please enter email and password');
    return;
  }

  setLoading(true);
  
  try {
    // Authenticate with email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });
    
    if (error) {
      Alert.alert('❌ Login Failed', error.message);
      setLoading(false);
      return;
    }
    
    if (data.user) {
      // Fetch user role and navigate accordingly
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profile?.role === 'admin') {
        navigation.navigate('AdminDashboard');
      } else if (profile?.role === 'canteen staff') {
        navigation.navigate('StaffDashboard');
      } else {
        navigation.navigate('UserDashboard');
      }
    }
  } catch (e: any) {
    Alert.alert('Error', e?.message || 'Login failed');
  } finally {
    setLoading(false);
  }
};
```

#### Main Function: User Registration
```typescript
const handleRegister = async () => {
  if (!validateForm()) return;
  
  setLoading(true);
  
  try {
    // Create auth user with Supabase
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password: password.trim(),
      options: {
        data: {
          full_name: name.trim(),
          phone: phone.trim(),
          role: role,
        },
      },
    });

    if (signUpError) throw new Error(signUpError.message);
    if (!authData.user) throw new Error('Failed to create user');

    // Create user profile in database
    const { error: profileError } = await supabase.from('profiles').insert([{
      id: authData.user.id,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role: role,
      is_active: true,
      created_at: new Date().toISOString(),
    }]);

    if (profileError) throw profileError;

    Alert.alert('✅ Registration Successful', 'You can now login with your credentials');
    navigation.navigate('Login', { email: email.trim() });
  } catch (e: any) {
    Alert.alert('❌ Registration Failed', e?.message || 'An error occurred');
  } finally {
    setLoading(false);
  }
};
```

**Key Features:**
- Secure authentication with Supabase Auth
- Role-based navigation (Admin, Staff, User)
- User profile creation during registration
- Email validation and password strength checking
- Session persistence across app restarts

---

### 4. Admin Module
**File:** [src/screens/admin/DashboardHome.tsx](src/screens/admin/DashboardHome.tsx)

#### Main Function: Admin Dashboard Home
```typescript
export default function DashboardHome({ 
  orders, 
  onOpenDrawer, 
  onQuickActionPress, 
  pendingOrdersCount = 0 
}: Props) {
  const { colors } = useTheme();
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Calculate dashboard statistics
  const getTotalRevenue = () => orders.reduce((sum, o) => sum + o.totalPrice, 0);
  const getPendingOrders = () => orders.filter(o => o.status === 'Pending').length;
  const getCompletedOrders = () => orders.filter(o => o.status === 'Completed').length;

  const handleOrderPress = (orderId: string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  return (
    <ScrollView style={[styles.content, { backgroundColor: colors.background }]}>
      {/* Header with Navigation */}
      <View style={styles.headerContainer}>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <TouchableOpacity onPress={onOpenDrawer} style={styles.menuButton}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
          
          {/* Notification Bell with Badge */}
          <TouchableOpacity 
            style={styles.notificationBell}
            onPress={() => onQuickActionPress('orders')}
          >
            <Text style={styles.bellIcon}>🔔</Text>
            {pendingOrdersCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingOrdersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <TouchableOpacity 
          style={[styles.statCard, { backgroundColor: colors.surface }]}
          onPress={() => onQuickActionPress('revenue')}
        >
          <Text style={styles.statEmoji}>💰</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Revenue</Text>
          <Text style={[styles.statValue, { color: colors.primary }]}>₹{getTotalRevenue()}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.statCard, { backgroundColor: colors.surface }]}
          onPress={() => onQuickActionPress('orders')}
        >
          <Text style={styles.statEmoji}>📦</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Orders</Text>
          <Text style={[styles.statValue, { color: colors.primary }]}>{orders.length}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.statCard, { backgroundColor: colors.surface }]}
          onPress={() => onQuickActionPress('pending')}
        >
          <Text style={styles.statEmoji}>⏳</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending Orders</Text>
          <Text style={[styles.statValue, { color: colors.primary }]}>{getPendingOrders()}</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Orders List */}
      <View style={styles.ordersSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Orders</Text>
        {orders.map((order) => (
          <TouchableOpacity
            key={order.id}
            style={[styles.orderCard, { backgroundColor: colors.surface }]}
            onPress={() => handleOrderPress(order.id)}
          >
            <View style={styles.orderHeader}>
              <Text style={[styles.orderToken, { color: colors.text }]}>Token #{order.token_number}</Text>
              <Text style={[styles.orderStatus, { color: order.status === 'Pending' ? colors.error : colors.success }]}>
                {order.status}
              </Text>
            </View>
            <Text style={[styles.orderPrice, { color: colors.primary }]}>₹{order.totalPrice}</Text>
            
            {expandedOrderId === order.id && (
              <View style={styles.expandedContent}>
                <Text style={[styles.orderDetail, { color: colors.textSecondary }]}>Items: {order.items?.length || 0}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
```

**Key Features:**
- Real-time order monitoring and notification system
- Revenue tracking and analytics
- Order status management (Pending, Ready, Completed)
- Quick action buttons for menu and order management
- Dashboard statistics with visual indicators

---

### 5. Order and Payment Management Module
**File:** [src/screens/user/CartTab.tsx](src/screens/user/CartTab.tsx)

#### Main Function: Cart Management & Order Placement
```typescript
export const CartTab: React.FC<CartTabProps> = ({
  colors,
  cart,
  removeFromCart,
  updateCartQuantity,
  getTotalPrice,
  placeOrder,
  goToMenu,
  closingTime,
}) => {
  const isEmpty = cart.length === 0;

  const currentTime = useMemo(() => {
    const now = new Date();
    const hours24 = now.getHours();
    const minutes = now.getMinutes();
    const period: 'AM' | 'PM' = hours24 >= 12 ? 'PM' : 'AM';
    const hour12 = hours24 % 12 || 12;
    return { hour12, minutes, period };
  }, []);

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={{
      backgroundColor: '#fff',
      borderRadius: 28,
      marginHorizontal: 12,
      marginTop: 28,
      marginBottom: 18,
      paddingVertical: 28,
      paddingHorizontal: 22,
      elevation: 8,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold' }}>{item.name}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 15 }}>₹{item.price}</Text>
        </View>

        {/* Quantity Controls */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary + '08', borderRadius: 12 }}>
          <TouchableOpacity onPress={() => updateCartQuantity(item.id, Math.max(1, item.quantity - 1))}>
            <Text style={{ color: colors.primary, fontSize: 18, fontWeight: 'bold', paddingHorizontal: 8 }}>−</Text>
          </TouchableOpacity>
          <Text style={{ color: colors.text, fontWeight: 'bold', minWidth: 22, textAlign: 'center' }}>{item.quantity}</Text>
          <TouchableOpacity onPress={() => updateCartQuantity(item.id, item.quantity + 1)}>
            <Text style={{ color: colors.primary, fontSize: 18, fontWeight: 'bold', paddingHorizontal: 8 }}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Remove Button */}
        <TouchableOpacity onPress={() => removeFromCart(item.id)} style={{ marginLeft: 8 }}>
          <Text style={{ color: colors.error, fontSize: 22, fontWeight: '700' }}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {isEmpty ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.text, fontSize: 18, marginBottom: 16 }}>Your cart is empty</Text>
          <TouchableOpacity 
            onPress={goToMenu} 
            style={{ backgroundColor: colors.primary, padding: 12, borderRadius: 8 }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Go to Menu</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={cart}
          renderItem={renderCartItem}
          keyExtractor={(item) => item.id}
          ListFooterComponent={
            <View style={{ padding: 16 }}>
              <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 20 }}>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>Order Summary</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={{ color: colors.textSecondary }}>Subtotal</Text>
                  <Text style={{ color: colors.text, fontWeight: 'bold' }}>₹{getTotalPrice()}</Text>
                </View>
                
                {closingTime && (
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 12 }}>
                    Closes at: {closingTime}
                  </Text>
                )}
                
                <TouchableOpacity 
                  onPress={() => placeOrder(currentTime.hour12, currentTime.minutes, currentTime.period)}
                  style={{ backgroundColor: colors.primary, padding: 16, borderRadius: 12 }}
                >
                  <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>
                    Place Order - ₹{getTotalPrice()}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};
```

**Key Features:**
- Dynamic quantity adjustment with increment/decrement
- Real-time price calculations
- Item removal from cart
- Order summary with total pricing
- Integration with payment module
- Stock availability checking

---

### 6. Loyalty and Feedback Module
**Files:** [src/screens/admin/Feedback.tsx](src/screens/admin/Feedback.tsx) & [src/screens/user/WalletTab.tsx](src/screens/user/WalletTab.tsx)

#### Main Function: Feedback Management
```typescript
export const Feedback: React.FC = () => {
  const { colors, tokens } = useTheme();
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [filterRating, setFilterRating] = useState<number | null>(null);

  useEffect(() => {
    loadFeedback();
    const unsubscribe = setupRealtimeSubscription();
    return unsubscribe;
  }, []);

  const loadFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select(\`
          id, user_id, order_id, rating, comment, created_at,
          user:profiles!feedback_user_id_fkey(name, email),
          order:orders!feedback_order_id_fkey(token_number)
        \`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const normalized: FeedbackItem[] = (data || []).map((row: any) => {
        const userRel = Array.isArray(row.user) ? row.user[0] : row.user;
        const orderRel = Array.isArray(row.order) ? row.order[0] : row.order;
        return {
          id: row.id,
          user_id: row.user_id,
          order_id: row.order_id,
          rating: row.rating,
          comment: row.comment ?? '',
          created_at: row.created_at,
          user: userRel ? { name: userRel.name, email: userRel.email } : undefined,
          order: orderRel ? { token_number: orderRel.token_number } : undefined,
        };
      });
      setFeedbacks(normalized);
    } catch (err) {
      console.error('Error loading feedback:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('feedback_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feedback' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            loadFeedback();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const filteredFeedbacks = filterRating 
    ? feedbacks.filter(f => f.rating === filterRating)
    : feedbacks;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadFeedback(); }} />}
        contentContainerStyle={{ padding: 16 }}
      >
        {/* Rating Filter */}
        <View style={{ flexDirection: 'row', marginBottom: 16, justifyContent: 'space-around' }}>
          {[1, 2, 3, 4, 5].map((rating) => (
            <TouchableOpacity
              key={rating}
              onPress={() => setFilterRating(filterRating === rating ? null : rating)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: filterRating === rating ? colors.primary : colors.surface,
              }}
            >
              <Text style={{ color: filterRating === rating ? '#fff' : colors.text }}>⭐ {rating}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Feedback List */}
        {loading ? (
          <ActivityIndicator color={colors.primary} size="large" />
        ) : filteredFeedbacks.length === 0 ? (
          <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 32 }}>No feedback available</Text>
        ) : (
          filteredFeedbacks.map((feedback) => (
            <TouchableOpacity
              key={feedback.id}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
              }}
              onPress={() => setSelectedFeedback(selectedFeedback?.id === feedback.id ? null : feedback)}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 14 }}>{feedback.user?.name}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Order #{feedback.order?.token_number}</Text>
                </View>
                <Text style={{ fontSize: 18, marginLeft: 8 }}>{'⭐'.repeat(feedback.rating)}</Text>
              </View>

              {selectedFeedback?.id === feedback.id && (
                <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.primary + '20' }}>
                  <Text style={{ color: colors.text, fontSize: 14, lineHeight: 20 }}>{feedback.comment}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8 }}>
                    {new Date(feedback.created_at).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};
```

#### Main Function: Loyalty & Wallet Management
```typescript
export const WalletTab: React.FC<WalletTabProps> = ({ colors }) => {
  const { loyaltyData, loading } = useLoyaltyRewards();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Loyalty Points Card */}
      <LinearGradient
        colors={['#7b2ff2', '#5a1ea6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          marginHorizontal: 16,
          marginTop: 18,
          borderRadius: 28,
          padding: 28,
          elevation: 12,
          marginBottom: 22,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 70,
            height: 70,
            borderRadius: 35,
            backgroundColor: 'rgba(255,255,255,0.22)',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 18,
          }}>
            <Icon name="star" size={32} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 19, fontWeight: 'bold', marginBottom: 2 }}>Loyalty Points</Text>
            <Text style={{ color: '#fff', fontSize: 48, fontWeight: '900', marginBottom: 2 }}>{loyaltyData?.total_points || 0}</Text>
            <Text style={{ color: '#fff', fontSize: 14, opacity: 0.92 }}>Available for redemption</Text>
          </View>
        </View>
      </LinearGradient>

      {/* How to Earn/Redeem Info */}
      <View style={{
        marginHorizontal: 16,
        marginBottom: 18,
        backgroundColor: '#f5f3ff',
        borderRadius: 16,
        padding: 18,
        borderLeftWidth: 5,
        borderLeftColor: '#7b2ff2',
        elevation: 2,
      }}>
        <Text style={{ color: '#3d246c', fontWeight: 'bold', fontSize: 17, marginBottom: 7 }}>How to Earn Points</Text>
        <Text style={{ color: '#5a4a7c', fontSize: 14, lineHeight: 22, marginBottom: 2 }}>• Earn 1 point for every ₹10 spent on orders</Text>
        <Text style={{ color: '#5a4a7c', fontSize: 14, lineHeight: 22, marginBottom: 10 }}>• Bonus points for feedback and reviews</Text>
        
        <Text style={{ height: 1, backgroundColor: '#e0d7fa', marginVertical: 10 }} />
        
        <Text style={{ color: '#3d246c', fontWeight: 'bold', fontSize: 17, marginBottom: 7 }}>How to Redeem</Text>
        <Text style={{ color: '#5a4a7c', fontSize: 14, lineHeight: 22, marginBottom: 2 }}>• 100 points = ₹10 off your next order</Text>
        <Text style={{ color: '#5a4a7c', fontSize: 14, lineHeight: 22 }}>• Points apply automatically at checkout</Text>
      </View>

      {/* Statistics */}
      <View style={{ marginHorizontal: 16, flexDirection: 'row', justifyContent: 'space-around', marginBottom: 24 }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: colors.primary, fontSize: 24, fontWeight: 'bold' }}>{loyaltyData?.points_earned || 0}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Points Earned</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: colors.error, fontSize: 24, fontWeight: 'bold' }}>{loyaltyData?.points_redeemed || 0}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Points Redeemed</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: colors.success, fontSize: 24, fontWeight: 'bold' }}>₹{((loyaltyData?.total_points || 0) * 0.1).toFixed(0)}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Discount Value</Text>
        </View>
      </View>

      {/* Tips Section */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 32,
        backgroundColor: '#f0e7ff',
        borderRadius: 14,
        padding: 14,
        elevation: 1,
      }}>
        <Icon name="lightbulb" size={20} color="#7b2ff2" />
        <Text style={{
          color: '#7b2ff2',
          fontSize: 14,
          fontWeight: '600',
          marginLeft: 12,
          flex: 1,
        }}>
          Spend more to earn more points and unlock special rewards!
        </Text>
      </View>
    </ScrollView>
  );
};
```

**Key Features:**
- User loyalty points tracking and display
- Real-time feedback collection with star ratings
- Feedback filtering by rating score
- Automatic point calculation (₹10 = 1 point)
- Redemption value display
- Beautiful gradient UI for engagement
- Real-time feedback updates with Supabase subscriptions
- User profile linking with feedback

---

## Summary

This comprehensive documentation covers all six main modules of the DineDesk application:

1. **User Module** - Core interface for students and staff to browse and order food
2. **Canteen Staff Module** - Authentication and access control for staff members
3. **Authentication Module** - Secure login and registration system
4. **Admin Module** - Dashboard for monitoring orders, revenue, and operations
5. **Order/Payment Module** - Shopping cart and order placement functionality
6. **Loyalty/Feedback Module** - Customer feedback system and loyalty rewards program

Each module includes main function implementations with key features and integration points with the Supabase backend.
