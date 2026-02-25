import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { supabase } from '../../lib/supabase';

interface OrderItem {
  id: string;
  quantity: number;
  menu_item_id: string;
  menu_item?: {
    name: string;
    price: number;
  };
}

interface Order {
  id: string;
  token_number: number;
  status: 'Pending' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled';
  total_price: number;
  created_at: string;
  order_items?: OrderItem[];
}

interface OrdersTabProps {
  colors: any;
  onOpenDrawer: () => void;
}

type FilterType = 'all' | 'Pending' | 'Preparing' | 'Ready';

export const OrdersTab: React.FC<OrdersTabProps> = ({ colors, onOpenDrawer }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    loadOrders();
    const subscription = setupRealtimeSubscription();
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('orders_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          loadOrders();
        }
      )
      .subscribe();

    return subscription;
  };

  const loadOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          token_number,
          status,
          total_price,
          created_at,
          order_items (
            id,
            quantity,
            menu_item_id,
            menu_item:menu_items!inner (
              name,
              price
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to handle the array/object relationship issue
      const transformedData = (data || []).map((order: any) => ({
        ...order,
        order_items: order.order_items?.map((item: any) => ({
          ...item,
          menu_item: Array.isArray(item.menu_item) ? item.menu_item[0] : item.menu_item
        }))
      }));

      setOrders(transformedData);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const statusCounts = useMemo(() => {
    return {
      pending: orders.filter(o => o.status === 'Pending').length,
      preparing: orders.filter(o => o.status === 'Preparing').length,
      ready: orders.filter(o => o.status === 'Ready').length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (selectedFilter === 'all') return orders;
    return orders.filter(o => o.status === selectedFilter);
  }, [orders, selectedFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return '#F59E0B';
      case 'Preparing': return '#8B5CF6';
      case 'Ready': return '#10B981';
      case 'Completed': return '#6B7280';
      case 'Cancelled': return '#EF4444';
      default: return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending': return '⏱️';
      case 'Preparing': return '👨‍🍳';
      case 'Ready': return '✅';
      case 'Completed': return '📦';
      case 'Cancelled': return '❌';
      default: return '📋';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const changeDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onOpenDrawer} style={styles.menuButton}>
            <Icon name="menu" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Track Your  Orders</Text>
          <TouchableOpacity style={styles.notificationButton}>
            <Icon name="notifications-none" size={24} color="#FFF" />
            {orders.filter(o => o.status === 'Pending').length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {orders.filter(o => o.status === 'Pending').length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Status Cards */}
        <View style={styles.statusCardsContainer}>
          <View style={[styles.statusCard, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
            <View style={styles.statusCardIcon}>
              <Text style={styles.statusEmoji}>⏱️</Text>
            </View>
            <Text style={[styles.statusCardLabel, { color: '#92400E' }]}>Pending</Text>
            <Text style={[styles.statusCardValue, { color: '#F59E0B' }]}>
              {statusCounts.pending}
            </Text>
          </View>

          <View style={[styles.statusCard, { backgroundColor: '#EDE9FE', borderColor: '#8B5CF6' }]}>
            <View style={styles.statusCardIcon}>
              <Text style={styles.statusEmoji}>👨‍🍳</Text>
            </View>
            <Text style={[styles.statusCardLabel, { color: '#5B21B6' }]}>Cooking</Text>
            <Text style={[styles.statusCardValue, { color: '#8B5CF6' }]}>
              {statusCounts.preparing}
            </Text>
          </View>

          <View style={[styles.statusCard, { backgroundColor: '#D1FAE5', borderColor: '#10B981' }]}>
            <View style={styles.statusCardIcon}>
              <Text style={styles.statusEmoji}>✅</Text>
            </View>
            <Text style={[styles.statusCardLabel, { color: '#065F46' }]}>Ready</Text>
            <Text style={[styles.statusCardValue, { color: '#10B981' }]}>
              {statusCounts.ready}
            </Text>
          </View>
        </View>

        {/* Latest Order Highlight */}
        {orders.length > 0 && orders[0].status !== 'Completed' && (
          <View style={[styles.latestOrderCard, { 
            backgroundColor: '#E0E7FF',
            borderColor: colors.primary 
          }]}>
            <View style={[styles.latestOrderBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.latestOrderNumber}>#{orders[0].token_number || '1'}</Text>
            </View>
            <View style={styles.latestOrderContent}>
              <Text style={[styles.latestOrderTitle, { color: colors.text }]}>
                Your Latest Order
              </Text>
              <View style={[styles.latestOrderStatus, { 
                backgroundColor: getStatusColor(orders[0].status) + '30' 
              }]}>
                <Text style={styles.latestOrderEmoji}>⏱</Text>
                <Text style={[styles.latestOrderStatusText, { 
                  color: getStatusColor(orders[0].status) 
                }]}>
                  {orders[0].status}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {(['all', 'Pending', 'Preparing', 'Ready'] as FilterType[]).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterTab,
                selectedFilter === filter && { 
                  backgroundColor: colors.primary 
                },
                { borderColor: colors.primary }
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[
                styles.filterTabText,
                { color: selectedFilter === filter ? '#FFF' : colors.primary }
              ]}>
                {filter === 'all' ? 'All' : filter}
                {filter !== 'all' && ` (${statusCounts[filter.toLowerCase() as keyof typeof statusCounts]})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date Selector */}
        <View style={styles.dateContainer}>
          <TouchableOpacity 
            style={[styles.dateButton, { borderColor: colors.primary }]}
            onPress={() => changeDate('prev')}
          >
            <Icon name="chevron-left" size={24} color={colors.primary} />
          </TouchableOpacity>

          <Text style={[styles.dateText, { color: colors.text }]}>
            {selectedDate.toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </Text>

          <TouchableOpacity 
            style={[styles.dateButton, { borderColor: colors.primary }]}
            onPress={() => changeDate('next')}
          >
            <Icon name="chevron-right" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Orders List */}
        <View style={styles.ordersContainer}>
          {loading ? (
            <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 40 }} />
          ) : filteredOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No orders yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Place your first order to see it here
              </Text>
            </View>
          ) : (
            filteredOrders.map((order) => (
              <View key={order.id} style={[styles.orderCard, { backgroundColor: colors.surface }]}>
                {/* Order Header */}
                <View style={styles.orderHeader}>
                  <View style={[styles.orderBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.orderBadgeText}>
                      #{order.token_number || order.id.substring(0, 4)}
                    </Text>
                  </View>
                  <View style={[styles.statusPill, { 
                    backgroundColor: getStatusColor(order.status) + '20' 
                  }]}>
                    <Text style={styles.statusEmoji}>{getStatusIcon(order.status)}</Text>
                    <Text style={[styles.statusPillText, { 
                      color: getStatusColor(order.status) 
                    }]}>
                      {order.status}
                    </Text>
                  </View>
                </View>

                {/* Order Date/Time */}
                <View style={styles.orderDateTime}>
                  <Icon name="access-time" size={14} color={colors.textSecondary} />
                  <Text style={[styles.orderDateText, { color: colors.textSecondary }]}>
                    {formatDate(order.created_at)} • {formatTime(order.created_at)}
                  </Text>
                </View>

                {/* Order Items */}
                <View style={styles.orderItems}>
                  <Text style={[styles.orderItemsTitle, { color: colors.text }]}>
                    Items:
                  </Text>
                  {order.order_items?.slice(0, 3).map((item, index) => (
                    <Text key={item.id} style={[styles.orderItemText, { color: colors.textSecondary }]}>
                      • {item.menu_item?.name || 'Item'} × {item.quantity}
                    </Text>
                  ))}
                  {(order.order_items?.length || 0) > 3 && (
                    <Text style={[styles.moreItems, { color: colors.primary }]}>
                      +{(order.order_items?.length || 0) - 3} more items
                    </Text>
                  )}
                </View>

                {/* Order Total */}
                <View style={styles.orderFooter}>
                  <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>
                    Total:
                  </Text>
                  <Text style={[styles.totalValue, { color: colors.primary }]}>
                    ₹{order.total_price}
                  </Text>
                </View>

                {/* View Details Button */}
                <TouchableOpacity style={styles.detailsButton}>
                  <Text style={[styles.detailsButtonText, { color: colors.primary }]}>
                    View Details →
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 16,
    elevation: 4,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  notificationButton: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusCardsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statusCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  statusCardIcon: {
    marginBottom: 8,
  },
  statusEmoji: {
    fontSize: 32,
  },
  statusCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  latestOrderCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  latestOrderBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  latestOrderNumber: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  latestOrderContent: {
    flex: 1,
  },
  latestOrderTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  latestOrderStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  latestOrderEmoji: {
    fontSize: 14,
  },
  latestOrderStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 16,
  },
  dateButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
  },
  ordersContainer: {
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
  },
  orderCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  orderBadgeText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  orderDateText: {
    fontSize: 12,
  },
  orderItems: {
    marginBottom: 12,
    paddingLeft: 8,
  },
  orderItemsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  orderItemText: {
    fontSize: 13,
    marginBottom: 2,
  },
  moreItems: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 14,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  detailsButton: {
    alignSelf: 'flex-end',
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
