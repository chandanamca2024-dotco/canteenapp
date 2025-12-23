import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export const Users: React.FC = () => {
  const { colors, tokens } = useTheme();

  return (
    <ScrollView style={[styles.content, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>User Management</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>View and manage all registered users</Text>
      </View>

      <View style={styles.usersContainer}>
        <View style={[styles.statsCard, { backgroundColor: colors.surface }, tokens.shadow.card]}>
          <View style={[styles.statItem, { borderRightWidth: 1, borderRightColor: colors.background }]}>
            <View style={[styles.statIconBox, { backgroundColor: colors.primary + '15' }]}>
              <Text style={styles.statEmoji}>👤</Text>
            </View>
            <Text style={[styles.statNum, { color: colors.text }]}>0</Text>
            <Text style={[styles.statText, { color: colors.textSecondary }]}>Total Users</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIconBox, { backgroundColor: colors.success + '15' }]}>
              <Text style={styles.statEmoji}>✅</Text>
            </View>
            <Text style={[styles.statNum, { color: colors.text }]}>0</Text>
            <Text style={[styles.statText, { color: colors.textSecondary }]}>Active Now</Text>
          </View>
        </View>

        <View style={[styles.emptyStateCard, { backgroundColor: colors.surface }, tokens.shadow.card]}>
          <View style={[styles.emptyIconContainer, { backgroundColor: colors.primary + '10' }]}>
            <Text style={styles.emptyIcon}>👥</Text>
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Active Users</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Active users will appear here when they log in to the app
          </Text>
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
  usersContainer: {
    paddingHorizontal: 16,
  },
  statsCard: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statEmoji: {
    fontSize: 28,
  },
  statNum: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyStateCard: {
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
