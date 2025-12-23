import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface TabItem {
  id: string;
  label: string;
  icon: string;
  screen?: string;
}

interface BottomNavProps {
  tabs: TabItem[];
  activeTab: string;
  onTabPress: (tabId: string) => void;
}

export const BottomNavigation: React.FC<BottomNavProps> = ({
  tabs,
  activeTab,
  onTabPress,
}) => {
  const { colors } = useTheme();

  const getIcon = (icon: string) => {
    const icons: { [key: string]: string } = {
      home: '🏠',
      dashboard: '📊',
      menu: '🍽️',
      orders: '📦',
      wallet: '💳',
      profile: '👤',
      notifications: '🔔',
      add: '➕',
      edit: '✏️',
      delete: '🗑️',
      report: '📈',
      feedback: '💬',
      settings: '⚙️',
      users: '👥',
      chart: '📉',
      sales: '💰',
    };
    return icons[icon] || '•';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={[styles.navBar, { backgroundColor: colors.surface, shadowColor: colors.text }]}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabItem,
                isActive && [
                  styles.activeTab,
                  { backgroundColor: colors.primary + '15' },
                ],
              ]}
              onPress={() => onTabPress(tab.id)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconContainer,
                  isActive && { backgroundColor: colors.primary },
                ]}
              >
                <Text style={[styles.icon, isActive && styles.activeIcon]}>
                  {getIcon(tab.icon)}
                </Text>
              </View>
              <Text
                style={[
                  styles.label,
                  {
                    color: isActive ? colors.primary : colors.textSecondary,
                    fontWeight: isActive ? '700' : '500',
                    fontSize: isActive ? 10 : 9,
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 0,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: 8,
    paddingHorizontal: 8,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 },
    elevation: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    position: 'relative',
    flex: 1,
  },
  activeTab: {
    borderRadius: 14,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  icon: {
    fontSize: 24,
  },
  activeIcon: {
    fontSize: 26,
  },
  label: {
    fontSize: 11,
    marginTop: 2,
  },
});
