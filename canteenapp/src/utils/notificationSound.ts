import { Alert, Vibration } from 'react-native';

/**
 * Plays a notification sound/vibration when a new order arrives
 * Since we don't have react-native-sound installed, we'll use vibration
 * You can install react-native-sound or expo-av for actual sound playback
 */
export const playOrderNotification = () => {
  try {
    // Vibrate pattern: [wait, vibrate, wait, vibrate]
    // Pattern: 0ms wait, 200ms vibrate, 100ms wait, 200ms vibrate
    Vibration.vibrate([0, 200, 100, 200]);
  } catch (error) {
    console.error('Error playing notification:', error);
  }
};

/**
 * Show an alert notification
 */
export const showOrderAlert = (orderNumber: string | number) => {
  Alert.alert(
    '🔔 New Order!',
    `Order #${orderNumber} has been placed`,
    [{ text: 'OK', style: 'default' }]
  );
};
