import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, Image, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../../shared/context/AuthContext';
import { useTheme } from '../../../shared/context/ThemeContext';
import { apiService } from '../../../shared/api/axios';
import { ModernHeader } from '../../components/ModernHeader/ModernHeader';

export const ProfileScreen: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const { colors, mode, toggleTheme } = useTheme();
  const [showFAQ, setShowFAQ] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
  const [profileImage, setProfileImage] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout }
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh user profile data
      const response = await apiService.getProfile();
      if (response.data.status && response.data.data) {
        updateUser(response.data.data);
        setProfileForm({
          name: response.data.data.name,
          email: response.data.data.email,
          phone: response.data.data.phone || ''
        });
      }
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    } finally {
      setRefreshing(false);
    }
  };


  const menuItems = [
    {
      id: 'edit',
      title: 'Edit Profile',
      icon: 'person-outline',
      onPress: () => {
        console.log('Edit Profile pressed');
        setShowEditProfile(true);
      },
    },
    {
      id: 'password',
      title: 'Change Password',
      icon: 'lock-closed-outline',
      onPress: () => {
        console.log('Change Password pressed');
        setShowChangePassword(true);
      },
    },
    {
      id: 'theme',
      title: 'Dark Mode',
      icon: mode === 'dark' ? 'moon' : 'sunny',
      onPress: toggleTheme,
      hasSwitch: true,
      switchValue: mode === 'dark',
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: 'help-circle-outline',
      onPress: () => Alert.alert('Help & Support', 'For any issues or assistance, please contact your organization directly. They will be able to help you with account-related questions, technical support, and operational guidance.'),
    },
    {
      id: 'faq',
      title: 'FAQ',
      icon: 'chatbubble-ellipses-outline',
      onPress: () => {
        console.log('FAQ pressed');
        setShowFAQ(true);
      },
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      icon: 'shield-checkmark-outline',
      onPress: () => {
        console.log('Privacy Policy pressed');
        setShowPrivacyPolicy(true);
      },
    },
  ];

  const faqData = [
    {
      question: 'How do I mark a pickup as completed?',
      answer: 'Go to Today or Weekly screen, find the client in your list, and tap the "Mark as Picked" button. You must be active on the client\'s route to mark pickups.'
    },
    {
      question: 'How do I activate on a route?',
      answer: 'Navigate to Route Selection screen, browse available routes, tap the three-dot menu next to your desired route, and select "Activate". You can only be active on one route at a time.'
    },
    {
      question: 'How do I issue bags to clients?',
      answer: 'Go to Bag Transfer screen, tap "Issue Bags to Client", select the client from your route, enter the number of bags and client\'s email. An OTP will be sent to the client for verification.'
    },
    {
      question: 'How do I transfer bags to another driver?',
      answer: 'In Bag Transfer screen, tap "Transfer Bags", select the receiving driver, enter the number of bags to transfer. The receiving driver will get an OTP to complete the transfer.'
    },
    {
      question: 'What does "missed" status mean?',
      answer: 'A pickup shows as "missed" when the scheduled pickup day has passed but the pickup was not completed. You can still mark missed pickups as completed.'
    },
    {
      question: 'Why can\'t I see some clients in my pickup list?',
      answer: 'You can only see clients assigned to your currently active route. Make sure you\'re activated on the correct route in Route Selection screen.'
    },
    {
      question: 'How do I filter pickups by route?',
      answer: 'In Today or Weekly screens, use the "Route" dropdown filter to view pickups from specific routes. Select "All Routes" to see pickups from all routes.'
    },
    {
      question: 'What\'s the difference between Today and Weekly screens?',
      answer: 'Today screen shows pickups scheduled for the current date only. Weekly screen shows all pickups for the current week, with additional "Missed" filter for overdue pickups.'
    },
    {
      question: 'How do I change my password?',
      answer: 'Go to Profile screen, tap "Change Password", enter your current password and new password twice. Your new password must be at least 6 characters long.'
    },
    {
      question: 'Can I work on multiple routes simultaneously?',
      answer: 'No, you can only be active on one route at a time. To switch routes, deactivate from your current route and activate on a new one in Route Selection screen.'
    }
  ];

  const privacyPolicyText = `Driver Privacy Policy & Guidelines

Last updated: ${new Date().toLocaleDateString()}

As a driver using this waste management system, it's important to understand what information should remain private and confidential.

1. CLIENT INFORMATION - KEEP PRIVATE
• Never share client names, addresses, or contact details with unauthorized persons
• Do not discuss client pickup schedules or waste patterns with others
• Client payment information and account details are strictly confidential
• Do not take photos of client properties without permission

2. ROUTE INFORMATION - KEEP PRIVATE
• Route details, schedules, and client lists are proprietary to your organization
• Do not share route maps or pickup locations with competitors
• Keep route optimization strategies confidential
• Driver assignments and route changes should not be discussed publicly

3. SYSTEM ACCESS - KEEP SECURE
• Never share your login credentials with anyone
• Log out of the app when not in use, especially on shared devices
• Report any suspicious activity or unauthorized access immediately
• Use strong passwords and change them regularly

4. OPERATIONAL DATA - KEEP CONFIDENTIAL
• Pickup completion rates and performance metrics are internal information
• Bag inventory levels and transfer records should not be shared externally
• Organization policies and procedures are confidential
• Financial information related to routes or clients is strictly private

5. WHAT YOU CAN SHARE
• General information about waste management best practices
• Environmental benefits of proper waste collection
• Your role as a professional driver (without specific details)
• Safety tips and general industry knowledge

6. REPORTING VIOLATIONS
If you notice any privacy breaches or unauthorized information sharing, report immediately to your organization's management.

Remember: Protecting client and organizational privacy is part of your professional responsibility as a driver.`;

  const handleImagePicker = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setProfileImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters long');
      return;
    }

    try {
      setUpdating(true);
      await apiService.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        verificationCode: '000000' // You might need to implement OTP verification
      });
      
      Alert.alert('Success', 'Password changed successfully');
      setShowChangePassword(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to change password');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!profileForm.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    try {
      setUpdating(true);
      const formData = new FormData();
      formData.append('name', profileForm.name);
      formData.append('email', profileForm.email);
      if (profileForm.phone) formData.append('phone', profileForm.phone);
      
      if (profileImage) {
        formData.append('profile_image', {
          uri: profileImage.uri,
          type: 'image/jpeg',
          name: 'profile.jpg',
        } as any);
      }

      const response = await apiService.post('/auth/update-profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Update user context with new data
      if (response.data.status && response.data.data?.user) {
        updateUser(response.data.data.user);
        // Update profile form with new data
        setProfileForm({
          name: response.data.data.user.name,
          email: response.data.data.user.email,
          phone: response.data.data.user.phone || ''
        });
      }
      
      Alert.alert('Success', 'Profile updated successfully');
      setShowEditProfile(false);
      setProfileImage(null);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <ModernHeader />
      
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              {user?.profile_image ? (
                <Image source={{ uri: user.profile_image }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0)?.toUpperCase() || 'D'}
                </Text>
              )}
            </View>
          </View>
          
          <Text style={[styles.userName, { color: colors.text }]}>
            {user?.name || 'Driver Name'}
          </Text>
          <Text style={[styles.userRole, { color: colors.textSecondary }]}>
            {user?.role?.toUpperCase() || 'DRIVER'}
          </Text>
          
          {user?.email && (
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
              {user.email}
            </Text>
          )}
        </View>



        {/* Menu Items */}
        <View style={[styles.menuCard, { backgroundColor: colors.cardBackground }]}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index < menuItems.length - 1 && { borderBottomColor: colors.border }
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon as any} size={24} color={colors.textSecondary} />
                <Text style={[styles.menuItemText, { color: colors.text }]}>
                  {item.title}
                </Text>
              </View>
              
              {item.hasSwitch ? (
                <View style={[
                  styles.switch,
                  { backgroundColor: item.switchValue ? colors.primary : colors.border }
                ]}>
                  <View style={[
                    styles.switchThumb,
                    {
                      backgroundColor: 'white',
                      transform: [{ translateX: item.switchValue ? 16 : 0 }]
                    }
                  ]} />
                </View>
              ) : (
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.error }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out" size={24} color="white" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
      
      {/* FAQ Modal */}
      <Modal visible={showFAQ} animationType="none" onRequestClose={() => setShowFAQ(false)}>
        <View style={[styles.fullScreenModal, { backgroundColor: colors.background }]}>
          <View style={[styles.fullScreenHeader, { backgroundColor: colors.surface }]}>
            <TouchableOpacity onPress={() => setShowFAQ(false)} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.fullScreenTitle, { color: colors.text }]}>FAQ</Text>
            <View style={styles.headerSpacer} />
          </View>
          
          <ScrollView style={styles.fullScreenContent}>
            {faqData.map((item, index) => (
              <View key={index} style={[styles.faqItem, { borderBottomColor: colors.border }]}>
                <Text style={[styles.faqQuestion, { color: colors.text }]}>{item.question}</Text>
                <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{item.answer}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
      
      {/* Change Password Modal */}
      <Modal visible={showChangePassword} animationType="none" onRequestClose={() => setShowChangePassword(false)}>
        <View style={[styles.fullScreenModal, { backgroundColor: colors.background }]}>
          <View style={[styles.fullScreenHeader, { backgroundColor: colors.surface }]}>
            <TouchableOpacity onPress={() => setShowChangePassword(false)} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.fullScreenTitle, { color: colors.text }]}>Change Password</Text>
            <View style={styles.headerSpacer} />
          </View>
          
          <ScrollView style={styles.fullScreenContent}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Current Password</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={[styles.passwordInput, { backgroundColor: colors.surface, color: colors.text }]}
                  secureTextEntry={!showCurrentPassword}
                  value={passwordForm.currentPassword}
                  onChangeText={(text) => setPasswordForm({...passwordForm, currentPassword: text})}
                  placeholder="Enter current password"
                  placeholderTextColor={colors.textSecondary}
                />
                <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)} style={styles.eyeButton}>
                  <Ionicons name={showCurrentPassword ? 'eye-off' : 'eye'} size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>New Password</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={[styles.passwordInput, { backgroundColor: colors.surface, color: colors.text }]}
                  secureTextEntry={!showNewPassword}
                  value={passwordForm.newPassword}
                  onChangeText={(text) => setPasswordForm({...passwordForm, newPassword: text})}
                  placeholder="Enter new password"
                  placeholderTextColor={colors.textSecondary}
                />
                <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeButton}>
                  <Ionicons name={showNewPassword ? 'eye-off' : 'eye'} size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Confirm New Password</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={[styles.passwordInput, { backgroundColor: colors.surface, color: colors.text }]}
                  secureTextEntry={!showConfirmPassword}
                  value={passwordForm.confirmPassword}
                  onChangeText={(text) => setPasswordForm({...passwordForm, confirmPassword: text})}
                  placeholder="Confirm new password"
                  placeholderTextColor={colors.textSecondary}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton}>
                  <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
            
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleChangePassword}
              disabled={updating}
            >
              <Text style={styles.submitButtonText}>
                {updating ? 'Updating...' : 'Change Password'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
      
      {/* Edit Profile Modal */}
      <Modal visible={showEditProfile} animationType="none" onRequestClose={() => setShowEditProfile(false)}>
        <View style={[styles.fullScreenModal, { backgroundColor: colors.background }]}>
          <View style={[styles.fullScreenHeader, { backgroundColor: colors.surface }]}>
            <TouchableOpacity onPress={() => setShowEditProfile(false)} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.fullScreenTitle, { color: colors.text }]}>Edit Profile</Text>
            <View style={styles.headerSpacer} />
          </View>
          
          <ScrollView style={styles.fullScreenContent}>
            <View style={styles.profileImageSection}>
              <TouchableOpacity onPress={handleImagePicker} style={styles.imagePickerButton}>
                <View style={[styles.imagePreview, { backgroundColor: colors.surface }]}>
                  {profileImage ? (
                    <Image source={{ uri: profileImage.uri }} style={styles.previewImage} />
                  ) : user?.profile_image ? (
                    <Image source={{ uri: user.profile_image }} style={styles.previewImage} />
                  ) : (
                    <View style={[styles.placeholderImage, { backgroundColor: colors.primary }]}>
                      <Text style={styles.placeholderText}>
                        {profileForm.name?.charAt(0)?.toUpperCase() || 'D'}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.imagePickerText, { color: colors.primary }]}>Change Photo</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Name</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text }]}
                value={profileForm.name}
                onChangeText={(text) => setProfileForm({...profileForm, name: text})}
                placeholder="Enter your name"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Email</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text }]}
                value={profileForm.email}
                onChangeText={(text) => setProfileForm({...profileForm, email: text})}
                placeholder="Enter your email"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Phone</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text }]}
                value={profileForm.phone}
                onChangeText={(text) => setProfileForm({...profileForm, phone: text})}
                placeholder="Enter your phone number"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
              />
            </View>
            
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleUpdateProfile}
              disabled={updating}
            >
              <Text style={styles.submitButtonText}>
                {updating ? 'Updating...' : 'Update Profile'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
      
      {/* Privacy Policy Modal */}
      <Modal visible={showPrivacyPolicy} animationType="none" onRequestClose={() => setShowPrivacyPolicy(false)}>
        <View style={[styles.fullScreenModal, { backgroundColor: colors.background }]}>
          <View style={[styles.fullScreenHeader, { backgroundColor: colors.surface }]}>
            <TouchableOpacity onPress={() => setShowPrivacyPolicy(false)} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.fullScreenTitle, { color: colors.text }]}>Privacy Policy</Text>
            <View style={styles.headerSpacer} />
          </View>
          
          <ScrollView style={styles.fullScreenContent}>
            <Text style={[styles.privacyText, { color: colors.text }]}>{privacyPolicyText}</Text>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 16,
  },

  menuCard: {
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 16,
    fontWeight: '500',
  },
  switch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 100,
  },
  logoutText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faqModal: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    padding: 20,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  faqTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  faqContent: {
    flex: 1,
  },
  faqItem: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    lineHeight: 24,
  },
  faqAnswer: {
    fontSize: 15,
    lineHeight: 22,
  },
  modalContent: {
    width: '90%',
    maxHeight: '85%',
    borderRadius: 12,
    padding: 20,
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalScrollContent: {
    maxHeight: 400,
    paddingHorizontal: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  submitButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  profileImageSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  imagePickerButton: {
    alignItems: 'center',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 8,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  imagePickerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  privacyText: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 20,
  },
  fullScreenModal: {
    flex: 1,
  },
  fullScreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  fullScreenTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  fullScreenContent: {
    flex: 1,
    padding: 20,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  passwordInput: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    padding: 8,
  },
});