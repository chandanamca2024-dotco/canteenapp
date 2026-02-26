import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLoyaltyRewards } from '../../hooks/useLoyaltyRewards';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';

interface WalletTabProps {
  colors: any;
  walletBalance: number;
}

export const WalletTab: React.FC<WalletTabProps> = ({ colors, walletBalance }) => {
  const { loyaltyData, loading, getDiscountValue } = useLoyaltyRewards();

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading wallet...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Wallet Balance Card */}
      <View style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
        <View style={styles.balanceHeader}>
          <View style={[styles.balanceIcon, { backgroundColor: 'rgba(255,255,255,0.25)' }]}> 
            <MCIcon name="credit-card-outline" size={32} color="#fff" />
          </View>
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>₹{walletBalance}</Text>
          </View>
        </View>
      </View>

      {/* Loyalty Points Card */}
      <View style={[styles.loyaltyCard, { backgroundColor: '#7b2ff2' }]}>
        <View style={styles.loyaltyHeader}>
          <View style={[styles.loyaltyIconWrapper, { backgroundColor: 'rgba(255,255,255,0.22)' }]}>
            <Icon name="star" size={32} color="#fff" />
          </View>
          <View style={styles.loyaltyInfo}>
            <Text style={styles.loyaltyLabel}>Loyalty Points</Text>
            <Text style={styles.loyaltyPoints}>{loyaltyData?.total_points || 0}</Text>
            <Text style={styles.loyaltySubtext}>
              Worth ₹{getDiscountValue(loyaltyData?.total_points || 0).toFixed(0)} in discounts
            </Text>
          </View>
        </View>
      </View>

      {/* How it Works Info */}
      <View style={[styles.infoCard, { backgroundColor: '#f5f3ff' }]}>
        <Text style={styles.infoTitle}><MCIcon name="lightbulb-on-outline" size={18} color="#3d246c" /> How Loyalty Points Work</Text>
        <View style={styles.infoItem}>
          <Text style={styles.infoBullet}>•</Text>
          <Text style={styles.infoText}>Earn 1 point for every ₹10 spent on orders</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoBullet}>•</Text>
          <Text style={styles.infoText}>Bonus points for feedback and reviews</Text>
        </View>
        
        <View style={[styles.divider, { backgroundColor: '#e0d7fa' }]} />
        
        <Text style={styles.infoTitle}><MCIcon name="gift-outline" size={18} color="#3d246c" /> Redemption</Text>
        <View style={styles.infoItem}>
          <Text style={styles.infoBullet}>•</Text>
          <Text style={styles.infoText}>100 points = ₹10 off your next order</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoBullet}>•</Text>
          <Text style={styles.infoText}>Points apply automatically at checkout</Text>
        </View>
      </View>

      {/* Points Statistics */}
      <View style={styles.statsSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Points Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.success }]}>
              {loyaltyData?.points_earned || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Earned</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.error }]}>
              {loyaltyData?.points_redeemed || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Redeemed</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {loyaltyData?.total_points || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Available</Text>
          </View>
        </View>
      </View>

      {/* Add Money Section */}
      <View style={styles.addMoneySection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Add Money to Wallet</Text>
        <View style={styles.amountButtonsGrid}>
          {[100, 500, 1000, 2000].map((amount) => (
            <TouchableOpacity
              key={amount}
              style={[styles.amountButton, { backgroundColor: colors.surface }]}
              activeOpacity={0.7}
            >
              <MCIcon name="cash-multiple" size={32} color={colors.primary} style={styles.amountEmoji} />
              <Text style={[styles.amountText, { color: colors.text }]}>₹{amount}</Text>
              <Text style={[styles.amountSubtext, { color: colors.textSecondary }]}>
                +{Math.floor(amount / 10)} pts
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Transactions */}
      <View style={styles.transactionsSection}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Transactions</Text>
          <TouchableOpacity>
            <Text style={[styles.viewAllText, { color: colors.primary }]}>View All →</Text>
          </TouchableOpacity>
        </View>
        
        {[
          { type: 'debit', desc: 'Order #1001', amount: 150, points: 15 },
          { type: 'credit', desc: 'Added money', amount: 500, points: 0 },
          { type: 'debit', desc: 'Order #1002', amount: 260, points: 26 },
        ].map((txn, idx) => (
          <View
            key={idx}
            style={[styles.transactionItem, { backgroundColor: colors.surface }]}
          >
            <View style={styles.transactionLeft}>
              <MCIcon
                name={txn.type === 'debit' ? 'arrow-top-right' : 'arrow-bottom-left'}
                size={24}
                color={txn.type === 'debit' ? colors.error : colors.success}
                style={styles.transactionIcon}
              />
              <View>
                <Text style={[styles.transactionDesc, { color: colors.text }]}>
                  {txn.desc}
                </Text>
                {txn.points > 0 && (
                  <Text style={[styles.transactionPoints, { color: colors.textSecondary }]}>
                    +{txn.points} points earned
                  </Text>
                )}
              </View>
            </View>
            <Text
              style={[
                styles.transactionAmount,
                { color: txn.type === 'debit' ? colors.error : colors.success },
              ]}
            >
              {txn.type === 'debit' ? '-' : '+'}₹{txn.amount}
            </Text>
          </View>
        ))}
      </View>

      {/* Bottom Spacing */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  balanceCard: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 20,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  balanceEmoji: {
    fontSize: 32,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
  },
  loyaltyCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 24,
    elevation: 8,
    shadowColor: '#7b2ff2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  loyaltyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loyaltyIconWrapper: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
  },
  loyaltyInfo: {
    flex: 1,
  },
  loyaltyLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
    opacity: 0.95,
  },
  loyaltyPoints: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -2,
    marginBottom: 4,
  },
  loyaltySubtext: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.88,
  },
  infoCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 18,
    borderLeftWidth: 5,
    borderLeftColor: '#7b2ff2',
  },
  infoTitle: {
    color: '#3d246c',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingRight: 8,
  },
  infoBullet: {
    color: '#7b2ff2',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 10,
    width: 12,
  },
  infoText: {
    color: '#5a4a7c',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 20,
    flex: 1,
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  statsSection: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  addMoneySection: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  amountButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amountButton: {
    width: '48%',
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  amountEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  amountText: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  amountSubtext: {
    fontSize: 11,
    fontWeight: '600',
  },
  transactionsSection: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  transactionDesc: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  transactionPoints: {
    fontSize: 11,
    fontWeight: '500',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '800',
  },
});
