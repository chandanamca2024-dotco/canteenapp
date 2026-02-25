import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { supabase } from '../../lib/supabase';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  image_url?: string;
  available?: boolean;
  food_type?: 'veg' | 'non-veg';
}

interface HomeTabProps {
  colors: any;
  onNavigateToMenu: () => void;
  onNavigateToOrders: () => void;
  onNavigateToLoyalty: () => void;
  onOpenDrawer: () => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  colors,
  onNavigateToMenu,
  onNavigateToOrders,
  onNavigateToLoyalty,
  onOpenDrawer,
}) => {
  const [greeting, setGreeting] = useState('');
  const [userName, setUserName] = useState('');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserData();
    loadMenuItems();
    updateGreeting();
  }, []);

  const updateGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning 🌅');
    else if (hour < 17) setGreeting('Good Afternoon 🌤️');
    else setGreeting('Good Evening 🌙');
  };

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single();
        
        if (profile?.name) {
          setUserName(profile.name.split(' ')[0]);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('available', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error loading menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMenuItems();
    setRefreshing(false);
  };

  const renderMenuItem = ({ item }: { item: MenuItem }) => (
    <View style={[styles.itemCard, { backgroundColor: colors.surface }]}>
      <View style={styles.itemImageContainer}>
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={styles.itemImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.itemImagePlaceholder, { backgroundColor: colors.primary + '20' }]}>
            <Icon name="restaurant" size={40} color={colors.primary} />
          </View>
        )}
        
        {item.food_type === 'veg' && (
          <View style={styles.vegBadge}>
            <Text style={styles.vegIndicator}>🟢</Text>
          </View>
        )}
        {item.food_type === 'non-veg' && (
          <View style={styles.nonVegBadge}>
            <Text style={styles.vegIndicator}>🔴</Text>
          </View>
        )}
      </View>

      <View style={styles.itemContent}>
        <View style={styles.categoryTag}>
          <Text style={[styles.categoryTagText, { color: colors.primary }]}>
            {item.category || 'Food'}
          </Text>
        </View>

        <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={2}>
          {item.name}
        </Text>

        <View style={styles.itemFooter}>
          <Text style={[styles.itemPrice, { color: colors.primary }]}>
            ₹{item.price}
          </Text>
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={onNavigateToMenu}
          >
            <Icon name="add" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: '#1F2937' }]}>
      {/* Premium Header */}
      <View style={styles.premiumHeader}>
        <View style={styles.branding}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>DD</Text>
          </View>
          <View>
            <Text style={styles.brandName}>DineDesk</Text>
            <Text style={styles.brandSubtitle}>Premium Meals</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={onOpenDrawer}
        >
          <Text style={styles.profileInitial}>
            {userName ? userName[0].toUpperCase() : 'U'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Greeting & User */}
      <View style={styles.greetingSection}>
        <Text style={styles.greetingText}>{greeting}</Text>
        <Text style={styles.welcomeText}>Welcome back, {userName || 'Guest'}</Text>
      </View>

      {/* Search Bar */}
      <TouchableOpacity 
        style={styles.searchBox}
        onPress={onNavigateToMenu}
        activeOpacity={0.7}
      >
        <Icon name="search" size={20} color="rgba(255,255,255,0.6)" />
        <Text style={styles.searchText}>Search for food...</Text>
      </TouchableOpacity>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FFF" />
          <Text style={styles.loadingText}>Loading menu items...</Text>
        </View>
      ) : menuItems.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyEmoji}>🍽️</Text>
          <Text style={styles.emptyText}>No items available</Text>
          <Text style={styles.emptySubtext}>Check back later</Text>
        </View>
      ) : (
        <FlatList
          data={menuItems}
          renderItem={renderMenuItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          scrollIndicatorInsets={{ right: 1 }}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={['#FFF']}
              tintColor="#FFF"
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  premiumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1F2937',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  branding: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
  },
  brandName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  brandSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  greetingSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#1F2937',
  },
  greetingText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
  },
  welcomeText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  searchBox: {
    marginHorizontal: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  searchText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 20,
  },
  itemCard: {
    flex: 1,
    margin: 8,
    borderRadius: 16,
    elevation: 3,
    overflow: 'hidden',
    backgroundColor: '#2D3748',
  },
  itemImageContainer: {
    position: 'relative',
    height: 140,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#374151',
  },
  vegBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFF',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nonVegBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFF',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vegIndicator: {
    fontSize: 16,
  },
  itemContent: {
    padding: 12,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#60A5FA',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#FFF',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#60A5FA',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    backgroundColor: '#3B82F6',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#FFF',
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
});
