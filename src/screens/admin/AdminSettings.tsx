import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { supabase } from '../../lib/supabase';

interface Props {
  onLogout: () => void;
}

interface Settings {
  opening_time: string;
  closing_time: string;
  min_order_value: number;
}

export default function AdminSettings({ onLogout }: Props) {
  const { colors } = useTheme();
  const [settings, setSettings] = useState<Settings>({
    opening_time: '9:00 AM',
    closing_time: '4:45 PM',
    min_order_value: 50,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editModal, setEditModal] = useState<{ field: keyof Settings; value: string } | null>(null);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  // Remove leading zero from time (08:00 AM -> 8:00 AM)
  const formatTime = (time: string): string => {
    return time.replace(/^0(\d):/, '$1:');
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('business_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        setSettingsId(data.id);
        setSettings({
          opening_time: formatTime(data.opening_time || '9:00 AM'),
          closing_time: formatTime(data.closing_time || '4:45 PM'),
          min_order_value: data.min_order_value || 50,
        });
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveSetting = async (field: keyof Settings, value: string | number) => {
    setSaving(true);
    try {
      // Validate time format if it's a time field
      if ((field === 'opening_time' || field === 'closing_time') && typeof value === 'string') {
        const timeRegex = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;
        if (!timeRegex.test(value)) {
          Alert.alert('Invalid Format', 'Please enter time in HH:MM AM/PM format (e.g., 9:00 AM)');
          setSaving(false);
          return;
        }
      }

      console.log('=== SAVE SETTING DEBUG ===');
      console.log('Field:', field);
      console.log('Value:', value);
      console.log('Settings ID:', settingsId);
      
      // Get current user session
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user?.email);
      console.log('User ID:', user?.id);

      if (!settingsId) {
        Alert.alert('Error', 'Settings ID not found. Please reload the page.');
        return;
      }

      // Check admin status first
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user?.id)
        .single();
      
      console.log('Profile data:', profileData);
      console.log('Profile error:', profileError);
      console.log('Is admin:', profileData?.is_admin);

      if (!profileData?.is_admin) {
        Alert.alert('Error', 'You do not have admin privileges. Please contact support.');
        return;
      }

      // Format time values - database stores in 12-hour format (e.g., "9:00 AM")
      const formattedValue = (field === 'opening_time' || field === 'closing_time') 
        ? formatTime(String(value))
        : value;

      console.log('Formatted value for database:', formattedValue);

      // Update using the actual UUID from the database
      const { data, error } = await supabase
        .from('business_settings')
        .update({ [field]: formattedValue })
        .eq('id', settingsId)
        .select();

      console.log('Update response data:', data);
      console.log('Update response error:', error);

      if (error) {
        console.error('Update error:', error);
        Alert.alert('Error', `Failed to save: ${error.message}\nCode: ${error.code}\nDetails: ${error.details || 'No details'}\nHint: ${error.hint || 'No hint'}`);
        throw error;
      }

      if (!data || data.length === 0) {
        Alert.alert('Error', 'No rows updated. Check RLS policies - admin status may not be set correctly.');
        throw new Error('No rows updated - check RLS policies');
      }

      setSettings(prev => ({ ...prev, [field]: value }));
      Alert.alert('Success', 'Setting saved successfully!');
      setEditModal(null);
      
      // Reload to confirm
      await loadSettings();
    } catch (err: any) {
      console.error('Save setting error:', err);
      Alert.alert('Error', err.message || 'Failed to save setting');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (field: keyof Settings) => {
    setEditModal({ field, value: String(settings[field]) });
  };

  if (loading) {
    return (
      <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.content, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Configure your canteen settings and preferences</Text>
      </View>

      <View style={styles.settingsSection}>
        <Text style={[styles.settingsTitle, { color: colors.text }]}>Business Settings</Text>

        <TouchableOpacity 
          style={[styles.settingItem, { backgroundColor: colors.surface }]}
          onPress={() => openEditModal('opening_time')}
        >
          <View>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Opening Time</Text>
            <Text style={[styles.settingValue, { color: colors.textSecondary }]}>{settings.opening_time}</Text>
          </View>
          <Text style={styles.settingIcon}>✏️</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.settingItem, { backgroundColor: colors.surface }]}
          onPress={() => openEditModal('closing_time')}
        >
          <View>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Closing Time</Text>
            <Text style={[styles.settingValue, { color: colors.textSecondary }]}>{settings.closing_time}</Text>
          </View>
          <Text style={styles.settingIcon}>✏️</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.settingItem, { backgroundColor: colors.surface }]}
          onPress={() => openEditModal('min_order_value')}
        >
          <View>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Minimum Order Value</Text>
            <Text style={[styles.settingValue, { color: colors.textSecondary }]}>₹{settings.min_order_value}</Text>
          </View>
          <Text style={styles.settingIcon}>✏️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.settingsSection}>
        <Text style={[styles.settingsTitle, { color: colors.text }]}>App Settings</Text>

        <TouchableOpacity style={[styles.settingItem, { backgroundColor: colors.surface }]}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>About DineDesk</Text>
          <Text style={styles.settingIcon}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.settingItem, { backgroundColor: colors.surface }]}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>Terms & Conditions</Text>
          <Text style={styles.settingIcon}>→</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.logoutBtn, { backgroundColor: colors.danger }]} 
        onPress={onLogout}
        disabled={saving}
      >
        <Text style={styles.logoutBtnText}>🚪 Logout</Text>
      </TouchableOpacity>

      {/* Edit Modal */}
      <Modal visible={!!editModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Edit {editModal?.field.replace('_', ' ').toUpperCase()}
            </Text>
            
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text }]}
              value={editModal?.value}
              onChangeText={(text) => setEditModal(prev => prev ? { ...prev, value: text } : null)}
              placeholder={editModal?.field === 'min_order_value' ? 'Enter amount' : 'HH:MM AM/PM'}
              keyboardType={editModal?.field === 'min_order_value' ? 'numeric' : 'default'}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.textSecondary }]}
                onPress={() => setEditModal(null)}
                disabled={saving}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  if (editModal) {
                    const value = editModal.field === 'min_order_value' 
                      ? Number(editModal.value) 
                      : editModal.value;
                    saveSetting(editModal.field, value);
                  }
                }}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.modalButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingBottom: 70 },
  header: { 
    paddingHorizontal: 20, 
    paddingTop: 50, 
    paddingBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: '900',
    letterSpacing: -0.8,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  settingsSection: { paddingHorizontal: 16, paddingVertical: 16 },
  settingsTitle: { fontSize: 16, fontWeight: '800', marginBottom: 14, letterSpacing: -0.3 },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 16, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
  settingLabel: { fontSize: 15, fontWeight: '600' },
  settingValue: { fontSize: 13, marginTop: 4, fontWeight: '500' },
  settingIcon: { fontSize: 18 },
  logoutBtn: { marginHorizontal: 16, marginVertical: 16, borderRadius: 14, paddingVertical: 16, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  logoutBtnText: { color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 0.3 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', padding: 24, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  modalInput: { padding: 16, borderRadius: 14, fontSize: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalButton: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  modalButtonText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
