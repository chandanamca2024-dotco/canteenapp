import React from 'react';
import { View, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function ReservationsTab() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
      <Icon name="calendar-clock" size={48} color="#10b981" style={{ marginBottom: 16 }} />
      <Text style={{ fontSize: 20, color: '#10b981', fontWeight: 'bold' }}>Reservations</Text>
      <Text style={{ fontSize: 16, color: '#666', marginTop: 8 }}>Reservations Coming Soon</Text>
    </View>
  );
}
