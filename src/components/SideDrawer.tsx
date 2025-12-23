import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface DrawerItem {
  id: string;
  label: string;
  icon: string;
  onPress: () => void;
  danger?: boolean;
}

interface DrawerProps {
  visible: boolean;
  onClose: () => void;
  items: DrawerItem[];
  userName?: string;
  userEmail?: string;
}

export const SideDrawer: React.FC<DrawerProps> = ({
  visible,
  onClose,
  items,
  userName = 'User',
  userEmail = 'user@example.com',
}) => {
  const { colors, isDark, toggleTheme } = useTheme();

  const getIcon = (icon: string) => {
    const icons: { [key: string]: string } = {
      settings: '⚙️',
      help: '❓',
      about: 'ℹ️',
      logout: '🚪',
      theme: isDark ? '☀️' : '🌙',
      notifications: '🔔',
      wallet: '💰',
      profile: '👤',
      history: '📋',
      feedback: '💬',
    };
    return icons[icon] || '•';
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.overlayBackground} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <SafeAreaView
          style={[
            styles.drawer,
            { backgroundColor: colors.surface },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
            <View style={styles.userInfo}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: colors.primary + '20' },
                ]}
              >
                <Text style={styles.avatarText}>
                  {userName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={[styles.userName, { color: colors.text }]}>
                  {userName}
                </Text>
                <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                  {userEmail}
                </Text>
              </View>
            </View>
          </View>

          {/* Menu Items */}
          <ScrollView style={styles.menuItems}>
            {items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuItem,
                  {
                    backgroundColor: item.danger ? colors.danger + '10' : 'transparent',
                  },
                ]}
                onPress={() => {
                  item.onPress();
                  onClose();
                }}
              >
                <Text style={styles.itemIcon}>{getIcon(item.icon)}</Text>
                <Text
                  style={[
                    styles.itemLabel,
                    {
                      color: item.danger ? colors.danger : colors.text,
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Theme Toggle */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={toggleTheme}
            >
              <Text style={styles.itemIcon}>{getIcon('theme')}</Text>
              <Text style={[styles.itemLabel, { color: colors.text }]}>
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Text style={[styles.version, { color: colors.textSecondary }]}>
              DineDesk v1.0.0
            </Text>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  overlayBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  drawer: {
    height: '100%',
    width: '75%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  closeIcon: {
    fontSize: 24,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4F46E5',
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  menuItems: {
    flex: 1,
    paddingVertical: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  itemIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  version: {
    fontSize: 11,
  },
});
