import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../lib/supabase';

export default function SelectRole({ navigation, route }: any) {
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'Student' | 'Staff' | null>(null);
  const userId = route?.params?.userId;

  const handleRoleSelection = async () => {
    if (!selectedRole) {
      Alert.alert('Please Select', 'Choose either Student or Staff to continue');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'User ID not found');
      return;
    }

    setLoading(true);

    try {
      // Get current user data
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData?.user) {
        throw new Error('Failed to get user data');
      }

      const user = userData.user;

      // Create profile with selected role
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: userId,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            email: user.email,
            role: selectedRole,
            is_active: true,
          },
        ]);

      if (profileError) {
        // If profile already exists, update it
        if (profileError.code === '23505') {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ role: selectedRole })
            .eq('id', userId);

          if (updateError) {
            throw updateError;
          }
        } else {
          throw profileError;
        }
      }

      // Update user metadata with role
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { role: selectedRole },
      });

      if (metadataError) {
        console.warn('Failed to update user metadata:', metadataError);
      }

      setLoading(false);
      
      Alert.alert(
        '✅ Welcome!',
        `Your account has been set up as ${selectedRole}`,
        [
          {
            text: 'Continue',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'UserDashboard' }],
              });
            },
          },
        ]
      );
    } catch (error: any) {
      setLoading(false);
      console.error('Role selection error:', error);
      Alert.alert('Error', error.message || 'Failed to set up your account');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Choose Your Role</Text>
        <Text style={styles.subtitle}>
          Select how you'll be using DineDesk
        </Text>

        <TouchableOpacity
          style={[
            styles.roleCard,
            selectedRole === 'Student' && styles.roleCardSelected,
          ]}
          onPress={() => setSelectedRole('Student')}
          disabled={loading}
        >
          <View style={styles.roleIcon}>
            <Text style={styles.roleEmoji}>📚</Text>
          </View>
          <View style={styles.roleContent}>
            <Text style={styles.roleTitle}>Student</Text>
            <Text style={styles.roleDescription}>
              Order food from the canteen
            </Text>
          </View>
          {selectedRole === 'Student' && (
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.roleCard,
            selectedRole === 'Staff' && styles.roleCardSelected,
          ]}
          onPress={() => setSelectedRole('Staff')}
          disabled={loading}
        >
          <View style={styles.roleIcon}>
            <Text style={styles.roleEmoji}>👨‍💼</Text>
          </View>
          <View style={styles.roleContent}>
            <Text style={styles.roleTitle}>Staff</Text>
            <Text style={styles.roleDescription}>
              Use canteen as staff member
            </Text>
          </View>
          {selectedRole === 'Staff' && (
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedRole && styles.continueButtonDisabled,
          ]}
          onPress={handleRoleSelection}
          disabled={!selectedRole || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.continueButtonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 26,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  roleCardSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  roleIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  roleEmoji: {
    fontSize: 32,
  },
  roleContent: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  continueButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  continueButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
