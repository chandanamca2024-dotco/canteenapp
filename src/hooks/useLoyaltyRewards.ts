// src/hooks/useLoyaltyRewards.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface LoyaltyData {
  id: string;
  user_id: string;
  total_points: number;
  points_earned: number;
  points_redeemed: number;
  last_earned_at?: string;
  last_redeemed_at?: string;
  created_at: string;
  updated_at: string;
}

export const useLoyaltyRewards = () => {
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLoyaltyData();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('loyalty_rewards_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loyalty_rewards',
        },
        async () => {
          // Refresh data when changes occur
          await fetchLoyaltyData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLoyaltyData = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        // If no loyalty record exists, create one
        if (fetchError.code === 'PGRST116') {
          const { data: newData, error: insertError } = await supabase
            .from('loyalty_rewards')
            .insert([
              {
                user_id: user.id,
                total_points: 0,
                points_earned: 0,
                points_redeemed: 0,
              },
            ])
            .select()
            .single();

          if (insertError) {
            console.error('Error creating loyalty record:', insertError);
            setError(insertError.message);
          } else {
            setLoyaltyData(newData);
          }
        } else {
          console.error('Error fetching loyalty data:', fetchError);
          setError(fetchError.message);
        }
      } else {
        setLoyaltyData(data);
      }
    } catch (e: any) {
      console.error('Exception in fetchLoyaltyData:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const redeemPoints = async (pointsToRedeem: number, orderId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (!loyaltyData || loyaltyData.total_points < pointsToRedeem) {
        throw new Error('Insufficient points');
      }

      const { data, error: updateError } = await supabase
        .from('loyalty_rewards')
        .update({
          total_points: loyaltyData.total_points - pointsToRedeem,
          points_redeemed: loyaltyData.points_redeemed + pointsToRedeem,
          last_redeemed_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setLoyaltyData(data);
      return true;
    } catch (e: any) {
      console.error('Error redeeming points:', e);
      setError(e.message);
      return false;
    }
  };

  const getPointsForAmount = (amount: number): number => {
    // 1 point per ₹10 spent
    return Math.floor(amount / 10);
  };

  const getDiscountValue = (points: number): number => {
    // 100 points = ₹10
    return (points / 100) * 10;
  };

  const refresh = () => {
    fetchLoyaltyData();
  };

  return {
    loyaltyData,
    loading,
    error,
    redeemPoints,
    getPointsForAmount,
    getDiscountValue,
    refresh,
  };
};
