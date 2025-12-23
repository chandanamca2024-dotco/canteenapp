import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../theme/ThemeContext';
import { Order } from './types';

interface OrdersProps {
  orders: Order[];
  updateOrderStatus: (orderId: string) => void;
}

export const Orders: React.FC<OrdersProps> = ({ orders, updateOrderStatus }) => {
  const { colors, tokens } = useTheme();

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'Pending': return colors.warning;
      case 'Preparing': return colors.primary;
      case 'Ready': return colors.success;
      case 'Completed': return '#6B7280';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'Pending': return '⏳';
      case 'Preparing': return '👨‍🍳';
      case 'Ready': return '✅';
      case 'Completed': return '📦';
    }
  };

  return (
    <ScrollView style={[styles.content, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Order Management</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Track and manage all customer orders in real-time</Text>
      </View>

      <View style={styles.ordersContainer}>
        <View style={styles.statsRow}>
          <View style={[styles.miniStat, { backgroundColor: colors.warning + '15', borderLeftColor: colors.warning }]}>
            <Text style={styles.miniStatIcon}>⏳</Text>
            <Text style={[styles.miniStatValue, { color: colors.warning }]}>
              {orders.filter(o => o.status === 'Pending').length}
            </Text>
            <Text style={[styles.miniStatLabel, { color: colors.textSecondary }]}>Pending</Text>
          </View>
          <View style={[styles.miniStat, { backgroundColor: colors.primary + '15', borderLeftColor: colors.primary }]}>
            <Text style={styles.miniStatIcon}>👨‍🍳</Text>
            <Text style={[styles.miniStatValue, { color: colors.primary }]}>
              {orders.filter(o => o.status === 'Preparing').length}
            </Text>
            <Text style={[styles.miniStatLabel, { color: colors.textSecondary }]}>Preparing</Text>
          </View>
          <View style={[styles.miniStat, { backgroundColor: colors.success + '15', borderLeftColor: colors.success }]}>
            <Text style={styles.miniStatIcon}>✅</Text>
            <Text style={[styles.miniStatValue, { color: colors.success }]}>
              {orders.filter(o => o.status === 'Ready').length}
            </Text>
            <Text style={[styles.miniStatLabel, { color: colors.textSecondary }]}>Ready</Text>
          </View>
        </View>

        <FlatList
          data={orders}
          scrollEnabled={false}
          renderItem={({ item: order }) => (
            <TouchableOpacity
              style={[styles.orderCard, { backgroundColor: colors.surface, borderRadius: tokens.radius.lg }, tokens.shadow.card]}
              onPress={() => updateOrderStatus(order.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.orderHeader, { borderBottomColor: colors.background }]}>
                <View style={styles.orderHeaderLeft}>
                  <Text style={[styles.orderId, { color: colors.text }]}>
                    {order.tokenNumber ? `#${order.tokenNumber}` : `#${order.id}`}
                  </Text>
                  <Text style={[styles.orderUser, { color: colors.textSecondary }]}>👤 {order.userName}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                  <Text style={styles.statusIcon}>{getStatusIcon(order.status)}</Text>
                  <Text style={[styles.orderStatus, { color: getStatusColor(order.status) }]}>
                    {order.status}
                  </Text>
                </View>
              </View>
              
              <View style={styles.orderBody}>
                <Text style={[styles.itemsLabel, { color: colors.textSecondary }]}>Order Items:</Text>
                <View style={styles.orderItems}>
                  {order.items.map((item, idx) => (
                    <View key={idx} style={styles.orderItemRow}>
                      <View style={[styles.itemDot, { backgroundColor: colors.primary }]} />
                      <Text style={[styles.orderItem, { color: colors.text }]}>{item.name}</Text>
                      <View style={[styles.qtyBadge, { backgroundColor: colors.primary + '15' }]}>
                        <Text style={[styles.qtyText, { color: colors.primary }]}>×{item.qty}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
              
              <View style={[styles.orderFooter, { borderTopColor: colors.background }]}>
                <View style={styles.footerLeft}>
                  <Text style={[styles.timeIcon, { color: colors.textSecondary }]}>🕐</Text>
                  <Text style={[styles.orderTime, { color: colors.textSecondary }]}>{order.timestamp}</Text>
                </View>
                <View style={[styles.totalContainer, { backgroundColor: colors.primary + '10' }]}>
                  <Text style={[styles.orderTotal, { color: colors.primary }]}>₹{order.totalPrice}</Text>
                </View>
              </View>
              
              <View style={[styles.tapHintContainer, { backgroundColor: colors.primary + '08' }]}>
                <Text style={[styles.tapHint, { color: colors.primary }]}>👆 Tap to update status</Text>
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingBottom: 70,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  ordersContainer: {
    paddingHorizontal: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  miniStat: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderLeftWidth: 3,
  },
  miniStatIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  miniStatValue: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  miniStatLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  orderCard: {
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  orderUser: {
    fontSize: 13,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  statusIcon: {
    fontSize: 14,
  },
  orderStatus: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  orderBody: {
    padding: 16,
    paddingTop: 12,
  },
  itemsLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  orderItems: {
    gap: 6,
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  orderItem: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  qtyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  qtyText: {
    fontSize: 12,
    fontWeight: '700',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeIcon: {
    fontSize: 14,
  },
  orderTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  totalContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tapHintContainer: {
    padding: 10,
    alignItems: 'center',
  },
  tapHint: {
    fontSize: 11,
    fontWeight: '600',
  },
  orderCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
});
