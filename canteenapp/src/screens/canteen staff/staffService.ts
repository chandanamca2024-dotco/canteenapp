import { supabase } from '../../lib/supabase';
import { Alert } from 'react-native';

/**
 * Staff Service Module
 * Handles all API calls for canteen staff operations
 */

export interface OrderItem {
  quantity: number;
  price: number;
  menu_items: {
    name: string;
    price: number;
  };
}

export interface Order {
  id: string;
  user_id: string;
  total_price: number;
  status: 'Pending' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled';
  created_at: string;
  token_number: number;
  requested_time?: string;
  userName?: string;
  userEmail?: string;
  items?: OrderItem[];
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
  stock_quantity?: number;
  description?: string;
  image_url?: string;
}

/**
 * Fetch all pending and preparing orders for canteen staff
 */
export const fetchStaffOrders = async (): Promise<Order[]> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        total_price,
        status,
        created_at,
        token_number,
        requested_time,
        profiles:user_id (
          name,
          email
        )
      `)
      .in('status', ['Pending', 'Preparing', 'Ready'])
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Fetch order items for each order
    const ordersWithItems = await Promise.all(
      (data || []).map(async (order: any) => {
        const { data: items } = await supabase
          .from('order_items')
          .select(`
            quantity,
            price,
            menu_items!inner (name, price)
          `)
          .eq('order_id', order.id);

        // Transform items to match the OrderItem interface
        const transformedItems = (items || []).map((item: any) => ({
          quantity: item.quantity,
          price: item.price,
          menu_items: Array.isArray(item.menu_items)
            ? item.menu_items[0]
            : item.menu_items,
        }));

        return {
          id: order.id,
          user_id: order.user_id,
          total_price: order.total_price,
          status: order.status,
          created_at: order.created_at,
          token_number: order.token_number,
          requested_time: order.requested_time,
          userName: order.profiles?.name || 'Guest',
          userEmail: order.profiles?.email || '',
          items: transformedItems,
        };
      })
    );

    return ordersWithItems;
  } catch (error: any) {
    console.error('Error fetching staff orders:', error);
    throw error;
  }
};

/**
 * Update order status
 */
export const updateOrderStatus = async (
  orderId: string,
  newStatus: 'Preparing' | 'Ready' | 'Completed' | 'Cancelled'
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) throw error;
  } catch (error: any) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

/**
 * Mark order as preparing
 */
export const markOrderAsPreparing = async (orderId: string): Promise<void> => {
  return updateOrderStatus(orderId, 'Preparing');
};

/**
 * Mark order as ready for pickup
 */
export const markOrderAsReady = async (orderId: string): Promise<void> => {
  return updateOrderStatus(orderId, 'Ready');
};

/**
 * Mark order as completed
 */
export const markOrderAsCompleted = async (orderId: string): Promise<void> => {
  return updateOrderStatus(orderId, 'Completed');
};

/**
 * Cancel an order
 */
export const cancelOrder = async (orderId: string): Promise<void> => {
  return updateOrderStatus(orderId, 'Cancelled');
};

/**
 * Fetch all menu items for inventory management
 */
export const fetchMenuItems = async (): Promise<MenuItem[]> => {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('category')
      .order('name');

    if (error) throw error;

    return data || [];
  } catch (error: any) {
    console.error('Error fetching menu items:', error);
    throw error;
  }
};

/**
 * Toggle menu item availability
 */
export const toggleMenuItemAvailability = async (
  itemId: string,
  currentStatus: boolean
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('menu_items')
      .update({ available: !currentStatus })
      .eq('id', itemId);

    if (error) throw error;
  } catch (error: any) {
    console.error('Error toggling availability:', error);
    throw error;
  }
};

/**
 * Update menu item stock quantity
 */
export const updateStockQuantity = async (
  itemId: string,
  newQuantity: number
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('menu_items')
      .update({ stock_quantity: newQuantity })
      .eq('id', itemId);

    if (error) throw error;
  } catch (error: any) {
    console.error('Error updating stock quantity:', error);
    throw error;
  }
};

/**
 * Get order statistics for dashboard
 */
export const getOrderStats = async (): Promise<{
  total: number;
  pending: number;
  preparing: number;
  ready: number;
  completed: number;
}> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('status')
      .gte('created_at', new Date().toISOString().split('T')[0]);

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      pending: data?.filter((o) => o.status === 'Pending').length || 0,
      preparing: data?.filter((o) => o.status === 'Preparing').length || 0,
      ready: data?.filter((o) => o.status === 'Ready').length || 0,
      completed: data?.filter((o) => o.status === 'Completed').length || 0,
    };

    return stats;
  } catch (error: any) {
    console.error('Error fetching order stats:', error);
    throw error;
  }
};

/**
 * Get staff profile information
 */
export const getStaffProfile = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;

    return data;
  } catch (error: any) {
    console.error('Error fetching staff profile:', error);
    throw error;
  }
};

/**
 * Check if user has staff role
 */
export const verifyStaffRole = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error) throw error;

    return data?.role === 'canteen staff' || data?.role === 'admin';
  } catch (error: any) {
    console.error('Error verifying staff role:', error);
    return false;
  }
};

/**
 * Subscribe to real-time order updates
 */
export const subscribeToOrders = (callback: () => void) => {
  const subscription = supabase
    .channel('staff_orders_channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders' },
      (payload) => {
        console.log('Order update received:', payload);
        callback();
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};

/**
 * Subscribe to real-time menu item updates
 */
export const subscribeToMenuItems = (callback: () => void) => {
  const subscription = supabase
    .channel('staff_menu_channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'menu_items' },
      (payload) => {
        console.log('Menu item update received:', payload);
        callback();
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};

export default {
  fetchStaffOrders,
  updateOrderStatus,
  markOrderAsPreparing,
  markOrderAsReady,
  markOrderAsCompleted,
  cancelOrder,
  fetchMenuItems,
  toggleMenuItemAvailability,
  updateStockQuantity,
  getOrderStats,
  getStaffProfile,
  verifyStaffRole,
  subscribeToOrders,
  subscribeToMenuItems,
};
