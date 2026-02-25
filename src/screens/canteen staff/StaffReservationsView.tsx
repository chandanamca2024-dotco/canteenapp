import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../theme/ThemeContext';

interface Reservation {
  id: string;
  user_id: string;
  reservation_date: string;
  reservation_time_slot: string;
  seat_number: string;
  number_of_guests: number;
  special_requests?: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled';
  seating_area?: string;
  created_at: string;
  user?: {
    name: string;
    role: string;
  };
}

export default function StaffReservationsView() {
  const { colors } = useTheme();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTimeSlotReservations, setCurrentTimeSlotReservations] = useState<Reservation[]>([]);

  useEffect(() => {
    fetchTodayReservations();
    setupRealtimeSubscription();
  }, []);

  useEffect(() => {
    // Check for upcoming reservations and show alert
    if (currentTimeSlotReservations.length > 0) {
      const timeSlot = currentTimeSlotReservations[0].reservation_time_slot;
      const seats = currentTimeSlotReservations.map(r => r.seat_number).join(', ');
      
      Alert.alert(
        '⚠️ Upcoming Reservations',
        `${currentTimeSlotReservations.length} reservation(s) for ${timeSlot}:\n\n` +
        `${currentTimeSlotReservations.map(r => `Seat ${r.seat_number} (${r.user?.name})`).join('\n')}\n\n` +
        'Please ensure seats are ready!',
        [{ text: 'OK', style: 'default' }]
      );
    }
  }, [currentTimeSlotReservations]);

  const getCurrentTimeSlot = () => {
    const now = new Date();
    const hours = now.getHours();
    const startHour = hours.toString().padStart(2, '0') + ':00';
    const endHour = (hours + 1).toString().padStart(2, '0') + ':00';
    return `${startHour}-${endHour}`;
  };

  const isUpcoming = (timeSlot: string): boolean => {
    const [startTime] = timeSlot.split('-');
    const [hours] = startTime.split(':').map(Number);
    
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    
    const timeDiff = (hours * 60) - (currentHours * 60 + currentMinutes);
    return timeDiff >= 0 && timeDiff <= 30;
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('reservations_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'seat_reservations' },
        (payload) => {
          console.log('Reservation update received:', payload);
          fetchTodayReservations();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const fetchTodayReservations = async () => {
    try {
      setLoading(true);

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('seat_reservations')
        .select(`
          id,
          user_id,
          reservation_date,
          reservation_time_slot,
          seat_number,
          number_of_guests,
          special_requests,
          status,
          seating_area,
          created_at,
          profiles:user_id (
            name,
            role
          )
        `)
        .eq('reservation_date', today)
        .eq('status', 'Confirmed')
        .order('reservation_time_slot', { ascending: true });

      if (error) throw error;

      const normalized: Reservation[] = (data || []).map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        reservation_date: row.reservation_date,
        reservation_time_slot: row.reservation_time_slot,
        seat_number: row.seat_number,
        number_of_guests: row.number_of_guests,
        special_requests: row.special_requests || '',
        status: row.status,
        seating_area: row.seating_area || '',
        created_at: row.created_at,
        user: row.profiles ? {
          name: row.profiles.name,
          role: row.profiles.role
        } : undefined,
      }));

      setReservations(normalized);

      // Check for upcoming reservations
      const upcoming = normalized.filter(r => isUpcoming(r.reservation_time_slot));
      setCurrentTimeSlotReservations(upcoming);
    } catch (error: any) {
      console.error('Error fetching reservations:', error);
      Alert.alert('Error', 'Failed to load reservations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTodayReservations();
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading reservations...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={styles.contentContainer}
      >
        {/* Alert Banner for Upcoming Reservations */}
        {currentTimeSlotReservations.length > 0 && (
          <View style={[styles.alertBanner, { backgroundColor: '#ff6b6b', borderColor: '#ff6b6b' }]}>
            <Text style={styles.alertIcon}>⚠️</Text>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>
                UPCOMING: {currentTimeSlotReservations.length} Reservation(s)
              </Text>
              <Text style={styles.alertSubtitle}>
                Time: {currentTimeSlotReservations[0].reservation_time_slot}
              </Text>
              <Text style={styles.alertSubtitle}>
                Seats: {currentTimeSlotReservations.map(r => r.seat_number).join(', ')}
              </Text>
            </View>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Today's Reservations
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>

        {/* Reservations List */}
        {reservations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🪑</Text>
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No reservations for today
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              New reservations will appear here
            </Text>
          </View>
        ) : (
          reservations.map((reservation) => {
            const upcoming = isUpcoming(reservation.reservation_time_slot);
            
            return (
              <View
                key={reservation.id}
                style={[
                  styles.reservationCard,
                  {
                    backgroundColor: upcoming ? '#fff4e6' : colors.surface,
                    borderColor: upcoming ? '#ff6b6b' : 'transparent',
                    borderWidth: upcoming ? 3 : 0,
                  },
                ]}
              >
                {upcoming && (
                  <View style={styles.upcomingBadge}>
                    <Text style={styles.upcomingBadgeText}>🔔 UPCOMING</Text>
                  </View>
                )}

                <View style={styles.cardHeader}>
                  <View style={styles.seatInfo}>
                    <Text style={[styles.seatNumber, { color: colors.text }]}>
                      🪑 Seat {reservation.seat_number}
                    </Text>
                    {reservation.seating_area && (
                      <Text style={[styles.seatingArea, { color: colors.textSecondary }]}>
                        📍 Area: {reservation.seating_area}
                      </Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.timeSlot,
                      { color: upcoming ? '#ff6b6b' : colors.primary }
                    ]}
                  >
                    🕐 {reservation.reservation_time_slot}
                  </Text>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.primary + '20' }]} />

                <View style={styles.guestInfo}>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                      Guest:
                    </Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {reservation.user?.name || 'Unknown'}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                      Role:
                    </Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {reservation.user?.role || 'User'}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                      Guests:
                    </Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {reservation.number_of_guests} {reservation.number_of_guests === 1 ? 'person' : 'people'}
                    </Text>
                  </View>

                  {reservation.special_requests && (
                    <View style={[styles.specialRequests, { backgroundColor: colors.warning + '15' }]}>
                      <Text style={[styles.specialRequestsLabel, { color: colors.text }]}>
                        📝 Special Requests:
                      </Text>
                      <Text style={[styles.specialRequestsText, { color: colors.textSecondary }]}>
                        {reservation.special_requests}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}

        {/* Summary */}
        {reservations.length > 0 && (
          <View style={[styles.summary, { backgroundColor: colors.primary + '15' }]}>
            <Text style={[styles.summaryText, { color: colors.text }]}>
              📊 Total Reservations Today: {reservations.length}
            </Text>
            <Text style={[styles.summaryText, { color: colors.text }]}>
              🔔 Upcoming (Next 30 min): {currentTimeSlotReservations.length}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  alertBanner: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    elevation: 4,
  },
  alertIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  alertSubtitle: {
    color: '#fff',
    fontSize: 14,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  reservationCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    position: 'relative',
  },
  upcomingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    elevation: 2,
  },
  upcomingBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  seatInfo: {
    flex: 1,
  },
  seatNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  seatingArea: {
    fontSize: 13,
  },
  timeSlot: {
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  guestInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  specialRequests: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
  },
  specialRequestsLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  specialRequestsText: {
    fontSize: 13,
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
  },
  summary: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
  },
  summaryText: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
});
