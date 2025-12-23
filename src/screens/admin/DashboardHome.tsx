import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Order } from './types';

interface Props {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string) => void;
  onOpenDrawer: () => void;
  onQuickActionPress: (tabId: string) => void;
  pendingOrdersCount?: number;
}

export default function DashboardHome({ orders, onUpdateOrderStatus, onOpenDrawer, onQuickActionPress, pendingOrdersCount = 0 }: Props) {
  const { colors } = useTheme();

  const getTotalRevenue = () => orders.reduce((sum, o) => sum + o.totalPrice, 0);
  const getPendingOrders = () => orders.filter(o => o.status === 'Pending').length;

  return (
    <ScrollView style={[styles.content, { backgroundColor: colors.background }]}>
      {/* Attractive Header with Shadow */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onOpenDrawer} style={[styles.menuButton, { backgroundColor: colors.primary }]}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
          
          {/* Notification Bell */}
          <TouchableOpacity 
            style={[styles.notificationBell, { backgroundColor: colors.primary }]}
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
        <View style={styles.headerContent}>
          <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>Welcome to</Text>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Admin Panel</Text>
          <Text style={[styles.headerSubtext, { color: colors.textSecondary }]}>Manage everything efficiently</Text>
        </View>
      </View>

      {/* Attractive Stats Cards with Gradient Feel */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.statIconCircle, { backgroundColor: '#10B98120' }]}>
            <Text style={styles.statEmoji}>💰</Text>
          </View>
          <View style={styles.statInfo}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Revenue</Text>
            <Text style={[styles.statValue, { color: '#10B981' }]}>₹{getTotalRevenue()}</Text>
          </View>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.statIconCircle, { backgroundColor: '#8B5CF620' }]}>
            <Text style={styles.statEmoji}>📦</Text>
          </View>
          <View style={styles.statInfo}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Orders</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>{orders.length}</Text>
          </View>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.statIconCircle, { backgroundColor: '#F59E0B20' }]}>
            <Text style={styles.statEmoji}>⏳</Text>
          </View>
          <View style={styles.statInfo}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
            <Text style={[styles.statValue, { color: colors.warning }]}>{getPendingOrders()}</Text>
          </View>
        </View>
      </View>

      {/* Attractive Action Cards */}
      <View style={styles.quickActions}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          {[
            { id: 'orders', label: 'Orders', icon: '🧾', color: '#8B5CF6' },
            { id: 'menu', label: 'Menu', icon: '🍽️', color: '#10B981' },
            { id: 'addItems', label: 'Add Items', icon: '➕', color: '#EC4899' },
            { id: 'sales', label: 'Sales', icon: '📈', color: '#F59E0B' },
            { id: 'users', label: 'Users', icon: '👥', color: '#A78BFA' },
            { id: 'feedback', label: 'Feedback', icon: '⭐', color: '#F472B6' },
          ].map(action => (
            <TouchableOpacity 
              key={action.id} 
              style={[styles.actionCard, { backgroundColor: colors.surface }]} 
              onPress={() => onQuickActionPress(action.id)}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: action.color + '15' }]}>
                <Text style={styles.actionIcon}>{action.icon}</Text>
              </View>
              <Text style={[styles.actionLabel, { color: colors.text }]}>{action.label}</Text>
              <View style={[styles.actionAccent, { backgroundColor: action.color }]} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Attractive Order Cards */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Orders</Text>
          <Text style={[styles.viewAll, { color: colors.primary }]}>View All →</Text>
        </View>
        {orders.filter(o => o.status !== 'Completed').slice(0, 4).map(order => (
          <TouchableOpacity 
            key={order.id} 
            style={[styles.orderCard, { backgroundColor: colors.surface }]} 
            onPress={() => onUpdateOrderStatus(order.id)}
          >
            <View style={styles.orderHeader}>
              <View style={styles.orderLeft}>
                <Text style={[styles.orderId, { color: colors.text }]}>Order #{order.id}</Text>
                <Text style={[styles.orderUser, { color: colors.textSecondary }]}>👤 {order.userName}</Text>
              </View>
              <View style={[
                styles.statusBadge, 
                { backgroundColor: order.status === 'Pending' ? colors.warning + '20' : order.status === 'Preparing' ? colors.primary + '20' : colors.success + '20' }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: order.status === 'Pending' ? colors.warning : order.status === 'Preparing' ? colors.primary : colors.success }
                ]}>{order.status}</Text>
              </View>
            </View>
            <View style={[styles.orderFooter, { borderTopColor: colors.border }]}>
              <Text style={[styles.orderTime, { color: colors.textSecondary }]}>🕐 {order.timestamp}</Text>
              <Text style={[styles.orderTotal, { color: colors.text }]}>₹{order.totalPrice}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { 
    flex: 1, 
    paddingBottom: 70 
  },
  
  // Attractive Header with Shadow
  header: { 
    paddingHorizontal: 20, 
    paddingTop: 50, 
    paddingBottom: 24,
    elevation: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
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
    fontWeight: '700' 
  },
  notificationBell: {
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
    position: 'relative',
  },
  bellIcon: {
    fontSize: 24,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
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
  headerSubtext: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
  },

  // Attractive Stats Cards
  statsContainer: { 
    paddingHorizontal: 16, 
    paddingTop: 24, 
    gap: 14,
  },
  statCard: { 
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18, 
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 4,
  },
  statIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
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
    marginBottom: 6,
  },
  statValue: { 
    fontSize: 26, 
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  // Attractive Quick Actions
  quickActions: { 
    paddingHorizontal: 16, 
    paddingTop: 28,
  },
  sectionTitle: { 
    fontSize: 20, 
    fontWeight: '800',
    marginBottom: 18,
    letterSpacing: -0.5,
  },
  actionGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 14,
  },
  actionCard: { 
    width: '30.5%', 
    padding: 18,
    borderRadius: 18, 
    alignItems: 'center', 
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  actionIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionIcon: { 
    fontSize: 28,
  },
  actionLabel: { 
    fontSize: 11, 
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  actionAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },

  // Attractive Orders Section
  section: { 
    paddingHorizontal: 16, 
    paddingTop: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  viewAll: {
    fontSize: 13,
    fontWeight: '700',
  },
  orderCard: { 
    borderRadius: 18, 
    padding: 18, 
    marginBottom: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  orderLeft: { 
    flex: 1,
  },
  orderId: { 
    fontSize: 15, 
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  orderUser: { 
    fontSize: 13,
    fontWeight: '500',
  },
  statusBadge: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 12,
  },
  statusText: { 
    fontSize: 11, 
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  orderTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  orderTotal: { 
    fontSize: 18, 
    fontWeight: '900',
    letterSpacing: -0.5,
  },
});
