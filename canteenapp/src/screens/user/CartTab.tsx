import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
  food_type?: 'veg' | 'non-veg';
}

interface CartTabProps {
  colors: any;
  cart: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onPlaceOrder: () => void;
  onBackToMenu: () => void;
}

export const CartTab: React.FC<CartTabProps> = ({
  colors,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onPlaceOrder,
  onBackToMenu,
}) => {
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  const currentTime = useMemo(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }, []);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before placing an order.');
      return;
    }

    Alert.alert(
      'Confirm Order',
      `Place order for ₹${subtotal}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setIsPlacingOrder(true);
            try {
              await onPlaceOrder();
            } finally {
              setIsPlacingOrder(false);
            }
          },
        },
      ]
    );
  };

  const renderCartItem = ({ item, index }: { item: CartItem; index: number }) => (
    <View style={[styles.cartItem, { backgroundColor: '#FFF' }]}>
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

      {/* Item Image Placeholder */}
      <View style={styles.itemImageContainer}>
        <Text style={styles.itemEmoji}>🍜</Text>
      </View>

      <View style={styles.itemDetails}>
        <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.itemPrice, { color: colors.textSecondary }]}>
          ₹{item.price}
        </Text>
      </View>

      {/* Quantity Controls */}
      <View style={styles.quantityControls}>
        <TouchableOpacity
          style={[styles.quantityButton, { borderColor: colors.primary }]}
          onPress={() => {
            if (item.quantity > 1) {
              onUpdateQuantity(item.id, item.quantity - 1);
            } else {
              onRemoveItem(item.id);
            }
          }}
        >
          <Icon name="remove" size={16} color={colors.primary} />
        </TouchableOpacity>

        <Text style={[styles.quantity, { color: colors.text }]}>
          {item.quantity}
        </Text>

        <TouchableOpacity
          style={[styles.quantityButton, { borderColor: colors.primary }]}
          onPress={() => onUpdateQuantity(item.id, item.quantity + 1)}
        >
          <Icon name="add" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Remove Button */}
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => {
          Alert.alert(
            'Remove Item',
            `Remove ${item.name} from cart?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Remove', onPress: () => onRemoveItem(item.id), style: 'destructive' },
            ]
          );
        }}
      >
        <Icon name="close" size={20} color={colors.danger} />
      </TouchableOpacity>
    </View>
  );

  if (cart.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <View style={styles.headerContent}>
            <Icon name="menu" size={28} color="#FFF" />
            <Text style={styles.headerTitle}>Your Cart</Text>
          </View>
        </View>

        {/* Empty State */}
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            All yours orders in one place
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Your cart is empty
          </Text>
          <TouchableOpacity
            style={[styles.browseButton, { backgroundColor: colors.primary }]}
            onPress={onBackToMenu}
          >
            <Text style={styles.browseButtonText}>Browse Menu</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.headerContent}>
          <Icon name="menu" size={28} color="#FFF" />
          <Text style={styles.headerTitle}>Your Cart</Text>
        </View>
        <Text style={styles.headerSubtitle}>All yours orders in one place</Text>
      </View>

      {/* Cart Items */}
      <FlatList
        data={cart}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.cartList}
        showsVerticalScrollIndicator={false}
      />

      {/* Order Summary Footer */}
      <View style={[styles.footer, { backgroundColor: colors.surface }]}>
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.text }]}>Total</Text>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>
              ₹{subtotal}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Pickup time
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {currentTime}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Canteen closes at
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              11:00 pm
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.placeOrderButton,
              { backgroundColor: colors.primary },
              isPlacingOrder && { opacity: 0.6 }
            ]}
            onPress={handlePlaceOrder}
            disabled={isPlacingOrder}
          >
            <Text style={styles.placeOrderText}>
              {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
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
  cartList: {
    padding: 16,
    paddingBottom: 100,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    position: 'relative',
  },
  foodTypeIndicator: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 14,
    height: 14,
    borderRadius: 2,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  itemImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemEmoji: {
    fontSize: 32,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 12,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 24,
    textAlign: 'center',
  },
  removeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  summaryContainer: {
    padding: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  placeOrderButton: {
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  placeOrderText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  browseButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  browseButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
