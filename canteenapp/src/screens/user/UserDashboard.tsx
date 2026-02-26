import React, { useState, useEffect, useMemo } from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  Alert,
  Image,
  ActivityIndicator,
  TextInput,
  Modal,
  BackHandler,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../theme/ThemeContext';
import { BottomNavigation } from '../../components/BottomNavigation';
import FeedbackTab from './FeedbackTab';
import { SideDrawer } from '../../components/SideDrawer';
import styles from './styles';
import { HomeTab } from './HomeTab';
import StudentHomeTab from './StudentHomeTab';
import HomeStaff from './HomeStaff';
import { MenuTab } from './MenuTab';
import { OrdersTab } from './OrdersTab';
import { WalletTab } from './WalletTab';
import { ProfileTab } from './ProfileTab';
import { WishlistTab } from './WishlistTab';
import { CartTab } from './CartTab';
import ReservationsTab from './ReservationsTab';
import { getCart as loadStoredCart, setCart as saveStoredCart, clearCart as clearStoredCart } from '../../lib/cartStorage';
// If you need saveCart and clearCart, export them as default or named from the stub, or adjust usage accordingly.

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  image?: string;
  available?: boolean;
  food_type?: 'veg' | 'non-veg';
}

interface CartItem extends MenuItem {
  quantity: number;
}

interface Order {
  id: string;
  items: CartItem[];
  totalPrice: number;
  status: 'Pending' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled';
  timestamp: string;
  created_at?: string;
}

export default function UserDashboard({ navigation, route }: any) {
  const { colors, isDark, toggleTheme } = useTheme();
    const [userRole, setUserRole] = useState<string>('Student');
  const [activeTab, setActiveTab] = useState('home');
  const [showPopularInMenu, setShowPopularInMenu] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [walletBalance] = useState(500);
  const [openingTime, setOpeningTime] = useState('9:00 am');
  const [closingTime, setClosingTime] = useState('4:45 pm');
  const [closingCountdown, setClosingCountdown] = useState<string>('');
  const [canteenStatus, setCanteenStatus] = useState<'closed' | 'opening-soon' | 'open'>('open');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  // Helper function to format time to lowercase am/pm
  const formatTime = (timeStr: string): string => {
    if (!timeStr) return timeStr;
    // Convert "9:00 AM" or "09:00 AM" to "9:00 am"
    return timeStr.replace(/\s*(AM|PM|am|pm)$/i, (match) => ' ' + match.trim().toLowerCase());
  };
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [wishlistItems, setWishlistItems] = useState<string[]>([]);
  
  // Reservation modal states
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [pendingPaymentData, setPendingPaymentData] = useState<any>(null);
  const [selectedResDate, setSelectedResDate] = useState<Date | null>(null);
  const [selectedResTimeSlot, setSelectedResTimeSlot] = useState('');
  const [selectedResArea, setSelectedResArea] = useState('');
  const [selectedResSeat, setSelectedResSeat] = useState('');
  const [resNumberOfSeats, setResNumberOfSeats] = useState(1);
  const [resPurpose, setResPurpose] = useState('');
  const [resSpecialRequests, setResSpecialRequests] = useState('');
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);

  // Load persisted cart on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await loadStoredCart();
        if (stored && Array.isArray(stored)) {
          setCart(stored);
        }
      } catch (err) {
        console.log('Cart restore skipped:', err);
      }
    })();
  }, []);

  // Hardware back button handler
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      console.log('Back button pressed');
      console.log('Current state - showPopularInMenu:', showPopularInMenu);
      
      if (showPopularInMenu) {
        console.log('Closing Popular view');
        setShowPopularInMenu(false);
        setActiveTab('home');
        console.log('Popular view closed, switched to home tab');
        return true; // Prevent default back behavior
      }
      
      // Allow default back behavior if Popular view is not open
      return false;
    });

    return () => backHandler.remove();
  }, [showPopularInMenu]);

  // Load existing wishlist IDs on mount so heart states match server
  useEffect(() => {
    const loadWishlist = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('wishlist')
        .select('menu_item_id')
        .eq('user_id', user.id);
      if (!error && data) {
        setWishlistItems(data.map((row: any) => row.menu_item_id));
      }
    };

    loadWishlist();
  }, []);

  // Load logged-in user's name and email
  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Get the user's name from profiles table
            const { data: profileData } = await supabase
              .from('profiles')
              .select('name, role')
          .eq('id', user.id)
          .maybeSingle();
        
        console.log('UserDashboard - Raw profile data from DB:', profileData);
        
        // Use name from profile, or fall back to email name, or 'User'
        const displayName = profileData?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
        setUserName(displayName);
        const role = (profileData as { name?: string; role?: string })?.role || 'Student';
        console.log('UserDashboard - Fetched role from database:', role);
        setUserRole(role);
        setUserEmail(user.email || '');
      }
    };

    loadUserData();
  }, []);

  // Fetch business hours from database
  useEffect(() => {
    const fetchBusinessHours = async () => {
      const { data, error } = await supabase
        .from('business_settings')
        .select('opening_time, closing_time')
        .limit(1)
        .maybeSingle();
      
      if (!error && data) {
        // Trim and ensure proper format
        const openTime = formatTime((data.opening_time || '9:00 AM').trim());
        const closeTime = formatTime((data.closing_time || '4:45 PM').trim());
        
        console.log('=== FETCHED BUSINESS HOURS ===');
        console.log('Raw opening_time from DB:', data.opening_time);
        console.log('Raw closing_time from DB:', data.closing_time);
        console.log('Processed opening_time:', openTime);
        console.log('Processed closing_time:', closeTime);
        
        setOpeningTime(openTime);
        setClosingTime(closeTime);
      } else {
        console.error('Error fetching business hours:', error);
        // Set defaults
        setOpeningTime('9:00 am');
        setClosingTime('4:45 pm');
      }
    };

    fetchBusinessHours();
  }, []);

  // Countdown timer that updates every second
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      // Use 'numeric' instead of '2-digit' to avoid leading zeros (9:00 am instead of 09:00 am)
      const currentTime = formatTime(now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
      
      const parseTime = (timeStr: string) => {
        if (!timeStr) return null;
        // Handle both "9:00 AM" and "09:00 AM" formats
        const match = timeStr.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)/i);
        if (!match) {
          console.warn('Invalid time format:', timeStr);
          return null;
        }
        let hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const period = match[3].toUpperCase();
        
        // Convert to 24-hour format
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        
        return hours * 60 + minutes;
      };

      const currentMinutes = parseTime(currentTime);
      const openingMinutes = parseTime(openingTime);
      const closingMinutes = parseTime(closingTime);

      console.log('=== TIME CHECK ===');
      console.log('Current time:', currentTime, '→', currentMinutes, 'mins');
      console.log('Opening time:', openingTime, '→', openingMinutes, 'mins');
      console.log('Closing time:', closingTime, '→', closingMinutes, 'mins');

      if (currentMinutes !== null && openingMinutes !== null && closingMinutes !== null) {
        if (currentMinutes < openingMinutes) {
          // Before opening - show countdown to opening
          const minutesUntilOpen = openingMinutes - currentMinutes;
          const hours = Math.floor(minutesUntilOpen / 60);
          const mins = minutesUntilOpen % 60;
          const secs = 60 - now.getSeconds();
          setClosingCountdown(`${hours}h ${mins}m ${secs}s`);
          setCanteenStatus('opening-soon');
          console.log('Status: OPENING SOON -', minutesUntilOpen, 'minutes until open');
        } else if (currentMinutes >= closingMinutes) {
          // After closing - show closed message
          setClosingCountdown('Closed for today');
          setCanteenStatus('closed');
          console.log('Status: CLOSED');
        } else {
          // During business hours - show countdown to closing
          const minutesUntilClose = closingMinutes - currentMinutes;
          const hours = Math.floor(minutesUntilClose / 60);
          const mins = minutesUntilClose % 60;
          const secs = 60 - now.getSeconds();
          setClosingCountdown(`${hours}h ${mins}m ${secs}s`);
          setCanteenStatus('open');
          console.log('Status: OPEN -', minutesUntilClose, 'minutes until close');
        }
      } else {
        console.warn('Could not parse times properly');
        console.warn('Current:', currentMinutes, 'Opening:', openingMinutes, 'Closing:', closingMinutes);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000); // Update every second

    return () => clearInterval(interval);
  }, [openingTime, closingTime]);

  const addToCart = (item: MenuItem) => {
    // Check if canteen is closed or opening soon
    if (canteenStatus === 'opening-soon') {
      Alert.alert(
        'Not Yet Open',
        `Orders will be available from ${openingTime}. Please try again later!`,
        [{ text: 'OK', style: 'cancel' }]
      );
      return;
    }

    if (canteenStatus === 'closed') {
      Alert.alert(
        'Canteen Closed',
        `The canteen is currently closed. It will reopen tomorrow at ${openingTime}. See you then!`,
        [{ text: 'OK', style: 'cancel' }]
      );
      return;
    }

    const existingItem = cart.find((cartItem) => cartItem.id === item.id);
    if (existingItem) {
      setCart(
        cart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      );
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter((item) => item.id !== itemId));
  };

  const updateCartQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
    } else {
      setCart(
        cart.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  // Persist cart when it changes
  useEffect(() => {
    try { saveStoredCart(cart); } catch {}
  }, [cart]);

  const cancelOrder = async (orderId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please login to cancel order');
        return;
      }

      // Check order status before cancelling
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !order) {
        Alert.alert('Error', 'Order not found');
        return;
      }

      // Only allow cancelling Pending orders (case-insensitive)
      const orderStatus = order.status?.toLowerCase().trim();
      if (orderStatus !== 'pending') {
        Alert.alert(
          'Cannot Cancel',
          `Order is already ${order.status}. You can only cancel pending orders.`,
          [{ text: 'OK' }]
        );
        return;
      }

      Alert.alert(
        'Cancel Order',
        'Are you sure you want to cancel this order?',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes, Cancel',
            style: 'destructive',
            onPress: async () => {
              try {
                // Get order items first to restore stock
                const { data: orderItems, error: itemsError } = await supabase
                  .from('order_items')
                  .select('menu_item_id, qty')
                  .eq('order_id', orderId);

                console.log('Order items to restore:', orderItems);

                if (!itemsError && orderItems && orderItems.length > 0) {
                  // Restore stock for each item
                  for (const item of orderItems) {
                    const { data: currentItem } = await supabase
                      .from('menu_items')
                      .select('stock_quantity')
                      .eq('id', item.menu_item_id)
                      .single();

                    if (currentItem) {
                      const newStock = (currentItem.stock_quantity || 0) + item.qty;
                      console.log(`Restoring stock - Item: ${item.menu_item_id}, Old: ${currentItem.stock_quantity}, Adding: ${item.qty}, New: ${newStock}`);
                      
                      const { error: updateError } = await supabase
                        .from('menu_items')
                        .update({ stock_quantity: newStock })
                        .eq('id', item.menu_item_id);
                      
                      if (updateError) {
                        console.error('Stock update error:', updateError);
                      } else {
                        console.log('Stock updated successfully');
                      }
                    }
                  }
                }

                // Update order status to Cancelled in database

                const { error: statusError } = await supabase
                  .from('orders')
                  .update({ status: 'Cancelled' })
                  .eq('id', orderId)
                  .eq('user_id', user.id);

                if (statusError) {
                  console.error('Failed to update order status:', statusError);
                  console.error('Status Error Details:', statusError.message, statusError.code);
                } else {
                  console.log('Order status updated to Cancelled');
                  // Fetch order details for email
                  const { data: cancelledOrder, error: fetchOrderError } = await supabase
                    .from('orders')
                    .select('id, token_number, created_at, total_price, status')
                    .eq('id', orderId)
                    .single();
                  if (user.email && cancelledOrder) {
                    const { data: orderItemsData } = await supabase
                      .from('order_items')
                      .select('menu_item_id, quantity, menu_items(name, price)')
                      .eq('order_id', orderId);
                    // Format items for email
                    const items = (orderItemsData || []).map((oi: any) => ({
                      name: oi.menu_items?.name || '',
                      quantity: oi.quantity,
                      price: oi.menu_items?.price || 0,
                    }));
                    // Send cancellation email
                    try {
                      const sendReceiptEmail = require('../../services/emailService').sendReceiptEmail;
                      await sendReceiptEmail({
                        userEmail: user.email,
                        userName: user.user_metadata?.full_name || user.email.split('@')[0],
                        order: {
                          id: cancelledOrder.id,
                          tokenNumber: cancelledOrder.token_number,
                          timestamp: cancelledOrder.created_at ? new Date(cancelledOrder.created_at).toLocaleString() : new Date().toLocaleString(),
                          status: 'Cancelled',
                          items,
                          totalPrice: cancelledOrder.total_price,
                        },
                      });
                    } catch (emailErr) {
                      console.error('Failed to send cancellation email:', emailErr);
                    }
                  } else {
                    console.warn('Cancellation email not sent: user.email or cancelledOrder is missing.');
                  }
                }

                console.log('About to refresh...');
                
                // Update local state to mark as cancelled
                setOrders(orders.map(o => 
                  o.id === orderId ? { ...o, status: 'Cancelled' as const } : o
                ));

                // Refresh menu items to reflect updated stock
                await refreshMenuItems();

                Alert.alert('Success', 'Order cancelled successfully! Stock restored.');
              } catch (err) {
                console.error('Cancel error:', err);
                Alert.alert('Error', 'Failed to cancel order');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Cancel order error:', error);
      Alert.alert('Error', 'Failed to cancel order');
    }
  };

  const placeOrder = async (pickupHour?: number, pickupMinute?: number, pickupPeriod?: 'AM' | 'PM') => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add items before placing an order');
      return;
    }

    // Check if ordering is allowed based on canteen status
    if (canteenStatus === 'opening-soon') {
      Alert.alert(
        'Not Open Yet',
        `Orders will be available from ${openingTime}. ${closingCountdown}`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    if (canteenStatus === 'closed') {
      Alert.alert(
        'Ordering Closed',
        `Sorry, orders are closed for today. We accept orders until ${closingTime}. Please come back tomorrow!`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Require login before navigating to Payment
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Login Required', 'Please log in to place your order.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => navigation.replace('Login') },
        ]);
        return;
      }
    } catch {}

    const totalPrice = getTotalPrice();
    const pickupTime = pickupHour && pickupMinute && pickupPeriod 
      ? `${pickupHour}:${pickupMinute.toString().padStart(2, '0')} ${pickupPeriod}`
      : undefined;
    
    // Store payment data and show reservation modal
    setPendingPaymentData({
      items: cart.map(ci => ({ id: ci.id, name: ci.name, price: ci.price, quantity: ci.quantity })),
      totalPrice,
      pickupTime,
    });

    // Ask if user wants to reserve a seat
    Alert.alert(
      'Reserve a Seat?',
      'Would you like to reserve a seat in the canteen?',
      [
        {
          text: 'No, Skip',
          style: 'cancel',
          onPress: () => {
            // Go directly to payment without reservation
            navigation.navigate('Payment', {
              items: cart.map(ci => ({ id: ci.id, name: ci.name, price: ci.price, quantity: ci.quantity })),
              totalPrice,
              pickupTime,
              openingTime,
              closingTime,
            });
          },
        },
        {
          text: 'Yes, Reserve',
          onPress: () => {
            // Show reservation modal
            setShowReservationModal(true);
          },
        },
      ]
    );
  };

  const toggleWishlist = async (item: MenuItem): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const isInWishlist = wishlistItems.includes(item.id);

    if (isInWishlist) {
      await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', user.id)
        .eq('menu_item_id', item.id);
      setWishlistItems(wishlistItems.filter(id => id !== item.id));
    } else {
      await supabase
        .from('wishlist')
        .insert({
          user_id: user.id,
          menu_item_id: item.id,
          item_name: item.name,
          item_price: item.price,
          item_image: item.image,
        });
      setWishlistItems([...wishlistItems, item.id]);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigation.replace('Login');
  };

  // Function to fetch and refresh menu items
  const refreshMenuItems = async () => {
    try {
      console.log('Refreshing menu items after cancel...');
      const { data, error } = await supabase.from('menu_items').select('*');
      if (error) {
        console.error('Error fetching menu items:', error);
        return;
      }
      
      if (data && data.length > 0) {
        console.log('Fresh menu items fetched:', data.length, 'items');
        const mappedItems = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          category: item.category,
          description: item.description,
          image: item.image || item.image_url,
          available: item.available,
          stock_quantity: item.stock_quantity,
        }));
        
        // Log stock quantities for verification
        mappedItems.forEach((item: any) => {
          console.log(`  ${item.name}: stock = ${item.stock_quantity}`);
        });
        
        const availableItems = mappedItems.filter((item: any) => item.available !== false);
        setMenuItems(availableItems);
        console.log('Menu items state updated');
      }
    } catch (e) {
      console.error('Exception fetching menu items:', e);
    }
  };

  useEffect(() => {
    // Handle return from Payment/Token screens to append new order and clear cart
    const params = route?.params;
    if (params?.newOrder) {
      setOrders((prev) => [params.newOrder as Order, ...prev]);
    }
    if (params?.clearCart) {
      setCart([]);
      try { clearStoredCart(); } catch {}
    }
    if (params?.newOrder || params?.clearCart) {
      // Clear params so it doesn't re-run
      navigation.setParams({ newOrder: undefined, clearCart: undefined });
    }
  }, [route?.params]);

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setLoadingMenu(true);
        const { data, error } = await supabase.from('menu_items').select('*');
        if (error) {
          console.error('Error fetching menu items:', error);
          setMenuItems([]);
        } else if (data && data.length > 0) {
          // Map data and handle both 'image' and 'image_url' column names
          const mappedItems = data.map((item: any) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            category: item.category,
            description: item.description,
            image: item.image || item.image_url, // Handle both column names
            available: item.available,
            stock_quantity: item.stock_quantity,
            food_type: item.food_type || 'veg', // Default to veg if not specified
          }));
          const availableItems = mappedItems.filter((item: any) => item.available !== false);
          setMenuItems(availableItems);
          console.log('Menu items fetched:', availableItems);
        } else {
          setMenuItems([]);
        }
      } catch (e) {
        console.error('Exception fetching menu items:', e);
        setMenuItems([]);
      } finally {
        setLoadingMenu(false);
      }
    };
    fetchMenuItems();

    // Subscribe to realtime changes on menu_items to keep UI fresh
    const menuChannel = supabase
      .channel('menu-items-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => {
        fetchMenuItems();
      })
      .subscribe();

    return () => {
      try { supabase.removeChannel(menuChannel); } catch {}
    };
  }, []);

  // Fetch user's orders and subscribe to real-time updates
  useEffect(() => {
    const fetchAndSubscribeOrders = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Initial fetch
      const fetchOrders = async () => {
        try {
          const { data: ordersData } = await supabase
            .from('orders')
            .select('id,status,total_price,created_at,token_number')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (ordersData && ordersData.length > 0) {
            // Fetch order items for each order with menu item details
            const ordersWithItems = await Promise.all(
              ordersData.map(async (order: any) => {
                try {
                  const { data: itemsData } = await supabase
                    .from('order_items')
                    .select(`
                      id,
                      quantity,
                      menu_item_id,
                      menu_items!inner(id, name, price)
                    `)
                    .eq('order_id', order.id);

                  const items = (itemsData || []).map((item: any) => ({
                    id: item.menu_item_id,
                    name: item.menu_items?.name || 'Unknown Item',
                    price: Number(item.menu_items?.price || 0),
                    quantity: item.quantity || 1,
                    category: '',
                  }));

                  return {
                    id: order.id,
                    items,
                    totalPrice: Number(order.total_price || 0),
                    status: order.status,
                    timestamp: order.created_at,
                    created_at: order.created_at,
                    total_price: order.total_price,
                    token_number: order.token_number,
                  };
                } catch (itemErr) {
                  console.warn(`Could not fetch items for order ${order.id}:`, itemErr);
                  // Return order without items if fetching items fails
                  return {
                    id: order.id,
                    items: [],
                    totalPrice: Number(order.total_price || 0),
                    status: order.status,
                    timestamp: order.created_at,
                    created_at: order.created_at,
                    total_price: order.total_price,
                    token_number: order.token_number,
                  };
                }
              })
            );
            setOrders(ordersWithItems);
          }
        } catch (err) {
          console.error('Error fetching orders:', err);
        }
      };

      await fetchOrders();

      // Real-time subscription
      const channel = supabase
        .channel('user-orders-realtime')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`
        }, () => {
          console.log('Order updated, refreshing...');
          fetchOrders();
        })
        .subscribe();

      return () => {
        try { supabase.removeChannel(channel); } catch {}
      };
    };

    const cleanup = fetchAndSubscribeOrders();
    return () => {
      if (cleanup && typeof cleanup.then === 'function') {
        cleanup.then(fn => { if (typeof fn === 'function') fn(); });
      }
    };
  }, []);

  // Handle optional seat reservation during checkout
  const submitReservationThenPayment = async () => {
    if (!selectedResSeat || !selectedResTimeSlot || !selectedResArea || !resPurpose.trim() || !selectedResDate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please login to make a reservation');
        return;
      }

      const dateStr = selectedResDate?.toISOString().split('T')[0] ?? '';
      if (!dateStr) {
        Alert.alert('Error', 'Invalid date selected');
        return;
      }
      
      // Check if seat already reserved
      const { data: existingReservations, error: checkError } = await supabase
        .from('seat_reservations')
        .select('id')
        .eq('seat_number', selectedResSeat)
        .eq('reservation_date', dateStr)
        .eq('reservation_time_slot', selectedResTimeSlot)
        .eq('status', 'Confirmed');

      if (checkError) throw checkError;

      if (existingReservations && existingReservations.length > 0) {
        Alert.alert('Not Available', 'This seat is already reserved for the selected time slot');
        return;
      }

      // Create reservation
      const { error: insertError } = await supabase
        .from('seat_reservations')
        .insert({
          user_id: user.id,
          seat_number: selectedResSeat,
          reservation_date: dateStr,
          reservation_time_slot: selectedResTimeSlot,
          seating_area: selectedResArea,
          number_of_seats: resNumberOfSeats as unknown as string,
          purpose: resPurpose.trim(),
          status: 'Confirmed',
        });

      if (insertError) throw insertError;

      // Reservation successful, now go to payment
      setShowReservationModal(false);
      Alert.alert('Seat Reserved', 'Your seat has been reserved! Proceeding to payment...');
      
      // Navigate to payment
      if (pendingPaymentData) {
        navigation.navigate('Payment', {
          items: pendingPaymentData.items,
          totalPrice: pendingPaymentData.totalPrice,
          pickupTime: pendingPaymentData.pickupTime,
          openingTime,
          closingTime,
        });
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create reservation');
    }
  };

  const drawerItems = [
    { id: 'notifications', label: 'Notifications', icon: 'notifications', onPress: () => { setDrawerVisible(false); setNotificationModalVisible(true); } },
    { id: 'reservations', label: 'Seat Reservations', icon: 'calendar', onPress: () => setActiveTab('reservations') },
    { id: 'wallet', label: 'Loyalty Points', icon: 'star', onPress: () => setActiveTab('wallet') },
    { id: 'feedback', label: 'Feedback', icon: 'feedback', onPress: () => setActiveTab('feedback') },
    { id: 'help', label: 'Help & Support', icon: 'help', onPress: () => setActiveTab('profile') },
    { id: 'about', label: 'About', icon: 'about', onPress: () => setActiveTab('profile') },
    { id: 'logout', label: 'Logout', icon: 'logout', danger: true, onPress: logout },
  ];

  const tabs = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'menu', label: 'Menu', icon: 'menu' },
    { id: 'cart', label: 'Cart', icon: 'cart', badgeCount: cart.length },
    { id: 'orders', label: 'Orders', icon: 'orders' },
    { id: 'wishlist', label: 'Wishlist', icon: 'wishlist' },
    { id: 'wallet', label: 'Loyalty', icon: 'star' },
    { id: 'profile', label: 'Profile', icon: 'profile' },
  ];

  const closingDate: Date | null = useMemo(() => {
    try {
      const match = closingTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (!match) return null;
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const ampm = match[3].toUpperCase();
      if (ampm === 'PM' && hours !== 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      const now = new Date();
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
      return d;
    } catch {
      return null;
    }
  }, [closingTime]);

  useEffect(() => {
    if (!closingDate) {
      setClosingCountdown('—');
      return;
    }
    const formatDuration = (ms: number) => {
      if (ms <= 0) return 'Closed';
      const totalSeconds = Math.floor(ms / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      return `${hours}h ${minutes}m ${seconds}s`;
    };
    setClosingCountdown(formatDuration(closingDate.getTime() - Date.now()));
    const interval = setInterval(() => {
      const remaining = closingDate.getTime() - Date.now();
      setClosingCountdown(formatDuration(remaining));
    }, 1000);
    return () => clearInterval(interval);
  }, [closingDate]);

  const isSearching = searchQuery.trim().length > 0;
  const filteredMenuItems = useMemo(() => {
    const base = selectedCategory ? menuItems.filter((item) => item.category === selectedCategory) : menuItems;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return base;
    const matches = base.filter((item) => item.name.toLowerCase().includes(query) || item.category.toLowerCase().includes(query));
    const startsWith = matches.filter((item) => item.name.toLowerCase().startsWith(query)).sort((a, b) => a.name.localeCompare(b.name));
    const contains = matches.filter((item) => !item.name.toLowerCase().startsWith(query)).sort((a, b) => a.name.localeCompare(b.name));
    return [...startsWith, ...contains];
  }, [menuItems, searchQuery, selectedCategory]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SideDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} items={drawerItems} userName={userName} userEmail={userEmail} />

      {/* Removed HomeTab for students. Only StudentHome is rendered. */}
      {activeTab === 'home' && (
        <StudentHomeTab userRole={route?.params?.role || userRole} />
      )}
      {activeTab === 'menu' && (
        <MenuTab
          colors={colors}
          onAddToCart={addToCart}
          onAddToWishlist={toggleWishlist}
          onOpenDrawer={() => setDrawerVisible(true)}
        />
      )}
      {activeTab === 'cart' && (
        <CartTab
          colors={colors}
          cart={cart}
          onUpdateQuantity={updateCartQuantity}
          onRemoveItem={removeFromCart}
          onPlaceOrder={placeOrder}
          onBackToMenu={() => setActiveTab('menu')}
        />
      )}
      {activeTab === 'orders' && (
        <OrdersTab 
          colors={colors}
          onOpenDrawer={() => setDrawerVisible(true)}
        />
      )}
      {activeTab === 'wallet' && (
        <WalletTab colors={colors} walletBalance={walletBalance} />
      )}
      {activeTab === 'feedback' && (
        <FeedbackTab colors={colors} />
      )}
      {activeTab === 'wishlist' && (
        <WishlistTab
          colors={colors}
          onAddToCart={addToCart}
          onOpenDrawer={() => setDrawerVisible(true)}
        />
      )}
      {activeTab === 'profile' && (
        <ProfileTab colors={colors} openDrawer={() => setDrawerVisible(true)} logout={logout} walletBalance={walletBalance} orders={orders} />
      )}
      {activeTab === 'reservations' && (
        <ReservationsTab />
      )}

      {/* Optional Seat Reservation Modal */}
      <Modal
        visible={showReservationModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowReservationModal(false);
          setSelectedResDate(null);
          setSelectedResTimeSlot('');
          setSelectedResArea('');
          setSelectedResSeat('');
          setResNumberOfSeats(1);
          setResPurpose('');
          setResSpecialRequests('');
        }}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333', flexDirection: 'row', alignItems: 'center' }}>
                <Icon name="seat" size={20} color="#333" style={{ marginRight: 6 }} />
                Reserve a Seat
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowReservationModal(false);
                  setSelectedResDate(null);
                  setSelectedResTimeSlot('');
                  setSelectedResArea('');
                  setSelectedResSeat('');
                  setResNumberOfSeats(1);
                  setResPurpose('');
                  setResSpecialRequests('');
                }}
              >
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#999' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 20 }}>
              {/* Date Selection */}
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 10 }}>📅 Select Date</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                  const date = new Date();
                  date.setDate(date.getDate() + day);
                  const isSelected = selectedResDate && selectedResDate.toDateString() === date.toDateString();
                  return (
                    <TouchableOpacity
                      key={day}
                      onPress={() => setSelectedResDate(date)}
                      style={{
                        backgroundColor: isSelected ? colors.primary : '#f5f5f5',
                        padding: 12,
                        borderRadius: 10,
                        marginRight: 10,
                        minWidth: 70,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 12, color: isSelected ? 'white' : '#666', fontWeight: '500' }}>
                        {day === 0 ? 'Today' : day === 1 ? 'Tomorrow' : `+${day}d`}
                      </Text>
                      <Text style={{ fontSize: 11, color: isSelected ? 'white' : '#999', marginTop: 4 }}>
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Time Slot Selection */}
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 10 }}>⏰ Select Time</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 }}>
                {['11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM'].map((slot) => (
                  <TouchableOpacity
                    key={slot}
                    onPress={() => setSelectedResTimeSlot(slot)}
                    style={{
                      backgroundColor: selectedResTimeSlot === slot ? colors.primary : '#f5f5f5',
                      padding: 10,
                      borderRadius: 8,
                      marginRight: 8,
                      marginBottom: 8,
                      width: '22%',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 12, color: selectedResTimeSlot === slot ? 'white' : '#333', fontWeight: '500' }}>
                      {slot}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Seating Area Selection */}
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 10 }}>🏢 Select Area</Text>
              <View style={{ marginBottom: 20 }}>
                {[
                  { id: 'window', label: '🪟 Window', description: 'Scenic view' },
                  { id: 'quiet', label: '🤫 Quiet Zone', description: 'Peaceful' },
                  { id: 'social', label: '👥 Social Area', description: 'Busy & fun' },
                  { id: 'corner', label: '📍 Corner', description: 'Private' }
                ].map((area) => (
                  <TouchableOpacity
                    key={area.id}
                    onPress={() => setSelectedResArea(area.id)}
                    style={{
                      backgroundColor: selectedResArea === area.id ? colors.primary + '20' : '#f9f9f9',
                      borderWidth: selectedResArea === area.id ? 2 : 1,
                      borderColor: selectedResArea === area.id ? colors.primary : '#e0e0e0',
                      padding: 12,
                      borderRadius: 10,
                      marginBottom: 10,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 2 }}>{area.label}</Text>
                      <Text style={{ fontSize: 12, color: '#999' }}>{area.description}</Text>
                    </View>
                    {selectedResArea === area.id && (
                      <Text style={{ fontSize: 16, color: colors.primary }}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Seat Selection */}
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
                <Icon name="seat" size={16} color="#333" style={{ marginRight: 4 }} />
                Select Seat
              </Text>
              <View style={{ marginBottom: 20 }}>
                {['A', 'B', 'C', 'D'].map((row) => (
                  <View key={row} style={{ flexDirection: 'row', marginBottom: 10 }}>
                    {[1, 2, 3].map((col) => {
                      const seatId = `${row}${col}`;
                      return (
                        <TouchableOpacity
                          key={seatId}
                          onPress={() => setSelectedResSeat(seatId)}
                          style={{
                            flex: 1,
                            backgroundColor: selectedResSeat === seatId ? colors.primary : '#f5f5f5',
                            padding: 15,
                            borderRadius: 8,
                            marginRight: col < 3 ? 8 : 0,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 1,
                            borderColor: selectedResSeat === seatId ? colors.primary : '#ddd'
                          }}
                        >
                          <Text style={{ fontSize: 14, fontWeight: '600', color: selectedResSeat === seatId ? 'white' : '#333' }}>
                            {seatId}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>

              {/* Number of Seats */}
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 10 }}>👥 Number of Seats</Text>
              <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <TouchableOpacity
                    key={num}
                    onPress={() => setResNumberOfSeats(num)}
                    style={{
                      flex: 1,
                      backgroundColor: resNumberOfSeats === num ? colors.primary : '#f5f5f5',
                      padding: 10,
                      borderRadius: 8,
                      marginRight: num < 6 ? 8 : 0,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '600', color: resNumberOfSeats === num ? 'white' : '#333' }}>
                      {num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Purpose */}
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 }}>💭 Purpose</Text>
              <TextInput
                placeholder="e.g., Study, Meeting, Casual"
                value={resPurpose}
                onChangeText={setResPurpose}
                style={{
                  borderWidth: 1,
                  borderColor: '#ddd',
                  borderRadius: 8,
                  padding: 10,
                  marginBottom: 20,
                  fontSize: 14,
                  color: '#333'
                }}
              />

              {/* Submit Button */}
              <TouchableOpacity
                onPress={submitReservationThenPayment}
                style={{
                  backgroundColor: colors.primary,
                  paddingVertical: 14,
                  borderRadius: 10,
                  alignItems: 'center',
                  marginBottom: 20
                }}
              >
                <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
                  ✓ Book Seat & Continue to Payment
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <BottomNavigation tabs={tabs} activeTab={activeTab} onTabPress={setActiveTab} />

      {/* Floating Back Button Header for Popular View - Rendered Last to Stay on Top */}
      {showPopularInMenu && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 999,
          paddingHorizontal: 16,
          paddingVertical: 10,
          paddingTop: 6,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.surface + '40',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
        }}>
          <TouchableOpacity
            onPress={() => {
              console.log('Back button pressed from floating header');
              setShowPopularInMenu(false);
              setActiveTab('home');
            }}
            activeOpacity={0.6}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: colors.primary + '20',
            }}
          >
            <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 26 }}>←</Text>
          </TouchableOpacity>
          
          <View style={{ flex: 1 }} />
          
          <TouchableOpacity
            onPress={() => {
              console.log('Close button pressed from floating header');
              setShowPopularInMenu(false);
              setActiveTab('home');
            }}
            activeOpacity={0.6}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: colors.primary + '20',
            }}
          >
            <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 26 }}>×</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
