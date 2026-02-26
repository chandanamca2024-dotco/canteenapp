import React from 'react';
import { TextInput, StyleSheet } from 'react-native';
import colors from '../theme/colors';

export default function AppInput(props: any) {
  return <TextInput {...props} style={styles.input} />;
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: 12,
    marginVertical: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
});
