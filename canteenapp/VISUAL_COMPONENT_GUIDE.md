# DineDesk - Visual Design Guide & Component Reference

## 🎨 Quick Component Reference

### 1. Modern Header
Used on: All screens (Home, Menu, Orders, Wallet, Profile)

```tsx
<View style={[styles.header, { backgroundColor: colors.surface }]}>
  <View style={styles.headerTop}>
    <TouchableOpacity
      style={[styles.menuButton, { backgroundColor: colors.primary }]}
      onPress={() => setDrawerVisible(true)}
    >
      <Text style={styles.menuIcon}>☰</Text>
    </TouchableOpacity>
  </View>
  <View style={styles.headerContent}>
    <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>
      {section}
    </Text>
    <Text style={[styles.headerTitle, { color: colors.text }]}>
      {title}
    </Text>
    <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
      {subtitle}
    </Text>
  </View>
</View>
```

**Styling:**
```js
header: {
  paddingHorizontal: 20,
  paddingTop: 50,
  paddingBottom: 24,
  elevation: 4,
  shadowColor: colors.primary,
  shadowOpacity: 0.15,
  shadowRadius: 8
}
menuButton: {
  width: 50, height: 50,
  borderRadius: 25,
  elevation: 4
}
```

---

### 2. Stat Card (Horizontal)
Used on: Home, Wallet tabs

```tsx
<View style={[styles.statCard, { backgroundColor: colors.surface }]}>
  <View style={[styles.statIconCircle, { backgroundColor: colors.primary + '15' }]}>
    <Text style={styles.statEmoji}>💳</Text>
  </View>
  <View style={styles.statInfo}>
    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
      Available Balance
    </Text>
    <Text style={[styles.statValue, { color: colors.primary }]}>
      ₹{walletBalance}
    </Text>
  </View>
</View>
```

**Styling:**
```js
statCard: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 18,
  paddingVertical: 16,
  borderRadius: 18,
  elevation: 2
}
statIconCircle: {
  width: 56, height: 56,
  borderRadius: 28,
  justifyContent: 'center',
  marginRight: 14
}
statValue: {
  fontSize: 24,
  fontWeight: '900'
}
```

---

### 3. Feature Card (Grid 2x2)
Used on: Home tab

```tsx
<TouchableOpacity style={[styles.featureCard, { backgroundColor: colors.surface }]}>
  <View style={[styles.featureIcon, { backgroundColor: '#EC489920' }]}>
    <Text style={styles.featureEmoji}>🎁</Text>
  </View>
  <Text style={[styles.featureLabel, { color: colors.text }]}>Offers</Text>
</TouchableOpacity>
```

**Styling:**
```js
featureCard: {
  width: '48%',
  paddingVertical: 18,
  paddingHorizontal: 12,
  borderRadius: 16,
  alignItems: 'center',
  elevation: 2
}
featureIcon: {
  width: 60, height: 60,
  borderRadius: 30,
  justifyContent: 'center',
  marginBottom: 10
}
featureLabel: {
  fontSize: 13,
  fontWeight: '700'
}
```

---

### 4. Order Card
Used on: Orders tab

```tsx
<View style={[styles.orderCard, { backgroundColor: colors.surface }]}>
  <View style={styles.orderCardTop}>
    <View style={styles.orderInfo}>
      <Text style={[styles.orderId, { color: colors.text }]}>
        Order #{item.id}
      </Text>
      <Text style={[styles.orderTime, { color: colors.textSecondary }]}>
        {item.timestamp}
      </Text>
    </View>
    <View style={[
      styles.orderStatusBadge,
      { backgroundColor: colors.primary + '20' }
    ]}>
      <Text style={[styles.orderStatusText, { color: colors.primary }]}>
        {item.status}
      </Text>
    </View>
  </View>
  <View style={styles.orderCardBottom}>
    <Text style={[styles.itemsCount, { color: colors.textSecondary }]}>
      {item.items.length} items
    </Text>
    <Text style={[styles.orderPrice, { color: colors.primary }]}>
      ₹{item.totalPrice}
    </Text>
  </View>
</View>
```

**Styling:**
```js
orderCard: {
  paddingHorizontal: 16,
  paddingVertical: 14,
  borderRadius: 16,
  elevation: 2
}
orderStatusBadge: {
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 10
}
orderPrice: {
  fontSize: 16,
  fontWeight: '900'
}
```

---

### 5. Menu Item Card
Used on: Menu tab

```tsx
<View style={[styles.menuCard, { backgroundColor: colors.surface }]}>
  <View style={[styles.menuItemImage, { backgroundColor: colors.primary + '15' }]}>
    <Text style={styles.foodEmoji}>🍚</Text>
    {!item.available && (
      <View style={styles.unavailableBadge}>
        <Text style={styles.unavailableText}>Out</Text>
      </View>
    )}
  </View>
  <Text style={[styles.itemName, { color: colors.text }]}>
    {item.name}
  </Text>
  <Text style={[styles.itemCategory, { color: colors.textSecondary }]}>
    {item.category}
  </Text>
  <View style={styles.itemFooter}>
    <Text style={[styles.price, { color: colors.primary }]}>
      ₹{item.price}
    </Text>
    <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]}>
      <Text style={styles.addBtnText}>+</Text>
    </TouchableOpacity>
  </View>
</View>
```

**Styling:**
```js
menuCard: {
  flex: 1,
  borderRadius: 12,
  overflow: 'hidden',
  elevation: 1
}
foodEmoji: {
  fontSize: 48
}
addBtn: {
  width: 32, height: 32,
  borderRadius: 8
}
```

---

### 6. Transaction Item
Used on: Wallet tab

```tsx
<View style={[styles.transactionItem, { backgroundColor: colors.surface }]}>
  <Text style={[styles.txnDesc, { color: colors.text }]}>
    {txn.type === 'debit' ? '📤' : '📥'} {txn.desc}
  </Text>
  <Text style={[
    styles.txnAmount,
    { color: txn.type === 'debit' ? colors.danger : colors.success }
  ]}>
    {txn.type === 'debit' ? '-' : '+'}₹{txn.amount}
  </Text>
</View>
```

**Styling:**
```js
transactionItem: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderRadius: 12,
  padding: 12,
  marginBottom: 8
}
txnAmount: {
  fontSize: 14,
  fontWeight: '700'
}
```

---

### 7. Profile Item
Used on: Profile tab

```tsx
<TouchableOpacity style={[styles.profileItem, { backgroundColor: colors.surface }]}>
  <Text style={styles.profileItemIcon}>📞</Text>
  <View style={{ flex: 1 }}>
    <Text style={[styles.profileItemLabel, { color: colors.textSecondary }]}>
      Phone Number
    </Text>
    <Text style={[styles.profileItemValue, { color: colors.text }]}>
      +91 98765 43210
    </Text>
  </View>
  <Text style={{ fontSize: 18 }}>→</Text>
</TouchableOpacity>
```

**Styling:**
```js
profileItem: {
  flexDirection: 'row',
  alignItems: 'center',
  borderRadius: 12,
  padding: 12,
  marginBottom: 8,
  elevation: 1
}
profileItemIcon: {
  fontSize: 20,
  marginRight: 12
}
```

---

### 8. Empty State
Used on: Orders tab (when no orders)

```tsx
<View style={[styles.emptyState, { backgroundColor: colors.surface + '50' }]}>
  <Text style={styles.emptyEmoji}>📋</Text>
  <Text style={[styles.emptyTitle, { color: colors.text }]}>
    No Orders Yet
  </Text>
  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
    Start by ordering from our menu
  </Text>
</View>
```

**Styling:**
```js
emptyState: {
  borderRadius: 16,
  padding: 32,
  alignItems: 'center',
  marginVertical: 12
}
emptyEmoji: {
  fontSize: 48,
  marginBottom: 12
}
emptyTitle: {
  fontSize: 16,
  fontWeight: '800'
}
```

---

### 9. Quick Action Button
Used on: Wallet tab (Add Money)

```tsx
<TouchableOpacity style={[
  styles.quickOrderCard,
  {
    backgroundColor: colors.surface,
    width: '100%',
    marginRight: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16
  }
]}>
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <View style={[styles.quickCardIcon, { marginRight: 14, marginBottom: 0 }]}>
      <Text style={styles.quickCardEmoji}>💵</Text>
    </View>
    <Text style={[styles.quickCardName, { textAlign: 'left' }]}>
      Add ₹{amount}
    </Text>
  </View>
  <Text style={[styles.quickCardPrice, { color: colors.primary }]}>→</Text>
</TouchableOpacity>
```

---

### 10. Status Alert
Used on: Home tab (Kitchen Closing)

```tsx
<View style={[
  styles.statusAlert,
  {
    backgroundColor: colors.warning + '15',
    borderColor: colors.warning + '50'
  }
]}>
  <Text style={styles.alertEmoji}>⏰</Text>
  <View style={styles.statusAlertContent}>
    <Text style={[styles.statusAlertTitle, { color: colors.text }]}>
      Kitchen Closes Soon
    </Text>
    <Text style={[styles.statusAlertTime, { color: colors.warning }]}>
      {closingCountdown}
    </Text>
  </View>
</View>
```

**Styling:**
```js
statusAlert: {
  marginHorizontal: 16,
  paddingHorizontal: 16,
  paddingVertical: 16,
  borderRadius: 16,
  borderWidth: 1,
  flexDirection: 'row'
}
alertEmoji: {
  fontSize: 28
}
```

---

## 📐 Layout Examples

### Section with Header & List
```tsx
<View style={styles.section}>
  <View style={styles.sectionHeader}>
    <Text style={[styles.sectionTitle, { color: colors.text }]}>
      Recent Orders
    </Text>
    <Text style={[styles.viewAll, { color: colors.primary }]}>
      View All
    </Text>
  </View>
  
  <FlatList
    data={orders}
    scrollEnabled={false}
    renderItem={({ item }) => (
      // Order card here
    )}
    keyExtractor={(item) => item.id}
  />
</View>
```

### Horizontal Scroll List
```tsx
<ScrollView horizontal showsHorizontalScrollIndicator={false}>
  {items.map((item) => (
    <View key={item.id} style={styles.quickOrderCard}>
      {/* Quick order card */}
    </View>
  ))}
</ScrollView>
```

### 2-Column Grid
```tsx
<FlatList
  data={items}
  numColumns={2}
  columnWrapperStyle={styles.itemRow}
  renderItem={({ item }) => (
    // Grid item card
  )}
  keyExtractor={(item) => item.id}
/>
```

---

## 🎨 Color Usage Guide

### For Success States
```js
backgroundColor: colors.success + '20'  // Light green background
color: colors.success                     // Bold green text
```

### For Warning States
```js
backgroundColor: colors.warning + '20'  // Light amber background
color: colors.warning                     // Bold amber text
```

### For Primary Actions
```js
backgroundColor: colors.primary         // Purple background
color: '#fff'                            // White text
```

### For Secondary Text
```js
color: colors.textSecondary             // Muted gray text
opacity: 0.85                           // Slightly transparent
```

---

## ⚡ Quick Styling Patterns

### Card Container
```js
{
  backgroundColor: colors.surface,
  borderRadius: 16,
  padding: 16,
  elevation: 2,
  shadowColor: '#000',
  shadowOpacity: 0.08,
  shadowRadius: 4
}
```

### Icon Circle (Colored Background)
```js
{
  width: 56,
  height: 56,
  borderRadius: 28,
  backgroundColor: colors.primary + '15',
  justifyContent: 'center',
  alignItems: 'center'
}
```

### Section Title
```js
{
  fontSize: 19,
  fontWeight: '800',
  letterSpacing: -0.3,
  marginBottom: 16,
  color: colors.text
}
```

### Badge/Pill
```js
{
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 10,
  backgroundColor: colors.primary + '20',
  alignSelf: 'flex-start'
}
```

---

## 🎬 Common Interactions

### Button Press Effect
```js
onPressIn={() => setScale(0.98)}
onPressOut={() => setScale(1)}
```

### Hover State (Web)
```js
onMouseEnter={() => setIsHovered(true)}
onMouseLeave={() => setIsHovered(false)}
```

### Disabled State
```js
opacity: item.available ? 1 : 0.5
disabled={!item.available}
```

---

## 📱 Responsive Design Tips

### Full Width Card
```js
{
  marginHorizontal: 16,
  width: Dimensions.get('window').width - 32
}
```

### Half Width Grid Item
```js
{
  width: '48%',
  marginRight: 8
}
```

### Flexible Spacing
```js
gap: 12,
flexWrap: 'wrap'
```

---

This guide provides quick reference for all major components and styling patterns used throughout DineDesk application. Each component is production-ready and follows the established design system.

