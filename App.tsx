import React from 'react';
import { View, Text } from 'react-native';
import { ThemeProvider } from './src/theme/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  console.log('App component rendering...');
  try {
    return (
      <ThemeProvider>
        <RootNavigator />
      </ThemeProvider>
    );
  } catch (error) {
    console.error('App error:', error);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ff0000' }}>
        <Text style={{ color: '#fff', fontSize: 18 }}>Error: {String(error)}</Text>
      </View>
    );
  }
}
