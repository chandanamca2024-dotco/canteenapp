import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  image?: string;
  available?: boolean;
  food_type?: 'veg' | 'non-veg';
}

export const useWishlist = () => {
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('wishlist')
        .select('menu_item_id')
        .eq('user_id', user.id);

      if (error) throw error;

      const ids = (data || []).map(item => item.menu_item_id);
      setWishlistIds(ids);
    } catch (error) {
      console.error('Error loading wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const isInWishlist = (itemId: string): boolean => {
    return wishlistIds.includes(itemId);
  };

  const addToWishlist = async (item: MenuItem) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to add items to wishlist');
        return false;
      }

      // Check if already in wishlist
      if (isInWishlist(item.id)) {
        Alert.alert('Already in Wishlist', `${item.name} is already in your wishlist`);
        return false;
      }

      const { error } = await supabase
        .from('wishlist')
        .insert({
          user_id: user.id,
          menu_item_id: item.id,
        });

      if (error) throw error;

      setWishlistIds(prev => [...prev, item.id]);
      Alert.alert('Added to Wishlist', `${item.name} has been added to your wishlist`);
      return true;
    } catch (error: any) {
      console.error('Error adding to wishlist:', error);
      Alert.alert('Error', 'Failed to add item to wishlist');
      return false;
    }
  };

  const removeFromWishlist = async (itemId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', user.id)
        .eq('menu_item_id', itemId);

      if (error) throw error;

      setWishlistIds(prev => prev.filter(id => id !== itemId));
      return true;
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      return false;
    }
  };

  const toggleWishlist = async (item: MenuItem) => {
    if (isInWishlist(item.id)) {
      return await removeFromWishlist(item.id);
    } else {
      return await addToWishlist(item);
    }
  };

  return {
    wishlistIds,
    loading,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
  };
};
