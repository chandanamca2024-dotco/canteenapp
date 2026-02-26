import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { supabase } from '../../lib/supabase';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  image?: string;
  available?: boolean;
  food_type?: 'veg' | 'non-veg';
}

interface WishlistItem {
  id: string;
  menu_item_id: string;
  menu_item?: MenuItem;
  created_at: string;
}

interface WishlistTabProps {
  colors: any;
  onAddToCart: (item: MenuItem) => void;
  onOpenDrawer: () => void;
}

export const WishlistTab: React.FC<WishlistTabProps> = ({
  colors,
  onAddToCart,
  onOpenDrawer,
}) => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('wishlist')
        .select(`
          id,
          menu_item_id,
          created_at,
          menu_item:menu_items!inner (
            id,
            name,
            price,
            category,
            image,
            available,
            food_type
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to handle menu_item relationship
      const transformedData = (data || []).map((item: any) => ({
        ...item,
        menu_item: Array.isArray(item.menu_item) ? item.menu_item[0] : item.menu_item
      }));

      setWishlistItems(transformedData);
    } catch (error) {
      console.error('Error loading wishlist:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadWishlist();
  };

  const removeFromWishlist = async (wishlistItemId: string, itemName: string) => {
    Alert.alert(
      'Remove from Wishlist',
      `Remove ${itemName} from your wishlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('wishlist')
                .delete()
                .eq('id', wishlistItemId);

              if (error) throw error;

              setWishlistItems(items => items.filter(item => item.id !== wishlistItemId));
              Alert.alert('Removed', `${itemName} removed from wishlist`);
            } catch (error) {
              console.error('Error removing from wishlist:', error);
              Alert.alert('Error', 'Failed to remove item from wishlist');
            }
          }
        }
      ]
    );
  };

  const handleAddToCart = (wishlistItem: WishlistItem) => {
    if (!wishlistItem.menu_item) return;
    
    if (!wishlistItem.menu_item.available) {
      Alert.alert('Unavailable', 'This item is currently unavailable');
      return;
    }

    onAddToCart(wishlistItem.menu_item);
    Alert.alert('Added to Cart', `${wishlistItem.menu_item.name} added to your cart`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onOpenDrawer} style={styles.menuButton}>
            <Icon name="menu" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Wishlist</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerSubtitle}>Your favorite items at a glance</Text>
      </View>

      {/* Items Count Badge */}
      <View style={[styles.countBadge, { backgroundColor: '#E0E7FF' }]}>
        <Text style={[styles.countText, { color: colors.primary }]}>
          {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 40 }} />
        ) : wishlistItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>❤️</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Your wishlist is empty
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Start adding your favorite items to your wishlist
            </Text>
          </View>
        ) : (
          <View style={styles.itemsContainer}>
            {wishlistItems.map((wishlistItem) => {
              const item = wishlistItem.menu_item;
              if (!item) return null;

              return (
                <View key={wishlistItem.id} style={[styles.itemCard, { backgroundColor: colors.surface }]}>
                  {/* Veg/Non-veg Indicator */}
                  <View style={[styles.foodTypeIndicator, { 
                    borderColor: item.food_type === 'veg' ? '#10B981' : '#EF4444' 
                  }]}>
                    <View style={{ 
                      width: 6, 
                      height: 6, 
                      borderRadius: 3, 
                      backgroundColor: item.food_type === 'veg' ? '#10B981' : '#EF4444' 
                    }} />
                  </View>

                  {/* Item Image */}
                  <View style={styles.itemImageContainer}>
                    <Text style={styles.itemEmoji}>🍜</Text>
                  </View>

                  {/* Item Details */}
                  <View style={styles.itemDetails}>
                    <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={[styles.itemCategory, { color: colors.textSecondary }]}>
                      {item.category}
                    </Text>
                    <Text style={[styles.itemPrice, { color: colors.primary }]}>
                      ₹{item.price}
                    </Text>

                    {!item.available && (
                      <View style={[styles.unavailableBadge, { backgroundColor: '#FEE2E2' }]}>
                        <Text style={styles.unavailableText}>Unavailable</Text>
                      </View>
                    )}
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[
                        styles.addToCartButton,
                        { backgroundColor: colors.primary },
                        !item.available && { opacity: 0.5 }
                      ]}
                      onPress={() => handleAddToCart(wishlistItem)}
                      disabled={!item.available}
                    >
                      <Icon name="add-shopping-cart" size={18} color="#FFF" />
                      <Text style={styles.buttonText}>Add to Order</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.removeButton, { borderColor: colors.danger }]}
                      onPress={() => removeFromWishlist(wishlistItem.id, item.name)}
                    >
                      <Icon name="favorite" size={20} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 16,
    elevation: 4,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
    marginTop: 4,
  },
  countBadge: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  countText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    flexGrow: 1,
  },
  itemsContainer: {
    padding: 16,
  },
  itemCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    position: 'relative',
  },
  foodTypeIndicator: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 14,
    height: 14,
    borderRadius: 2,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    zIndex: 1,
  },
  itemImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemEmoji: {
    fontSize: 56,
  },
  itemDetails: {
    marginBottom: 16,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  itemCategory: {
    fontSize: 13,
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  unavailableBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  unavailableText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  addToCartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  removeButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});
