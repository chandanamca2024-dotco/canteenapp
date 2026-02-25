import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../theme/ThemeContext';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
  stock_quantity?: number;
  description?: string;
  image_url?: string;
}

export default function StaffInventory() {
  const { colors } = useTheme();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchMenuItems();
    setupRealtimeSubscription();
  }, []);

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('menu_items_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_items' },
        (payload) => {
          console.log('Menu item update received:', payload);
          fetchMenuItems();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const fetchMenuItems = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('category')
        .order('name');

      if (error) throw error;

      setMenuItems(data || []);
    } catch (error: any) {
      console.error('Error fetching menu items:', error);
      Alert.alert('Error', 'Failed to load menu items');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleAvailability = async (itemId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ available: !currentStatus })
        .eq('id', itemId);

      if (error) throw error;

      Alert.alert(
        '✅ Success',
        `Item ${!currentStatus ? 'marked as available' : 'marked as unavailable'}`
      );
      fetchMenuItems();
    } catch (error: any) {
      console.error('Error updating availability:', error);
      Alert.alert('❌ Error', error.message);
    }
  };

  const updateStockQuantity = async (itemId: string, newQuantity: number) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ stock_quantity: newQuantity })
        .eq('id', itemId);

      if (error) throw error;

      Alert.alert('✅ Success', 'Stock quantity updated');
      fetchMenuItems();
    } catch (error: any) {
      console.error('Error updating stock:', error);
      Alert.alert('❌ Error', error.message);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMenuItems();
  };

  const categories = Array.from(new Set(menuItems.map(item => item.category)));

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory ? item.category === filterCategory : true;
    return matchesSearch && matchesCategory;
  });

  const renderMenuItem = ({ item }: { item: MenuItem }) => {
    return (
      <View style={[styles.menuCard, { backgroundColor: colors.surface }]}>
        <View style={styles.cardHeader}>
          <View style={styles.itemInfo}>
            <Text style={[styles.itemName, { color: colors.text }]}>
              {item.name}
            </Text>
            <Text style={[styles.itemCategory, { color: colors.textSecondary }]}>
              📁 {item.category}
            </Text>
            <Text style={[styles.itemPrice, { color: colors.primary }]}>
              ₹{item.price}
            </Text>
          </View>

          <View style={styles.statusContainer}>
            <TouchableOpacity
              style={[
                styles.availabilityBadge,
                {
                  backgroundColor: item.available
                    ? colors.success + '20'
                    : colors.danger + '20',
                },
              ]}
              onPress={() => toggleAvailability(item.id, item.available)}
            >
              <Text
                style={[
                  styles.availabilityText,
                  {
                    color: item.available ? colors.success : colors.danger,
                  },
                ]}
              >
                {item.available ? '✅ Available' : '❌ Unavailable'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {item.description && (
          <Text style={[styles.itemDescription, { color: colors.textSecondary }]}>
            {item.description}
          </Text>
        )}

        <View style={[styles.divider, { backgroundColor: colors.primary + '20' }]} />

        <View style={styles.stockContainer}>
          <Text style={[styles.stockLabel, { color: colors.text }]}>
            📦 Stock Quantity:
          </Text>
          <View style={styles.stockControls}>
            <TouchableOpacity
              style={[styles.stockButton, { backgroundColor: colors.danger }]}
              onPress={() => {
                const currentStock = item.stock_quantity || 0;
                if (currentStock > 0) {
                  updateStockQuantity(item.id, currentStock - 1);
                }
              }}
            >
              <Text style={styles.stockButtonText}>−</Text>
            </TouchableOpacity>

            <Text style={[styles.stockValue, { color: colors.text }]}>
              {item.stock_quantity || 0}
            </Text>

            <TouchableOpacity
              style={[styles.stockButton, { backgroundColor: colors.success }]}
              onPress={() => {
                const currentStock = item.stock_quantity || 0;
                updateStockQuantity(item.id, currentStock + 1);
              }}
            >
              <Text style={styles.stockButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {(item.stock_quantity || 0) < 5 && item.available && (
          <View style={[styles.lowStockWarning, { backgroundColor: colors.warning + '20' }]}>
            <Text style={[styles.lowStockText, { color: colors.warning }]}>
              ⚠️ Low stock! Consider restocking soon.
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading inventory...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search menu items..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Category Filter */}
      <View style={styles.categoryFilter}>
        <TouchableOpacity
          style={[
            styles.categoryChip,
            {
              backgroundColor: filterCategory === null ? colors.primary : colors.surface,
            },
          ]}
          onPress={() => setFilterCategory(null)}
        >
          <Text
            style={[
              styles.categoryChipText,
              { color: filterCategory === null ? '#fff' : colors.text },
            ]}
          >
            All
          </Text>
        </TouchableOpacity>

        {categories.map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              {
                backgroundColor:
                  filterCategory === category ? colors.primary : colors.surface,
              },
            ]}
            onPress={() => setFilterCategory(category)}
          >
            <Text
              style={[
                styles.categoryChipText,
                { color: filterCategory === category ? '#fff' : colors.text },
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Menu Items List */}
      <FlatList
        data={filteredItems}
        renderItem={renderMenuItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📦</Text>
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No items found
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Try adjusting your search or filter
            </Text>
          </View>
        }
      />

      {/* Summary */}
      {filteredItems.length > 0 && (
        <View style={[styles.summary, { backgroundColor: colors.primary + '15' }]}>
          <Text style={[styles.summaryText, { color: colors.text }]}>
            📊 Total Items: {filteredItems.length} | Available:{' '}
            {filteredItems.filter(i => i.available).length}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  categoryFilter: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 1,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  menuCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 13,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  availabilityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  availabilityText: {
    fontSize: 13,
    fontWeight: '600',
  },
  itemDescription: {
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  stockContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  stockControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stockButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  stockValue: {
    fontSize: 20,
    fontWeight: 'bold',
    minWidth: 40,
    textAlign: 'center',
  },
  lowStockWarning: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
  },
  lowStockText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
  },
  summary: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  summaryText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});
