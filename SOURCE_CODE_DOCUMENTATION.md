# DineDesk - Source Code Documentation

## 6.3 Source Code Structure

### 6.3.1 Supabase Configuration
**File:** `src/lib/supabase.ts`

```typescript
// Supabase client initialization with authentication configuration
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SUPABASE_URL = 'https://drhkxyhffyndzvsgdufd.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// Create Supabase client with PKCE auth flow and session persistence
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

### 6.3.2 Authentication Module Code
**File:** `src/screens/auth/LoginScreen.tsx` & `RegisterScreen.tsx`

#### User Login Function
```typescript
// Handle user login with email and password
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
    
    setLoading(false);
    
    if (error) {
      Alert.alert('❌ Login Failed', error.message);
      return;
    }
    
    if (data.user) {
      console.log('Login successful for:', data.user.email);
      Alert.alert('✅ Welcome', 'Logged in successfully!');
      // Navigation handled after login
    }
  } catch (e: any) {
    setLoading(false);
    Alert.alert('Error', e?.message || 'Login failed');
  }
};
```

#### User Registration Function
```typescript
// Handle user registration with profile creation
const handleRegister = async () => {
  if (!validateForm()) return;
  
  setLoading(true);
  
  try {
    // 1. Create auth user with Supabase
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password: password.trim(),
      options: {
        emailRedirectTo: undefined,
        data: {
          full_name: name.trim(),
          phone: phone.trim(),
          role: role,
        },
      },
    });

    if (signUpError) {
      throw new Error(signUpError.message);
    }

    if (!authData.user) {
      throw new Error('Failed to create user');
    }

    // 2. Create profile in profiles table
    await supabase.from('profiles').insert([{
      id: authData.user.id,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role: role,
      is_active: true,
    }]);

    setLoading(false);
    Alert.alert('✅ Registration Successful', 'Your account has been created!');
    navigation.navigate('Login', { email });
  } catch (error: any) {
    setLoading(false);
    Alert.alert('❌ Registration Failed', error.message);
  }
};
```

#### Logout Function
```typescript
// Handle user logout
const logout = async () => {
  await supabase.auth.signOut();
  navigation.replace('Login');
};
```

#### Role Verification Function
```typescript
// Verify user role from profiles table
const checkUserRole = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', userId)
    .single();
  
  if (error || !data) return null;
  
  return data.role; // Returns 'user', 'admin', or 'canteenStaff'
};
```

---

### 6.3.3 Menu Management Module
**File:** `src/screens/admin/AdminDashboard.tsx` & `src/screens/user/UserDashboard.tsx`

#### Fetch Menu Items
```typescript
// Fetch all menu items from database
const fetchMenuItems = async () => {
  try {
    setLoadingMenu(true);
    const { data, error } = await supabase.from('menu_items').select('*');
    
    if (error) {
      console.error('Error fetching menu items:', error);
      setMenuItems([]);
    } else if (data && data.length > 0) {
      const mappedItems = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        category: item.category,
        description: item.description,
        image: item.image_url,
        available: item.available,
        stock_quantity: item.stock_quantity,
        food_type: item.food_type || 'veg',
      }));
      
      const availableItems = mappedItems.filter((item: any) => item.available !== false);
      setMenuItems(availableItems);
    }
  } catch (e) {
    console.error('Exception fetching menu items:', e);
  } finally {
    setLoadingMenu(false);
  }
};
```

#### Add Menu Item (Admin Only)
```typescript
// Add new menu item to database
const addMenuItem = async (item: MenuItem) => {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .insert([{
        name: item.name,
        price: item.price,
        category: item.category,
        description: item.description || '',
        image_url: item.image || null,
        available: item.available !== false,
      }])
      .select('*')
      .single();
      
    if (error) throw error;
    
    setMenuItems([...menuItems, {
      id: data.id,
      name: data.name,
      price: Number(data.price),
      category: data.category,
      available: data.available,
      description: data.description,
      image: data.image_url,
    }]);
    
    Alert.alert('Success', '✅ Item added successfully!');
  } catch (e: any) {
    Alert.alert('Error', e?.message || 'Failed to add item');
  }
};
```

#### Update Menu Item
```typescript
// Update existing menu item
const editMenuItem = async (item: MenuItem) => {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .update({
        name: item.name,
        price: item.price,
        category: item.category,
        description: item.description || '',
        image_url: item.image || null,
        available: item.available !== false,
      })
      .eq('id', item.id)
      .select('*')
      .single();
      
    if (error) throw error;
    
    // Update local state with new data
    setMenuItems(menuItems.map(m => 
      m.id === item.id ? {
        id: data.id,
        name: data.name,
        price: Number(data.price),
        category: data.category,
        available: data.available,
        description: data.description,
        image: data.image_url,
      } : m
    ));
    
    Alert.alert('Success', '✅ Item updated successfully!');
  } catch (e: any) {
    Alert.alert('Error', e?.message || 'Failed to update item');
  }
};
```

#### Delete Menu Item
```typescript
// Delete menu item from database
const removeMenuItem = async (itemId: string) => {
  try {
    // Check if item has any orders before deleting
    const { data: orderItems, error: checkError } = await supabase
      .from('order_items')
      .select('id', { count: 'exact' })
      .eq('menu_item_id', itemId)
      .limit(1);
    
    if (checkError) throw checkError;
    
    if (orderItems && orderItems.length > 0) {
      Alert.alert('Cannot Delete', 'This item has been ordered. You can disable it instead.');
      return;
    }

    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', itemId);
      
    if (error) throw error;
    
    setMenuItems(menuItems.filter((item) => item.id !== itemId));
    Alert.alert('Success', '✅ Item deleted successfully!');
  } catch (e: any) {
    Alert.alert('Error', e?.message || 'Failed to delete item');
  }
};
```

#### Toggle Availability
```typescript
// Toggle menu item availability status
const toggleAvailability = async (itemId: string) => {
  const current = menuItems.find((m) => m.id === itemId);
  if (!current) return;
  
  const nextAvailable = !current.available;
  
  try {
    const { error } = await supabase
      .from('menu_items')
      .update({ available: nextAvailable })
      .eq('id', itemId);
      
    if (error) throw error;
    
    setMenuItems(menuItems.map((item) =>
      item.id === itemId ? { ...item, available: nextAvailable } : item
    ));
  } catch (e: any) {
    Alert.alert('Error', e?.message || 'Failed to update availability');
  }
};
```

---

### 6.3.4 Cart & Order Module
**File:** `src/screens/user/PaymentScreen.tsx` & `src/lib/cartStorage.ts`

#### Add/Remove Items to Cart
```typescript
// Add item to cart (stored locally in AsyncStorage)
const addToCart = async (item: MenuItem) => {
  try {
    const cartString = await AsyncStorage.getItem('cart');
    const cart = cartString ? JSON.parse(cartString) : [];
    
    const existingIndex = cart.findIndex((i: any) => i.id === item.id);
    
    if (existingIndex >= 0) {
      cart[existingIndex].quantity += 1;
    } else {
      cart.push({ ...item, quantity: 1 });
    }
    
    await AsyncStorage.setItem('cart', JSON.stringify(cart));
  } catch (error) {
    console.error('Error adding to cart:', error);
  }
};

// Remove item from cart
const removeFromCart = async (itemId: string) => {
  try {
    const cartString = await AsyncStorage.getItem('cart');
    const cart = cartString ? JSON.parse(cartString) : [];
    
    const updatedCart = cart.filter((item: any) => item.id !== itemId);
    await AsyncStorage.setItem('cart', JSON.stringify(updatedCart));
  } catch (error) {
    console.error('Error removing from cart:', error);
  }
};
```

#### Create Order
```typescript
// Create order after successful payment
const createOrderAfterPayment = async (
  userId: string, 
  paymentId: string, 
  requestedTime: Date | null, 
  userEmail: string,
  paymentMethod: 'razorpay' | 'wallet' | 'upi' | 'card'
) => {
  try {
    // Get today's start time for token number calculation
    const startOfDay = getStartOfTodayUTC();
    
    // Get last token number of the day
    const { data: rows, error: queryError } = await supabase
      .from('orders')
      .select('token_number')
      .gte('created_at', startOfDay)
      .not('token_number', 'is', null)
      .order('token_number', { ascending: false })
      .limit(1);
    
    if (queryError) throw queryError;
    
    // Calculate next token number
    const lastToken = rows && rows.length > 0 && rows[0]?.token_number ? rows[0].token_number : 0;
    const nextToken = lastToken + 1;

    // Insert order into database
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        total_price: payableTotal,
        status: 'Pending',
        token_number: nextToken,
        payment_id: paymentId,
        requested_time: requestedTime ? requestedTime.toISOString() : null,
      })
      .select('id, created_at, token_number')
      .single();
      
    if (orderError || !orderData) {
      throw orderError || new Error('Order creation failed');
    }

    return orderData;
  } catch (e: any) {
    console.error('Order creation error:', e);
    throw e;
  }
};
```

#### Insert Order Items
```typescript
// Insert order items for an order
const insertOrderItems = async (orderId: string, items: any[]) => {
  const orderItems = items.map((i: any) => ({ 
    order_id: orderId, 
    menu_item_id: i.id, 
    quantity: i.quantity 
  }));
  
  console.log('📦 Inserting order items:', orderItems);
  
  const { error: itemsError, data: itemsData } = await supabase
    .from('order_items')
    .insert(orderItems)
    .select('id, order_id, menu_item_id, quantity');
  
  if (itemsError) {
    console.error('❌ Order items error:', itemsError);
    throw itemsError;
  }
  
  console.log('✅ Order items saved:', itemsData);
  return itemsData;
};
```

#### Fetch Order History
```typescript
// Fetch user's order history
const fetchOrders = async (userId: string) => {
  try {
    const { data: ordersData } = await supabase
      .from('orders')
      .select('id, status, total_price, created_at, token_number')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (ordersData && ordersData.length > 0) {
      // Fetch order items for each order
      const ordersWithItems = await Promise.all(
        ordersData.map(async (order) => {
          const { data: items } = await supabase
            .from('order_items')
            .select(`
              quantity,
              menu_items (name, price)
            `)
            .eq('order_id', order.id);
          
          return {
            ...order,
            items: items || []
          };
        })
      );
      
      return ordersWithItems;
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
};
```

#### Update Order Status
```typescript
// Update order status (Admin/Staff)
const updateOrderStatus = async (orderId: string, newStatus: string) => {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);
    
    if (error) throw error;
    
    Alert.alert('Success', `Order marked as ${newStatus}`);
  } catch (error: any) {
    console.error('Error updating order:', error);
    Alert.alert('Error', error.message);
  }
};
```

---

### 6.3.5 Payment Module
**File:** `src/screens/user/PaymentScreen.tsx`

#### Razorpay Payment
```typescript
// Handle Razorpay payment
const handleRazorpayPayment = async () => {
  try {
    setProcessing(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    const RazorpayCheckout = require('react-native-razorpay').default;

    // Configure Razorpay options
    const options = {
      description: 'DineDesk Payment',
      currency: 'INR',
      key: RAZORPAY_KEY_ID,
      amount: payableTotal * 100, // Amount in paise
      name: 'DineDesk',
      prefill: {
        email: user.email || 'user@dinedesk.com',
        contact: '9999999999',
      },
    };

    // Open Razorpay checkout
    RazorpayCheckout.open(options)
      .then(async (data: any) => {
        console.log('✅ Payment Success:', data);
        
        // Create order after successful payment
        await createOrderAfterPayment(
          user.id,
          data.razorpay_payment_id,
          requestedTime,
          user.email || 'user@dinedesk.com',
          'razorpay'
        );
      })
      .catch((error: any) => {
        console.error('Payment Error:', error);
        Alert.alert('Payment Failed', 'Please try again');
        setProcessing(false);
      });
  } catch (e: any) {
    console.error('Error:', e);
    Alert.alert('Error', e?.message || 'Payment failed');
    setProcessing(false);
  }
};
```

#### Transaction Record Insertion
```typescript
// Create transaction record in database
const createTransactionRecord = async (orderData: any, userId: string, paymentId: string, paymentMethod: string) => {
  try {
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        order_id: orderData.id,
        user_id: userId,
        amount: payableTotal,
        payment_status: 'completed',
        payment_method: paymentMethod,
        payment_id: paymentId,
      });
    
    if (transactionError) {
      console.error('❌ Transaction record error:', transactionError);
    } else {
      console.log('💳 Transaction record created successfully');
    }
  } catch (txErr) {
    console.error('Transaction creation failed:', txErr);
  }
};
```

---

### 6.3.6 Loyalty & Rewards Module
**File:** `src/screens/user/PaymentScreen.tsx`

#### Calculate and Award Points
```typescript
// Award loyalty points based on order amount (10 points per ₹250)
const awardLoyaltyPoints = async (userId: string, amount: number) => {
  const points = Math.floor(amount / 250) * 10;
  if (points <= 0) return;
  
  try {
    const { data, error } = await supabase
      .from('loyalty_rewards')
      .select('total_points, points_earned')
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Create new record if doesn't exist
    if (!data) {
      await supabase
        .from('loyalty_rewards')
        .insert({
          user_id: userId,
          total_points: points,
          points_earned: points,
          points_redeemed: 0,
        });
      return;
    }

    // Update existing record
    const nextTotal = (data.total_points || 0) + points;
    const nextEarned = (data.points_earned || 0) + points;

    await supabase
      .from('loyalty_rewards')
      .update({
        total_points: nextTotal,
        points_earned: nextEarned,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
  } catch (err) {
    console.log('Loyalty rewards update skipped:', err);
  }
};
```

#### Redeem Loyalty Points
```typescript
// Redeem loyalty points (max 5 per order)
const redeemLoyaltyPoints = async (userId: string, pointsToRedeem: number) => {
  if (pointsToRedeem <= 0) return;
  
  try {
    const { data, error } = await supabase
      .from('loyalty_rewards')
      .select('total_points, points_redeemed')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (error) throw error;
    
    if (!data || (data.total_points || 0) < pointsToRedeem) return;

    // Update points balance
    await supabase
      .from('loyalty_rewards')
      .update({
        total_points: (data.total_points || 0) - pointsToRedeem,
        points_redeemed: (data.points_redeemed || 0) + pointsToRedeem,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
  } catch (err) {
    console.log('Loyalty redemption skipped:', err);
  }
};
```

#### Fetch User Rewards
```typescript
// Fetch user's loyalty rewards balance
const fetchUserRewards = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('loyalty_rewards')
      .select('total_points, points_earned, points_redeemed')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (error) throw error;
    
    return {
      totalPoints: data?.total_points || 0,
      pointsEarned: data?.points_earned || 0,
      pointsRedeemed: data?.points_redeemed || 0,
    };
  } catch (error) {
    console.error('Error fetching rewards:', error);
    return { totalPoints: 0, pointsEarned: 0, pointsRedeemed: 0 };
  }
};
```

---

### 6.3.7 Feedback Module
**File:** `src/screens/user/FeedbackTab.tsx`

#### Insert Feedback
```typescript
// Submit user feedback to database
const submitFeedback = async () => {
  if (!rating || !comment.trim()) {
    Alert.alert('Error', 'Please provide a rating and comment');
    return;
  }

  setSubmitting(true);
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      Alert.alert('Error', 'You must be logged in to submit feedback');
      return;
    }

    const { error } = await supabase
      .from('feedback')
      .insert({
        user_id: user.id,
        rating: rating,
        comment: comment.trim(),
        category: selectedCategory,
      });

    if (error) throw error;

    Alert.alert('Success', 'Thank you for your feedback!');
    setRating(0);
    setComment('');
    setSelectedCategory('General');
  } catch (error: any) {
    console.error('Error submitting feedback:', error);
    Alert.alert('Error', error.message);
  } finally {
    setSubmitting(false);
  }
};
```

#### Fetch Feedback Entries
```typescript
// Fetch all feedback entries (User view)
const fetchUserFeedback = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return [];
  }
};
```

#### Admin View of Feedback
```typescript
// Fetch all feedback (Admin view)
const fetchAllFeedback = async () => {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select(`
        *,
        profiles:user_id (
          name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data.map((feedback: any) => ({
      id: feedback.id,
      rating: feedback.rating,
      comment: feedback.comment,
      category: feedback.category,
      userName: feedback.profiles?.name || 'Unknown',
      userEmail: feedback.profiles?.email || '',
      createdAt: feedback.created_at,
    }));
  } catch (error) {
    console.error('Error fetching all feedback:', error);
    return [];
  }
};
```

---

### 6.3.8 Canteen Staff Module
**File:** `src/screens/canteen staff/CanteenStaffDashboard.tsx`

#### Fetch Incoming Orders
```typescript
// Fetch pending orders for canteen staff
const fetchIncomingOrders = async () => {
  try {
    setLoading(true);
    
    const { data: ordersData, error } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        total_price,
        status,
        created_at,
        token_number,
        requested_time,
        profiles:user_id (
          name,
          email
        )
      `)
      .in('status', ['Pending', 'Preparing'])
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Fetch order items for each order
    const ordersWithItems = await Promise.all(
      (ordersData || []).map(async (order) => {
        const { data: items } = await supabase
          .from('order_items')
          .select(`
            quantity,
            menu_items (name, price)
          `)
          .eq('order_id', order.id);

        return {
          id: order.id,
          userName: order.profiles?.name || 'Guest',
          userEmail: order.profiles?.email || '',
          items: items || [],
          totalPrice: order.total_price,
          status: order.status,
          tokenNumber: order.token_number,
          requestedTime: order.requested_time,
          timestamp: new Date(order.created_at).toLocaleString(),
        };
      })
    );

    setOrders(ordersWithItems);
  } catch (error: any) {
    console error('Error fetching orders:', error);
    Alert.alert('Error', error.message);
  } finally {
    setLoading(false);
  }
};
```

#### Update Order Preparation Status
```typescript
// Update order status to 'Preparing'
const markAsPreparing = async (orderId: string) => {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'Preparing' })
      .eq('id', orderId);

    if (error) throw error;

    Alert.alert('Success', 'Order marked as preparing');
    fetchIncomingOrders(); // Refresh orders
  } catch (error: any) {
    console.error('Error updating order:', error);
    Alert.alert('Error', error.message);
  }
};
```

#### Mark Orders as Ready/Completed
```typescript
// Mark order as ready for pickup
const markAsReady = async (orderId: string) => {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'Ready' })
      .eq('id', orderId);

    if (error) throw error;

    Alert.alert('Success', 'Order marked as ready');
    fetchIncomingOrders(); // Refresh orders
  } catch (error: any) {
    console.error('Error updating order:', error);
    Alert.alert('Error', error.message);
  }
};

// Mark order as completed
const markAsCompleted = async (orderId: string) => {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'Completed' })
      .eq('id', orderId);

    if (error) throw error;

    Alert.alert('Success', 'Order completed');
    fetchIncomingOrders(); // Refresh orders
  } catch (error: any) {
    console.error('Error updating order:', error);
    Alert.alert('Error', error.message);
  }
};
```

---

### 6.3.9 Routing & Navigation
**File:** `src/navigation/RootNavigator.tsx`

#### React Navigation Configuration
```typescript
// Root navigation stack with type safety
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

export type RootStackParamList = {
  Login: { email?: string } | undefined;
  Register: undefined;
  UserDashboard: undefined;
  AdminDashboard: undefined;
  CanteenStaffDashboard: undefined;
  Payment: {
    items: any[];
    totalPrice: number;
    openingTime?: string;
    closingTime?: string;
  };
  Receipt: {
    order: any;
    clearCart: boolean;
  };
  OrderToken: {
    orderId: string;
    tokenNumber: number;
    newOrder: any;
    clearCart: boolean;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="UserDashboard" component={UserDashboard} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        <Stack.Screen name="CanteenStaffDashboard" component={CanteenStaffDashboard} />
        <Stack.Screen name="Payment" component={PaymentScreen} />
        <Stack.Screen name="Receipt" component={ReceiptScreen} />
        <Stack.Screen name="OrderToken" component={OrderTokenScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

#### Protected Routes Implementation
```typescript
// Check authentication status and redirect accordingly
useEffect(() => {
  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Not logged in - redirect to login
        setInitialRoute('Login');
        return;
      }

      // Get user role from profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_active')
        .eq('id', session.user.id)
        .single();

      if (!profile || !profile.is_active) {
        // Invalid or inactive user - logout
        await supabase.auth.signOut();
        setInitialRoute('Login');
        return;
      }

      // Redirect based on role
      switch (profile.role) {
        case 'admin':
          setInitialRoute('AdminDashboard');
          break;
        case 'canteenStaff':
          setInitialRoute('CanteenStaffDashboard');
          break;
        default:
          setInitialRoute('UserDashboard');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setInitialRoute('Login');
    }
  };

  checkAuth();
}, []);
```

#### Role-Based Navigation
```typescript
// Navigate based on user role after login
const navigateToRoleBasedDashboard = async (user: any) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      Alert.alert('Error', 'Profile not found');
      return;
    }

    // Navigate to appropriate dashboard
    switch (profile.role) {
      case 'admin':
        navigation.replace('AdminDashboard');
        break;
      case 'canteenStaff':
        navigation.replace('CanteenStaffDashboard');
        break;
      case 'user':
      default:
        navigation.replace('UserDashboard');
        break;
    }
  } catch (error) {
    console.error('Navigation error:', error);
  }
};
```

---

## End of Source Code Documentation
