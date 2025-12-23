import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface SalesReportProps {
  getTotalRevenue: () => number;
  getTotalOrders: () => number;
}

export const SalesReport: React.FC<SalesReportProps> = ({
  getTotalRevenue,
  getTotalOrders,
}) => {
  const { colors, tokens } = useTheme();

  return (
    <ScrollView style={[styles.content, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Sales Analytics</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Track and analyze your business performance metrics</Text>
      </View>

      <View style={styles.reportsContainer}>
        <View style={[styles.heroCard, { backgroundColor: colors.surface }, tokens.shadow.card]}>
          <View style={styles.heroCardTop}>
            <View>
              <Text style={[styles.heroLabel, { color: colors.textSecondary }]}>TODAY'S REVENUE</Text>
              <Text style={[styles.heroValue, { color: colors.primary }]}>₹{getTotalRevenue()}</Text>
              <View style={styles.trendContainer}>
                <Text style={[styles.trendIcon, { color: colors.success }]}>↑</Text>
                <Text style={[styles.trendText, { color: colors.success }]}>+12% from yesterday</Text>
              </View>
            </View>
            <View style={[styles.heroIcon, { backgroundColor: colors.primary + '15' }]}>
              <Text style={styles.heroIconText}>💰</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderLeftColor: colors.success }, tokens.shadow.card]}>
            <View style={[styles.statIconWrapper, { backgroundColor: colors.success + '15' }]}>
              <Text style={styles.statIcon}>📦</Text>
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Orders</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{getTotalOrders()}</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface, borderLeftColor: colors.warning }, tokens.shadow.card]}>
            <View style={[styles.statIconWrapper, { backgroundColor: colors.warning + '15' }]}>
              <Text style={styles.statIcon}>⏳</Text>
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>0</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderLeftColor: colors.primary }, tokens.shadow.card]}>
            <View style={[styles.statIconWrapper, { backgroundColor: colors.primary + '15' }]}>
              <Text style={styles.statIcon}>👨‍🍳</Text>
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Preparing</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>0</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface, borderLeftColor: colors.success }, tokens.shadow.card]}>
            <View style={[styles.statIconWrapper, { backgroundColor: colors.success + '15' }]}>
              <Text style={styles.statIcon}>✅</Text>
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>0</Text>
          </View>
        </View>

        <View style={[styles.insightCard, { backgroundColor: colors.surface }, tokens.shadow.card]}>
          <Text style={[styles.insightTitle, { color: colors.text }]}>💡 Quick Insights</Text>
          <View style={styles.insightItem}>
            <Text style={styles.insightBullet}>•</Text>
            <Text style={[styles.insightText, { color: colors.textSecondary }]}>Peak hours: 12:00 PM - 2:00 PM</Text>
          </View>
          <View style={styles.insightItem}>
            <Text style={styles.insightBullet}>•</Text>
            <Text style={[styles.insightText, { color: colors.textSecondary }]}>Most ordered: Biryani items</Text>
          </View>
          <View style={styles.insightItem}>
            <Text style={styles.insightBullet}>•</Text>
            <Text style={[styles.insightText, { color: colors.textSecondary }]}>Average order value: ₹{getTotalOrders() > 0 ? Math.round(getTotalRevenue() / getTotalOrders()) : 0}</Text>
          </View>
        </View>
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
    paddingTop: 50,
    paddingBottom: 24,
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
  reportsContainer: {
    paddingHorizontal: 16,
  },
  heroCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  heroCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  heroValue: {
    fontSize: 36,
    fontWeight: '900',
    marginBottom: 8,
    letterSpacing: -1,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendIcon: {
    fontSize: 16,
    fontWeight: '700',
  },
  trendText: {
    fontSize: 13,
    fontWeight: '600',
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroIconText: {
    fontSize: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  statIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statIcon: {
    fontSize: 20,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  insightCard: {
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  insightBullet: {
    fontSize: 16,
    color: '#FF6B00',
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
});
