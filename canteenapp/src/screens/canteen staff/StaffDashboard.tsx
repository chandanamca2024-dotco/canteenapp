import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../theme/ThemeContext';
import StaffInventory from './StaffInventory';
import StaffSettings from './StaffSettings';

const { width } = Dimensions.get('window');

interface OrderItem {
  quantity: number;
  menu_items: {
    name: string;
    price: number;
  };
}

interface Order {
  id: string;
  userName: string;
  userEmail: string;
  items: OrderItem[];
  totalPrice: number;
  status: 'Pending' | 'Preparing' | 'Ready' | 'Completed';
  tokenNumber: number;
  requestedTime?: string;
  timestamp: string;
  createdAt: Date;
}

export default function StaffDashboard({ navigation }: any) {
  const { colors, isDark } = useTheme();

  // Debug: Log when StaffDashboard is mounted
  useEffect(() => {
    console.log('StaffDashboard mounted');
  }, []);
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'settings'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('All');
  const [notificationCount, setNotificationCount] = useState(0);

  // Prevent selecting a future date
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selDate = new Date(selectedDate);
    selDate.setHours(0, 0, 0, 0);
    if (selDate > today) {
      setSelectedDate(today);
      Alert.alert('Info', 'You cannot view orders for future dates.');
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchIncomingOrders();
    setupRealtimeSubscription();
  }, [selectedDate]);

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('orders_channel_staff')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload: any) => {
          console.log('Order update received:', payload);
          if (payload.eventType === 'INSERT') {
            setNotificationCount(prev => prev + 1);
          }
          fetchIncomingOrders();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const fetchIncomingOrders = async () => {
    try {
      setLoading(true);

      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

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
        .in('status', ['Pending', 'Preparing', 'Ready'])
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      const ordersWithItems = await Promise.all(
        (ordersData || []).map(async (order: any) => {
          const { data: items } = await supabase
            .from('order_items')
            .select(`
              quantity,
              menu_items!inner (name, price)
            `)
            .eq('order_id', order.id);

          const normalizedItems = (items || []).map((item: any) => ({
            quantity: item.quantity,
            menu_items: {
              name: item.menu_items.name,
              price: item.menu_items.price,
            },
          }));

          return {
            id: order.id,
            userName: order.profiles?.name || 'Customer',
            userEmail: order.profiles?.email || '',
            items: normalizedItems,
            totalPrice: order.total_price,
            status: order.status,
            tokenNumber: order.token_number,
            requestedTime: order.requested_time,
            timestamp: new Date(order.created_at).toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            }),
            createdAt: new Date(order.created_at),
          };
        })
      );

      setOrders(ordersWithItems);
      const pendingCount = ordersWithItems.filter((o: Order) => o.status === 'Pending').length;
      setNotificationCount(pendingCount);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: 'Preparing' | 'Ready' | 'Completed') => {
      // Debug: Example logout handler
      const handleLogout = () => {
        console.log('Logout button pressed on StaffDashboard');
        // Place your logout logic here, e.g.:
        // await supabase.auth.signOut();
        // navigation.navigate('Login');
      };
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      const statusMessages = {
        Preparing: '👨‍🍳 Order is now being prepared',
        Ready: '✅ Order is ready for pickup',
        Completed: '🎉 Order completed successfully'
      };

      Alert.alert('Success', statusMessages[newStatus]);
      fetchIncomingOrders();
    } catch (error: any) {
      console.error('Error updating order:', error);
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  const getOrderStats = () => {
    return {
      pending: orders.filter((o: Order) => o.status === 'Pending').length,
      preparing: orders.filter((o: Order) => o.status === 'Preparing').length,
      ready: orders.filter((o: Order) => o.status === 'Ready').length,
    };
  };

  const getTimeSlots = () => {
    const slots = new Set<string>();
    orders.forEach(order => {
      if (order.requestedTime) {
        slots.add(order.requestedTime);
      }
    });
    return ['All', ...Array.from(slots)];
  };

  const filteredOrders = selectedTimeSlot === 'All' 
    ? orders 
    : orders.filter((o: Order) => o.requestedTime === selectedTimeSlot);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatDateShort = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          navigation.replace('Login');
        },
      },
    ]);
  };

  const stats = getOrderStats();
  const timeSlots = getTimeSlots();

  const renderOrdersTab = () => (
    <ScrollView
      style={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchIncomingOrders();
          }}
          colors={['#8B5CF6']}
        />
      }
    >
      {/* Order Statistics */}
      <View style={styles.sectionHeader}>
        <Icon name="bar-chart" size={24} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Statistics</Text>
      </View>

      {/* Date Selector */}
      <View style={[styles.dateSelector, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => changeDate(-1)} style={styles.dateArrow}>
          <Icon name="chevron-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.dateCenter}>
          <Text style={[styles.dateText, { color: colors.text }]}>
            {formatDateShort(selectedDate)}
          </Text>
          <Text style={[styles.dateYear, { color: colors.textSecondary }]}>
            {selectedDate.getFullYear()}
          </Text>
        </View>
        <TouchableOpacity onPress={() => changeDate(1)} style={styles.dateArrow}>
          <Icon name="chevron-right" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Status Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statusCard, { backgroundColor: colors.surface, borderLeftColor: '#EF4444' }]}>
          <View style={[styles.statusIconCircle, { backgroundColor: '#FEE2E2' }]}>
            <Icon name="access-time" size={24} color="#EF4444" />
          </View>
          <Text style={[styles.statusValue, { color: colors.text }]}>{stats.pending}</Text>
          <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Pending</Text>
        </View>

        <View style={[styles.statusCard, { backgroundColor: colors.surface, borderLeftColor: '#F59E0B' }]}>
          <View style={[styles.statusIconCircle, { backgroundColor: '#FEF3C7' }]}>
            <Icon name="local-fire-department" size={24} color="#F59E0B" />
          </View>
          <Text style={[styles.statusValue, { color: colors.text }]}>{stats.preparing}</Text>
          <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Preparing</Text>
        </View>

        <View style={[styles.statusCard, { backgroundColor: colors.surface, borderLeftColor: '#10B981' }]}>
          <View style={[styles.statusIconCircle, { backgroundColor: '#D1FAE5' }]}>
            <Icon name="check-circle" size={24} color="#10B981" />
          </View>
          <Text style={[styles.statusValue, { color: colors.text }]}>{stats.ready}</Text>
          <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Ready</Text>
        </View>
      </View>

      {/* Filter by Pickup Time */}
      <View style={styles.filterSection}>
        <View style={styles.filterHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="schedule" size={20} color={colors.text} />
            <Text style={[styles.filterTitle, { color: colors.text }]}>Filter by Pickup Time</Text>
          </View>
          <View style={[styles.slotBadge, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.slotBadgeText, { color: colors.primary }]}>
              {timeSlots.length - 1} {timeSlots.length - 1 === 1 ? 'slot' : 'slots'}
            </Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeSlots}>
          {timeSlots.map((slot) => (
            <TouchableOpacity
              key={slot}
              style={[
                styles.timeSlot,
                {
                  backgroundColor: selectedTimeSlot === slot ? colors.primary : colors.surface,
                },
              ]}
              onPress={() => setSelectedTimeSlot(slot)}
            >
              <Icon 
                name={slot === 'All' ? 'apps' : 'schedule'} 
                size={16} 
                color={selectedTimeSlot === slot ? '#FFF' : colors.text} 
              />
              <Text
                style={[
                  styles.timeSlotText,
                  { color: selectedTimeSlot === slot ? '#FFF' : colors.text },
                ]}
              >
                {slot}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* All Orders */}
      <View style={styles.ordersSection}>
        <View style={styles.ordersHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="receipt" size={20} color={colors.text} />
            <Text style={[styles.ordersTitle, { color: colors.text }]}>All Orders</Text>
          </View>
          <View style={[styles.orderCountBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.orderCountText}>{filteredOrders.length}</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading orders...</Text>
          </View>
        ) : filteredOrders.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={[styles.emptyText, { color: colors.text }]}>No orders yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              New orders will appear here automatically
            </Text>
          </View>
        ) : (
          filteredOrders.map((order) => (
            <View key={order.id} style={[styles.orderCard, { backgroundColor: colors.surface }]}>
              {/* Token Header */}
              <View style={styles.orderCardHeader}>
                <View style={styles.tokenContainer}>
                  <Text style={styles.tokenLabel}>TOKEN</Text>
                  <Text style={styles.tokenNumber}>#{order.tokenNumber}</Text>
                </View>
                <View style={[
                  styles.orderStatusBadge,
                  { backgroundColor: order.status === 'Pending' ? '#FEE2E2' : 
                                     order.status === 'Preparing' ? '#FEF3C7' : '#D1FAE5' }
                ]}>
                  <Icon 
                    name={order.status === 'Pending' ? 'access-time' : 
                          order.status === 'Preparing' ? 'local-fire-department' : 'check-circle'} 
                    size={16} 
                    color={order.status === 'Pending' ? '#EF4444' : 
                           order.status === 'Preparing' ? '#F59E0B' : '#10B981'} 
                  />
                  <Text style={[
                    styles.orderStatusText,
                    { color: order.status === 'Pending' ? '#EF4444' : 
                             order.status === 'Preparing' ? '#F59E0B' : '#10B981' }
                  ]}>
                    {order.status}
                  </Text>
                </View>
              </View>

              {/* Customer Info */}
              <View style={styles.customerInfo}>
                <View style={styles.customerAvatar}>
                  <Text style={styles.customerInitial}>{order.userName.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={[styles.customerName, { color: colors.text }]}>{order.userName}</Text>
              </View>

              {/* Order Items */}
              <View style={styles.orderItems}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Icon name="restaurant" size={16} color={colors.primary} />
                  <Text style={[styles.orderItemsTitle, { color: colors.text }]}>Order Items</Text>
                  <View style={[styles.itemCountBadge, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.itemCountText, { color: colors.primary }]}>
                      {order.items.length}
                    </Text>
                  </View>
                </View>

                {order.items.map((item, index) => (
                  <View key={index} style={styles.orderItemRow}>
                    <View style={[styles.itemBullet, { backgroundColor: colors.textSecondary }]} />
                    <Text style={[styles.itemName, { color: colors.text }]}>{item.menu_items.name}</Text>
                    <View style={styles.itemQtyBadge}>
                      <Text style={styles.itemQtyText}>×{item.quantity}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Total & Details */}
              <View style={[styles.orderFooter, { borderTopColor: colors.background }]}>
                <View style={styles.orderDetails}>
                  <View style={styles.totalSection}>
                    <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>₹ TOTAL AMOUNT</Text>
                    <Text style={[styles.totalAmount, { color: colors.primary }]}>₹{order.totalPrice.toFixed(2)}</Text>
                  </View>
                  
                  <View style={styles.timeInfo}>
                    <View style={styles.timeRow}>
                      <Icon name="access-time" size={14} color={colors.textSecondary} />
                      <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                        Ordered: {order.timestamp}
                      </Text>
                    </View>
                    {order.requestedTime && (
                      <View style={styles.timeRow}>
                        <Icon name="schedule" size={14} color={colors.primary} />
                        <Text style={[styles.timeText, { color: colors.primary }]}>
                          Pickup: {order.requestedTime}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Action Button */}
                {order.status === 'Pending' && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
                    onPress={() => updateOrderStatus(order.id, 'Preparing')}
                  >
                    <Icon name="play-arrow" size={18} color="#FFF" />
                    <Text style={styles.actionButtonText}>Start Preparing</Text>
                  </TouchableOpacity>
                )}

                {order.status === 'Preparing' && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#10B981' }]}
                    onPress={() => updateOrderStatus(order.id, 'Ready')}
                  >
                    <Icon name="check" size={18} color="#FFF" />
                    <Text style={styles.actionButtonText}>Mark as Ready</Text>
                  </TouchableOpacity>
                )}

                {order.status === 'Ready' && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#6B7280' }]}
                    onPress={() => updateOrderStatus(order.id, 'Completed')}
                  >
                    <Icon name="done-all" size={18} color="#FFF" />
                    <Text style={styles.actionButtonText}>Complete Order</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with Gradient */}
      <View style={styles.header}>
        <View style={styles.headerGradient}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <View style={styles.chefIconContainer}>
                <Icon name="chef-hat" size={28} color="#FFF" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Staff Kitchen</Text>
                <Text style={styles.headerDate}>{formatDate(selectedDate)}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <Icon name="notifications" size={24} color="#FFF" />
              {notificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{notificationCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Content */}
      {activeTab === 'orders' && renderOrdersTab()}
      {activeTab === 'inventory' && <StaffInventory />}
      {activeTab === 'settings' && <StaffSettings navigation={navigation} />}

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { backgroundColor: colors.surface, borderTopColor: colors.background }]}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('orders')}
        >
          <Icon 
            name="receipt" 
            size={24} 
            color={activeTab === 'orders' ? '#8B5CF6' : colors.textSecondary} 
          />
          <Text style={[
            styles.navLabel,
            { color: activeTab === 'orders' ? '#8B5CF6' : colors.textSecondary }
          ]}>
            Orders
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('inventory')}
        >
          <Icon 
            name="inventory" 
            size={24} 
            color={activeTab === 'inventory' ? '#8B5CF6' : colors.textSecondary} 
          />
          <Text style={[
            styles.navLabel,
            { color: activeTab === 'inventory' ? '#8B5CF6' : colors.textSecondary }
          ]}>
            Inventory
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('settings')}
        >
          <Icon 
            name="settings" 
            size={24} 
            color={activeTab === 'settings' ? '#8B5CF6' : colors.textSecondary} 
          />
          <Text style={[
            styles.navLabel,
            { color: activeTab === 'settings' ? '#8B5CF6' : colors.textSecondary }
          ]}>
            Settings
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={handleLogout}
        >
          <Icon 
            name="logout" 
            size={24} 
            color={colors.textSecondary} 
          />
          <Text style={[styles.navLabel, { color: colors.textSecondary }]}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    overflow: 'hidden',
  },
  headerGradient: {
    backgroundColor: '#8B5CF6',
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chefIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chefIcon: {
    fontSize: 28,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
  },
  headerDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  notificationButton: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  notificationBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dateArrow: {
    padding: 8,
  },
  dateCenter: {
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '700',
  },
  dateYear: {
    fontSize: 12,
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statusCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusValue: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  slotBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  slotBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeSlots: {
    flexDirection: 'row',
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    elevation: 2,
  },
  timeSlotText: {
    fontSize: 13,
    fontWeight: '600',
  },
  ordersSection: {
    paddingHorizontal: 20,
  },
  ordersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ordersTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  orderCountBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderCountText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  orderCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderTopWidth: 3,
    borderTopColor: '#EF4444',
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tokenContainer: {
    gap: 2,
  },
  tokenLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#EF4444',
    letterSpacing: 0.5,
  },
  tokenNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#EF4444',
  },
  orderStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  orderStatusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  customerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerInitial: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
  },
  orderItems: {
    marginBottom: 16,
  },
  orderItemsTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  itemCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  itemCountText: {
    fontSize: 11,
    fontWeight: '700',
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  itemBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
  },
  itemQtyBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  itemQtyText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  orderFooter: {
    borderTopWidth: 1,
    paddingTop: 16,
  },
  orderDetails: {
    marginBottom: 16,
  },
  totalSection: {
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '800',
  },
  timeInfo: {
    gap: 6,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyState: {
    paddingVertical: 60,
    paddingHorizontal: 40,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
});
