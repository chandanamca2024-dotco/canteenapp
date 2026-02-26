import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
  image?: string;
  description?: string;
}

interface MenuProps {
  menuItems: MenuItem[];
  toggleAvailability: (itemId: string) => void;
  removeMenuItem: (itemId: string) => void;
}

export const Menu: React.FC<MenuProps> = ({
  menuItems,
  toggleAvailability,
  removeMenuItem,
}) => {
  const { colors, tokens } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'Rice': '🍚',
      'South Indian': '🥘',
      'Breakfast': '🍳',
      'Lunch': '🍱',
      'Snacks': '🥟',
      'Beverages': '☕',
      'Starters': '🍢',
    };
    return icons[category] || '🍴';
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Rice': '#FF6B6B',
      'South Indian': '#4ECDC4',
      'Breakfast': '#FFD93D',
      'Lunch': '#95E1D3',
      'Snacks': '#F38181',
      'Beverages': '#AA96DA',
      'Starters': '#FCBAD3',
    };
    return colors[category] || '#8B5CF6';
  };

  const filteredItems = useMemo(() => {
    const base = selectedCategory
      ? menuItems.filter(item => item.category === selectedCategory)
      : menuItems;

    const query = searchQuery.trim().toLowerCase();
    if (!query) return base;

    const matches = base.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    );

    const startsWith = matches
      .filter((item) => item.name.toLowerCase().startsWith(query))
      .sort((a, b) => a.name.localeCompare(b.name));
    const contains = matches
      .filter((item) => !item.name.toLowerCase().startsWith(query))
      .sort((a, b) => a.name.localeCompare(b.name));

    return [...startsWith, ...contains];
  }, [menuItems, selectedCategory, searchQuery]);

  const showResults = selectedCategory !== null || searchQuery.trim().length > 0;

  // Get unique categories with item counts
  const categories = Array.from(new Set(menuItems.map(item => item.category))).map(cat => ({
    name: cat,
    count: menuItems.filter(item => item.category === cat).length,
    availableCount: menuItems.filter(item => item.category === cat && item.available).length,
  }));

  // Fetch pending orders count for notifications
  useEffect(() => {
    const fetchPendingOrders = async () => {
      try {
        const { count, error } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Pending');
        
        if (!error && count !== null) {
          setPendingOrdersCount(count);
        }
      } catch (error) {
        console.error('Error fetching pending orders:', error);
      }
    };

    fetchPendingOrders();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('pending-orders-notifications')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' }, 
        (payload: any) => {
          fetchPendingOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <ScrollView style={[styles.content, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      {/* Modern Header with Gradient Effect */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.headerGradientOverlay} />
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <TouchableOpacity 
                onPress={() => setSelectedCategory(null)}
                activeOpacity={selectedCategory ? 0.7 : 1}
              >
                <Text style={styles.headerTitle}>
                  {selectedCategory ? `← ${selectedCategory}` : 'Menu Management'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.headerSubtitle}>
                {selectedCategory 
                  ? `Managing ${selectedCategory} items` 
                  : 'Select a category to manage items'}
              </Text>
            </View>
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationIcon}>🔔</Text>
              {pendingOrdersCount > 0 && (
                <View style={styles.notificationDot}>
                  <Text style={styles.notificationCount}>{pendingOrdersCount}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchSection}>
        <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search food items or categories"
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={{ fontSize: 16, color: colors.textSecondary }}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Categories View */}
      {!showResults ? (
        <>
          {/* Enhanced Stats Cards with Gradients */}
          <View style={styles.menuStats}>
            <View style={[styles.statCard, styles.statCard1]}>
              <View style={styles.statIconContainer}>
                <Text style={styles.statEmoji}>📂</Text>
              </View>
              <Text style={styles.statNumber}>{categories.length}</Text>
              <Text style={styles.statLabel}>Categories</Text>
            </View>
            <View style={[styles.statCard, styles.statCard2]}>
              <View style={styles.statIconContainer}>
                <Text style={styles.statEmoji}>🍽️</Text>
              </View>
              <Text style={styles.statNumber}>{menuItems.length}</Text>
              <Text style={styles.statLabel}>Total Items</Text>
            </View>
            <View style={[styles.statCard, styles.statCard3]}>
              <View style={styles.statIconContainer}>
                <Text style={styles.statEmoji}>✅</Text>
              </View>
              <Text style={styles.statNumber}>{menuItems.filter(i => i.available).length}</Text>
              <Text style={styles.statLabel}>Available</Text>
            </View>
          </View>

          {/* Category Cards */}
          <View style={styles.menuListContainer}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.name}
                style={[styles.categoryCard, { backgroundColor: colors.surface }]}
                onPress={() => setSelectedCategory(category.name)}
                activeOpacity={0.7}
              >
                <View style={[styles.categoryIconContainer, { backgroundColor: getCategoryColor(category.name) + '20' }]}>
                  <Text style={styles.categoryCardIcon}>{getCategoryIcon(category.name)}</Text>
                </View>
                <View style={styles.categoryCardContent}>
                  <Text style={[styles.categoryCardTitle, { color: colors.text }]}>{category.name}</Text>
                  <Text style={[styles.categoryCardSubtitle, { color: colors.textSecondary }]}>
                    {category.availableCount} available • {category.count} total
                  </Text>
                </View>
                <Text style={styles.categoryArrow}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      ) : (
        <>
          {/* Enhanced Stats Cards for Selected Category */}
          <View style={styles.menuStats}>
            <View style={[styles.statCard, styles.statCard1]}>
              <View style={styles.statIconContainer}>
                <Text style={styles.statEmoji}>📊</Text>
              </View>
              <Text style={styles.statNumber}>{filteredItems.length}</Text>
              <Text style={styles.statLabel}>Results</Text>
            </View>
            <View style={[styles.statCard, styles.statCard2]}>
              <View style={styles.statIconContainer}>
                <Text style={styles.statEmoji}>✅</Text>
              </View>
              <Text style={styles.statNumber}>{filteredItems.filter(i => i.available).length}</Text>
              <Text style={styles.statLabel}>Available</Text>
            </View>
            <View style={[styles.statCard, styles.statCard3]}>
              <View style={styles.statIconContainer}>
                <Text style={styles.statEmoji}>❌</Text>
              </View>
              <Text style={styles.statNumber}>{filteredItems.filter(i => !i.available).length}</Text>
              <Text style={styles.statLabel}>Unavailable</Text>
            </View>
          </View>

          {filteredItems.length === 0 ? (
            <View style={[styles.menuListContainer, { paddingVertical: 24 }]}>
              <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
                <Text style={styles.emptyEmoji}>🔍</Text>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No matches found</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Try another name or category</Text>
              </View>
            </View>
          ) : (
            <View style={styles.menuListContainer}>
              {filteredItems.map((item) => (
                <View key={item.id} style={[styles.menuItemCard, { backgroundColor: colors.surface }]}>
                  {/* Food Image */}
                  <View style={styles.imageContainer}>
                    {item.image ? (
                      <Image 
                        source={{ uri: item.image }} 
                        style={styles.foodImage}
                        resizeMode="cover"
                        onError={(error) => {
                          console.log('Image load error for:', item.name, item.image);
                        }}
                      />
                    ) : (
                      <View style={[styles.placeholderImage, { backgroundColor: getCategoryColor(item.category) + '20' }]}>
                        <Text style={styles.placeholderIcon}>{getCategoryIcon(item.category)}</Text>
                      </View>
                    )}
                    <View style={[styles.priceBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.priceText}>₹{item.price}</Text>
                    </View>
                  </View>

                  {/* Content */}
                  <View style={styles.menuItemContent}>
                    <Text style={[styles.menuItemName, { color: colors.text }]}>{item.name}</Text>
                    <View style={[styles.categoryChip, { backgroundColor: getCategoryColor(item.category) + '20' }]}>
                      <Text style={styles.categoryIcon}>{getCategoryIcon(item.category)}</Text>
                      <Text style={[styles.categoryText, { color: getCategoryColor(item.category) }]}>{item.category}</Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.menuItemActions}>
                      <TouchableOpacity
                        style={[
                          styles.statusButton,
                          item.available ? styles.availableButton : styles.unavailableButton,
                        ]}
                        onPress={() => toggleAvailability(item.id)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.statusIcon}>{item.available ? '✅' : '⭕'}</Text>
                        <Text style={[styles.statusText, { color: item.available ? '#10B981' : '#EF4444' }]}>
                          {item.available ? 'Available' : 'Unavailable'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => removeMenuItem(item.id)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.deleteIcon}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  headerGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    position: 'relative',
    zIndex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    lineHeight: 20,
  },
  notificationBadge: {
    position: 'relative',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationIcon: {
    fontSize: 20,
  },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notificationCount: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: -20,
    zIndex: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  menuStats: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  statCard1: {
    backgroundColor: '#E0E7FF',
  },
  statCard2: {
    backgroundColor: '#D1FAE5',
  },
  statCard3: {
    backgroundColor: '#FEE2E2',
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statEmoji: {
    fontSize: 24,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuListContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  emptyState: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  menuItemCard: {
    borderRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
  },
  foodImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 64,
  },
  priceBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  priceText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  menuItemContent: {
    padding: 16,
  },
  menuItemName: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 14,
    gap: 6,
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '700',
  },
  menuItemActions: {
    flexDirection: 'row',
    gap: 10,
  },
  statusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  availableButton: {
    backgroundColor: '#D1FAE5',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  unavailableButton: {
    backgroundColor: '#FEE2E2',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  statusIcon: {
    fontSize: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
  },
  deleteButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    borderWidth: 2,
    borderColor: '#EF4444',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  deleteIcon: {
    fontSize: 20,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryCardIcon: {
    fontSize: 32,
  },
  categoryCardContent: {
    flex: 1,
  },
  categoryCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  categoryCardSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  categoryArrow: {
    fontSize: 24,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 100,
  },
});

