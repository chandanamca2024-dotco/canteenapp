import React, { useState, useEffect, useMemo } from 'react';
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
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../theme/ThemeContext';
import { BottomNavigation } from '../../components/BottomNavigation';
import { SideDrawer } from '../../components/SideDrawer';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  image?: string;
  available?: boolean;
}

interface CartItem extends MenuItem {
  quantity: number;
}

interface Order {
  id: string;
  items: CartItem[];
  totalPrice: number;
  status: 'Pending' | 'Preparing' | 'Ready' | 'Completed';
  timestamp: string;
}

export default function UserDashboard({ navigation }: any) {
  const { colors, isDark, tokens } = useTheme();
  const [activeTab, setActiveTab] = useState('home');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [walletBalance] = useState(500);
  const [closingTime] = useState('4:45 PM');
  const [closingCountdown, setClosingCountdown] = useState<string>('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const addToCart = (item: MenuItem) => {
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

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const placeOrder = async () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add items before placing an order');
      return;
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to place an order');
        return;
      }

      const totalPrice = getTotalPrice();

      // Insert order into Supabase
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_price: totalPrice,
          status: 'Pending',
        })
        .select('id')
        .single();

      if (orderError) {
        console.error('❌ Error inserting order:', orderError);
        Alert.alert('Error', 'Failed to place order. Please try again.');
        return;
      }

      if (!orderData) {
        Alert.alert('Error', 'Failed to create order');
        return;
      }

      // Insert order items
      const orderItems = cart.map((item) => ({
        order_id: orderData.id,
        menu_item_id: item.id,
        quantity: item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('❌ Error inserting order items:', itemsError);
        Alert.alert('Error', 'Order created but failed to save items.');
        return;
      }

      // Update local state
      const newOrder: Order = {
        id: orderData.id,
        items: cart,
        totalPrice: totalPrice,
        status: 'Pending',
        timestamp: new Date().toLocaleString(),
      };
      setOrders([newOrder, ...orders]);
      setCart([]);
      Alert.alert('Success', '✅ Order placed successfully! Admin will prepare it soon.');
    } catch (e) {
      console.error('❌ Error placing order:', e);
      Alert.alert('Error', 'Failed to place order. Please try again.');
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigation.replace('Login');
  };

  // Fetch menu items from database
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setLoadingMenu(true);
        console.log('🔄 Fetching menu items from database...');
        
        const { data, error } = await supabase
          .from('menu_items')
          .select('*');

        console.log('📊 Query result:', { data, error });

        if (error) {
          console.error('❌ Error fetching menu items:', error);
          setMenuItems([]);
        } else if (data && data.length > 0) {
          console.log('✅ Found', data.length, 'items in database');
          // Filter for available items
          const availableItems = data.filter((item: any) => item.available !== false);
          setMenuItems(availableItems);
        } else {
          console.log('⚠️ No items found in database');
          setMenuItems([]);
        }
      } catch (e) {
        console.error('❌ Exception fetching menu items:', e);
        setMenuItems([]);
      } finally {
        setLoadingMenu(false);
      }
    };

    fetchMenuItems();
  }, []);

  const drawerItems = [
    { id: 'notifications', label: 'Notifications', icon: 'notifications', onPress: () => {} },
    { id: 'wallet', label: 'Wallet', icon: 'wallet', onPress: () => {} },
    { id: 'help', label: 'Help & Support', icon: 'help', onPress: () => {} },
    { id: 'about', label: 'About', icon: 'about', onPress: () => {} },
    { id: 'logout', label: 'Logout', icon: 'logout', danger: true, onPress: logout },
  ];

  const tabs = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'menu', label: 'Menu', icon: 'menu' },
    { id: 'orders', label: 'Orders', icon: 'orders' },
    { id: 'wallet', label: 'Wallet', icon: 'wallet' },
    { id: 'profile', label: 'Profile', icon: 'profile' },
  ];

  // Parse closing time string like "08:00 PM" into a Date (today)
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

  // Live countdown updater
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

    // Initial set
    setClosingCountdown(formatDuration(closingDate.getTime() - Date.now()));

    const interval = setInterval(() => {
      const remaining = closingDate.getTime() - Date.now();
      setClosingCountdown(formatDuration(remaining));
    }, 1000);

    return () => clearInterval(interval);
  }, [closingDate]);

  const isSearching = searchQuery.trim().length > 0;

  const filteredMenuItems = useMemo(() => {
    const base = selectedCategory
      ? menuItems.filter((item) => item.category === selectedCategory)
      : menuItems;

    const query = searchQuery.trim().toLowerCase();
    if (!query) return base;

    const matches = base.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    );

    const startsWith = matches
      .filter((item) => item.name.toLowerCase().startsWith(query))
      .sort((a, b) => a.name.localeCompare(b.name));
    const contains = matches
      .filter((item) => !item.name.toLowerCase().startsWith(query))
      .sort((a, b) => a.name.localeCompare(b.name));

    return [...startsWith, ...contains];
  }, [menuItems, searchQuery, selectedCategory]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        items={drawerItems}
        userName="Chandler"
        userEmail="chandler@university.edu"
      />

      {activeTab === 'home' && (
        <ScrollView style={[styles.content, { backgroundColor: colors.background }]}>
          {/* Modern Header */}
          <View style={[styles.header, { backgroundColor: colors.surface }]}>
            <View style={styles.headerTop}>
              <TouchableOpacity onPress={() => setDrawerVisible(true)} style={[styles.menuButton, { backgroundColor: colors.primary }]}>
                <Text style={styles.menuIcon}>☰</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.headerContent}>
              <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>Welcome to</Text>
              <Text style={[styles.headerTitle, { color: colors.text }]}>DineDesk</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Order your favorite meals instantly</Text>
            </View>
          </View>

          {/* Quick Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <View style={[styles.statIconCircle, { backgroundColor: '#10B98120' }]}>
                <Text style={styles.statEmoji}>💰</Text>
              </View>
              <View style={styles.statInfo}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Wallet</Text>
                <Text style={[styles.statValue, { color: '#10B981' }]}>₹{walletBalance}</Text>
              </View>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <View style={[styles.statIconCircle, { backgroundColor: '#8B5CF620' }]}>
                <Text style={styles.statEmoji}>🍽️</Text>
              </View>
              <View style={styles.statInfo}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Orders</Text>
                <Text style={[styles.statValue, { color: colors.primary }]}>{orders.length}</Text>
              </View>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <View style={[styles.statIconCircle, { backgroundColor: '#F59E0B20' }]}>
                <Text style={styles.statEmoji}>⏳</Text>
              </View>
              <View style={styles.statInfo}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Ready</Text>
                <Text style={[styles.statValue, { color: colors.warning }]}>{orders.filter((o) => o.status === 'Ready').length}</Text>
              </View>
            </View>
          </View>

          {/* Status Alert */}
          {closingCountdown !== 'Closed' && (
            <View style={[styles.statusAlert, { backgroundColor: colors.warning + '15', borderColor: colors.warning }]}>
              <View style={styles.statusAlertIcon}>
                <Text style={styles.alertEmoji}>⏰</Text>
              </View>
              <View style={styles.statusAlertContent}>
                <Text style={[styles.statusAlertTitle, { color: colors.text }]}>Kitchen closes in</Text>
                <Text style={[styles.statusAlertTime, { color: colors.warning }]}>{closingCountdown}</Text>
              </View>
            </View>
          )}

          {/* Quick Order Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Order</Text>
              <TouchableOpacity>
                <Text style={[styles.viewAll, { color: colors.primary }]}>View All →</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={menuItems.slice(0, 5)}
              horizontal
              scrollEnabled
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.quickOrderCard, { backgroundColor: colors.surface }]}
                  onPress={() => addToCart(item)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.quickCardIcon, { backgroundColor: colors.primary + '10' }]}>
                    <Text style={styles.quickCardEmoji}>🍜</Text>
                  </View>
                  <Text style={[styles.quickCardName, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
                  <Text style={[styles.quickCardPrice, { color: colors.primary }]}>₹{item.price}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
            />
          </View>

          {/* Recent Orders */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Recent Orders</Text>
              <Text style={[styles.orderCount, { color: colors.textSecondary }]}>{orders.length} total</Text>
            </View>
            {orders.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
                <Text style={styles.emptyEmoji}>📋</Text>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No Orders Yet</Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Start ordering your favorite meals</Text>
              </View>
            ) : (
              orders.slice(0, 3).map((order) => (
                <View key={order.id} style={[styles.orderCard, { backgroundColor: colors.surface }]}>
                  <View style={styles.orderCardTop}>
                    <View style={styles.orderInfo}>
                      <Text style={[styles.orderId, { color: colors.text }]}>Order #{order.id}</Text>
                      <Text style={[styles.orderTime, { color: colors.textSecondary }]}>🕐 {order.timestamp}</Text>
                    </View>
                    <View style={[
                      styles.orderStatusBadge,
                      { backgroundColor: order.status === 'Completed' ? colors.success + '20' : order.status === 'Ready' ? colors.primary + '20' : colors.warning + '20' }
                    ]}>
                      <Text style={[
                        styles.orderStatusText,
                        { color: order.status === 'Completed' ? colors.success : order.status === 'Ready' ? colors.primary : colors.warning }
                      ]}>{order.status}</Text>
                    </View>
                  </View>
                  <View style={[styles.orderCardBottom, { borderTopColor: colors.border }]}>
                    <Text style={[styles.itemsCount, { color: colors.textSecondary }]}>{order.items.length} items</Text>
                    <Text style={[styles.orderPrice, { color: colors.text }]}>₹{order.totalPrice}</Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Features Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Features</Text>
            <View style={styles.featuresGrid}>
              <TouchableOpacity style={[styles.featureCard, { backgroundColor: colors.surface }]}>
                <View style={[styles.featureIcon, { backgroundColor: '#EC489920' }]}>
                  <Text style={styles.featureEmoji}>🎁</Text>
                </View>
                <Text style={[styles.featureLabel, { color: colors.text }]}>Offers</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.featureCard, { backgroundColor: colors.surface }]}>
                <View style={[styles.featureIcon, { backgroundColor: '#A78BFA20' }]}>
                  <Text style={styles.featureEmoji}>⭐</Text>
                </View>
                <Text style={[styles.featureLabel, { color: colors.text }]}>Reviews</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.featureCard, { backgroundColor: colors.surface }]}>
                <View style={[styles.featureIcon, { backgroundColor: '#F47CB620' }]}>
                  <Text style={styles.featureEmoji}>❤️</Text>
                </View>
                <Text style={[styles.featureLabel, { color: colors.text }]}>Favorites</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.featureCard, { backgroundColor: colors.surface }]}>
                <View style={[styles.featureIcon, { backgroundColor: '#10B98120' }]}>
                  <Text style={styles.featureEmoji}>🎯</Text>
                </View>
                <Text style={[styles.featureLabel, { color: colors.text }]}>Recommendations</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      {activeTab === 'menu' && (
        <ScrollView style={styles.content}>
          <View style={[styles.header, { backgroundColor: colors.surface }]}>
            <View style={styles.headerTop}>
              <TouchableOpacity
                style={[styles.menuButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  if (selectedCategory) {
                    setSelectedCategory(null);
                  } else {
                    setDrawerVisible(true);
                  }
                }}
              >
                <Text style={styles.menuIcon}>{selectedCategory ? '←' : '☰'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.headerContent}>
              <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>
                {selectedCategory ? 'Browse' : 'Explore'}
              </Text>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {selectedCategory || 'Our Menu'}
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                {selectedCategory 
                  ? `${menuItems.filter(i => i.category === selectedCategory && i.available).length} items available`
                  : `${menuItems.filter(i => i.available).length} items available`}
              </Text>
            </View>
          </View>

          {/* Search Bar */}
          <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search for dishes or categories"
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={{ color: colors.textSecondary, fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            ) : (
              <Text style={{ color: colors.textSecondary, fontSize: 16 }}>🔍</Text>
            )}
          </View>

          {/* Cart Preview */}
          {cart.length > 0 && (
            <View style={[styles.cartPreview, { backgroundColor: colors.surface }]}>
              <Text style={[styles.cartTitle, { color: colors.text }]}>
                Cart ({cart.length} items)
              </Text>
              <FlatList
                data={cart}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View style={[styles.cartItem, { borderBottomColor: colors.border }]}>
                    <View>
                      <Text style={[styles.cartItemName, { color: colors.text }]}>
                        {item.name}
                      </Text>
                      <Text style={[styles.cartItemPrice, { color: colors.textSecondary }]}>
                        ₹{item.price} × {item.quantity}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                      <Text style={[styles.removeBtn, { color: colors.danger }]}>✕</Text>
                    </TouchableOpacity>
                  </View>
                )}
                keyExtractor={(item) => item.id}
              />
              <View style={[styles.cartFooter, { borderTopColor: colors.border }]}>
                <Text style={[styles.totalPrice, { color: colors.text }]}>
                  Total: ₹{getTotalPrice()}
                </Text>
                <TouchableOpacity
                  style={[styles.orderBtn, { backgroundColor: colors.primary }]}
                  onPress={placeOrder}
                >
                  <Text style={styles.orderBtnText}>Place Order</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Loading State */}
          {loadingMenu && (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 10 }}>
                Loading Menu...
              </Text>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}

          {/* Empty Menu State */}
          {!loadingMenu && menuItems.length === 0 && (
            <View style={[styles.emptyState, { backgroundColor: colors.surface + '50' }]}>
              <Text style={styles.emptyEmoji}>🍽️</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Menu Items</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Menu items will appear here once admin adds them
              </Text>
            </View>
          )}

          {/* Category View */}
          {!loadingMenu && menuItems.length > 0 && !selectedCategory && !isSearching && (
            <>
              <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
                <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: 12 }]}>
                  Browse by Category
                </Text>
              </View>
              {Array.from(new Set(menuItems.map(item => item.category))).map((category) => {
                const categoryItems = menuItems.filter(i => i.category === category);
                const availableCount = categoryItems.filter(i => i.available).length;
                
                const getCategoryIcon = (cat: string) => {
                  const icons: { [key: string]: string } = {
                    'Rice': '🍚',
                    'South Indian': '🥘',
                    'Breakfast': '🍳',
                    'Lunch': '🍱',
                    'Snacks': '🥟',
                    'Beverages': '☕',
                    'Starters': '🍢',
                  };
                  return icons[cat] || '🍴';
                };

                const getCategoryColor = (cat: string) => {
                  const colors: { [key: string]: string } = {
                    'Rice': '#FF6B6B',
                    'South Indian': '#4ECDC4',
                    'Breakfast': '#FFD93D',
                    'Lunch': '#95E1D3',
                    'Snacks': '#F38181',
                    'Beverages': '#AA96DA',
                    'Starters': '#FCBAD3',
                  };
                  return colors[cat] || '#8B5CF6';
                };

                return (
                  <TouchableOpacity
                    key={category}
                    style={[styles.categoryCard, { backgroundColor: colors.surface, marginHorizontal: 16, marginBottom: 12 }]}
                    onPress={() => setSelectedCategory(category)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.categoryIconWrapper, { backgroundColor: getCategoryColor(category) + '20' }]}>
                      <Text style={styles.categoryIconLarge}>{getCategoryIcon(category)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.categoryTitle, { color: colors.text }]}>{category}</Text>
                      <Text style={[styles.categorySubtitle, { color: colors.textSecondary }]}>
                        {availableCount} available • {categoryItems.length} total
                      </Text>
                    </View>
                    <Text style={{ fontSize: 24, color: colors.textSecondary }}>→</Text>
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          {/* Menu Items Grid - Filtered by Selected Category */}
          {!loadingMenu && menuItems.length > 0 && (selectedCategory || isSearching) && (
            filteredMenuItems.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: colors.surface + '50' }]}>
                <Text style={styles.emptyEmoji}>🔍</Text>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No matches found</Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Try a different name or category
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredMenuItems}
                scrollEnabled={false}
                numColumns={2}
                columnWrapperStyle={styles.itemRow}
                renderItem={({ item }) => (
                  <View
                    style={[
                      styles.menuCard,
                      {
                        backgroundColor: colors.surface,
                        opacity: item.available ? 1 : 0.5,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.menuItemImage,
                        { backgroundColor: colors.primary + '15' },
                      ]}
                    >
                      {item.image ? (
                        <Image
                          source={{ uri: item.image }}
                          style={{ width: '100%', height: 100 }}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={styles.foodEmoji}>
                          {item.category === 'Rice'
                            ? '🍚'
                            : item.category === 'Starters'
                            ? '🥘'
                            : '🍽️'}
                        </Text>
                      )}
                      {!item.available && (
                        <View style={styles.unavailableBadge}>
                          <Text style={styles.unavailableText}>Out</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.itemName, { color: colors.text }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.itemCategory, { color: colors.textSecondary }]}>
                      {item.category}
                    </Text>
                    <View style={styles.itemFooter}>
                      <Text style={[styles.price, { color: colors.primary }]}>
                        ₹{item.price}
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.addBtn,
                          {
                            backgroundColor: colors.primary,
                            opacity: item.available ? 1 : 0.5,
                          },
                        ]}
                        onPress={() => item.available && addToCart(item)}
                        disabled={!item.available}
                      >
                        <Text style={styles.addBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                keyExtractor={(item) => item.id}
              />
            )
          )}
        </ScrollView>
      )}

      {activeTab === 'orders' && (
        <ScrollView style={styles.content}>
          <View style={[styles.header, { backgroundColor: colors.surface }]}>
            <View style={styles.headerTop}>
              <TouchableOpacity
                style={[styles.menuButton, { backgroundColor: colors.primary }]}
                onPress={() => setDrawerVisible(true)}
              >
                <Text style={styles.menuIcon}>☰</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.headerContent}>
              <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>
                Track
              </Text>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Your Orders</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                {orders.length} order{orders.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {orders.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.surface + '50' }]}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Orders Yet</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Start by ordering from our menu
              </Text>
            </View>
          ) : (
            <View style={styles.section}>
              <FlatList
                data={orders}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View
                    style={[styles.orderCard, { backgroundColor: colors.surface }]}
                  >
                    <View style={styles.orderCardTop}>
                      <View style={styles.orderInfo}>
                        <Text style={[styles.orderId, { color: colors.text }]}>
                          Order #{item.id}
                        </Text>
                        <Text style={[styles.orderTime, { color: colors.textSecondary }]}>
                          {item.timestamp}
                        </Text>
                      </View>
                      <View style={styles.orderCardRight}>
                        <View
                          style={[
                            styles.orderStatusBadge,
                            {
                              backgroundColor:
                                item.status === 'Completed'
                                  ? colors.success + '20'
                                  : item.status === 'Ready'
                                  ? colors.primary + '20'
                                  : colors.warning + '20',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.orderStatusText,
                              {
                                color:
                                  item.status === 'Completed'
                                    ? colors.success
                                    : item.status === 'Ready'
                                    ? colors.primary
                                    : colors.warning,
                              },
                            ]}
                          >
                            {item.status}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.orderCardBottom}>
                      <Text style={[styles.itemsCount, { color: colors.textSecondary }]}>
                        {item.items.length} item{item.items.length !== 1 ? 's' : ''}
                      </Text>
                      <Text style={[styles.orderPrice, { color: colors.primary }]}>
                        ₹{item.totalPrice}
                      </Text>
                    </View>
                  </View>
                )}
                keyExtractor={(item) => item.id}
              />
            </View>
          )}
        </ScrollView>
      )}

      {activeTab === 'wallet' && (
        <ScrollView style={styles.content}>
          <View style={[styles.header, { backgroundColor: colors.surface }]}>
            <View style={styles.headerTop}>
              <TouchableOpacity
                style={[styles.menuButton, { backgroundColor: colors.primary }]}
                onPress={() => setDrawerVisible(true)}
              >
                <Text style={styles.menuIcon}>☰</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.headerContent}>
              <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>
                Manage
              </Text>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Your Wallet</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                Balance: ₹{walletBalance}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={[styles.statCard, { backgroundColor: colors.primary + '15' }]}>
              <View style={[styles.statIconCircle, { backgroundColor: colors.primary + '30' }]}>
                <Text style={styles.statEmoji}>💳</Text>
              </View>
              <View style={styles.statInfo}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Available Balance
                </Text>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  ₹{walletBalance}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Add Money
              </Text>
            </View>
            <View style={{ gap: 12 }}>
              {[100, 500, 1000, 2000].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={[styles.quickOrderCard, { backgroundColor: colors.surface, width: '100%', marginRight: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16 }]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.quickCardIcon, { marginRight: 14, marginBottom: 0 }]}>
                      <Text style={styles.quickCardEmoji}>💵</Text>
                    </View>
                    <View>
                      <Text style={[styles.quickCardName, { textAlign: 'left' }]}>Add ₹{amount}</Text>
                    </View>
                  </View>
                  <Text style={[styles.quickCardPrice, { color: colors.primary }]}>→</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Recent Transactions
              </Text>
              <Text style={[styles.viewAll, { color: colors.primary }]}>View All</Text>
            </View>
            {[
              { type: 'debit', desc: 'Order #1001', amount: 150 },
              { type: 'credit', desc: 'Added money', amount: 500 },
              { type: 'debit', desc: 'Order #1002', amount: 260 },
            ].map((txn, idx) => (
              <View
                key={idx}
                style={[styles.transactionItem, { backgroundColor: colors.surface }]}
              >
                <View>
                  <Text style={[styles.txnDesc, { color: colors.text }]}>
                    {txn.type === 'debit' ? '📤' : '📥'} {txn.desc}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.txnAmount,
                    { color: txn.type === 'debit' ? colors.danger : colors.success },
                  ]}
                >
                  {txn.type === 'debit' ? '-' : '+'}₹{txn.amount}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {activeTab === 'profile' && (
        <ScrollView style={styles.content}>
          <View style={[styles.header, { backgroundColor: colors.surface }]}>
            <View style={styles.headerTop}>
              <TouchableOpacity
                style={[styles.menuButton, { backgroundColor: colors.primary }]}
                onPress={() => setDrawerVisible(true)}
              >
                <Text style={styles.menuIcon}>☰</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.headerContent}>
              <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>
                Account
              </Text>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Your Profile</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                Manage your details
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={[styles.statCard, { backgroundColor: colors.primary + '15', justifyContent: 'center', paddingHorizontal: 20 }]}>
              <View style={[styles.statIconCircle, { backgroundColor: colors.primary + '30', width: 70, height: 70, borderRadius: 35 }]}>
                <Text style={{ fontSize: 36 }}>👤</Text>
              </View>
              <View style={[styles.statInfo, { marginLeft: 0, marginTop: 16 }]}>
                <Text style={[styles.statValue, { color: colors.primary, marginBottom: 2 }]}>
                  Chandler
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  chandler@university.edu
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>
              Account Information
            </Text>
            <TouchableOpacity
              style={[styles.profileItem, { backgroundColor: colors.surface }]}
            >
              <Text style={styles.profileItemIcon}>📞</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.profileItemLabel, { color: colors.textSecondary }]}>
                  Phone Number
                </Text>
                <Text style={[styles.profileItemValue, { color: colors.text }]}>
                  +91 98765 43210
                </Text>
              </View>
              <Text style={{ fontSize: 18 }}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.profileItem, { backgroundColor: colors.surface }]}
            >
              <Text style={styles.profileItemIcon}>👤</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.profileItemLabel, { color: colors.textSecondary }]}>
                  Role / Status
                </Text>
                <Text style={[styles.profileItemValue, { color: colors.text }]}>
                  Student
                </Text>
              </View>
              <Text style={{ fontSize: 18 }}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.profileItem, { backgroundColor: colors.surface }]}
            >
              <Text style={styles.profileItemIcon}>📍</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.profileItemLabel, { color: colors.textSecondary }]}>
                  Saved Addresses
                </Text>
                <Text style={[styles.profileItemValue, { color: colors.text }]}>
                  1 address saved
                </Text>
              </View>
              <Text style={{ fontSize: 18 }}>→</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>
              Settings
            </Text>
            <TouchableOpacity
              style={[styles.profileItem, { backgroundColor: colors.surface }]}
            >
              <Text style={styles.profileItemIcon}>🔔</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.profileItemLabel, { color: colors.textSecondary }]}>
                  Notifications
                </Text>
                <Text style={[styles.profileItemValue, { color: colors.text }]}>
                  Enabled
                </Text>
              </View>
              <Text style={{ fontSize: 18 }}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.profileItem, { backgroundColor: colors.surface }]}
            >
              <Text style={styles.profileItemIcon}>🔒</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.profileItemLabel, { color: colors.textSecondary }]}>
                  Privacy & Security
                </Text>
                <Text style={[styles.profileItemValue, { color: colors.text }]}>
                  Manage settings
                </Text>
              </View>
              <Text style={{ fontSize: 18 }}>→</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.logoutBtn2, { backgroundColor: colors.danger, marginBottom: 20 }]}
            onPress={logout}
          >
            <Text style={styles.logoutBtnText}>🚪 Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Bottom Navigation */}
      <BottomNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabPress={setActiveTab}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingBottom: 70,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 24,
    elevation: 4,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  headerTop: {
    marginBottom: 16,
  },
  menuButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  menuIcon: {
    fontSize: 22,
    color: '#fff',
    fontWeight: '700',
  },
  headerContent: {
    marginTop: 8,
  },
  welcomeText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.85,
  },
  spacer: {
    flex: 1,
  },
  statusAlert: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  statusAlertIcon: {
    marginRight: 14,
    fontSize: 24,
  },
  alertEmoji: {
    fontSize: 28,
  },
  statusAlertContent: {
    flex: 1,
  },
  statusAlertTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusAlertTime: {
    fontSize: 18,
    fontWeight: '900',
  },
  closingTimeCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closingTimeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  closingTimeValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  statIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  statEmoji: {
    fontSize: 28,
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  viewAll: {
    fontSize: 13,
    fontWeight: '700',
  },
  orderCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  quickOrderCard: {
    width: 140,
    marginRight: 12,
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  quickCardIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickCardEmoji: {
    fontSize: 32,
  },
  quickCardName: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  quickCardPrice: {
    fontSize: 14,
    fontWeight: '900',
  },
  orderCard: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  orderCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  orderTime: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  orderCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  itemsCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  orderStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  orderStatusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  orderPrice: {
    fontSize: 16,
    fontWeight: '900',
  },
  emptyState: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginVertical: 12,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: '48%',
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  featureIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureEmoji: {
    fontSize: 28,
  },
  featureLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  header2: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle2: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  cartBadge: {
    backgroundColor: '#EF4444',
    color: '#fff',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: '700',
  },
  cartPreview: {
    margin: 16,
    borderRadius: 12,
    padding: 12,
    elevation: 2,
  },
  cartTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '600',
  },
  cartItemPrice: {
    fontSize: 11,
    marginTop: 2,
  },
  removeBtn: {
    fontSize: 16,
    fontWeight: '700',
  },
  cartFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    marginTop: 8,
  },
  totalPrice: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  orderBtn: {
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  orderBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  itemRow: {
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  menuCard: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 1,
  },
  menuItemImage: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  foodEmoji: {
    fontSize: 48,
  },
  unavailableBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  unavailableText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  itemCategory: {
    fontSize: 11,
    paddingHorizontal: 8,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  balanceCard: {
    margin: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 3,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 8,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 16,
  },
  addMoneyBtn: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  addMoneyText: {
    color: '#fff',
    fontWeight: '700',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  txnDesc: {
    fontSize: 14,
    fontWeight: '500',
  },
  txnAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  profileCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 1,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileAvatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#4F46E5',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
  },
  profileEmail: {
    fontSize: 12,
    marginTop: 4,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
  },
  profileItemIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  profileItemLabel: {
    fontSize: 11,
  },
  profileItemValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  logoutBtn2: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  orderCardRight: {
    alignItems: 'flex-end',
  },
  orderItem: {
    fontSize: 11,
    marginVertical: 2,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  categoryIconLarge: {
    fontSize: 28,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  categorySubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
});
