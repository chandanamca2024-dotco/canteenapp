import React from 'react';
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

export default function StudentHomeTab() {
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hi, <Text style={{color: '#198b02'}}>Likith</Text></Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconBtn}><Icon name="bell-outline" size={24} color="#10b981" /></TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}><Icon name="weather-night" size={24} color="#10b981" /></TouchableOpacity>
          <View style={styles.avatarCircle}><Text style={styles.avatarText}>L</Text></View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarWrap}>
        <TextInput style={styles.searchBar} placeholder="Search meals, desserts, drinks..." placeholderTextColor="#94a3b8" />
        <Icon name="magnify" size={22} color="#10b981" style={styles.searchIcon} />
      </View>

      {/* Welcome Card */}
      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeTitle}>Welcome to Student Homepage</Text>
        <Text style={styles.welcomeSubtitle}>What would you like to eat today?</Text>
      </View>

      {/* Banner Carousel (static) */}
      <View style={styles.bannerWrap}>
        <Image source={{uri: POPULAR_ITEMS[0].image}} style={styles.bannerImg} />
        <View style={styles.bannerOverlay}>
          <Text style={styles.bannerText}>Fresh & Healthy</Text>
          <Text style={styles.bannerSubText}>Quality meals every day.</Text>
        </View>
      </View>

      {/* Popular Picks */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Popular Picks</Text>
        <TouchableOpacity><Text style={styles.seeAllBtn}>See All →</Text></TouchableOpacity>
      </View>
      <FlatList
        data={POPULAR_ITEMS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id}
        style={styles.popularList}
        contentContainerStyle={{paddingLeft: 16, paddingRight: 8}}
        renderItem={({item}) => (
          <View style={styles.popularCard}>
            <Image source={{uri: item.image}} style={styles.popularImg} />
            <View style={styles.popularTag}><Text style={styles.popularTagText}>{item.tag}</Text></View>
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
          <Text style={styles.openNowTime}>06:00 am - 11:00 pm</Text>
        </View>
        <View>
          <Text style={styles.closesInLabel}>CLOSES IN</Text>
          <Text style={styles.closesInTime}>4h 11m 60s</Text>
        </View>
      </View>

      {/* Quick Access */}
      <View style={styles.quickAccessWrap}>
        <View style={styles.quickRow}>
          <QuickBtn icon="silverware-fork-knife" label="MENU" />
          <QuickBtn icon="seat" label="SEATS" />
          <QuickBtn icon="star" label="LOYALTY" />
        </View>
        <View style={styles.quickRow}>
          <QuickBtn icon="heart-outline" label="WISHLIST" />
          <QuickBtn icon="message-text-outline" label="FEEDBACK" />
          <QuickBtn icon="account-outline" label="PROFILE" />
        </View>
      </View>

      {/* Recent Orders */}
      <Text style={styles.recentOrdersTitle}>Recent Orders</Text>
      <View style={styles.orderCard}>
        <View style={styles.orderRow}>
          <Text style={styles.orderId}>Order #1</Text>
          <View style={styles.orderStatus}><Icon name="clock-outline" size={16} color="#f59e0b" /><Text style={styles.orderStatusText}>Pending</Text></View>
          <Text style={styles.orderPrice}>₹310</Text>
        </View>
        <Text style={styles.orderTime}>6:42 pm • 4 items</Text>
        <Text style={styles.orderItems}>Idli, Chole Bhature, Fresh Lime Juice, Paneer Tikka</Text>
        <TouchableOpacity><Text style={styles.viewDetails}>View Details</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function QuickBtn({icon, label}: {icon: string, label: string}) {
  return (
    <TouchableOpacity style={styles.quickBtn}>
      <Icon name={icon} size={26} color="#10b981" />
      <Text style={styles.quickBtnLabel}>{label}</Text>
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
  quickBtn: { flex: 1, alignItems: 'center', padding: 12, backgroundColor: '#f0fdf4', borderRadius: 12, marginHorizontal: 4 },
  quickBtnLabel: { color: '#10b981', fontWeight: 'bold', fontSize: 13, marginTop: 4 },
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
