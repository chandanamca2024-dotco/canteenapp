# DineDesk - Source Code

## 6.3 Modules

### 6.3.1 Supabase Configuration

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SUPABASE_URL = 'https://drhkxyhffyndzvsgdufd.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType: 'pkce',
    storage: AsyncStorage,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

---

### 6.3.2 Authentication Module Code

```typescript
// src/screens/auth/LoginScreen.tsx
const handleLogin = async () => {
  if (!email.trim() || !password.trim()) {
    Alert.alert('Error', 'Please enter email and password');
    return;
  }
  setLoading(true);
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });
    
    if (error) {
      Alert.alert('❌ Login Failed', error.message);
      return;
    }
    
    if (data.user) {
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

```typescript
// src/screens/auth/RegisterScreen.tsx
const handleRegister = async () => {
  setLoading(true);
  try {
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

### 6.3.3 User Module Code

```typescript
// src/screens/user/StudentHomeTab.tsx
export function StudentHomeTab(props: {
  colors: any;
  isDark: boolean;
  userName: string;
  userRole?: string;
  walletBalance: number;
  orders: Order[];
  // ... other props
}) {
  const {
    colors,
    isDark,
    userName,
    userRole = 'Student',
    // ... other props
  } = props;

  // Helper function to check if user is college staff
  const isCollegeStaff = (role?: string) => {
    if (!role) return false;
    const roleLower = role.toLowerCase().trim();
    return roleLower.includes('staff') || roleLower === 'canteen staff' || roleLower === 'college staff';
  };

  return (
    <FlatList
      ListHeaderComponent={
        <>
          {/* Header - Icons & Buttons Only */}
          <View style={{
            backgroundColor: isDark ? '#1f2937' : '#fff',
            paddingTop: 48,
            paddingBottom: 24,
            paddingHorizontal: 20,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              {/* Notification Bell & Avatar Buttons */}
            </View>
          </View>

          {/* Welcome Message Card - Below Header */}
          <View style={{ paddingHorizontal: 20, marginTop: 20, marginBottom: 16 }}>
            <View style={{
              backgroundColor: isDark ? '#374151' : '#fff',
              borderRadius: 12,
              padding: 18,
              borderLeftWidth: 4,
              borderLeftColor: isCollegeStaff(userRole) ? '#3b82f6' : '#10b981',
            }}>
              <Text style={{
                fontSize: 20,
                fontWeight: '800',
                color: isCollegeStaff(userRole)
                  ? isDark ? '#93c5fd' : '#1e40af'
                  : isDark ? '#86efac' : '#059669',
                marginBottom: 6,
              }}>
                {isCollegeStaff(userRole)
                  ? 'Welcome to College Staff Homepage'
                  : 'Welcome to Student Homepage'
                }
              </Text>
              <Text style={{ fontSize: 14, color: isDark ? '#d1d5db' : '#666', marginTop: 4 }}>
                {userName && `Hi, ${userName}!`}
              </Text>
              <Text style={{ fontSize: 13, color: isDark ? '#9ca3af' : '#888', marginTop: 8 }}>
                What would you like to eat today?
              </Text>
            </View>
          </View>
        </>
      }
      // ... rest of the component
    />
  );
}
```

```typescript
// src/screens/user/UserDashboard.tsx
const addToCart = (item: MenuItem) => {
  setCart((prevCart) => {
    const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
    
    if (existingItem) {
      return prevCart.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      );
    }
    
    return [...prevCart, { ...item, quantity: 1 }];
  });
  
  saveStoredCart([...cart, { ...item, quantity: 1 }]);
  Alert.alert('✅ Added', `${item.name} added to cart`);
};

const removeFromCart = (itemId: string) => {
  setCart(prevCart => prevCart.filter(item => item.id !== itemId));
};

const updateCartQuantity = (itemId: string, newQuantity: number) => {
  if (newQuantity <= 0) {
    removeFromCart(itemId);
    return;
  }
  setCart(prevCart =>
    prevCart.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    )
  );
};

const getTotalPrice = () => {
  return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
};
```

---

### 6.3.4 Canteen Staff Module Code

```typescript
// src/screens/auth/StaffLoginScreen.tsx
export default function StaffLogin({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) throw signInError;
      if (!data.user) throw new Error('No user found');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, is_active')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) {
        throw new Error('Profile not found');
      }

      if (profile.is_active === false) {
        await supabase.auth.signOut();
        throw new Error('Account is inactive');
      }

      if (profile.role !== 'canteen staff' && profile.role !== 'admin') {
        await supabase.auth.signOut();
        throw new Error('Not authorized as canteen staff');
      }

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

```typescript
// src/screens/admin/DashboardHome.tsx
export default function DashboardHome({ orders, onOpenDrawer, onQuickActionPress, pendingOrdersCount = 0 }: Props) {
  const { colors } = useTheme();
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const getTotalRevenue = () => orders.reduce((sum, o) => sum + o.totalPrice, 0);
  const getPendingOrders = () => orders.filter(o => o.status === 'Pending').length;

  return (
    <ScrollView style={[styles.content, { backgroundColor: colors.background }]}>
      <View style={styles.headerContainer}>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <TouchableOpacity onPress={onOpenDrawer} style={styles.menuButton}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.notificationBell} onPress={() => onQuickActionPress('orders')}>
            <Text style={styles.bellIcon}>🔔</Text>
            {pendingOrdersCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingOrdersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

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
              <Text style={[styles.orderStatus, { color: order.status === 'Pending' ? colors.error : colors.success }]}>
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

### 6.3.6 Order & Payment Management Module Code

```typescript
// src/screens/user/CartTab.tsx
const placeOrder = async (pickupHour?: number, pickupMinute?: number, pickupPeriod?: 'AM' | 'PM') => {
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      Alert.alert('Error', 'Please login first');
      return;
    }

    const totalPrice = getTotalPrice();
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([{
        user_id: authUser.id,
        total_price: totalPrice,
        status: 'Pending',
        requested_time: `${pickupHour}:${pickupMinute} ${pickupPeriod}`,
        created_at: new Date().toISOString(),
      }])
      .select();

    if (orderError) throw orderError;

    const order_id = orderData[0].id;

    for (const item of cart) {
      await supabase.from('order_items').insert([{
        order_id,
        menu_item_id: item.id,
        quantity: item.quantity,
        food_type: item.food_type,
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
```

```typescript
// src/screens/user/CartTab.tsx
export const CartTab: React.FC<CartTabProps> = ({
  colors,
  cart,
  removeFromCart,
  updateCartQuantity,
  getTotalPrice,
  placeOrder,
  goToMenu,
}) => {
  const isEmpty = cart.length === 0;

  const currentTime = useMemo(() => {
    const now = new Date();
    const hours24 = now.getHours();
    const minutes = now.getMinutes();
    const period = hours24 >= 12 ? 'PM' : 'AM';
    const hour12 = hours24 % 12 || 12;
    return { hour12, minutes, period };
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {isEmpty ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.text, fontSize: 18, marginBottom: 16 }}>Your cart is empty</Text>
          <TouchableOpacity onPress={goToMenu} style={{ backgroundColor: colors.primary, padding: 12, borderRadius: 8 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Go to Menu</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={cart}
          renderItem={({ item }) => (
            <View style={{ backgroundColor: '#fff', borderRadius: 28, marginHorizontal: 12, marginTop: 28, paddingVertical: 28, paddingHorizontal: 22 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold' }}>{item.name}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 15 }}>₹{item.price}</Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary + '08', borderRadius: 12 }}>
                  <TouchableOpacity onPress={() => updateCartQuantity(item.id, Math.max(1, item.quantity - 1))}>
                    <Text style={{ color: colors.primary, fontSize: 18, fontWeight: 'bold', paddingHorizontal: 8 }}>−</Text>
                  </TouchableOpacity>
                  <Text style={{ color: colors.text, fontWeight: 'bold', minWidth: 22, textAlign: 'center' }}>{item.quantity}</Text>
                  <TouchableOpacity onPress={() => updateCartQuantity(item.id, item.quantity + 1)}>
                    <Text style={{ color: colors.primary, fontSize: 18, fontWeight: 'bold', paddingHorizontal: 8 }}>+</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={() => removeFromCart(item.id)} style={{ marginLeft: 8 }}>
                  <Text style={{ color: colors.error, fontSize: 22, fontWeight: '700' }}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          keyExtractor={(item) => item.id}
          ListFooterComponent={
            <View style={{ padding: 16, marginBottom: 32 }}>
              <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16 }}>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>Order Summary</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={{ color: colors.textSecondary }}>Subtotal</Text>
                  <Text style={{ color: colors.text, fontWeight: 'bold' }}>₹{getTotalPrice()}</Text>
                </View>
                
                <TouchableOpacity 
                  onPress={() => placeOrder(currentTime.hour12, currentTime.minutes, currentTime.period)}
                  style={{ backgroundColor: colors.primary, padding: 16, borderRadius: 12 }}
                >
                  <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>Place Order - ₹{getTotalPrice()}</Text>
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

---

### 6.3.7 Loyalty & Feedback Module Code

```typescript
// src/screens/admin/Feedback.tsx
export const Feedback: React.FC = () => {
  const { colors } = useTheme();
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
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
        .select(`
          id, user_id, order_id, rating, comment, created_at,
          user:profiles!feedback_user_id_fkey(name, email),
          order:orders!feedback_order_id_fkey(token_number)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const normalized = (data || []).map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        order_id: row.order_id,
        rating: row.rating,
        comment: row.comment ?? '',
        created_at: row.created_at,
        user: row.user ? { name: row.user.name, email: row.user.email } : undefined,
        order: row.order ? { token_number: row.order.token_number } : undefined,
      }));

      setFeedbacks(normalized);
    } catch (err) {
      console.error('Error loading feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('feedback_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feedback' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          loadFeedback();
        }
      })
      .subscribe();

    return () => subscription.unsubscribe();
  };

  const filteredFeedbacks = filterRating 
    ? feedbacks.filter(f => f.rating === filterRating)
    : feedbacks;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
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
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 14 }}>{feedback.user?.name}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Order #{feedback.order?.token_number}</Text>
                </View>
                <Text style={{ fontSize: 18, marginLeft: 8 }}>{'⭐'.repeat(feedback.rating)}</Text>
              </View>
              <Text style={{ color: colors.text, fontSize: 14, lineHeight: 20, marginTop: 8 }}>{feedback.comment}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};
```

```typescript
// src/screens/user/WalletTab.tsx
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
      <LinearGradient
        colors={['#7b2ff2', '#5a1ea6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ marginHorizontal: 16, marginTop: 18, borderRadius: 28, padding: 28, elevation: 12, marginBottom: 22 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', marginRight: 18 }}>
            <Icon name="star" size={32} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 19, fontWeight: 'bold', marginBottom: 2 }}>Loyalty Points</Text>
            <Text style={{ color: '#fff', fontSize: 48, fontWeight: '900', marginBottom: 2 }}>{loyaltyData?.total_points || 0}</Text>
            <Text style={{ color: '#fff', fontSize: 14, opacity: 0.92 }}>Available for redemption</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={{ marginHorizontal: 16, marginBottom: 18, backgroundColor: '#f5f3ff', borderRadius: 16, padding: 18, borderLeftWidth: 5, borderLeftColor: '#7b2ff2' }}>
        <Text style={{ color: '#3d246c', fontWeight: 'bold', fontSize: 17, marginBottom: 7 }}>How to Earn Points</Text>
        <Text style={{ color: '#5a4a7c', fontSize: 14, lineHeight: 22, marginBottom: 2 }}>• Earn 1 point for every ₹10 spent on orders</Text>
        <Text style={{ color: '#5a4a7c', fontSize: 14, lineHeight: 22, marginBottom: 10 }}>• Bonus points for feedback and reviews</Text>
        
        <Text style={{ color: '#3d246c', fontWeight: 'bold', fontSize: 17, marginBottom: 7 }}>How to Redeem</Text>
        <Text style={{ color: '#5a4a7c', fontSize: 14, lineHeight: 22, marginBottom: 2 }}>• 100 points = ₹10 off your next order</Text>
        <Text style={{ color: '#5a4a7c', fontSize: 14, lineHeight: 22 }}>• Points apply automatically at checkout</Text>
      </View>

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
    </ScrollView>
  );
};
```

---

## End
