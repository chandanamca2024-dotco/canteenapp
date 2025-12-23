import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import colors from '../theme/colors';

export default function RoleSelect({ role, setRole }: any) {
  return (
    <View style={styles.container}>
      {['Student', 'Staff'].map(item => (
        <TouchableOpacity
          key={item}
          style={[
            styles.option,
            role === item && styles.active,
          ]}
          onPress={() => setRole(item)}
        >
          <Text style={styles.text}>{item}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', marginVertical: 10 },
  option: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 5,
    alignItems: 'center',
  },
  active: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  text: {
    color: '#000',
    fontWeight: '600',
  },
});
