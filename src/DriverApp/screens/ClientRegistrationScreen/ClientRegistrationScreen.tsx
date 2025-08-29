import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar, Platform, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useTheme } from '../../../shared/context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { Input, Button } from '../../../shared/components';
import { apiService } from '../../../shared/api/axios';

interface ClientRegistrationScreenProps {
  onClose?: () => void;
}

export const ClientRegistrationScreen: React.FC<ClientRegistrationScreenProps> = ({ onClose }) => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    clientType: 'residential',
    monthlyRate: 0,
    numberOfUnits: 1,
    pickUpDay: 'wednesday',
    serviceStartDate: '',
    gracePeriod: 5,
  });
  const [routes, setRoutes] = useState<any[]>([]);
  const [routesLoaded, setRoutesLoaded] = useState(false);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showRoutePicker, setShowRoutePicker] = useState(false);
  const [showClientTypePicker, setShowClientTypePicker] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<any[]>([]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const pickUpDay = days[selectedDate.getDay()];
      setFormData(prev => ({ 
        ...prev, 
        serviceStartDate: dateString, 
        pickUpDay 
      }));
    }
  };

  const handleDocumentPicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        multiple: true,
        copyToCacheDirectory: true,
      });
      
      if (!result.canceled && result.assets) {
        // Filter out any invalid documents
        const validDocuments = result.assets.filter(doc => doc && doc.uri && doc.name);
        console.log('Selected documents:', validDocuments);
        setSelectedDocuments(validDocuments);
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to pick documents');
    }
  };

  const fetchRoutes = async () => {
    if (routesLoaded) return;
    
    setRoutesLoading(true);
    try {
      console.log('Fetching routes for client registration...');
      const response = await apiService.get('/organization/routes?page=1&limit=50');
      console.log('Routes response:', response.data);
      if (response.data?.status) {
        const routesData = response.data.data.data || [];
        setRoutes(routesData);
        setRoutesLoaded(true);
      }
    } catch (error) {
      console.error('Failed to fetch routes:', error);
      Alert.alert('Error', 'Failed to load routes. Please try again.');
    } finally {
      setRoutesLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.address || !selectedRoute || !formData.serviceStartDate || !formData.monthlyRate) {
      Alert.alert('Error', 'Please fill in all required fields including monthly rate');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Validate monthly rate
    if (isNaN(formData.monthlyRate) || formData.monthlyRate <= 0) {
      Alert.alert('Error', 'Please enter a valid monthly rate');
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('route', selectedRoute);
      formDataToSend.append('clientType', formData.clientType);
      formDataToSend.append('monthlyRate', (formData.monthlyRate || 0).toString());
      formDataToSend.append('numberOfUnits', (formData.numberOfUnits || 1).toString());
      formDataToSend.append('pickUpDay', formData.pickUpDay);
      formDataToSend.append('serviceStartDate', formData.serviceStartDate);
      formDataToSend.append('gracePeriod', (formData.gracePeriod || 5).toString());
      
      // Add documents as files to FormData
      if (selectedDocuments && selectedDocuments.length > 0) {
        console.log('Adding documents to FormData:', selectedDocuments.length);
        
        selectedDocuments.forEach((doc, index) => {
          if (doc && doc.uri && doc.name) {
            console.log(`Adding document ${index}:`, { uri: doc.uri, type: doc.mimeType, name: doc.name });
            
            // React Native FormData file format
            formDataToSend.append('documents[]', {
              uri: doc.uri,
              type: doc.mimeType || 'application/pdf',
              name: doc.name,
            } as any);
          }
        });
      }
      
      console.log('Sending FormData request with files');
      
      // apiService will auto-detect FormData and set proper headers
      const response = await apiService.post('/driver/register-client', formDataToSend);
      
      if (response.data.status) {
        Alert.alert('Success', 'Client registered successfully! The client account is pending approval by the organization.');
        onClose ? onClose() : navigation.goBack();
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      console.error('Error details:', error.response?.data?.details);
      
      let errorMessage = 'Failed to register client';
      if (error.response?.data?.details) {
        const details = error.response.data.details;
        errorMessage = details.map((detail: any) => `${detail.field}: ${detail.message}`).join('\n');
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Validation Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.headerBackground} barStyle="light-content" translucent={false} />
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => onClose ? onClose() : navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.headerText} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Register New Client</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        bounces={true}
        alwaysBounceVertical={true}
      >
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <Input
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              placeholder="Enter client's full name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <Input
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              placeholder="Enter email address"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <Input
              value={formData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <Input
              value={formData.address}
              onChangeText={(value) => handleInputChange('address', value)}
              placeholder="Enter full address"
              multiline
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Route *</Text>
            <TouchableOpacity 
              style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => {
                if (!routesLoaded) {
                  fetchRoutes();
                }
                setShowRoutePicker(true);
              }}
            >
              <Text style={[styles.pickerLabel, { color: selectedRoute ? colors.text : colors.textSecondary }]}>
                {routesLoading ? 'Loading routes...' : 
                 selectedRoute ? routes.find(r => r.id === selectedRoute)?.name || 'Select Route' : 
                 'Tap to load routes'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Service Start Date *</Text>
            <TouchableOpacity 
              style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.pickerLabel, { color: formData.serviceStartDate ? colors.text : colors.textSecondary }]}>
                {formData.serviceStartDate || 'Select Date'}
              </Text>
              <Ionicons name="calendar" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Client Type</Text>
            <TouchableOpacity 
              style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setShowClientTypePicker(true)}
            >
              <Text style={[styles.pickerLabel, { color: colors.text }]}>
                {formData.clientType === 'residential' ? 'Residential' : 'Commercial'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Monthly Rate (KSH) *</Text>
            <Input
              value={formData.monthlyRate > 0 ? formData.monthlyRate.toString() : ''}
              onChangeText={(value) => {
                const numValue = parseFloat(value);
                handleInputChange('monthlyRate', isNaN(numValue) ? 0 : numValue);
              }}
              placeholder="Enter monthly rate (required)"
              keyboardType="numeric"
            />
          </View>

          {formData.clientType === 'commercial' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Number of Units</Text>
              <Input
                value={formData.numberOfUnits.toString()}
                onChangeText={(value) => handleInputChange('numberOfUnits', parseInt(value) || 1)}
                placeholder="Enter number of units"
                keyboardType="numeric"
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Pickup Day</Text>
            <View style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.pickerLabel, { color: colors.text, textTransform: 'capitalize' }]}>
                {formData.pickUpDay}
              </Text>
              <Ionicons name="information-circle" size={16} color={colors.textSecondary} />
            </View>
            <Text style={[styles.helperText, { color: colors.textSecondary }]}>Automatically set based on service start date</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Grace Period (Days)</Text>
            <Input
              value={formData.gracePeriod.toString()}
              onChangeText={(value) => handleInputChange('gracePeriod', parseInt(value) || 5)}
              placeholder="Enter grace period (default: 5)"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Documents (Optional)</Text>
            <TouchableOpacity 
              style={[styles.documentButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleDocumentPicker}
            >
              <Ionicons name="document-attach" size={20} color={colors.primary} />
              <Text style={[styles.documentButtonText, { color: colors.text }]}>Upload Documents</Text>
            </TouchableOpacity>
            {selectedDocuments.length > 0 && (
              <View style={styles.documentsPreview}>
                <Text style={[styles.documentsCount, { color: colors.textSecondary }]}>
                  {selectedDocuments.length} document(s) selected
                </Text>
                {selectedDocuments.map((doc, index) => (
                  <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[styles.documentName, { color: colors.text, flex: 1 }]}>
                      • {doc.name}
                    </Text>
                    <TouchableOpacity 
                      onPress={() => {
                        setSelectedDocuments(prev => prev.filter((_, i) => i !== index));
                      }}
                      style={{ padding: 4 }}
                    >
                      <Ionicons name="close-circle" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          <Button
            title="Register Client"
            onPress={handleRegister}
            loading={loading}
          />
        </View>
      </ScrollView>

      {/* Date Picker */}
      {showDatePicker && (
        <Modal visible={showDatePicker} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.datePickerContainer, { backgroundColor: colors.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Select Date</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              <View style={styles.datePickerWrapper}>
                <DateTimePicker
                  value={formData.serviceStartDate ? new Date(formData.serviceStartDate) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                  style={{ width: '100%' }}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Route Picker Modal */}
      <Modal visible={showRoutePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Route</Text>
              <TouchableOpacity onPress={() => setShowRoutePicker(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {routesLoading ? (
                <View style={styles.loadingContainer}>
                  <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading routes...</Text>
                </View>
              ) : routes.length > 0 ? (
                routes.map((route) => (
                  <TouchableOpacity
                    key={route.id}
                    style={[styles.modalItem, { borderBottomColor: colors.border }]}
                    onPress={() => {
                      setSelectedRoute(route.id);
                      setShowRoutePicker(false);
                    }}
                  >
                    <Text style={[styles.modalItemText, { color: colors.text }]}>{route.name}</Text>
                    <Text style={[styles.modalItemSubtext, { color: colors.textSecondary }]}>{route.path}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.loadingContainer}>
                  <Text style={[styles.loadingText, { color: colors.textSecondary }]}>No routes available</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Client Type Picker Modal */}
      <Modal visible={showClientTypePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Client Type</Text>
              <TouchableOpacity onPress={() => setShowClientTypePicker(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalList}>
              <TouchableOpacity
                style={[styles.modalItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  handleInputChange('clientType', 'residential');
                  setShowClientTypePicker(false);
                }}
              >
                <Text style={[styles.modalItemText, { color: colors.text }]}>Residential</Text>
                <Text style={[styles.modalItemSubtext, { color: colors.textSecondary }]}>Individual households</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  handleInputChange('clientType', 'commercial');
                  setShowClientTypePicker(false);
                }}
              >
                <Text style={[styles.modalItemText, { color: colors.text }]}>Commercial</Text>
                <Text style={[styles.modalItemSubtext, { color: colors.textSecondary }]}>Businesses and offices</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 6,
    backgroundColor: colors.headerBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    height: 56,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.headerText,
  },
  content: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  input: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  registerButton: {
    backgroundColor: colors.primary,
    marginTop: 20,
  },
  pickerContainer: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    minHeight: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 16,
    flex: 1,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '70%',
    borderRadius: 12,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalList: {
    maxHeight: 300,
  },
  modalItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalItemSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  documentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  documentButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  documentsPreview: {
    marginTop: 8,
    padding: 8,
    borderRadius: 4,
  },
  documentsCount: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  documentName: {
    fontSize: 12,
    marginLeft: 8,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  datePickerContainer: {
    width: '90%',
    borderRadius: 12,
    padding: 20,
  },
  datePickerWrapper: {
    marginTop: 10,
  },
});