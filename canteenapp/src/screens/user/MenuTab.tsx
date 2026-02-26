import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
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

interface MenuTabProps {
  colors: any;
  onAddToCart: (item: MenuItem) => void;
  onAddToWishlist: (item: MenuItem) => void;
  onOpenDrawer: () => void;
}

export const MenuTab: React.FC<MenuTabProps> = ({
  colors,
  onAddToCart,
  onAddToWishlist,
  onOpenDrawer,
}) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'veg' | 'non-veg'>('all');

  useEffect(() => {
    loadMenuItems();
  }, []);

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('available', true)
        .order('category', { ascending: true });

      if (error) throw error;
      if (data) setMenuItems(data);
    } catch (error) {
      console.error('Error loading menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    let items = menuItems;

    // Filter by food type
    if (selectedFilter === 'veg') {
      items = items.filter(item => item.food_type === 'veg');
    } else if (selectedFilter === 'non-veg') {
      items = items.filter(item => item.food_type === 'non-veg');
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    }

    return items;
  }, [menuItems, selectedFilter, searchQuery]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(filteredItems.map(item => item.category)));
    return cats.map(category => ({
      name: category,
      count: filteredItems.filter(item => item.category === category).length,
      total: menuItems.filter(item => item.category === category).length,
    }));
  }, [filteredItems, menuItems]);

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'Beverages': '☕',
      'South Indian': '🍛',
      'Main Course': '🍜',
      'Chinese': '🥡',
      'Rice': '🍚',
      'Starters': '🍢',
      'Desserts': '🍰',
      'Snacks': '🥙',
    };
    return icons[category] || '🍽️';
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onOpenDrawer} style={styles.menuButton}>
            <Icon name="menu" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Explore Our Menu</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Item Count */}
        <View style={styles.countContainer}>
          <Text style={[styles.countText, { color: colors.textSecondary }]}>
            {filteredItems.length} items available
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
            <Icon name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search for dishes or categories"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="close" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Food Type Filter */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === 'all' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setSelectedFilter('all')}
          >
            <Icon 
              name="restaurant" 
              size={18} 
              color={selectedFilter === 'all' ? '#FFF' : colors.primary} 
            />
            <Text style={[
              styles.filterText,
              { color: selectedFilter === 'all' ? '#FFF' : colors.primary }
            ]}>
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === 'veg' && { backgroundColor: '#10B981' },
              { borderColor: '#10B981' }
            ]}
            onPress={() => setSelectedFilter('veg')}
          >
            <View style={[styles.vegDot, { borderColor: selectedFilter === 'veg' ? '#FFF' : '#10B981' }]}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: selectedFilter === 'veg' ? '#FFF' : '#10B981' }} />
            </View>
            <Text style={[
              styles.filterText,
              { color: selectedFilter === 'veg' ? '#FFF' : '#10B981' }
            ]}>
              Veg
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === 'non-veg' && { backgroundColor: '#EF4444' },
              { borderColor: '#EF4444' }
            ]}
            onPress={() => setSelectedFilter('non-veg')}
          >
            <View style={[styles.vegDot, { borderColor: selectedFilter === 'non-veg' ? '#FFF' : '#EF4444' }]}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: selectedFilter === 'non-veg' ? '#FFF' : '#EF4444' }} />
            </View>
            <Text style={[
              styles.filterText,
              { color: selectedFilter === 'non-veg' ? '#FFF' : '#EF4444' }
            ]}>
              Non-Veg
            </Text>
          </TouchableOpacity>
        </View>

        {/* Browse by Category */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Browse by Category
          </Text>

          {loading ? (
            <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 20 }} />
          ) : categories.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🍽️</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No items found
              </Text>
            </View>
          ) : (
            categories.map((category) => (
              <TouchableOpacity
                key={category.name}
                style={[styles.categoryCard, { backgroundColor: colors.surface }]}
                activeOpacity={0.7}
              >
                <View style={styles.categoryIcon}>
                  <Text style={styles.categoryEmoji}>{getCategoryIcon(category.name)}</Text>
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={[styles.categoryName, { color: colors.text }]}>
                    {category.name}
                  </Text>
                  <Text style={[styles.categoryCount, { color: colors.textSecondary }]}>
                    {category.count} available • {category.total} total
                  </Text>
                </View>
                <Icon name="arrow-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* All Items Grid */}
        {!loading && filteredItems.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              All Items ({filteredItems.length})
            </Text>
            
            <View style={styles.itemsGrid}>
              {filteredItems.map((item) => (
                <View key={item.id} style={[styles.itemCard, { backgroundColor: colors.surface }]}>
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

                  {/* Wishlist Button */}
                  <TouchableOpacity 
                    style={styles.wishlistButton}
                    onPress={() => onAddToWishlist(item)}
                  >
                    <Icon name="favorite-border" size={18} color={colors.danger} />
                  </TouchableOpacity>

                  {/* Item Image Placeholder */}
                  <View style={styles.itemImage}>
                    <Text style={styles.itemEmoji}>🍜</Text>
                  </View>

                  {/* Item Info */}
                  <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.itemCategory, { color: colors.textSecondary }]}>
                    {item.category}
                  </Text>
                  <View style={styles.itemFooter}>
                    <Text style={[styles.itemPrice, { color: colors.primary }]}>
                      ₹{item.price}
                    </Text>
                    <TouchableOpacity
                      style={[styles.addToCartButton, { backgroundColor: colors.primary }]}
                      onPress={() => onAddToCart(item)}
                    >
                      <Icon name="add" size={18} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
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
    paddingBottom: 16,
    paddingHorizontal: 16,
    elevation: 4,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  countContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  countText: {
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    gap: 6,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  vegDot: {
    width: 12,
    height: 12,
    borderRadius: 2,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryEmoji: {
    fontSize: 32,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 12,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  itemCard: {
    width: '48%',
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    position: 'relative',
  },
  foodTypeIndicator: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 16,
    height: 16,
    borderRadius: 2,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  wishlistButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  itemImage: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemEmoji: {
    fontSize: 48,
  },
  itemName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  itemCategory: {
    fontSize: 11,
    marginBottom: 8,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  addToCartButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
