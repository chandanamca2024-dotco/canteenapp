import { supabase } from './supabase';

export interface AdminProfile {
  id: string;
  email: string;
  role: string;
  is_admin: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MenuItem {
  id?: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  image_url?: string;
  available: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Get current admin profile from database (fast + no side effects)
 */
export async function getAdminProfile(): Promise<AdminProfile | null> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.log('Not authenticated');
      return null;
    }

    // Use maybeSingle to avoid errors when no row exists and keep the call fast
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, role, is_admin, created_at, updated_at')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching admin profile:', error);
      return null;
    }

    if (!data) {
      console.log('No profile found for user:', user.id);
      return null;
    }

    return data as AdminProfile;
  } catch (err) {
    console.error('Exception in getAdminProfile:', err);
    return null;
  }
}

/**
 * Check if current user is admin
 */
export async function isUserAdmin(): Promise<boolean> {
  try {
    const profile = await getAdminProfile();
    return profile?.is_admin === true;
  } catch (err) {
    console.error('Error checking admin status:', err);
    return false;
  }
}

/**
 * Add a new menu item to database
 */
export async function addMenuItem(item: MenuItem): Promise<MenuItem | null> {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .insert([{
        name: item.name,
        price: item.price,
        category: item.category,
        description: item.description || '',
        image_url: item.image_url || null,
        available: item.available,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select();

    if (error) {
      console.error('Error adding menu item:', error);
      return null;
    }

    console.log('Menu item added:', data[0]);
    return data[0] as MenuItem;
  } catch (err) {
    console.error('Exception in addMenuItem:', err);
    return null;
  }
}

/**
 * Update an existing menu item
 */
export async function updateMenuItem(id: string, item: Partial<MenuItem>): Promise<MenuItem | null> {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .update({
        ...item,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating menu item:', error);
      return null;
    }

    console.log('Menu item updated:', data[0]);
    return data[0] as MenuItem;
  } catch (err) {
    console.error('Exception in updateMenuItem:', err);
    return null;
  }
}

/**
 * Delete a menu item
 */
export async function deleteMenuItem(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting menu item:', error);
      return false;
    }

    console.log('Menu item deleted:', id);
    return true;
  } catch (err) {
    console.error('Exception in deleteMenuItem:', err);
    return false;
  }
}

/**
 * Get all menu items
 */
export async function getAllMenuItems(): Promise<MenuItem[]> {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching menu items:', error);
      return [];
    }

    return (data || []) as MenuItem[];
  } catch (err) {
    console.error('Exception in getAllMenuItems:', err);
    return [];
  }
}

/**
 * Get menu items by category
 */
export async function getMenuItemsByCategory(category: string): Promise<MenuItem[]> {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('category', category)
      .eq('available', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching menu items by category:', error);
      return [];
    }

    return (data || []) as MenuItem[];
  } catch (err) {
    console.error('Exception in getMenuItemsByCategory:', err);
    return [];
  }
}

/**
 * Toggle menu item availability
 */
export async function toggleMenuItemAvailability(id: string, available: boolean): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('menu_items')
      .update({ available, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error toggling availability:', error);
      return false;
    }

    console.log('Menu item availability toggled:', id, available);
    return true;
  } catch (err) {
    console.error('Exception in toggleMenuItemAvailability:', err);
    return false;
  }
}

/**
 * Upload image to Supabase storage and get public URL
 */
export async function uploadMenuItemImage(
  imageUri: string,
  itemId: string
): Promise<string | null> {
  try {
    // Convert URI to blob
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const fileName = `menu_${itemId}_${Date.now()}.jpg`;

    const { data, error } = await supabase.storage
      .from('food-images')
      .upload(fileName, blob, { upsert: true });

    if (error) {
      console.error('Error uploading image:', error);
      return null;
    }

    // Get public URL
    const { data: publicData } = supabase.storage
      .from('food-images')
      .getPublicUrl(fileName);

    return publicData?.publicUrl || null;
  } catch (err) {
    console.error('Exception in uploadMenuItemImage:', err);
    return null;
  }
}

/**
 * Seed sample menu items (for development/testing)
 */
export async function seedSampleMenuItems(): Promise<MenuItem[]> {
  const sampleItems: MenuItem[] = [
    {
      name: 'Butter Chicken',
      price: 250,
      category: 'Curry',
      description: 'Tender chicken in creamy butter and tomato sauce',
      available: true,
    },
    {
      name: 'Paneer Tikka',
      price: 180,
      category: 'Starters',
      description: 'Marinated paneer grilled to perfection',
      available: true,
    },
    {
      name: 'Biryani',
      price: 200,
      category: 'Rice',
      description: 'Fragrant basmati rice with spiced meat',
      available: true,
    },
    {
      name: 'Dosa',
      price: 80,
      category: 'South Indian',
      description: 'Crispy rice and lentil crepe',
      available: true,
    },
    {
      name: 'Naan',
      price: 40,
      category: 'Bread',
      description: 'Soft and fluffy Indian bread',
      available: true,
    },
    {
      name: 'Mango Lassi',
      price: 60,
      category: 'Beverage',
      description: 'Refreshing yogurt-based mango drink',
      available: true,
    },
  ];

  const results: MenuItem[] = [];

  for (const item of sampleItems) {
    const result = await addMenuItem(item);
    if (result) {
      results.push(result);
    }
  }

  console.log(`Seeded ${results.length} sample menu items`);
  return results;
}
