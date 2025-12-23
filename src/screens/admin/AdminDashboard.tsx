import React, { useState, useEffect } from 'react';
import { View, SafeAreaView, StatusBar, StyleSheet, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../theme/ThemeContext';
import { BottomNavigation } from '../../components/BottomNavigation';
import { SideDrawer } from '../../components/SideDrawer';
import { Orders } from './Orders';
import { Menu } from './Menu';
import { SalesReport } from './SalesReport';
import { Feedback } from './Feedback';
import { Users } from './Users';
import { AddItems } from './AddItems';
import { Profile } from './Profile';
import DashboardHome from './DashboardHome';
import AdminSettings from './AdminSettings';
import { NotificationToast } from '../../components/NotificationToast';
import { playOrderNotification } from '../../utils/notificationSound';

import { MenuItem, Order } from './types';

export default function AdminDashboard({ navigation }: any) {
  const { colors, isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  
  // Notification state
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  const updateOrderStatus = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const flow: Order['status'][] = ['Pending','Preparing','Ready','Completed'];
    const next = flow[(flow.indexOf(order.status) + 1) % flow.length];
    (async () => {
      try {
        const { error } = await supabase
          .from('orders')
          .update({ status: next })
          .eq('id', orderId);
        if (error) throw error;
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: next } : o));
      } catch (e: any) {
        Alert.alert('Error', e?.message || 'Failed to update order');
      }
    })();
  };

  const toggleAvailability = (itemId: string) => {
    const current = menuItems.find((m) => m.id === itemId);
    if (!current) return;
    const nextAvailable = !current.available;
    (async () => {
      try {
        const { error } = await supabase
          .from('menu_items')
          .update({ available: nextAvailable })
          .eq('id', itemId);
        if (error) throw error;
        setMenuItems(
          menuItems.map((item) =>
            item.id === itemId ? { ...item, available: nextAvailable } : item
          )
        );
      } catch (e: any) {
        Alert.alert('Error', e?.message || 'Failed to update availability');
      }
    })();
  };

  const removeMenuItem = (itemId: string) => {
    (async () => {
      try {
        const { error } = await supabase
          .from('menu_items')
          .delete()
          .eq('id', itemId);
        if (error) throw error;
        setMenuItems(menuItems.filter((item) => item.id !== itemId));
      } catch (e: any) {
        Alert.alert('Error', e?.message || 'Failed to delete item');
      }
    })();
  };

  const addMenuItem = (item: MenuItem) => {
    (async () => {
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
          .select('id,name,price,category,available,description,image_url')
          .single();
        if (error) throw error;
        setMenuItems([...menuItems, {
          id: data.id,
          name: data.name,
          price: Number(data.price),
          category: data.category,
          available: data.available,
          description: data.description || undefined,
          image: data.image_url || undefined,
        }]);
        Alert.alert('Success', '✅ Item added successfully!');
      } catch (e: any) {
        Alert.alert('Error', e?.message || 'Failed to add item');
      }
    })();
  };

  const editMenuItem = (item: MenuItem) => {
    (async () => {
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
          .select('id,name,price,category,available,description,image_url')
          .single();
        if (error) throw error;
        setMenuItems(menuItems.map(m => 
          m.id === item.id 
            ? {
              id: data.id,
              name: data.name,
              price: Number(data.price),
              category: data.category,
              available: data.available,
              description: data.description || undefined,
              image: data.image_url || undefined,
            }
            : m
        ));
        Alert.alert('Success', '✅ Item updated successfully!');
      } catch (e: any) {
        Alert.alert('Error', e?.message || 'Failed to update item');
      }
    })();
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigation.replace('Login');
  };

  const drawerItems = [
    { id: 'theme', label: `Theme: ${isDark ? 'Dark' : 'Light'}`, icon: 'theme', onPress: toggleTheme },
    { id: 'settings', label: 'Settings', icon: 'settings', onPress: () => setActiveTab('settings') },
    { id: 'help', label: 'Help & Support', icon: 'help', onPress: () => {} },
    { id: 'logout', label: 'Logout', icon: 'logout', danger: true, onPress: logout },
  ];

  const tabs = [
    { id: 'dashboard', label: 'Home', icon: 'home' },
    { id: 'orders', label: 'Orders', icon: 'orders' },
    { id: 'menu', label: 'Menu', icon: 'menu' },
    { id: 'sales', label: 'Sales', icon: 'chart' },
    { id: 'profile', label: 'More', icon: 'settings' },
  ];

  const getTotalRevenue = () => orders.reduce((sum, order) => sum + order.totalPrice, 0);

  // Load initial data and enable realtime updates
  useEffect(() => {
    const loadMenu = async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('id,name,price,category,available,description,image_url')
        .order('name');
      if (!error && data) {
        setMenuItems(
          data.map((d: any) => ({
            id: d.id,
            name: d.name,
            price: Number(d.price),
            category: d.category,
            available: d.available,
            description: d.description ?? undefined,
            image: d.image_url ?? undefined,
          }))
        );
      }
    };

    const loadOrders = async () => {
      const start = new Date();
      start.setHours(0,0,0,0);
      const { data: ords, error } = await supabase
        .from('orders')
        .select('id,user_id,total_price,status,created_at,token_number')
        .gte('created_at', start.toISOString())
        .order('created_at', { ascending: false });
      if (error || !ords) return;

      const ids = ords.map((o: any) => o.id);
      let itemsMap: Record<string, { name: string; qty: number }[]> = {};
      if (ids.length) {
        const { data: itms } = await supabase
          .from('order_items')
          .select('order_id, quantity, menu_items(name)')
          .in('order_id', ids);
        (itms || []).forEach((row: any) => {
          const arr = itemsMap[row.order_id] || [];
          arr.push({ name: row.menu_items?.name || 'Item', qty: row.quantity });
          itemsMap[row.order_id] = arr;
        });
      }
      const mapped: Order[] = ords.map((o: any) => ({
        id: o.id,
        userId: o.user_id,
        userName: 'User',
        items: itemsMap[o.id] || [],
        totalPrice: Number(o.total_price),
        status: o.status,
        timestamp: new Date(o.created_at).toLocaleTimeString(),
        tokenNumber: o.token_number ?? undefined,
      }));
      setOrders(mapped);
    };

    const realtime = () => {
      const channel = supabase
        .channel('orders-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const o = payload.new;
            const newOrder: Order = {
              id: o.id,
              userId: o.user_id,
              userName: 'User',
              items: [],
              totalPrice: Number(o.total_price),
              status: o.status,
              timestamp: new Date(o.created_at).toLocaleTimeString(),
              tokenNumber: o.token_number ?? undefined,
            };
            
            setOrders(prev => [newOrder, ...prev]);
            
            // Show notification
            playOrderNotification();
            setNotificationMessage(`New Order #${o.token_number || o.id.slice(0, 8)} - ₹${o.total_price}`);
            setNotificationVisible(true);
            
            // Update pending count
            setPendingOrdersCount(prev => prev + 1);
            
          } else if (payload.eventType === 'UPDATE') {
            const o = payload.new;
            setOrders(prev => prev.map(p => p.id === o.id ? { ...p, status: o.status, tokenNumber: o.token_number ?? p.tokenNumber } : p));
          }
        })
        .subscribe();
      return () => { void supabase.removeChannel(channel); };
    };

    loadMenu();
    loadOrders();
    const unsubscribe = realtime();
    return unsubscribe;
  }, []);

  // Update pending orders count whenever orders change
  useEffect(() => {
    const pendingCount = orders.filter(o => o.status === 'Pending').length;
    setPendingOrdersCount(pendingCount);
  }, [orders]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Notification Toast */}
        <NotificationToast
          visible={notificationVisible}
          message={notificationMessage}
          type="info"
          onDismiss={() => setNotificationVisible(false)}
          autoHideDuration={5000}
        />
        
        <SideDrawer
          visible={drawerVisible}
          onClose={() => setDrawerVisible(false)}
          items={drawerItems}
          userName="Admin"
          userEmail="admin@dinedesk.com"
        />

      {activeTab === 'dashboard' && (
        <DashboardHome
          orders={orders}
          onUpdateOrderStatus={updateOrderStatus}
          onOpenDrawer={() => setDrawerVisible(true)}
          onQuickActionPress={(id) => setActiveTab(id)}
          pendingOrdersCount={pendingOrdersCount}
        />
      )}

      {activeTab === 'orders' && (
        <Orders
          orders={orders}
          updateOrderStatus={updateOrderStatus}
        />
      )}

      {activeTab === 'menu' && (
        <Menu
          menuItems={menuItems}
          toggleAvailability={toggleAvailability}
          removeMenuItem={removeMenuItem}
        />
      )}

      {activeTab === 'feedback' && <Feedback />}

      {activeTab === 'sales' && (
        <SalesReport
          getTotalRevenue={getTotalRevenue}
          getTotalOrders={() => orders.length}
        />
      )}

      {activeTab === 'users' && <Users />}

      {activeTab === 'addItems' && (
        <AddItems
          menuItems={menuItems}
          onAddItem={(item) => {
            addMenuItem(item);
          }}
          onEditItem={(updatedItem) => {
            editMenuItem(updatedItem);
          }}
          onRemoveItem={(itemId) => {
            removeMenuItem(itemId);
          }}
        />
      )}

      {activeTab === 'profile' && (
        <Profile
          toggleTheme={toggleTheme}
          onLogout={logout}
        />
      )}

      {activeTab === 'settings' && (
        <AdminSettings onLogout={logout} />
      )}

        {/* Bottom Navigation */}
        <BottomNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabPress={setActiveTab}
        />
      </SafeAreaView>
    </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 12,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuIcon: {
    fontSize: 22,
    color: '#fff',
    fontWeight: '600',
  },
  headerContent: {
    flex: 1,
  },
  headerGreeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '400',
  },
  spacer: {
    flex: 1,
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
  addMenuBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addMenuBtnText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  metricsContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  metricCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  metricIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  metricLabel: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statsOverview: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  statIconContainer: {
    marginRight: 16,
  },
  statIcon: {
    fontSize: 32,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  quickActions: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '31%',
    paddingVertical: 20,
    paddingHorizontal: 8,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionIcon: {
    fontSize: 28,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  actionIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  orderCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 1,
  },
  orderCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '700',
  },
  orderUser: {
    fontSize: 11,
    marginTop: 2,
  },
  orderStatus: {
    fontSize: 12,
    fontWeight: '700',
  },
  orderItems: {
    marginVertical: 8,
  },
  orderItem: {
    fontSize: 11,
    marginVertical: 2,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  orderTime: {
    fontSize: 11,
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: '700',
  },
  tapHint: {
    fontSize: 10,
    marginTop: 8,
    fontStyle: 'italic',
  },
  menuItemCard: {
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    elevation: 1,
  },
  menuItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemName: {
    fontSize: 14,
    fontWeight: '700',
  },
  menuItemCategory: {
    fontSize: 11,
    marginTop: 2,
  },
  menuItemPrice: {
    fontSize: 14,
    fontWeight: '700',
  },
  menuItemActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  statusToggle: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  deleteBtn: {
    borderRadius: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeIcon: {
    fontSize: 24,
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 400,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 14,
  },
  categoryOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  categoryBtn: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  categoryBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  addItemBtn: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addItemBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  settingsSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  settingsTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    elevation: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingValue: {
    fontSize: 12,
    marginTop: 2,
  },
  settingIcon: {
    fontSize: 14,
  },
  logoutBtn: {
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
  emptyState: {
    textAlign: 'center',
    padding: 40,
    fontSize: 16,
  },
  reportCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
  },
  reportLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  reportValue: {
    fontSize: 28,
    fontWeight: '700',
  },
});
