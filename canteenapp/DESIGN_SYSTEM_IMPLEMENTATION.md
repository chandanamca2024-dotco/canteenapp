# DineDesk - Design System & Implementation Guide

## 📐 Design System Overview

### Core Principles
1. **Modern Minimalism**: Clean layouts with purposeful use of space
2. **Visual Hierarchy**: Size, weight, and color guide user attention
3. **Consistency**: Uniform styling across all screens
4. **Accessibility**: High contrast ratios, readable text sizes
5. **Glass-morphism**: Subtle shadows, rounded corners, depth

---

## 🎨 Color System

### Primary Colors
```
Light Theme:
- Primary:     #8B5CF6 (Purple) - Main actions, headers
- Secondary:   #EC4899 (Pink) - Accents, highlights
- Success:     #10B981 (Green) - Positive states
- Warning:     #F59E0B (Amber) - Alerts, caution
- Danger:      #EF4444 (Red) - Errors, critical
- Info:        #3B82F6 (Blue) - Information

Dark Theme:
- Primary:     #A78BFA (Light Purple)
- Secondary:   #F472B6 (Light Pink)
- Success:     #34D399 (Light Green)
- Warning:     #FBBF24 (Light Amber)
```

### Neutral Colors
```
Light Theme:
- Background:  #FFFFFF
- Surface:     #F9FAFB (Card backgrounds)
- Border:      rgba(0,0,0,0.1) (Dividers)
- Text:        #111827 (Primary text)
- TextSecondary: rgba(text, 0.6) (Secondary text)

Dark Theme:
- Background:  #0F172A (Dark background)
- Surface:     #1E293B (Card backgrounds)
- Border:      rgba(255,255,255,0.1)
- Text:        #FFFFFF
- TextSecondary: rgba(255,255,255,0.6)
```

---

## 📏 Spacing System

### Core Spacing Values
```
xs:  4px
sm:  8px
md:  12px
lg:  16px
xl:  20px
2xl: 24px
3xl: 32px
```

### Common Spacing Patterns
```
- Card padding: 16px (lg)
- Section padding: 20px horizontal, 20px vertical (xl)
- Header padding: 50px top, 20px horizontal, 24px bottom
- List item gap: 12px (md)
- Section title margin: 16px bottom (lg)
```

---

## 📝 Typography

### Font Scale
```
Hero Title:     32px, Bold (900), Letter spacing: -1px
Section Title:  19px, Bold (800), Letter spacing: -0.3px
Card Title:     15px, Bold (800)
Body Text:      13-14px, Regular (500)
Label:          12px, Semibold (600)
Helper Text:    11px, Regular (500)
```

### Weight Usage
```
900 - Hero titles, major values
800 - Section titles, card headers
700 - Regular headers, button text
600 - Labels, input text
500 - Body text, descriptions
400 - Disabled text, hints
```

---

## 🌟 Component Styling

### Card Components
```tsx
Card Base:
{
  paddingHorizontal: 16,
  paddingVertical: 14-16,
  borderRadius: 16-18,
  elevation: 2,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.08,
  shadowRadius: 4,
}
```

### Stat Cards
```tsx
{
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 18,
  paddingVertical: 16,
  borderRadius: 18,
  gap: 14,
  backgroundColor: 'surface'
}

Icon Circle:
{
  width: 56,
  height: 56,
  borderRadius: 28,
  backgroundColor: 'primary + 15% opacity',
  justifyContent: 'center',
  alignItems: 'center',
}
```

### Feature Cards (Grid)
```tsx
{
  width: '48%',
  paddingVertical: 18,
  paddingHorizontal: 12,
  borderRadius: 16,
  alignItems: 'center',
  backgroundColor: 'surface',
  elevation: 2,
}

Icon Container:
{
  width: 60,
  height: 60,
  borderRadius: 30,
  marginBottom: 10,
  backgroundColor: 'color + 20% opacity',
}
```

### Button Styles
```tsx
Primary Button:
{
  paddingVertical: 12-16,
  paddingHorizontal: 24-32,
  borderRadius: 8,
  backgroundColor: colors.primary,
  justifyContent: 'center',
  alignItems: 'center',
}

Add Button (Circular):
{
  width: 32,
  height: 32,
  borderRadius: 8,
  backgroundColor: colors.primary,
  justifyContent: 'center',
  alignItems: 'center',
}

Menu Button (Header):
{
  width: 50,
  height: 50,
  borderRadius: 25,
  backgroundColor: colors.primary,
  elevation: 4,
  shadowOpacity: 0.3,
}
```

### Header Styling
```tsx
Modern Header:
{
  paddingHorizontal: 20,
  paddingTop: 50,
  paddingBottom: 24,
  elevation: 4,
  backgroundColor: colors.surface,
  shadowColor: colors.primary,
  shadowOpacity: 0.15,
  shadowRadius: 8,
}

Welcome Text:
{
  fontSize: 14,
  fontWeight: '500',
  letterSpacing: 0.5,
  color: colors.textSecondary,
  marginBottom: 4,
}

Title:
{
  fontSize: 32,
  fontWeight: '900',
  letterSpacing: -1,
  color: colors.text,
  marginBottom: 6,
}

Subtitle:
{
  fontSize: 14,
  fontWeight: '500',
  color: colors.textSecondary,
  opacity: 0.85,
}
```

---

## 🎭 Status Indicators

### Order Status Colors
```
Pending    - Warning (Amber #F59E0B)
Preparing  - Primary (Purple #8B5CF6)
Ready      - Success (Green #10B981)
Completed  - Success (Green #10B981)
```

### Status Badge Style
```tsx
{
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 10,
  backgroundColor: 'statusColor + 20% opacity',
}

Text:
{
  fontSize: 11,
  fontWeight: '800',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  color: 'statusColor',
}
```

### Availability Badges
```tsx
Out of Stock:
{
  position: 'absolute',
  top: 4,
  right: 4,
  backgroundColor: '#EF4444',
  borderRadius: 4,
  paddingHorizontal: 6,
  paddingVertical: 2,
  fontSize: 10,
  color: '#fff',
}
```

---

## 🔢 Responsive Grid

### Menu Grid
```
Columns: 2
Gap: 8px (sm)
Width per item: ~(screen - 32px padding) / 2
Item height: 100px + text content
```

### Feature Grid
```
Columns: 2
Gap: 12px (md)
Width per item: 48% (~half screen)
Height: ~200px
```

### Stat Cards (Vertical Stack)
```
Gap: 12px
Full width: -16px horizontal padding
Height per card: ~110px
```

---

## 🎬 Animation & Transitions

### Recommended Animations
```
Card Press:     0.2s duration, scale 0.98
Button Ripple:  0.3s duration, background fade
Tab Switch:     0.3s duration, opacity fade
List Item:      0.15s duration per item
```

### Disabled States
```
Opacity: 0.5
Color: textSecondary with reduced contrast
Not clickable: pointerEvents: 'none'
```

---

## 📱 Screen Layout Patterns

### Home Tab Layout
```
Header (50pt top)
  ↓
Stats Container (3 cards vertical)
  ↓
Status Alert (Closing time)
  ↓
Quick Order Section (Horizontal scroll)
  ↓
Recent Orders Section (Vertical list)
  ↓
Features Grid (2 columns)
```

### Menu Tab Layout
```
Header (Show available count)
  ↓
Cart Preview (If items > 0)
  ↓
Menu Grid (2 columns)
  ├─ Item Image + Emoji
  ├─ Item Name
  ├─ Category
  └─ Price + Add Button
```

### Orders Tab Layout
```
Header (Show order count)
  ↓
If No Orders:
  └─ Empty State (Emoji + Message + CTA)
Else:
  └─ Order Cards (List)
     ├─ Order ID + Time
     ├─ Status Badge
     ├─ Item Count
     └─ Total Price
```

### Wallet Tab Layout
```
Header (Show balance)
  ↓
Balance Stat Card
  ↓
Add Money Buttons (4 options)
  ↓
Transaction History List
  ├─ Type (Debit/Credit emoji)
  ├─ Description
  └─ Amount (Color-coded)
```

### Profile Tab Layout
```
Header (Account settings)
  ↓
User Card (Avatar + Name + Email)
  ↓
Account Info Section
  ├─ Phone
  ├─ Role
  └─ Saved Addresses
  ↓
Settings Section
  ├─ Notifications
  └─ Privacy & Security
  ↓
Logout Button (Danger red)
```

---

## 🚀 Implementation Checklist

### Header Components
- [x] Modern elevated header with shadows
- [x] Menu button (circular, 50px)
- [x] Welcome text with secondary color
- [x] Bold title (32px, 900 weight)
- [x] Subtitle (14px, 500 weight)

### Card Components
- [x] Stat cards (horizontal layout)
- [x] Feature cards (2-column grid)
- [x] Order cards (full width)
- [x] Menu item cards (2-column grid)

### Interactive Elements
- [x] Add to cart buttons
- [x] Status badges
- [x] Add money buttons
- [x] Profile item clickables
- [x] Logout button

### Visual Elements
- [x] Emoji icons throughout
- [x] Color-coded status indicators
- [x] Empty state messages
- [x] Shadow effects
- [x] Border radius consistency

### Typography
- [x] Font size hierarchy
- [x] Font weight consistency
- [x] Letter spacing for premium feel
- [x] Color contrast compliance

### Spacing
- [x] Consistent padding (16px lg)
- [x] Consistent gaps (12px md)
- [x] Header top padding (50px)
- [x] Section padding (20px)

---

## 📊 Design Tokens Summary

```javascript
SPACING = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, 2xl: 24, 3xl: 32
}

COLORS = {
  primary: '#8B5CF6',
  secondary: '#EC4899',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  surface: 'light:#F9FAFB, dark:#1E293B'
}

TYPOGRAPHY = {
  hero: { size: 32, weight: 900, spacing: -1 },
  heading: { size: 19, weight: 800, spacing: -0.3 },
  title: { size: 15, weight: 800 },
  body: { size: 13, weight: 500 },
  label: { size: 12, weight: 600 },
  caption: { size: 11, weight: 500 }
}

BORDER_RADIUS = {
  sm: 4, md: 8, lg: 14, xl: 16, 2xl: 18, 3xl: 20
}

SHADOWS = {
  sm: { elevation: 1, opacity: 0.05 },
  md: { elevation: 2, opacity: 0.08 },
  lg: { elevation: 4, opacity: 0.15 }
}
```

---

## 🎯 Design Philosophy

1. **Form Follows Function**: Every design element serves a purpose
2. **Consistent Visual Language**: Repeated patterns build familiarity
3. **Generous Spacing**: Breathing room between elements
4. **Color Meaning**: Colors communicate status and function
5. **Type Hierarchy**: Clear reading order through sizing
6. **Accessibility First**: Readable, touchable, usable for all
7. **Performance**: Smooth animations, quick responses

---

This design system provides a comprehensive guide for maintaining consistency across the entire DineDesk application while allowing for future enhancements and customizations.

