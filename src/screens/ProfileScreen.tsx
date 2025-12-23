import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../theme/ThemeContext';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: string;
  avatar_url?: string;
  created_at: string;
}

export default function ProfileScreen({ navigation }: any) {
  const { colors, tokens } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  
  // Editable fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Student');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Error', 'Please login again');
        navigation.navigate('Login');
        return;
      }

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        
        // Profile doesn't exist, create it
        if (error.code === 'PGRST116') {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email || '',
              name: user.user_metadata?.name || '',
              phone: user.user_metadata?.phone || '',
              role: user.user_metadata?.role || 'Student',
              is_active: true,
              status: 'active',
            });

          if (!insertError) {
            loadProfile(); // Reload after creating
          }
        }
        return;
      }

      setProfile(profileData);
      setName(profileData.name || '');
      setPhone(profileData.phone || '');
      setRole(profileData.role || 'Student');
    } catch (err) {
      console.error('Error:', err);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!profile) return;

    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          name: name.trim(),
          phone: phone.trim(),
          role: role,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) {
        throw error;
      }

      Alert.alert('✅ Success', 'Profile updated successfully!');
      setEditing(false);
      loadProfile();
    } catch (err: any) {
      console.error('Error updating profile:', err);
      Alert.alert('Error', err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          },
        },
      ]
    );
  };

  if (loading && !profile) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {name.charAt(0).toUpperCase() || '👤'}
            </Text>
          </View>
        </View>
        <Text style={styles.headerName}>{name || 'User'}</Text>
        <Text style={styles.headerEmail}>{profile?.email}</Text>
      </View>

      {/* Profile Info */}
      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Profile Information
          </Text>

          {/* Name */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Name</Text>
            {editing ? (
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={colors.textSecondary}
              />
            ) : (
              <Text style={[styles.value, { color: colors.text }]}>
                {name || 'Not set'}
              </Text>
            )}
          </View>

          {/* Phone */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Phone</Text>
            {editing ? (
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone"
                keyboardType="phone-pad"
                placeholderTextColor={colors.textSecondary}
              />
            ) : (
              <Text style={[styles.value, { color: colors.text }]}>
                {phone || 'Not set'}
              </Text>
            )}
          </View>

          {/* Role */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Role</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {role}
            </Text>
          </View>

          {/* Member Since */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Member Since
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
            </Text>
          </View>

          {/* Edit/Save Button */}
          {editing ? (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton, { borderColor: colors.textSecondary }]}
                onPress={() => {
                  setEditing(false);
                  setName(profile?.name || '');
                  setPhone(profile?.phone || '');
                }}
              >
                <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={saveProfile}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: colors.primary }]}
              onPress={() => setEditing(true)}
            >
              <Text style={styles.editButtonText}>✏️ Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.danger }]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>🚪 Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '800',
  },
  headerName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  headerEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  content: {
    padding: 20,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  editButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 2,
  },
  saveButton: {},
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  logoutButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
