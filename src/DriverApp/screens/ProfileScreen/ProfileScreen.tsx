import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, Image, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../../shared/context/AuthContext';
import { useTheme } from '../../../shared/context/ThemeContext';
import { apiService } from '../../../shared/api/axios';
import { ModernHeader } from '../../components/ModernHeader/ModernHeader';

// Type definitions
interface ApiResponse<T> {
  status: boolean;
  data?: T;
  message?: string;
}

export const ProfileScreen: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const { colors, mode, toggleTheme } = useTheme();
  const [showFAQ, setShowFAQ] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
  const [originalForm, setOriginalForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
  const [profileImage, setProfileImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [updating, setUpdating] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [hasFormChanges, setHasFormChanges] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showImageViewer, setShowImageViewer] = useState(false);
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
      if (response.data && 'status' in response.data && response.data.status && response.data.data) {
        updateUser(response.data.data);
        const newFormData = {
          name: response.data.data.name,
          email: response.data.data.email,
          phone: response.data.data.phone || ''
        };
        setProfileForm(newFormData);
        setOriginalForm(newFormData);
        setHasFormChanges(false);
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
        const formData = {
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || ''
      };
      setProfileForm(formData);
      setOriginalForm(formData);
      setHasFormChanges(false);
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
        setImagePreview(result.assets[0].uri);
        await handlePhotoUpload(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handlePhotoUpload = async (image: ImagePicker.ImagePickerAsset) => {
    try {
      setUploadingPhoto(true);
      
      const formData = new FormData();
      formData.append('profile_image', {
        uri: image.uri,
        type: image.mimeType || 'image/jpeg',
        name: 'profile.jpg',
      } as any);
      
      // Use fetch instead of axios for FormData to avoid interceptor issues
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch('http://192.168.1.189:8000/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.status && data.data?.user) {
        updateUser(data.data.user);
        setImagePreview(null);
        Alert.alert('Success', 'Profile photo updated successfully!');
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error: any) {
      setImagePreview(null); // Clear preview on error
      Alert.alert('Error', error.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const checkFormChanges = (newForm: typeof profileForm) => {
    const hasChanges = newForm.name !== originalForm.name || 
                      newForm.email !== originalForm.email || 
                      newForm.phone !== originalForm.phone;
    setHasFormChanges(hasChanges);
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
      const requestData = {
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone || null,
      };

      const response = await apiService.post('/auth/update-profile', requestData);
      
      if (response.data.status && response.data.data?.user) {
        updateUser(response.data.data.user);
        const newFormData = {
          name: response.data.data.user.name,
          email: response.data.data.user.email,
          phone: response.data.data.user.phone || ''
        };
        setProfileForm(newFormData);
        setOriginalForm(newFormData);
        setHasFormChanges(false);
      }
      
      Alert.alert('Success', 'Profile updated successfully');
      setShowEditProfile(false);
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
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={() => user && 'profile_image' in user && user.profile_image && setShowImageViewer(true)}
            disabled={!user || !('profile_image' in user) || !user.profile_image}
          >
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              {user && 'profile_image' in user && user.profile_image ? (
                <Image 
                  source={{ uri: user.profile_image as string }} 
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0)?.toUpperCase() || 'D'}
                </Text>
              )}
            </View>
          </TouchableOpacity>
          
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
              <TouchableOpacity onPress={handleImagePicker} style={styles.imagePickerButton} disabled={uploadingPhoto}>
                <View style={[styles.imagePreview, { backgroundColor: colors.surface }]}>
                  {imagePreview ? (
                    <Image source={{ uri: imagePreview }} style={styles.previewImage} />
                  ) : user && 'profile_image' in user && user.profile_image ? (
                    <Image source={{ uri: user.profile_image as string }} style={styles.previewImage} />
                  ) : (
                    <View style={[styles.placeholderImage, { backgroundColor: colors.primary }]}>
                      <Text style={styles.placeholderText}>
                        {profileForm.name?.charAt(0)?.toUpperCase() || 'D'}
                      </Text>
                    </View>
                  )}
                  {uploadingPhoto && (
                    <View style={styles.uploadingOverlay}>
                      <Text style={styles.uploadingText}>Uploading...</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.imagePickerText, { color: uploadingPhoto ? colors.textSecondary : colors.primary }]}>
                  {uploadingPhoto ? 'Uploading...' : 'Change Photo'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Name</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                value={profileForm.name}
                onChangeText={(text) => {
                  const newForm = {...profileForm, name: text};
                  setProfileForm(newForm);
                  checkFormChanges(newForm);
                }}
                placeholder="Enter your name"
                placeholderTextColor={colors.textSecondary}
                editable={!updating}
                autoCapitalize="words"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Email</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                value={profileForm.email}
                onChangeText={(text) => {
                  const newForm = {...profileForm, email: text};
                  setProfileForm(newForm);
                  checkFormChanges(newForm);
                }}
                placeholder="Enter your email"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                editable={!updating}
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Phone</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                value={profileForm.phone}
                onChangeText={(text) => {
                  const newForm = {...profileForm, phone: text};
                  setProfileForm(newForm);
                  checkFormChanges(newForm);
                }}
                placeholder="Enter your phone number"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
                editable={!updating}
              />
            </View>
            
            <TouchableOpacity
              style={[styles.submitButton, { 
                backgroundColor: hasFormChanges ? colors.primary : colors.border,
                opacity: hasFormChanges ? 1 : 0.6
              }]}
              onPress={handleUpdateProfile}
              disabled={updating || !hasFormChanges}
            >
              <Text style={[styles.submitButtonText, {
                color: hasFormChanges ? 'white' : colors.textSecondary
              }]}>
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
      
      {/* Image Viewer Modal */}
      <Modal visible={showImageViewer} animationType="fade" onRequestClose={() => setShowImageViewer(false)}>
        <View style={styles.imageViewerModal}>
          <TouchableOpacity 
            style={styles.imageViewerClose}
            onPress={() => setShowImageViewer(false)}
          >
            <Ionicons name="close" as any size={30} color="white" />
          </TouchableOpacity>
          {user && 'profile_image' in user && user.profile_image ? (
            <Image 
              source={{ uri: user.profile_image as string }} 
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          ) : null}
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
    overflow: 'hidden',
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
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
  },
  uploadingText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
  imageViewerModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    padding: 10,
  },
  fullScreenImage: {
    width: '90%',
    height: '80%',
  },
});