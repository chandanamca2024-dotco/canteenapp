import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export const Feedback: React.FC = () => {
  const { colors, tokens } = useTheme();

  return (
    <ScrollView style={[styles.content, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Customer Feedback</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>View all customer ratings and reviews</Text>
      </View>

      <View style={styles.feedbackContainer}>
        <View style={[styles.ratingOverview, { backgroundColor: colors.surface }, tokens.shadow.card]}>
          <View style={styles.ratingLeft}>
            <Text style={[styles.ratingScore, { color: colors.primary }]}>0.0</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Text key={star} style={styles.star}>⭐</Text>
              ))}
            </View>
            <Text style={[styles.ratingCount, { color: colors.textSecondary }]}>0 reviews</Text>
          </View>
          <View style={styles.ratingBars}>
            {[5, 4, 3, 2, 1].map((num) => (
              <View key={num} style={styles.ratingBarRow}>
                <Text style={[styles.barLabel, { color: colors.textSecondary }]}>{num}⭐</Text>
                <View style={[styles.barTrack, { backgroundColor: colors.background }]}>
                  <View style={[styles.barFill, { backgroundColor: colors.primary, width: '0%' }]} />
                </View>
                <Text style={[styles.barCount, { color: colors.textSecondary }]}>0</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.emptyStateCard, { backgroundColor: colors.surface }, tokens.shadow.card]}>
          <View style={[styles.emptyIconContainer, { backgroundColor: colors.primary + '10' }]}>
            <Text style={styles.emptyIcon}>📝</Text>
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Feedback Yet</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Customer feedback and reviews will be displayed here
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
  feedbackContainer: {
    paddingHorizontal: 16,
  },
  ratingOverview: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    gap: 20,
  },
  ratingLeft: {
    alignItems: 'center',
    paddingRight: 20,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  ratingScore: {
    fontSize: 48,
    fontWeight: '900',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  star: {
    fontSize: 14,
  },
  ratingCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  ratingBars: {
    flex: 1,
    gap: 6,
  },
  ratingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barLabel: {
    fontSize: 12,
    fontWeight: '600',
    width: 28,
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barCount: {
    fontSize: 11,
    fontWeight: '600',
    width: 20,
    textAlign: 'right',
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
