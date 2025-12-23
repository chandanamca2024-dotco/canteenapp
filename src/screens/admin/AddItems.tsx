import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
  Modal,
  Image,
  ActivityIndicator,
} from 'react-native';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { useTheme } from '../../theme/ThemeContext';
import { supabase } from '../../lib/supabase';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
  image?: string;
  stock?: number;
  description?: string;
}

interface AddItemsProps {
  menuItems: MenuItem[];
  onAddItem: (item: MenuItem) => void;
  onEditItem: (item: MenuItem) => void;
  onRemoveItem: (itemId: string) => void;
}

export const AddItems: React.FC<AddItemsProps> = ({
  menuItems,
  onAddItem,
  onEditItem,
  onRemoveItem,
}) => {
  const { colors, tokens } = useTheme();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'Rice',
    stock: '',
    description: '',
    imageUri: '',
  });
  const [imageUrl, setImageUrl] = useState('');
  const [useUrlInput, setUseUrlInput] = useState(false);

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      category: 'Rice',
      stock: '',
      description: '',
      imageUri: '',
    });
    setImageUrl('');
    setUseUrlInput(false);
    setEditingItem(null);
  };

  const pickImage = async () => {
    try {
      launchImageLibrary(
        {
          mediaType: 'photo',
          maxWidth: 800,
          maxHeight: 800,
          quality: 0.8,
          includeBase64: false,
        },
        (response: ImagePickerResponse) => {
          if (response.didCancel) {
            console.log('User cancelled image picker');
          } else if (response.errorCode) {
            Alert.alert('Error', response.errorMessage || 'Failed to pick image');
          } else if (response.assets && response.assets[0]) {
            const imageUri = response.assets[0].uri;
            if (imageUri) {
              setFormData({ ...formData, imageUri });
              setImageUrl(''); // Clear URL input
            }
          }
        }
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to open image picker');
    }
  };

  // Validate that a pasted URL is https and actually resolves to an image
  const validateRemoteImageUrl = async (url: string): Promise<boolean> => {
    try {
      const trimmed = url.trim();
      if (!trimmed) return false;
      // Require https for iOS ATS and Android security; http often fails
      if (!/^https:\/\//i.test(trimmed)) return false;
      // Try to prefetch/cache the image; returns boolean
      const ok = await Image.prefetch(trimmed);
      return !!ok;
    } catch {
      return false;
    }
  };

  const uploadImageToSupabase = async (imageUri: string): Promise<string | null> => {
    if (!imageUri) return null;

    try {
      setUploading(true);
      // Convert image URI to blob for upload
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const fileName = `menu-${Date.now()}.jpg`;

      const { data, error } = await supabase.storage
        .from('food-images')
        .upload(fileName, blob, {
          contentType: (blob as any)?.type || 'image/jpeg',
          upsert: false,
        });

      if (error) {
        Alert.alert('Upload Error', error.message);
        return null;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('food-images').getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      Alert.alert('Error', 'Failed to upload image');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleAddItem = async () => {
    if (!formData.name || !formData.price) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setUploading(true);
    let finalImageUrl: string | null = null;

    // If user pasted a URL, validate it's a loadable https image
    if (imageUrl) {
      const valid = await validateRemoteImageUrl(imageUrl);
      if (!valid) {
        Alert.alert(
          'Invalid Image URL',
          'Please paste a direct HTTPS image link that loads publicly.'
        );
      } else {
        finalImageUrl = imageUrl.trim();
      }
    }

    // Upload image to Supabase if selected from picker
    if (!finalImageUrl && formData.imageUri && !formData.imageUri.startsWith('http')) {
      finalImageUrl = (await uploadImageToSupabase(formData.imageUri)) || null;
    }

    const newItem: MenuItem = {
      id: editingItem?.id || String(Date.now()),
      name: formData.name,
      price: parseInt(formData.price),
      category: formData.category,
      available: true,
      image: finalImageUrl || undefined,
      description: formData.description,
    };

    if (editingItem) {
      onEditItem(newItem);
      Alert.alert('Success', 'Food item updated successfully!');
    } else {
      onAddItem(newItem);
      Alert.alert('Success', 'Food item added successfully!');
    }

    resetForm();
    setShowAddForm(false);
    setUploading(false);
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      price: String(item.price),
      category: item.category,
      stock: '',
      description: item.description || '',
      imageUri: item.image || '',
    });
    setImageUrl(item.image || '');
    setShowAddForm(true);
  };

  const handleRemoveItem = (itemId: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this food item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onRemoveItem(itemId);
            Alert.alert('Success', 'Food item removed successfully!');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={[styles.content, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>➕ Add Food Items</Text>
          <Text style={styles.headerSubtitle}>Create and manage menu items</Text>
        </View>
        <TouchableOpacity
          style={styles.addFloatingBtn}
          onPress={() => {
            resetForm();
            setShowAddForm(true);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.addFloatingBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Add/Edit Modal */}
      <Modal visible={showAddForm} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background, borderTopLeftRadius: tokens.radius.xl, borderTopRightRadius: tokens.radius.xl }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingItem ? 'Edit Food Item' : 'Add New Food Item'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  resetForm();
                  setShowAddForm(false);
                }}
              >
                <Text style={[styles.closeBtn, { color: colors.text }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer}>
              {/* Image Picker Section */}
              <View style={styles.imageSection}>
                {/* Display Image if available */}
                {(formData.imageUri || imageUrl) && (
                  <View style={[styles.imagePicker, { borderColor: colors.primary, backgroundColor: colors.surface }]}>
                    <Image
                      source={{ uri: imageUrl || formData.imageUri }}
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                  </View>
                )}

                {/* Image Options Buttons */}
                <View style={styles.imageOptionsRow}>
                  <TouchableOpacity
                    style={[styles.imageOptionBtn, { backgroundColor: colors.primary }]}
                    onPress={pickImage}
                  >
                    <Text style={styles.imageOptionText}>📷 Pick from Gallery</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.imageOptionBtn, { backgroundColor: colors.secondary || '#4CAF50' }]}
                    onPress={() => setUseUrlInput(!useUrlInput)}
                  >
                    <Text style={styles.imageOptionText}>
                      {useUrlInput ? '✕ Close' : '🔗 Use URL'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* URL Input Field */}
                {useUrlInput && (
                  <View style={styles.urlInputContainer}>
                    <Text style={[styles.urlLabel, { color: colors.text }]}>
                      📋 Paste Image URL (Perfect for Laptop/Desktop!)
                    </Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
                      placeholder="https://example.com/image.jpg"
                      placeholderTextColor={colors.textSecondary}
                      value={imageUrl}
                      onChangeText={(text) => {
                        setImageUrl(text);
                        setFormData({ ...formData, imageUri: '' }); // Clear picker image
                      }}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <Text style={[styles.urlHint, { color: colors.textSecondary }]}>
                      💡 Right-click any image → "Copy image address" → Paste here
                    </Text>
                    <Text style={[styles.urlHint, { color: colors.textSecondary, marginTop: 4 }]}>
                      🔍 Find food images: Unsplash, Pexels, Google Images
                    </Text>
                  </View>
                )}
              </View>

              <Text style={[styles.label, { color: colors.text }]}>Item Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
                placeholder="Enter the name of the food item"
                placeholderTextColor={colors.textSecondary}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />

              <Text style={[styles.label, { color: colors.text }]}>Price (₹) *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
                placeholder="Enter the price in rupees"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                value={formData.price}
                onChangeText={(text) => setFormData({ ...formData, price: text })}
              />

              <Text style={[styles.label, { color: colors.text }]}>Stock Quantity</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
                placeholder="Enter the quantity available in stock"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                value={formData.stock}
                onChangeText={(text) => setFormData({ ...formData, stock: text })}
              />

              <Text style={[styles.label, { color: colors.text }]}>Category</Text>
              <View style={styles.categoryOptions}>
                {['Rice', 'Curry', 'South Indian', 'Starters', 'Bread', 'Beverage'].map(
                  (cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryBtn,
                        {
                          backgroundColor:
                            formData.category === cat ? colors.primary : colors.surface,
                        },
                      ]}
                      onPress={() => setFormData({ ...formData, category: cat })}
                    >
                      <Text
                        style={[
                          styles.categoryBtnText,
                          {
                            color: formData.category === cat ? '#fff' : colors.text,
                          },
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>

              <Text style={[styles.label, { color: colors.text }]}>Description</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  { backgroundColor: colors.surface, color: colors.text },
                ]}
                placeholder="Write a detailed description of the food item for customers"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
              />

            <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                onPress={handleAddItem}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {editingItem ? '✓ Update Item' : '✓ Add Item'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.cancelBtn, { backgroundColor: colors.background, borderColor: colors.text }]}
                onPress={() => {
                  resetForm();
                  setShowAddForm(false);
                }}
              >
                <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Menu Items List */}
      <View style={styles.itemsContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Total Items: {menuItems.length}
        </Text>

        {menuItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              📋 No food items yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Add your first item to get started
            </Text>
          </View>
        ) : (
          <FlatList
            data={menuItems}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={[styles.itemCard, { backgroundColor: colors.surface, borderRadius: tokens.radius.md }, tokens.shadow.card]}>
                {item.image ? (
                  <Image
                    source={{ uri: item.image }}
                    style={styles.itemImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.itemImage, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f7f7' }]}> 
                    <Text style={{ fontSize: 28 }}>🍽️</Text>
                  </View>
                )}
                <View style={styles.itemTop}>
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, { color: colors.text }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.itemCategory, { color: colors.textSecondary }]}>
                      {item.category}
                    </Text>
                  </View>
                  <Text style={[styles.itemPrice, { color: colors.primary }]}>
                    ₹{item.price}
                  </Text>
                </View>

                <View style={styles.itemActions}>
                  <TouchableOpacity
                    style={[styles.editBtn, { backgroundColor: colors.primary + '20' }]}
                    onPress={() => handleEditItem(item)}
                  >
                    <Text style={[styles.editBtnText, { color: colors.primary }]}>
                      ✏️ Edit
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.deleteBtn, { backgroundColor: colors.danger + '20' }]}
                    onPress={() => handleRemoveItem(item.id)}
                  >
                    <Text style={[styles.deleteBtnText, { color: colors.danger }]}>
                      🗑️ Delete
                    </Text>
                  </TouchableOpacity>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: item.available
                        ? colors.success + '20'
                        : colors.warning + '20',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: item.available ? colors.success : colors.warning,
                      },
                    ]}
                  >
                    {item.available ? '✓ Available' : '⏳ Unavailable'}
                  </Text>
                </View>
              </View>
            )}
            keyExtractor={(item) => item.id}
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingBottom: 70,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  addFloatingBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  addFloatingBtnText: {
    fontSize: 28,
    color: '#FF6B00',
    fontWeight: '700',
  },
  itemsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
  },
  itemCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
  },
  itemImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
  },
  itemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  itemCategory: {
    fontSize: 11,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 12,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  editBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deleteBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    fontSize: 24,
    fontWeight: '700',
  },
  formContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  imagePicker: {
    borderWidth: 2,
    borderRadius: 12,
    borderStyle: 'dashed',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  imagePlaceholder: {
    alignItems: 'center',
    gap: 8,
  },
  imageIcon: {
    fontSize: 48,
  },
  imageText: {
    fontSize: 14,
    fontWeight: '600',
  },
  imageSubtext: {
    fontSize: 12,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  imageSection: {
    marginBottom: 16,
  },
  imageOptionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  imageOptionBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
  },
  imageOptionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  urlInputContainer: {
    marginTop: 8,
  },
  urlLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  urlHint: {
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },
  urlToggleBtn: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    elevation: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    marginBottom: 6,
  },
  textArea: {
    textAlignVertical: 'top',
    minHeight: 120,
    paddingTop: 16,
  },
  categoryOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryBtn: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  categoryBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  submitBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
    elevation: 2,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  cancelBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
