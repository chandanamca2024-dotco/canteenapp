import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { BottomNavigation } from '../../components/BottomNavigation';
import { SideDrawer } from '../../components/SideDrawer';
import { useCart } from '../../hooks/useCart';
import { useWishlist } from '../../hooks/useWishlist';

// Import all tab components
import { HomeTab } from './HomeTab';
import { MenuTab } from './MenuTab';
import { CartTab } from './CartTab';
import { OrdersTab } from './OrdersTab';
import { WishlistTab } from './WishlistTab';
import { WalletTab } from './WalletTab';
import { ProfileTab } from './ProfileTab';

type TabType = 'home' | 'menu' | 'cart' | 'orders' | 'wishlist' | 'wallet' | 'profile';

export default function UserDashboardModular({ navigation }: any) {
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [drawerVisible, setDrawerVisible] = useState(false);

  // Use custom hooks for cart and wishlist management
  const {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    getTotalPrice,
    placeOrder,
  } = useCart();

  const { addToWishlist } = useWishlist();

  const handlePlaceOrder = async () => {
    const success = await placeOrder();
    if (success) {
      setActiveTab('orders');
    }
  };

  const handleLogout = async () => {
    navigation.replace('Login');
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeTab
            colors={colors}
            onNavigateToMenu={() => setActiveTab('menu')}
            onNavigateToOrders={() => setActiveTab('orders')}
            onNavigateToLoyalty={() => setActiveTab('wallet')}
            onOpenDrawer={() => setDrawerVisible(true)}
          />
        );
      
      case 'menu':
        return (
          <MenuTab
            colors={colors}
            onAddToCart={addToCart}
            onAddToWishlist={addToWishlist}
            onOpenDrawer={() => setDrawerVisible(true)}
          />
        );
      
      case 'cart':
        return (
          <CartTab
            colors={colors}
            cart={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeFromCart}
            onPlaceOrder={handlePlaceOrder}
            onBackToMenu={() => setActiveTab('menu')}
          />
        );
      
      case 'orders':
        return (
          <OrdersTab
            colors={colors}
            onOpenDrawer={() => setDrawerVisible(true)}
          />
        );
      
      case 'wishlist':
        return (
          <WishlistTab
            colors={colors}
            onAddToCart={addToCart}
            onOpenDrawer={() => setDrawerVisible(true)}
          />
        );
      
      case 'wallet':
        return (
          <WalletTab
            colors={colors}
            walletBalance={500}
          />
        );
      
      case 'profile':
        return (
          <ProfileTab
            colors={colors}
            onLogout={handleLogout}
            onOpenDrawer={() => setDrawerVisible(true)}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        items={[
          { 
            id: 'home', 
            label: 'Home', 
            icon: 'home', 
            onPress: () => {
              setActiveTab('home');
              setDrawerVisible(false);
            }
          },
          { 
            id: 'orders', 
            label: 'My Orders', 
            icon: 'orders', 
            onPress: () => {
              setActiveTab('orders');
              setDrawerVisible(false);
            }
          },
          { 
            id: 'wishlist', 
            label: 'Wishlist', 
            icon: 'wishlist', 
            onPress: () => {
              setActiveTab('wishlist');
              setDrawerVisible(false);
            }
          },
          { 
            id: 'wallet', 
            label: 'Wallet', 
            icon: 'wallet', 
            onPress: () => {
              setActiveTab('wallet');
              setDrawerVisible(false);
            }
          },
          { 
            id: 'help', 
            label: 'Help & Support', 
            icon: 'help', 
            onPress: () => {
              setDrawerVisible(false);
            }
          },
          { 
            id: 'logout', 
            label: 'Logout', 
            icon: 'logout', 
            danger: true, 
            onPress: handleLogout
          },
        ]}
        userName="Student"
        userEmail="student@university.edu"
      />

      {/* Render active tab */}
      <View style={styles.content}>
        {renderActiveTab()}
      </View>

      {/* Bottom Navigation */}
      <BottomNavigation
        tabs={[
          { id: 'home', label: 'Home', icon: 'home' },
          { id: 'menu', label: 'Menu', icon: 'menu' },
          { id: 'orders', label: 'Orders', icon: 'orders' },
          { id: 'wallet', label: 'Wallet', icon: 'wallet' },
          { id: 'profile', label: 'Profile', icon: 'profile' },
        ]}
        activeTab={activeTab}
        onTabPress={(tab: string) => setActiveTab(tab as TabType)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
