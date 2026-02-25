import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ReservationsTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Reservations Coming Soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  text: { fontSize: 20, color: '#10b981', fontWeight: 'bold' },
});
