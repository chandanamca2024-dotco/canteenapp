import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, TextInput, ScrollView } from 'react-native';
import { generatePDF } from 'react-native-html-to-pdf';
import { Platform, PermissionsAndroid, Linking } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { RootScreenProps } from '../../navigation/RootNavigator';
import { supabase } from '../../lib/supabase';
import { RAZORPAY_KEY_ID, RAZORPAY_CONFIG } from '../../config/razorpay';
import ScrollTimePicker, { Period } from '../../components/ScrollTimePicker';

import { clearCart as clearStoredCart } from '../../lib/cartStorage';
import { sendReceiptEmail } from '../../services/emailService';


export default function PaymentScreen({ navigation, route }: RootScreenProps<'Payment'>) {
  const { colors } = useTheme();
  const params = route?.params ?? { items: [], totalPrice: 0 };
  const { items, totalPrice, openingTime: openingTimeParam, closingTime: closingTimeParam, pickupTime: pickupTimeParam } = params;
  const defaultOpeningTime = openingTimeParam ?? '9:00 AM';
  const defaultClosingTime = closingTimeParam ?? '4:45 PM';
  const [openingTime, setOpeningTime] = useState(defaultOpeningTime);
  const [closingTime, setClosingTime] = useState(defaultClosingTime);
  const [processing, setProcessing] = useState(false);
  const [keyInput, setKeyInput] = useState(RAZORPAY_KEY_ID);
  const [razorpayAvailable, setRazorpayAvailable] = useState(false);
  const [requestedTime, setRequestedTime] = useState<Date | null>(new Date());
  const [requestedTimeText, setRequestedTimeText] = useState<string | null>(pickupTimeParam ?? null);
  const [showClockPicker, setShowClockPicker] = useState(false);
  const [hasPromptedCustomTime, setHasPromptedCustomTime] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [useCoins, setUseCoins] = useState(false);
  const [showPaymentSection, setShowPaymentSection] = useState(false);

  const normalizeTime = (value: string | null | undefined, fallback: string) => {
    if (!value) return fallback;
    const trimmed = value.trim();
    const match = trimmed.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/);
    if (!match) return fallback;
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    let period = match[3] ? match[3].toUpperCase() : '';
    if (!period) {
      if (hours === 0) {
        hours = 12;
        period = 'AM';
      } else if (hours === 12) {
        period = 'PM';
      } else if (hours > 12) {
        hours -= 12;
        period = 'PM';
      } else {
        period = 'AM';
      }
    } else if (hours === 0) {
      hours = 12;
    }
    return `${hours}:${minutes} ${period}`;
  };

  const redeemablePoints = Math.min(5, loyaltyPoints);
  const appliedPoints = useCoins ? redeemablePoints : 0;
  const discountAmount = appliedPoints;
  const payableTotal = Math.max(totalPrice - discountAmount, 0);


  // Helper to open/view PDF (must be in component scope)
  const openPDF = (pdfPath: string | null) => {
    if (!pdfPath) return;
    (async () => {
      try {
        if (Platform.OS === 'android') {
          const FileViewer = require('react-native-file-viewer').default;
          await FileViewer.open(pdfPath);
        } else {
          // iOS: use Linking
          await Linking.openURL(pdfPath);
        }
      } catch (err) {
        Alert.alert('Open PDF Error', 'Could not open the PDF file.');
      }
    })();
  };

  // Helper to generate PDF receipt (optional - skipped if permission denied)
  const generatePDFReceipt = async (order: any) => {
    try {
      // Android: request write permission
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'App needs access to storage to save your receipt PDF.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('PDF receipt skipped: permission denied');
          return; // Silently skip, don't block order completion
        }
      }

      const htmlContent = `
        <h1>DineDesk Order Receipt</h1>
        <p><strong>Order ID:</strong> ${order.id}</p>
        <p><strong>Date:</strong> ${order.timestamp}</p>
        <p><strong>Status:</strong> ${order.status}</p>
        <h2>Items</h2>
        <ul>
          ${order.items.map((item: any) => `<li>${item.name} x${item.quantity} - ₹${item.price * item.quantity}</li>`).join('')}
        </ul>
        <h3>Total: ₹${order.totalPrice}</h3>
      `;

      const options = {
        html: htmlContent,
        fileName: `DineDesk_Receipt_${order.id}`,
        directory: 'Documents',
      };
      
      const file = await generatePDF(options);
      setPdfPath(file.filePath || null);
      setShowReceipt(true);
    } catch (err) {
      console.log('PDF generation skipped:', err);
      // Don't show error alert, just skip PDF generation
    }
  };

  useEffect(() => {
    // Check if Razorpay SDK is available
    try {
      const RazorpayCheckout = require('react-native-razorpay').default;
      if (RazorpayCheckout && typeof RazorpayCheckout.open === 'function') {
        setRazorpayAvailable(true);
        console.log('✅ Razorpay SDK is available');
      }
    } catch (e) {
      console.log('⚠️ Razorpay SDK not available, using mock payment only');
      setRazorpayAvailable(false);
    }
  }, []);

  useEffect(() => {
    const fetchBusinessHours = async () => {
      const { data, error } = await supabase
        .from('business_settings')
        .select('opening_time, closing_time')
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setOpeningTime(normalizeTime(data.opening_time, defaultOpeningTime));
        setClosingTime(normalizeTime(data.closing_time, defaultClosingTime));
      }
    };

    fetchBusinessHours();
  }, []);

  useEffect(() => {
    const fetchLoyaltyPoints = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoyaltyPoints(0);
          return;
        }
        const { data, error } = await supabase
          .from('loyalty_rewards')
          .select('total_points')
          .eq('user_id', user.id)
          .maybeSingle();
        if (error) throw error;
        setLoyaltyPoints(data?.total_points ?? 0);
      } catch {
        setLoyaltyPoints(0);
      }
    };

    fetchLoyaltyPoints();
  }, []);

  // One-time auth status check to guide UI
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setIsLoggedIn(!!user);
      } catch {
        setIsLoggedIn(false);
      }
    })();
  }, []);

  const getStartOfTodayUTC = () => {
    // Get today's date in UTC timezone
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00Z`;
  };

  const awardLoyaltyPoints = async (userId: string, amount: number) => {
    const points = Math.floor(amount / 250) * 10;
    if (points <= 0) return;
    try {
      const { data, error } = await supabase
        .from('loyalty_rewards')
        .select('total_points, points_earned')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        await supabase
          .from('loyalty_rewards')
          .insert({
            user_id: userId,
            total_points: points,
            points_earned: points,
            points_redeemed: 0,
          });
        return;
      }

      const nextTotal = (data.total_points || 0) + points;
      const nextEarned = (data.points_earned || 0) + points;

      await supabase
        .from('loyalty_rewards')
        .update({
          total_points: nextTotal,
          points_earned: nextEarned,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    } catch (err) {
      console.log('Loyalty rewards update skipped:', err);
    }
  };

  const redeemLoyaltyPoints = async (userId: string, pointsToRedeem: number) => {
    if (pointsToRedeem <= 0) return;
    try {
      const { data, error } = await supabase
        .from('loyalty_rewards')
        .select('total_points, points_redeemed')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      if (!data || (data.total_points || 0) < pointsToRedeem) return;

      await supabase
        .from('loyalty_rewards')
        .update({
          total_points: (data.total_points || 0) - pointsToRedeem,
          points_redeemed: (data.points_redeemed || 0) + pointsToRedeem,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    } catch (err) {
      console.log('Loyalty redemption skipped:', err);
    }
  };

  const createOrderAfterPayment = async (userId: string, paymentId: string, rt: Date | null, userEmail: string, paymentMethod: 'razorpay' | 'wallet' | 'upi' | 'card' = 'razorpay') => {
    try {
      // Store the exact time string the user selected to avoid any shifts
      const requestedTimeString = requestedTimeText ?? (rt ? formatDisplayTime(rt) : null);

      // Let the database trigger assign the unique token number
      // DO NOT manually calculate the token - this causes race conditions
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          total_price: payableTotal,
          status: 'Paid',
          // token_number is automatically assigned by the database trigger
          payment_id: paymentId,
          requested_time: requestedTimeString,
        })
        .select('id, created_at, token_number')
        .single();
      if (orderError || !orderData) {
        console.error('Order creation error:', orderError);
        throw orderError || new Error('Order creation failed');
      }

      const orderItems = items.map((i: any) => ({ 
        order_id: orderData.id, 
        menu_item_id: i.id, 
        quantity: i.quantity 
      }));
      
      console.log('📦 Inserting order items:', orderItems);
      
      const { error: itemsError, data: itemsData } = await supabase
        .from('order_items')
        .insert(orderItems)
        .select('id, order_id, menu_item_id, quantity');
      
      if (itemsError) {
        console.error('❌ Order items error:', itemsError);
        throw itemsError;
      }
      
      console.log('✅ Order items saved:', itemsData);

      // Create transaction record
      try {
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            order_id: orderData.id,
            user_id: userId,
            amount: payableTotal,
            payment_status: 'completed',
            payment_method: paymentMethod,
            payment_id: paymentId,
          });
        
        if (transactionError) {
          console.error('❌ Transaction record error:', transactionError);
        } else {
          console.log('💳 Transaction record created successfully');
        }
      } catch (txErr) {
        console.error('Transaction creation failed:', txErr);
      }

      // Remove ordered items from wishlist for this user
      try {
        const orderedIds = items.map((i: any) => i.id);
        if (orderedIds.length > 0) {
          await supabase
            .from('wishlist')
            .delete()
            .eq('user_id', userId)
            .in('menu_item_id', orderedIds);
          console.log('🧹 Removed ordered items from wishlist:', orderedIds);
        }
      } catch (wErr) {
        console.log('Wishlist cleanup skipped:', wErr);
      }

      // Promote frequently ordered items to favorites (threshold: 3 orders)
      try {
        const { data: userOrderRows } = await supabase
          .from('orders')
          .select('id')
          .eq('user_id', userId);
        const userOrderIds = (userOrderRows || []).map((r: any) => r.id);
        for (const i of items) {
          if (userOrderIds.length === 0) continue;
          const { data: _rows, count } = await supabase
            .from('order_items')
            .select('id, menu_item_id', { count: 'exact' })
            .in('order_id', userOrderIds)
            .eq('menu_item_id', i.id);
          const timesOrdered = count || 0;
          if (timesOrdered >= 3) {
            // If not already in favorites, add it
            const { data: favExists } = await supabase
              .from('favorites')
              .select('id')
              .eq('user_id', userId)
              .eq('menu_item_id', i.id)
              .limit(1);
            if (!favExists || favExists.length === 0) {
              await supabase
                .from('favorites')
                .insert({ user_id: userId, menu_item_id: i.id });
              console.log('⭐ Promoted to favorites:', i.name);
            }
          }
        }
      } catch (favErr) {
        console.log('Favorites promotion skipped:', favErr);
      }

      if (useCoins && appliedPoints > 0) {
        await redeemLoyaltyPoints(userId, appliedPoints);
      }
      await awardLoyaltyPoints(userId, payableTotal);

      const newOrder = {
        id: orderData.id,
        items: items.map((i: any) => ({ ...i })),
        totalPrice,
        status: 'Pending',
        timestamp: orderData.created_at ? new Date(orderData.created_at).toLocaleString() : new Date().toLocaleString(),
        tokenNumber: orderData.token_number,
      };

      // Send receipt email using the correct utility
      try {
        await sendReceiptEmail({
          userEmail: userEmail,
          userName: userEmail.split('@')[0],
          order: {
            id: newOrder.id,
            tokenNumber: newOrder.tokenNumber,
            timestamp: newOrder.timestamp,
            status: newOrder.status,
            items: newOrder.items,
            totalPrice: newOrder.totalPrice,
          },
        });
      } catch (emailErr) {
        console.error('Failed to send receipt email:', emailErr);
      }

      // 🧹 Clear cart immediately (both storage and will be reset in UserDashboard)
      await clearStoredCart().catch(() => {});

      // Navigate to Receipt screen with clearCart flag for safety
      navigation.replace('Receipt', { order: newOrder, clearCart: true });

      // Also navigate to Token screen to show token number
      setTimeout(() => {
        navigation.navigate('OrderToken', {
          orderId: newOrder.id,
          tokenNumber: newOrder.tokenNumber,
          newOrder,
          clearCart: true,
        });
      }, 500);
    } catch (e: any) {
      console.error('Order creation error:', e);
      Alert.alert('Error', e?.message || 'Failed to create order');
      setProcessing(false);
    }
  };


  const formatDisplayTime = (d: Date) => {
    try {
      return d.toLocaleString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return d.toLocaleTimeString();
    }
  };

  const selectQuickOffset = (minutes: number) => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + minutes);
    setRequestedTime(d);
    setRequestedTimeText(formatDisplayTime(d));
  };

  const openTimePicker = () => {
    setShowClockPicker(true);
  };

  const handleRazorpayPayment = async () => {
    if (!keyInput.trim()) {
      Alert.alert('Error', 'Please enter your Razorpay test key');
      return;
    }

    if (!razorpayAvailable) {
      Alert.alert('SDK Not Available', 'Using test payment instead');
      handleMockPayment();
      return;
    }

    try {
      setProcessing(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in');
        setProcessing(false);
        return;
      }

      const RazorpayCheckout = require('react-native-razorpay').default;

      const options = {
        description: 'DineDesk Payment',
        currency: 'INR',
        key: keyInput.trim(),
        amount: payableTotal * 100,
        name: 'DineDesk',
        prefill: {
          email: user.email || 'user@dinedesk.com',
          contact: '9999999999',
        },
      };

      RazorpayCheckout.open(options)
        .then(async (data: any) => {
          console.log('✅ Payment Success:', data);
          await createOrderAfterPayment(
            user.id,
            data.razorpay_payment_id || `rzp_${Date.now()}`,
            requestedTime,
            user.email || 'user@dinedesk.com',
            'razorpay',
          );
        })
        .catch((error: any) => {
          console.error('Payment Error:', error);
          Alert.alert('Payment Failed', 'Please try again');
          setProcessing(false);
        });
    } catch (e: any) {
      console.error('Error:', e);
      Alert.alert('Error', e?.message || 'Payment failed');
      setProcessing(false);
    }
  };

  const handleMockPayment = async () => {
    try {
      setProcessing(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in');
        setProcessing(false);
        return;
      }
      // Simulate payment
      await new Promise((r) => setTimeout(r, 1200));
      await createOrderAfterPayment(user.id, `mock_payment_${Date.now()}`, requestedTime, user.email || 'user@dinedesk.com', 'razorpay');
    } catch (e: any) {
      console.error('Mock payment error:', e);
      Alert.alert('Error', e?.message || 'Payment failed');
      setProcessing(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header with Amount */}
      <View style={{
        backgroundColor: '#ffffff',
        paddingTop: 50,
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: '#9ca3af', fontSize: 14, fontWeight: '600', letterSpacing: 1, marginBottom: 8 }}>TOTAL AMOUNT</Text>
          <Text style={{ color: '#1f2937', fontSize: 56, fontWeight: '900', letterSpacing: -2 }}>₹{totalPrice}</Text>
          <View style={{
            backgroundColor: '#f3f4f6',
            paddingHorizontal: 16,
            paddingVertical: 6,
            borderRadius: 20,
            marginTop: 12,
          }}>
            <Text style={{ color: '#6b7280', fontSize: 13, fontWeight: '600' }}>{items.length} {items.length === 1 ? 'item' : 'items'}</Text>
          </View>
        </View>
      </View>

      <View style={{ padding: 20 }}>
        {/* Login requirement banner */}
        {isLoggedIn === false && (
          <View style={{
            backgroundColor: '#fef3c7',
            borderLeftWidth: 4,
            borderLeftColor: '#f59e0b',
            marginBottom: 20,
            padding: 16,
            borderRadius: 12,
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
          }}>
            <Text style={{ color: '#92400e', marginBottom: 12, fontSize: 14, fontWeight: '600' }}>⚠️ Login Required</Text>
            <Text style={{ color: '#78350f', marginBottom: 14, fontSize: 13 }}>You must be logged in to complete your payment.</Text>
            <TouchableOpacity onPress={() => navigation.replace('Login')} style={{
              alignSelf: 'flex-start',
              backgroundColor: '#f59e0b',
              paddingVertical: 10,
              paddingHorizontal: 20,
              borderRadius: 8,
              elevation: 2,
            }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Go to Login</Text>
            </TouchableOpacity>
          </View>
        )}
        {/* PDF Receipt Download/View Button */}
        {showReceipt && pdfPath && (
          <TouchableOpacity
            style={{
              backgroundColor: colors.primary,
              padding: 16,
              borderRadius: 12,
              alignItems: 'center',
              marginBottom: 20,
              elevation: 3,
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 10,
            }}
            onPress={() => openPDF(pdfPath)}
          >
            <Text style={{ fontSize: 24 }}>📄</Text>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Download Receipt PDF</Text>
          </TouchableOpacity>
        )}

        {/* Preferred Pickup Time Card */}
        <View style={{
          backgroundColor: '#ffffff',
          borderRadius: 20,
          padding: 20,
          marginBottom: 24,
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          borderWidth: 1,
          borderColor: '#f0f0f0',
        }}>
          <Text style={{ color: '#1f2937', fontWeight: '700', marginBottom: 6, fontSize: 18 }}>Preferred Pickup Time</Text>
          <Text style={{ color: '#9ca3af', marginBottom: 16, fontSize: 13, lineHeight: 18 }}>
            Select when you want to pick up your order.
          </Text>

          {/* Quick Time Slots */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            {[{ label: '+15m', min: 15, icon: '🕐' }, { label: '+30m', min: 30, icon: '🕑' }, { label: '+45m', min: 45, icon: '🕒' }].map((opt) => (
              <TouchableOpacity
                key={opt.label}
                disabled={processing}
                onPress={() => selectQuickOffset(opt.min)}
                style={{
                  flex: 1,
                  minWidth: 70,
                  backgroundColor: '#f9fafb',
                  borderColor: '#e5e7eb',
                  borderWidth: 1.5,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  opacity: processing ? 0.6 : 1,
                  alignItems: 'center',
                  elevation: 1,
                }}
              >
                <Text style={{ fontSize: 20, marginBottom: 4 }}>{opt.icon}</Text>
                <Text style={{ color: '#374151', fontWeight: '700', fontSize: 14 }}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Time Button */}
          <TouchableOpacity
            disabled={processing}
            onPress={openTimePicker}
            style={{
              backgroundColor: colors.primary,
              paddingVertical: 14,
              paddingHorizontal: 20,
              borderRadius: 12,
              opacity: processing ? 0.6 : 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              elevation: 3,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.3,
              shadowRadius: 5,
            }}
          >
            <Text style={{ fontSize: 22 }}>🕒</Text>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Select Custom Time</Text>
          </TouchableOpacity>

          {/* Selected Time Display */}
          <View style={{
            marginTop: 16,
            backgroundColor: '#f0fdf4',
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: '#bbf7d0',
          }}>
            <Text style={{ color: '#15803d', fontSize: 13, fontWeight: '600', textAlign: 'center' }}>
              ⏰ Selected: {requestedTimeText ?? (requestedTime ? formatDisplayTime(requestedTime) : 'ASAP')}
            </Text>
          </View>
        </View>

        {!showPaymentSection && (
          <TouchableOpacity
            onPress={() => setShowPaymentSection(true)}
            disabled={processing}
            style={{
              borderRadius: 16,
              marginBottom: 20,
              elevation: 6,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 10,
              opacity: processing ? 0.6 : 1,
            }}
          >
            <LinearGradient
              colors={[colors.primary, '#6366f1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 18,
                paddingHorizontal: 24,
                borderRadius: 16,
                alignItems: 'center',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 20 }}>🚀</Text>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 17, letterSpacing: 0.5 }}>Continue to Payment</Text>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18 }}>→</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {showPaymentSection && (
          <>
            {/* Back Button */}
            <TouchableOpacity
              onPress={() => setShowPaymentSection(false)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16,
                paddingVertical: 8,
              }}
            >
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 16 }}>← Back to Time Selection</Text>
            </TouchableOpacity>

            {/* Order Items */}
            <View style={{
              backgroundColor: '#ffffff',
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: '#f0f0f0',
            }}>
              <Text style={{ color: '#1f2937', fontWeight: '700', fontSize: 16, marginBottom: 12 }}>Order Summary</Text>
              {items.map((item: any, index: number) => (
                <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#374151', fontWeight: '600', fontSize: 14 }}>{item.name}</Text>
                    <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 2 }}>Qty: {item.quantity}</Text>
                  </View>
                  <Text style={{ color: '#1f2937', fontWeight: '700', fontSize: 14 }}>₹{item.price * item.quantity}</Text>
                </View>
              ))}
              <View style={{ borderTopWidth: 1, borderTopColor: '#e5e7eb', marginTop: 8, paddingTop: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: '#1f2937', fontWeight: '700', fontSize: 16 }}>Total</Text>
                  <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 18 }}>₹{totalPrice}</Text>
                </View>
              </View>
            </View>

        {/* Loyalty Coins */}
        <View style={{
          backgroundColor: '#ffffff',
          borderRadius: 16,
          padding: 16,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: '#f0f0f0',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ color: '#1f2937', fontWeight: '700', fontSize: 16 }}>Use SuperCoins</Text>
              <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>
                Available: {loyaltyPoints} • Max 5 coins per order
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setUseCoins(!useCoins)}
              disabled={redeemablePoints === 0}
              style={{
                height: 32,
                width: 64,
                borderRadius: 16,
                backgroundColor: useCoins ? colors.primary : '#e5e7eb',
                padding: 3,
                opacity: redeemablePoints === 0 ? 0.5 : 1,
              }}
            >
              <View style={{
                height: 26,
                width: 26,
                borderRadius: 13,
                backgroundColor: '#ffffff',
                transform: [{ translateX: useCoins ? 32 : 0 }],
              }} />
            </TouchableOpacity>
          </View>
          {useCoins && appliedPoints > 0 && (
            <View style={{ marginTop: 10 }}>
              <Text style={{ color: '#10b981', fontWeight: '600', fontSize: 12 }}>
                Applied {appliedPoints} SuperCoins • Discount ₹{discountAmount}
              </Text>
            </View>
          )}
        </View>

        {/* Payment Button */}
        <TouchableOpacity
          disabled={processing || isLoggedIn === false}
          onPress={handleRazorpayPayment}
          style={{
            borderRadius: 16,
            marginBottom: 20,
            opacity: processing ? 0.6 : 1,
            elevation: isLoggedIn === false ? 0 : 8,
            shadowColor: isLoggedIn === false ? 'transparent' : colors.primary,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.5,
            shadowRadius: 12,
          }}
        >
          <LinearGradient
            colors={isLoggedIn === false ? ['#d1d5db', '#d1d5db'] : [colors.primary, '#6366f1', '#8b5cf6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              paddingVertical: 20,
              paddingHorizontal: 24,
              borderRadius: 16,
              alignItems: 'center',
            }}
          >
          {processing ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 17, letterSpacing: 0.5 }}>Processing...</Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 26 }}>💳</Text>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18, letterSpacing: 0.5 }}>Pay ₹{payableTotal}</Text>
              <Text style={{ fontSize: 20 }}>✨</Text>
            </View>
          )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Security Badge */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: 12,
        }}>
          <Text style={{ fontSize: 16 }}>🔒</Text>
          <Text style={{ color: '#9ca3af', fontSize: 12, fontWeight: '600' }}>Secure Payment Gateway</Text>
        </View>
          </>
        )}
      </View>

      <ScrollTimePicker
        visible={showClockPicker}
        colors={colors}
        openingTime={openingTime}
        closingTime={closingTime}
        initialHour={(requestedTime || new Date()).getHours() % 12 || 12}
        initialMinute={(requestedTime || new Date()).getMinutes()}
        initialPeriod={(requestedTime || new Date()).getHours() >= 12 ? 'PM' : 'AM'}
        onCancel={() => setShowClockPicker(false)}
        onConfirm={(hour12: number, minute: number, period: Period) => {
          const now = new Date();
          let hours24 = hour12 % 12;
          hours24 = period === 'PM' ? hours24 + 12 : hours24;
          const picked = new Date(now);
          picked.setHours(hours24, minute, 0, 0);
          if (picked.getTime() < now.getTime()) {
            picked.setDate(picked.getDate() + 1);
          }
          setRequestedTime(picked);
          const timeText = `${hour12.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${period}`;
          setRequestedTimeText(timeText);
          setShowClockPicker(false);
          Alert.alert('Time selected', `Pickup at ${timeText}`);
        }}
      />
    </ScrollView>
  );
}

// Using ScrollTimePicker for modern time selection
