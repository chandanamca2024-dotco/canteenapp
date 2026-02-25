import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import { Buffer } from 'buffer';
import { styles } from './styles';
import { supabase } from '../../lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string;
  created_at: string;
  role?: string;
  loyalty_points?: number;
}

export function ProfileTab({ colors, logout, openDrawer, walletBalance, orders }: { colors: any; logout: () => void; openDrawer?: () => void; walletBalance?: number; orders?: any[] }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [supercoinsBalance, setSupercoinsBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch user profile from database
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileData) {
          setAvatarUrl(profileData.avatar_url ?? null);
          // If phone missing in profile but present in auth metadata (from registration), persist it
          const regPhone = (user.user_metadata as any)?.phone || '';
          if (!profileData.phone && regPhone) {
            try {
              await supabase.from('profiles').update({ phone: regPhone }).eq('id', user.id);
              profileData.phone = regPhone;
            } catch {}
          }
          setUserProfile(profileData);
        } else {
          setAvatarUrl(null);
        }

        // Fetch wishlist count (for Favorites stat)
        const { data: wishlistData } = await supabase
          .from('wishlist')
          .select('id')
          .eq('user_id', user.id);

        setFavoriteCount(wishlistData?.length || 0);

        // Fetch orders for this user (scoped by user_id). Normalize for UI.
        const { data: myOrders } = await supabase
          .from('orders')
          .select('id,status,total_price,created_at,token_number')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        const normalized = (myOrders || []).map((o: any) => ({
          id: o.id,
          status: o.status,
          totalPrice: Number(o.total_price || 0),
          created_at: o.created_at,
          tokenNumber: o.token_number,
          items: [] as any[],
          itemCount: 0 as number,
        }));
        // Fetch item counts for these orders
        const orderIds = normalized.map((o: any) => o.id);
        if (orderIds.length > 0) {
          const { data: orderItemsRows } = await supabase
            .from('order_items')
            .select('order_id')
            .in('order_id', orderIds);
          const counts = new Map<string, number>();
          (orderItemsRows || []).forEach((r: any) => {
            counts.set(r.order_id, (counts.get(r.order_id) || 0) + 1);
          });
          normalized.forEach((o: any) => {
            o.itemCount = counts.get(o.id) || 0;
          });
        }
        setUserOrders(normalized);

        // Loyalty points (SuperCoins): 10 coins for every full ₹250 spent
        const totalSpent = (myOrders || []).reduce((sum: number, order: any) => sum + (order.total_price || 0), 0);
        const coins = Math.floor(totalSpent / 250) * 10;
        setSupercoinsBalance(coins);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();

    // Realtime subscription for user's orders to reflect status changes instantly
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const channel = supabase
        .channel('user-orders')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`
        }, () => {
          // Refresh orders on any change
          fetchUserProfile();
        })
        .subscribe();

      return () => {
        try { supabase.removeChannel(channel); } catch {}
      };
    };

    const teardown = setupRealtime();
    return () => {
      // Cleanup subscription on unmount
      if (typeof teardown === 'function') {
        try { (teardown as any)(); } catch {}
      }
    };
  }, []);

  const handleEditProfile = () => {
    console.log('Edit Profile button pressed');
    if (userProfile) {
      setEditName(userProfile.name);
      setEditPhone(userProfile.phone);
      setShowEditModal(true);
      console.log('setShowEditModal(true) called');
    } else {
      console.log('userProfile is null');
    }
    setTimeout(() => {
      console.log('showEditModal state:', showEditModal);
    }, 500);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    setEditLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editName,
          phone: editPhone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userProfile?.id);

      if (error) throw error;

      setUserProfile({
        ...userProfile!,
        name: editName,
        phone: editPhone,
      });
      
      Alert.alert('Success', '✅ Profile updated successfully!');
      setShowEditModal(false);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to update profile');
    } finally {
      setEditLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel'
        },
        {
          text: 'Logout',
          onPress: logout,
          style: 'destructive'
        }
      ]
    );
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword || !currentPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      Alert.alert('Success', '✅ Password changed successfully!');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Render immediately without blocking loader; data hydrates when ready

  const formattedEmail = userProfile?.email || 'user@example.com';
  const displayName = userProfile?.name || 'User';
  const displayPhone = userProfile?.phone || 'Not added';
  const activeOrders = userOrders.filter(o => o.status !== 'Completed');
  const completedOrders = userOrders.filter(o => o.status === 'Completed');
  const ordersCount = userOrders.length;

  // Avatar upload handler using react-native-image-picker and Supabase Storage
  const handlePickAvatar = () => {
    const options = {
      mediaType: 'photo' as const,
      maxWidth: 400,
      maxHeight: 400,
      includeBase64: false,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
        return;
      }

      if (response.errorCode) {
        Alert.alert('Error', response.errorMessage || 'Failed to pick image');
        return;
      }

      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        if (!asset.uri) {
          Alert.alert('Error', 'Could not get image data.');
          return;
        }

        // Call upload function
        uploadAvatar(asset);
      }
    });
  };

  // Separate upload function
  const uploadAvatar = async (asset: any) => {
    setAvatarUploading(true);
    try {
      // Generate a unique filename
      const fileExt = asset.fileName?.split('.').pop() || 'jpg';
      const fileName = `avatar_${userProfile?.id || 'user'}_${Date.now()}.${fileExt}`;
      
      // Use FormData for file upload (works better in React Native)
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: fileName,
      } as any);

      // Upload to Supabase Storage using FormData
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, formData, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.error('Storage upload error:', error);
        throw error;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      const publicUrl = publicUrlData?.publicUrl;
      
      if (!publicUrl) {
        throw new Error('Could not get public URL');
      }

      setAvatarUrl(publicUrl);
      
      // Update in supabase profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userProfile?.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw updateError;
      }

      Alert.alert('Success', 'Profile picture updated successfully!');
    } catch (e: any) {
      console.error('Avatar upload error:', e);
      Alert.alert(
        'Upload Failed', 
        e?.message || 'Failed to upload profile picture. Please try again.'
      );
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.content}>
        <View>
          <View style={[styles.header]}>
            <View style={styles.headerTop}>
              <TouchableOpacity
                style={[styles.menuButton, { backgroundColor: colors.primary }]}
                onPress={() => openDrawer && openDrawer()}
              >
                <Icon name="menu" size={24} color={colors.text} style={styles.menuIcon} />
              </TouchableOpacity>
              {/* Removed logout button from header */}
            </View>
                  {/* Date Joined info */}
                  <View style={{ marginBottom: 8, alignItems: 'center' }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                      Date Joined: {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : '—'}
                    </Text>
                  </View>
          </View>
          <View style={[styles.profileCardModern, {
            marginTop: -20,
            backgroundColor: '#F8FAFF',
            borderRadius: 24,
            padding: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 16,
            elevation: 8,
          }]}> 
            <TouchableOpacity onPress={handlePickAvatar} style={styles.profileAvatarModern}>
              {avatarUploading ? (
                <ActivityIndicator color="#4F46E5" />
              ) : avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.profileAvatarImageModern as any} />
              ) : (
                <Icon name="account-circle" size={64} color={colors.primary} style={styles.profileAvatarTextModern} />
              )}
              <View style={styles.profileAvatarEditBadge}><Icon name="pencil" size={18} color={colors.primary} style={styles.profileAvatarEditIcon} /></View>
            </TouchableOpacity>
            <Text style={[styles.profileNameModern, { backgroundColor: 'transparent' }]}>{displayName}</Text>
            <Text style={[styles.profileEmailModern, { backgroundColor: 'transparent' }]}>{formattedEmail}</Text>
            <Text style={[styles.profilePhoneModern, { backgroundColor: 'transparent' }]}>{displayPhone}</Text>
            {userProfile?.role && (
              <View style={[styles.roleBadgeModern, { backgroundColor: 'transparent' }]}> 
                <Text style={[styles.roleBadgeTextModern, { backgroundColor: 'transparent' }]}> 
                  {userProfile.role === 'Staff' ? 'College Staff' : userProfile.role === 'Student' ? 'Student' : userProfile.role}
                </Text>
              </View>
            )}
            <View style={styles.profileStatsRowModern}>
              <View style={styles.profileStatModern}>
                <Text style={styles.profileStatValueModern}>{ordersCount}</Text>
                <Text style={styles.profileStatLabelModern}>Orders</Text>
              </View>
              <View style={styles.profileStatModern}>
                <Text style={styles.profileStatValueModern}>{supercoinsBalance}</Text>
                <Text style={styles.profileStatLabelModern}>Loyalty Points</Text>
              </View>
              <View style={styles.profileStatModern}>
                <Text style={styles.profileStatValueModern}>{favoriteCount}</Text>
                <Text style={styles.profileStatLabelModern}>Favorites</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.editProfileBtnModern} onPress={handleEditProfile}>
              <Text style={styles.editProfileBtnTextModern}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.editProfileBtnModern} onPress={() => setShowPasswordModal(true)}>
              <Text style={styles.editProfileBtnTextModern}>Change Password</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 4 }]}>Active Orders</Text>
          <Text style={[{ color: colors.textSecondary, fontSize: 12, marginBottom: 12 }]}>Pending, Preparing, Ready</Text>
          {activeOrders && activeOrders.length > 0 ? (
            activeOrders.map((order) => (
              <View
                key={order.id}
                style={[{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 10,
                  borderLeftWidth: 4,
                  borderLeftColor: order.status === 'Ready' ? colors.primary : order.status === 'Preparing' ? colors.warning : colors.border
                }]}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={[{ color: colors.text, fontWeight: '600' as const, fontSize: 14 }]}>Token #{order.tokenNumber ?? '—'}</Text>
                  <Text style={[{ color: colors.textSecondary, fontSize: 11, backgroundColor: colors.primary + '15', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }]}>{order.status}</Text>
                </View>
                <Text style={[{ color: colors.textSecondary, fontSize: 12, marginBottom: 4 }]}>
                  {(order.itemCount ?? (order.items?.length || 0))} items • ₹{order.totalPrice || 0}
                </Text>
                <Text style={[{ color: colors.textSecondary, fontSize: 11 }]}>
                  {new Date(order.created_at).toLocaleString()}
                </Text>
              </View>
            ))
          ) : (
            <View style={[{ backgroundColor: colors.surface, borderRadius: 12, padding: 20, alignItems: 'center' }]}> 
              <Text style={[{ color: colors.textSecondary, fontSize: 14 }]}>No active orders</Text>
            </View>
          )}
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 4 }]}>Order History</Text>
          <Text style={[{ color: colors.textSecondary, fontSize: 12, marginBottom: 12 }]}>Orders linked to {formattedEmail}</Text>
          {completedOrders && completedOrders.length > 0 ? (
            completedOrders.slice(0, 5).map((order, idx) => (
              <View
                key={order.id || idx}
                style={[{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 10,
                  borderLeftWidth: 4,
                  borderLeftColor: order.status === 'Completed' ? colors.success : order.status === 'Ready' ? colors.primary : colors.warning
                }]}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={[{ color: colors.text, fontWeight: '600' as const, fontSize: 14 }]}>Order #{order.id?.slice(-6) || 'Unknown'}</Text>
                  <Text style={[{ color: colors.textSecondary, fontSize: 11, backgroundColor: colors.primary + '15', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }]}>{order.status || 'Pending'}</Text>
                </View>
                <Text style={[{ color: colors.textSecondary, fontSize: 12, marginBottom: 4 }]}> {(order.itemCount ?? (order.items?.length || 0))} items • ₹{order.totalPrice || 0} </Text>
                <Text style={[{ color: colors.textSecondary, fontSize: 11 }]}> {order.timestamp || new Date(order.created_at).toLocaleDateString()} </Text>
              </View>
            ))
          ) : (
            <View style={[{ backgroundColor: colors.surface, borderRadius: 12, padding: 20, alignItems: 'center' }]}> <Text style={[{ color: colors.textSecondary, fontSize: 14 }]}>No orders yet</Text> </View>
          )}
        </View>
        <View style={[styles.section, { marginBottom: 30 }]}>
          <TouchableOpacity
            style={[styles.logoutBtn2, { backgroundColor: colors.danger, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}
            onPress={handleLogout}
          >
            <Icon name="logout" size={24} color="#fff" style={{ marginRight: 10 }} />
            <Text style={[styles.logoutBtnText, { fontSize: 16, fontWeight: '600' as const, color: '#fff' }]}>Logout</Text>
          </TouchableOpacity>
        </View>
        {/* Password Change Modal */}
        <Modal
          visible={showPasswordModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPasswordModal(false)}
        >
          <View style={{
            flex: 1,
            backgroundColor: colors.background,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <View style={{
              backgroundColor: '#F8FAFF',
              borderRadius: 24,
              padding: 28,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 16,
              elevation: 8,
              width: '90%',
              maxWidth: 400,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Text style={[{ color: colors.text, fontSize: 20, fontWeight: '700' as const }]}>Change Password</Text>
                <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                  <Text style={[{ color: colors.textSecondary, fontSize: 24 }]}>✕</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 12,
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.border
                }]}
                placeholder="Current Password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />
              <TextInput
                style={[{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 12,
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.border
                }]}
                placeholder="New Password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TextInput
                style={[{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 20,
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.border
                }]}
                placeholder="Confirm New Password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity
                style={[{
                  backgroundColor: colors.primary,
                  borderRadius: 12,
                  padding: 16,
                  alignItems: 'center',
                  marginBottom: 10,
                  opacity: passwordLoading ? 0.6 : 1
                }]}
                onPress={handleChangePassword}
                disabled={passwordLoading}
              >
                {passwordLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[{ color: '#fff', fontWeight: '600' as const, fontSize: 16 }]}>Update Password</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 16,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: colors.border
                }]}
                onPress={() => setShowPasswordModal(false)}
              >
                <Text style={[{ color: colors.text, fontWeight: '600' as const, fontSize: 16 }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {/* Edit Profile Modal */}
        <Modal
          visible={showEditModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowEditModal(false)}
        >
          <View style={styles.editModalOverlayModern}>
            <View style={styles.editModalCardModern}>
              <View style={styles.editModalHeaderModern}>
                <Text style={styles.editModalTitleModern}>Edit Profile</Text>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <Text style={styles.editModalCloseModern}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.editModalLabelModern}>Full Name</Text>
              <TextInput
                style={styles.editModalInputModern}
                placeholder="Enter your name"
                placeholderTextColor="#A0AEC0"
                value={editName}
                onChangeText={setEditName}
              />
              <Text style={styles.editModalLabelModern}>Phone Number</Text>
              <TextInput
                style={styles.editModalInputModern}
                placeholder="Enter your phone"
                placeholderTextColor="#A0AEC0"
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
              />
              <TouchableOpacity
                style={[styles.editModalSaveBtnModern, editLoading && { opacity: 0.6 }]}
                onPress={handleSaveProfile}
                disabled={editLoading}
              >
                {editLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.editModalSaveBtnTextModern}>Save Changes</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.editModalCancelBtnModern}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.editModalCancelBtnTextModern}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}
