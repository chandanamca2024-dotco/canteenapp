import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { supabase } from '../../lib/supabase';

const POPULAR_ITEMS = [
  {
    id: '1',
    name: 'Chicken Biryani',
    price: 180,
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    tag: 'MAIN COU',
  },
  {
    id: '2',
    name: 'Chow Mein Chicken',
    price: 160,
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
    tag: 'CHINESE',
  },
  {
    id: '3',
    name: 'Chicken Curry',
    price: 200,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
    tag: 'RICH',
  },
];

export default function StudentHomeTab({ userRole }: { userRole?: string }) {
  const [userName, setUserName] = useState('');
  const [userInitial, setUserInitial] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [popularItems, setPopularItems] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [openingTime, setOpeningTime] = useState('06:00 am');
  const [closingTime, setClosingTime] = useState('11:00 pm');
  const [closingCountdown, setClosingCountdown] = useState('');
  const [orders, setOrders] = useState<any[]>([]);

  // Fetch user info
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Try to get name and avatar from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, avatar_url')
          .eq('id', user.id)
          .maybeSingle();
        const name = profile?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
        setUserName(name);
        setUserInitial(name.charAt(0).toUpperCase());
        setAvatarUrl(profile?.avatar_url || null);
      }
    };
    fetchUser();
  }, []);

  // Fetch menu items and popular items
  useEffect(() => {
    const fetchMenu = async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('category', { ascending: true });
      if (!error && data) {
        setMenuItems(data);
        // Example: filter popular items by a 'popular' flag or top 5 by order_count
        setPopularItems(data.filter((item: any) => item.popular).slice(0, 5));
      }
    };
    fetchMenu();
  }, []);

  // Fetch banners (static or from Supabase)
  useEffect(() => {
    // You can fetch from Supabase or use static banners
    setBanners([
      { image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800', title: 'Fresh & Healthy', subtitle: 'Quality meals every day.' },
      { image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800', title: 'Tasty & Quick', subtitle: 'Ready in minutes.' },
      { image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800', title: 'Variety Everyday', subtitle: 'Try something new!' },
    ]);
  }, []);

  // Fetch opening/closing times
  useEffect(() => {
    const fetchTimes = async () => {
      const { data, error } = await supabase
        .from('business_settings')
        .select('opening_time, closing_time')
        .limit(1)
        .maybeSingle();
      if (!error && data) {
        setOpeningTime(data.opening_time || '06:00 am');
        setClosingTime(data.closing_time || '11:00 pm');
      }
    };
    fetchTimes();
  }, []);

  // Countdown logic
  useEffect(() => {
    const parseTime = (timeStr: string) => {
      if (!timeStr) return null;
      const match = timeStr.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)/i);
      if (!match) return null;
      let hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const period = match[3].toUpperCase();
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };
    const updateCountdown = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const openingMinutes = parseTime(openingTime);
      const closingMinutes = parseTime(closingTime);
      if (currentMinutes < openingMinutes!) {
        const mins = openingMinutes! - currentMinutes;
        setClosingCountdown(`Opens in ${Math.floor(mins/60)}h ${mins%60}m`);
      } else if (currentMinutes >= closingMinutes!) {
        setClosingCountdown('Closed');
      } else {
        const mins = closingMinutes! - currentMinutes;
        setClosingCountdown(`${Math.floor(mins/60)}h ${mins%60}m ${60-now.getSeconds()}s`);
      }
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [openingTime, closingTime]);

  // Fetch recent orders
  useEffect(() => {
    const fetchOrders = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);
      if (!error && data) setOrders(data);
    };
    fetchOrders();
  }, []);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hi, <Text style={{color: '#198b02'}}>{userName}</Text></Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconBtn}><Icon name="bell-outline" size={24} color="#10b981" /></TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}><Icon name="weather-night" size={24} color="#10b981" /></TouchableOpacity>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarCircle} />
          ) : (
            <View style={styles.avatarCircle}><Text style={styles.avatarText}>{userInitial}</Text></View>
          )}
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarWrap}>
        <TextInput
          style={styles.searchBar}
          placeholder="Search meals, desserts, drinks..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Icon name="magnify" size={22} color="#10b981" style={styles.searchIcon} />
      </View>

      {/* Welcome Card */}
      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeTitle}>
          {userRole && userRole.toLowerCase() === 'student'
            ? 'Welcome to Student Dashboard'
            : userRole && userRole.toLowerCase() === 'staff'
              ? 'Welcome to College Staff Dashboard'
              : 'Welcome!'}
        </Text>
        <Text style={styles.welcomeSubtitle}>What would you like to eat today?</Text>
      </View>

      {/* Static Banner Card */}
      <View style={styles.bannerWrap}>
        <Image source={{ uri: banners[0]?.image }} style={styles.bannerImg} />
        <View style={styles.bannerOverlay}>
          <Text style={styles.bannerText}>{banners[0]?.title}</Text>
          <Text style={styles.bannerSubText}>{banners[0]?.subtitle}</Text>
        </View>
      </View>

      {/* Popular Picks */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Popular Picks</Text>
        <TouchableOpacity><Text style={styles.seeAllBtn}>See All →</Text></TouchableOpacity>
      </View>
      <FlatList
        data={searchQuery.trim() ? menuItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.category?.toLowerCase().includes(searchQuery.toLowerCase())) : popularItems}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id}
        style={styles.popularList}
        contentContainerStyle={{paddingLeft: 16, paddingRight: 8}}
        renderItem={({item}) => (
          <View style={styles.popularCard}>
            <Image source={{uri: item.image}} style={styles.popularImg} />
            {item.category && <View style={styles.popularTag}><Text style={styles.popularTagText}>{item.category}</Text></View>}
            <Text style={styles.popularName}>{item.name}</Text>
            <Text style={styles.popularPrice}>₹{item.price}</Text>
            <TouchableOpacity style={styles.addBtn}><Icon name="plus" size={20} color="#fff" /></TouchableOpacity>
          </View>
        )}
      />

      {/* Open Now Card */}
      <View style={styles.openNowCard}>
        <View>
          <Text style={styles.openNowLabel}>Open Now</Text>
          <Text style={styles.openNowTime}>{openingTime} - {closingTime}</Text>
        </View>
        <View>
          <Text style={styles.closesInLabel}>CLOSES IN</Text>
          <Text style={styles.closesInTime}>{closingCountdown}</Text>
        </View>
      </View>

      {/* Quick Access Cards */}
      <View style={styles.quickAccessWrap}>
        <View style={styles.quickRow}>
          <QuickCard icon="silverware-fork-knife" label="MENU" />
          <QuickCard icon="seat" label="SEATS" />
          <QuickCard icon="star" label="LOYALTY" />
        </View>
        <View style={styles.quickRow}>
          <QuickCard icon="heart-outline" label="WISHLIST" />
          <QuickCard icon="message-text-outline" label="FEEDBACK" />
          <QuickCard icon="account-outline" label="PROFILE" />
        </View>
      </View>

      {/* Recent Orders */}
      <Text style={styles.recentOrdersTitle}>Recent Orders</Text>
      {orders.length === 0 && (
        <Text style={{ marginHorizontal: 16, color: '#64748b' }}>No recent orders.</Text>
      )}
      {orders.map((order, idx) => (
        <View key={order.id || idx} style={styles.orderCard}>
          <View style={styles.orderRow}>
            <Text style={styles.orderId}>Order #{order.id}</Text>
            <View style={styles.orderStatus}><Icon name="clock-outline" size={16} color="#f59e0b" /><Text style={styles.orderStatusText}>{order.status || 'Pending'}</Text></View>
            <Text style={styles.orderPrice}>₹{order.total_price || order.total || 0}</Text>
          </View>
          <Text style={styles.orderTime}>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {order.items?.length || 0} items</Text>
          <Text style={styles.orderItems}>{order.items?.map((i: any) => i.name).join(', ') || ''}</Text>
          <TouchableOpacity><Text style={styles.viewDetails}>View Details</Text></TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

function QuickCard({icon, label}: {icon: string, label: string}) {
  return (
    <TouchableOpacity style={styles.quickCard}>
      <View style={styles.quickIconCircle}>
        <Icon name={icon} size={28} color="#10b981" />
      </View>
      <Text style={styles.quickCardLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, paddingTop: 32 },
  greeting: { fontSize: 24, fontWeight: '700', color: '#222' },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: { marginHorizontal: 4 },
  avatarCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 20 },
  searchBarWrap: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 10, backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 10 },
  searchBar: { flex: 1, height: 44, fontSize: 16, color: '#222' },
  searchIcon: { marginLeft: 8 },
  welcomeCard: { backgroundColor: '#f0fdf4', margin: 16, borderRadius: 12, padding: 16, elevation: 2 },
  welcomeTitle: { fontWeight: 'bold', fontSize: 16, color: '#10b981' },
  welcomeSubtitle: { color: '#64748b', marginTop: 2 },
  bannerWrap: { marginHorizontal: 16, marginBottom: 12, borderRadius: 16, overflow: 'hidden', elevation: 2 },
  bannerImg: { width: '100%', height: 120, borderRadius: 16 },
  bannerOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'flex-end', padding: 16, backgroundColor: 'rgba(0,0,0,0.15)' },
  bannerText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  bannerSubText: { color: '#fff', fontSize: 13 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginTop: 8 },
  sectionTitle: { fontWeight: 'bold', fontSize: 17, color: '#222' },
  seeAllBtn: { color: '#10b981', fontWeight: 'bold', fontSize: 15 },
  popularList: { marginVertical: 8 },
  popularCard: { width: 140, backgroundColor: '#fff', borderRadius: 14, marginRight: 12, elevation: 2, padding: 8, alignItems: 'center', position: 'relative' },
  popularImg: { width: 120, height: 70, borderRadius: 10 },
  popularTag: { position: 'absolute', left: 8, top: 8, backgroundColor: '#10b981', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  popularTagText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  popularName: { fontWeight: 'bold', fontSize: 14, marginTop: 8, color: '#222' },
  popularPrice: { color: '#10b981', fontWeight: 'bold', fontSize: 15, marginTop: 2 },
  addBtn: { backgroundColor: '#10b981', borderRadius: 16, padding: 6, position: 'absolute', right: 8, bottom: 8 },
  openNowCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 16, elevation: 2 },
  openNowLabel: { color: '#10b981', fontWeight: 'bold', fontSize: 15 },
  openNowTime: { color: '#222', fontSize: 13 },
  closesInLabel: { color: '#64748b', fontSize: 12 },
  closesInTime: { color: '#10b981', fontWeight: 'bold', fontSize: 15 },
  quickAccessWrap: { marginHorizontal: 16, marginTop: 8, marginBottom: 8 },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  quickCard: { flex: 1, alignItems: 'center', padding: 16, backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 4, elevation: 2 },
  quickIconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  quickCardLabel: { color: '#10b981', fontWeight: 'bold', fontSize: 14 },
  recentOrdersTitle: { marginHorizontal: 16, marginTop: 12, fontWeight: 'bold', fontSize: 16, color: '#222' },
  orderCard: { backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 16, elevation: 2 },
  orderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderId: { fontWeight: 'bold', fontSize: 15, color: '#222' },
  orderStatus: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef3c7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 },
  orderStatusText: { color: '#f59e0b', fontWeight: 'bold', marginLeft: 4 },
  orderPrice: { color: '#10b981', fontWeight: 'bold', fontSize: 15 },
  orderTime: { color: '#64748b', fontSize: 13, marginTop: 2 },
  orderItems: { color: '#222', fontSize: 13, marginTop: 2 },
  viewDetails: { color: '#10b981', fontWeight: 'bold', marginTop: 8, fontSize: 14 },
});
