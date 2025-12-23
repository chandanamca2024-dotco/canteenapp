import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface NotificationToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  onDismiss: () => void;
  autoHideDuration?: number;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  visible,
  message,
  type = 'info',
  onDismiss,
  autoHideDuration = 4000,
}) => {
  const { colors } = useTheme();
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();

      // Auto hide
      const timer = setTimeout(() => {
        hideToast();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.timing(translateY, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'error':
        return colors.danger;
      default:
        return colors.primary;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return '🔔';
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          transform: [{ translateY }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={hideToast}
        activeOpacity={0.9}
      >
        <Text style={styles.icon}>{getIcon()}</Text>
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
        <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  icon: {
    fontSize: 24,
  },
  message: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
});
