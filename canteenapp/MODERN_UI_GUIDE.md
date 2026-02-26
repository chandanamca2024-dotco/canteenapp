# DineDesk Modern UI Implementation Guide

## Overview
This guide helps you implement the modern, attractive UI design system throughout your app.

## Color System
```javascript
// Primary Brand Colors
- Primary: #8B5CF6 (Purple)
- Primary Light: #A78BFA
- Primary Dark: #6D28D9
- Secondary: #EC4899 (Pink)

// Status Colors
- Success: #10B981 (Green)
- Warning: #F59E0B (Orange)
- Danger: #EF4444 (Red)
- Info: #3B82F6 (Blue)

// Order Status Mapping
- Pending: #F59E0B (Orange)
- Preparing: #3B82F6 (Blue)
- Ready: #10B981 (Green)
- Completed: #8B5CF6 (Purple)
- Cancelled: #EF4444 (Red)
```

## Typography System
```javascript
// Heading Styles
H1: 32px, Weight 800, Line Height 40px (Page titles)
H2: 28px, Weight 700, Line Height 36px (Section headers)
H3: 24px, Weight 700, Line Height 32px (Card titles)
H4: 20px, Weight 600, Line Height 28px (Subsection titles)

// Body Text
Body: 16px, Weight 400, Line Height 24px
Small: 14px, Weight 400, Line Height 20px
Caption: 12px, Weight 500, Letter Spacing 0.5px

// Button Text
Button: 16px, Weight 600, Letter Spacing 0.5px
```

## Spacing System (Base 4px)
```javascript
xs: 4px      (minimal spacing)
sm: 8px      (small gaps)
md: 12px     (medium gaps)
lg: 16px     (standard padding)
xl: 20px     (large spacing)
xxl: 24px    (extra large)
xxxl: 32px   (huge spacing)
```

## Border Radius
```javascript
sm: 6px      (small inputs, badges)
md: 8px      (medium elements)
lg: 12px     (cards, buttons)
xl: 16px     (headers, large elements)
full: 999px  (circles, pills)
```

## Component Usage Examples

### 1. Modern Button
```tsx
import { ModernButton } from '../components/ModernComponents';

<ModernButton
  variant="primary"  // 'primary' | 'secondary' | 'ghost' | 'danger'
  size="medium"      // 'small' | 'medium' | 'large'
  onPress={() => handlePress()}
  colors={colors}
>
  Place Order
</ModernButton>
```

### 2. Modern Card
```tsx
import { ModernCard } from '../components/ModernComponents';

<ModernCard colors={colors} elevation="md">
  <Text>Card content goes here</Text>
</ModernCard>
```

### 3. Stat Card
```tsx
import { StatCard } from '../components/ModernComponents';

<StatCard
  icon="🍽️"
  label="Total Orders"
  value={42}
  color="#8B5CF6"
  colors={colors}
/>
```

### 4. Gradient Header
```tsx
import { GradientHeader } from '../components/ModernComponents';

<GradientHeader
  title="Your Orders"
  subtitle="Track and manage your meals"
  icon="📦"
  colors={colors}
  gradientColors={['#8B5CF6', '#6D28D9']}
/>
```

### 5. Badge
```tsx
import { Badge } from '../components/ModernComponents';

<Badge 
  label="Ready" 
  variant="success"  // 'primary' | 'success' | 'warning' | 'danger'
  colors={colors}
/>
```

### 6. Menu Item Card
```tsx
import { MenuItemCard } from '../components/ModernComponents';

<MenuItemCard
  name="Paneer Tikka"
  price={250}
  image={itemImage}
  foodType="veg"
  available={true}
  colors={colors}
  onPress={() => handleItemPress()}
  onAddCart={() => handleAddCart()}
/>
```

## Layout Patterns

### Header Pattern
```tsx
<View style={{
  backgroundColor: colors.primary,
  paddingHorizontal: 16,
  paddingVertical: 24,
  borderBottomLeftRadius: 20,
  borderBottomRightRadius: 20,
}}>
  <Text style={{ color: '#FFF', fontSize: 28, fontWeight: '800' }}>
    Welcome
  </Text>
  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
    Subtitle here
  </Text>
</View>
```

### Card Grid Pattern (2 columns)
```tsx
<View style={{ flexDirection: 'row', paddingHorizontal: 12 }}>
  <View style={{ flex: 1, marginRight: 8 }}>
    <ModernCard colors={colors}>
      {/* Content */}
    </ModernCard>
  </View>
  <View style={{ flex: 1, marginLeft: 8 }}>
    <ModernCard colors={colors}>
      {/* Content */}
    </ModernCard>
  </View>
</View>
```

### Section with Title
```tsx
<View style={{ paddingHorizontal: 16, marginVertical: 16 }}>
  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
    <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>
      Recent Orders
    </Text>
    <TouchableOpacity>
      <Text style={{ color: colors.primary, fontWeight: '600' }}>
        View All →
      </Text>
    </TouchableOpacity>
  </View>
  {/* Content below */}
</View>
```

## Shadow System
```javascript
// Small Shadow (subtle cards)
shadowColor: '#000'
shadowOffset: { width: 0, height: 1 }
shadowOpacity: 0.05
shadowRadius: 2
elevation: 1

// Medium Shadow (standard cards)
shadowColor: '#000'
shadowOffset: { width: 0, height: 2 }
shadowOpacity: 0.08
shadowRadius: 4
elevation: 2

// Large Shadow (elevated cards)
shadowColor: '#000'
shadowOffset: { width: 0, height: 4 }
shadowOpacity: 0.12
shadowRadius: 8
elevation: 4

// Extra Large Shadow (headers, overlays)
shadowColor: '#000'
shadowOffset: { width: 0, height: 8 }
shadowOpacity: 0.15
shadowRadius: 12
elevation: 8
```

## Animation Timings
```javascript
- Fast: 150ms (micro-interactions)
- Normal: 300ms (standard animations)
- Slow: 500ms (important transitions)
```

## Best Practices

1. **Consistency**: Always use the spacing system. Don't use random numbers.
2. **Visual Hierarchy**: Use typography sizes to establish clear hierarchy.
3. **Color Usage**: 
   - Use primary for main CTAs
   - Use status colors for order states
   - Use secondary for accent elements
4. **Shadows**: Use shadows to create depth, not for every element
5. **Spacing**: Maintain consistent gaps between elements
6. **Touch Targets**: Ensure buttons are at least 44x44 points
7. **Text Contrast**: Ensure sufficient contrast for accessibility

## Migration Checklist
When updating a screen:
- [ ] Replace colors with theme colors
- [ ] Use consistent spacing (lg: 16px is standard)
- [ ] Apply proper typography styles
- [ ] Use modern components from ModernComponents.tsx
- [ ] Add shadows to cards for depth
- [ ] Use proper border radius (lg: 12px for cards)
- [ ] Ensure 16px horizontal padding on main content
- [ ] Add visual feedback (active states, opacity changes)

## Status Color Implementation
```tsx
const getStatusColor = (status: string, colors: any) => {
  const statusColors = {
    'Pending': colors.warning,      // Orange
    'Preparing': '#3B82F6',          // Blue
    'Ready': colors.success,         // Green
    'Completed': colors.primary,     // Purple
    'Cancelled': colors.danger,      // Red
  };
  return statusColors[status] || colors.textSecondary;
};
```

## Example Screen Structure
```tsx
export function YourScreen({ colors, isDark }) {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Gradient Header */}
      <GradientHeader title="Title" colors={colors} />
      
      {/* Content with spacing */}
      <View style={{ paddingHorizontal: 16, marginVertical: 16 }}>
        
        {/* Section Header */}
        <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 12 }}>
          Section Title
        </Text>
        
        {/* Cards/Content */}
        <ModernCard colors={colors}>
          <Text>Content</Text>
        </ModernCard>
        
      </View>
    </ScrollView>
  );
}
```

## Import Path
All design system files are in `src/theme/`:
- `designSystem.ts` - Core design tokens
- `componentStyles.ts` - Reusable style utilities
- `modernStyles.ts` - Full component styles
- `../components/ModernComponents.tsx` - Reusable components
