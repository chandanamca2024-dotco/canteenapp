import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  Modal,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { supabase } from '../../lib/supabase';

interface BusinessSettings {
  openingTime: string;
  closingTime: string;
  minOrderValue: number;
}

export const Profile: React.FC<{
  toggleTheme: () => void;
  onLogout: () => void;
  businessSettings?: BusinessSettings;
  onBusinessSettingsUpdate?: (settings: BusinessSettings) => void;
}> = ({ toggleTheme, onLogout, businessSettings, onBusinessSettingsUpdate }) => {
  const { colors, isDark, tokens } = useTheme();
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showBusinessSettings, setShowBusinessSettings] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [settings, setSettings] = useState<BusinessSettings>(
    businessSettings || {
      openingTime: '9:00 AM',
      closingTime: '4:45 PM',
      minOrderValue: 50,
    }
  );

  // Load business settings from database on component mount
  React.useEffect(() => {
    const loadBusinessSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('business_settings')
          .select('opening_time, closing_time, min_order_value')
          .limit(1)
          .maybeSingle();

        if (data && !error) {
          setSettings({
            openingTime: data.opening_time || '9:00 AM',
            closingTime: data.closing_time || '4:45 PM',
            minOrderValue: data.min_order_value || 50,
          });
        }
      } catch (err) {
        console.error('Error loading business settings:', err);
      }
    };

    loadBusinessSettings();
  }, []);

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Success', 'Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordChange(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to change password');
    }
  };

  const handleSaveBusinessSettings = async () => {
    if (!settings.openingTime || !settings.closingTime || !settings.minOrderValue) {
      Alert.alert('Error', 'Please fill in all business settings');
      return;
    }

    try {
      // Save to database
      const { error } = await supabase
        .from('business_settings')
        .update({
          opening_time: settings.openingTime,
          closing_time: settings.closingTime,
          min_order_value: settings.minOrderValue,
        })
        .eq('id', (await supabase.from('business_settings').select('id').limit(1).maybeSingle()).data?.id);

      if (error) {
        Alert.alert('Error', 'Failed to save settings: ' + error.message);
        return;
      }

      if (onBusinessSettingsUpdate) {
        onBusinessSettingsUpdate(settings);
      }

      Alert.alert('Success', 'Business settings updated successfully!');
      setShowBusinessSettings(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to save business settings');
      console.error('Error saving settings:', err);
    }
  };

  return (
    <ScrollView style={[styles.content, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profile & Settings</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Manage your account and business settings</Text>
      </View>

      {/* Profile Card */}
      <View style={[styles.profileCard, { backgroundColor: colors.surface, borderRadius: tokens.radius.xl }, tokens.shadow.card]}>
        <View style={styles.profileTop}>
          <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatar}>👨‍💼</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>Admin User</Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
              admin@dinedesk.com
            </Text>
            <View style={[styles.roleBadge, { backgroundColor: colors.primary + '15' }]}>
              <Text style={[styles.roleText, { color: colors.primary }]}>👑 Administrator</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Business Settings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Business Settings</Text>
          <TouchableOpacity onPress={() => setShowBusinessSettings(true)}>
            <Text style={[styles.editLink, { color: colors.primary }]}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.settingItem, { backgroundColor: colors.surface, borderRadius: tokens.radius.md }, tokens.shadow.card]}>
          <View>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Opening Time</Text>
            <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
              {settings.openingTime}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.settingItem,
            {
              backgroundColor: colors.primary + '15',
              borderLeftWidth: 4,
              borderLeftColor: colors.primary,
            },
          ]}
        >
          <View>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Closing Time</Text>
            <Text style={[styles.settingValue, { color: colors.primary, fontWeight: '700' }]}>
              {settings.closingTime}
            </Text>
          </View>
        </View>

        <View style={[styles.settingItem, { backgroundColor: colors.surface, borderRadius: tokens.radius.md }, tokens.shadow.card]}>
          <View>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Minimum Order</Text>
            <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
              ₹{settings.minOrderValue}
            </Text>
          </View>
        </View>
      </View>

      {/* Theme Settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences</Text>

        <View
          style={[
            styles.settingItem,
            { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
          ]}
        >
          <View style={styles.settingLeft}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Theme</Text>
            <Text style={[styles.settingSubtext, { color: colors.textSecondary }]}>
              {isDark ? 'Enabled' : 'Disabled'}
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#767577', true: colors.primary }}
            thumbColor={isDark ? colors.primary : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Security Settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Security</Text>

        {!showPasswordChange ? (
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: colors.surface }]}
            onPress={() => setShowPasswordChange(true)}
          >
            <View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Change Password
              </Text>
              <Text style={[styles.settingSubtext, { color: colors.textSecondary }]}>
                Update your password
              </Text>
            </View>
            <Text style={styles.settingIcon}>→</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.passwordForm, { backgroundColor: colors.surface }]}>
            <Text style={[styles.passwordFormTitle, { color: colors.text }]}>
              Change Password
            </Text>

            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Current Password
            </Text>
            <TextInput
              style={[styles.passwordInput, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="Enter your current password"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />

            <Text style={[styles.inputLabel, { color: colors.text }]}>New Password</Text>
            <TextInput
              style={[styles.passwordInput, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="Enter a new password (at least 6 characters)"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Confirm Password
            </Text>
            <TextInput
              style={[styles.passwordInput, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="Re-enter your new password"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <View style={styles.passwordActions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { backgroundColor: colors.background }]}
                onPress={() => {
                  setShowPasswordChange(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.updateBtn, { backgroundColor: colors.primary }]}
                onPress={handlePasswordChange}
              >
                <Text style={styles.updateBtnText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Business Settings Modal */}
      <Modal visible={showBusinessSettings} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Business Settings
              </Text>
              <TouchableOpacity onPress={() => setShowBusinessSettings(false)}>
                <Text style={[styles.closeBtn, { color: colors.text }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Opening Time</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
                placeholder="Enter opening time in HH:MM AM/PM format"
                placeholderTextColor={colors.textSecondary}
                value={settings.openingTime}
                onChangeText={(text) => setSettings({ ...settings, openingTime: text })}
              />

              <Text style={[styles.label, { color: colors.text }]}>Closing Time</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
                placeholder="Enter closing time in HH:MM AM/PM format"
                placeholderTextColor={colors.textSecondary}
                value={settings.closingTime}
                onChangeText={(text) => setSettings({ ...settings, closingTime: text })}
              />

              <Text style={[styles.label, { color: colors.text }]}>Minimum Order Value (₹)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
                placeholder="Enter the minimum order value in rupees"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                value={String(settings.minOrderValue)}
                onChangeText={(text) =>
                  setSettings({ ...settings, minOrderValue: parseInt(text) || 0 })
                }
              />

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveBusinessSettings}
              >
                <Text style={styles.submitBtnText}>✓ Save Settings</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.cancelSubmitBtn, { backgroundColor: colors.background, borderColor: colors.text }]}
                onPress={() => setShowBusinessSettings(false)}
              >
                <Text style={[styles.cancelSubmitBtnText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Logout */}
      <TouchableOpacity
        style={[styles.logoutBtn, { backgroundColor: colors.danger }]}
        onPress={() =>
          Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Logout',
              style: 'destructive',
              onPress: onLogout,
            },
          ])
        }
      >
        <Text style={styles.logoutBtnText}>🚪 Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingBottom: 70,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 16,
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
  profileCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatar: {
    fontSize: 40,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 13,
    marginBottom: 8,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  editLink: {
    fontSize: 13,
    fontWeight: '700',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 10,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  settingLeft: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingValue: {
    fontSize: 12,
  },
  settingSubtext: {
    fontSize: 12,
  },
  settingIcon: {
    fontSize: 16,
    fontWeight: '700',
  },
  passwordForm: {
    marginHorizontal: 16,
    borderRadius: 10,
    padding: 16,
  },
  passwordFormTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  passwordInput: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    marginBottom: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  passwordActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  updateBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  updateBtnText: {
    color: '#fff',
    fontSize: 14,
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
    marginBottom: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
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
  cancelSubmitBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  cancelSubmitBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  logoutBtn: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 20,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  logoutBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
