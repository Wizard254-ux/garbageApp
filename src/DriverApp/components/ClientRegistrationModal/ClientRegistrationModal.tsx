import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  useColorScheme,
  Platform,
} from 'react-native';

import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../shared/context/ThemeContext';
import { apiService } from '../../../shared/api/axios';


interface ClientRegistrationModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ClientRegistrationModal: React.FC<ClientRegistrationModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { colors } = useTheme();
  const colorScheme = useColorScheme();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [routes, setRoutes] = useState<any[]>([]);
  const [routesLoading, setRoutesLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    route: '',
    pickUpDay: '',
    clientType: 'residential',
    monthlyRate: '',
    serviceStartDate: '',
    numberOfUnits: 1,
    gracePeriod: 5,
  });

  // Filter routes based on search query
  const filteredRoutes = useMemo(() => {
    if (!routes) return [];
    if (!searchQuery.trim()) return routes;
    return routes.filter(route => 
      route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.path.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [routes, searchQuery]);

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.getTime() === today.getTime();
      const isPast = date < today;
      const dateString = date.toISOString().split('T')[0];
      
      days.push({
        date,
        dateString,
        day: date.getDate(),
        isCurrentMonth,
        isToday,
        isPast,
        isSelected: formData.serviceStartDate === dateString
      });
    }
    
    return days;
  };
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentMonth(newMonth);
  };


  const clientTypes = [
    { value: 'residential', label: 'Residential' },
    { value: 'commercial', label: 'Commercial' },
  ];

  const [routesLoaded, setRoutesLoaded] = useState(false);

  const handleLoadRoutes = async () => {
    if (!routesLoaded) {
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
    }
  };

  const handleRouteSearch = (text: string) => {
    setSearchQuery(text);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      route: '',
      pickUpDay: '',
      clientType: 'residential',
      monthlyRate: '',
      serviceStartDate: '',
      numberOfUnits: 1,
      gracePeriod: 5,
    });
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.name || !formData.email || !formData.phone || !formData.address || !formData.route || !formData.serviceStartDate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Validate phone format (basic validation)
    if (formData.phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const clientFormData = new FormData();
      clientFormData.append('name', formData.name);
      clientFormData.append('email', formData.email);
      clientFormData.append('phone', formData.phone);
      clientFormData.append('address', formData.address);
      clientFormData.append('route', formData.route);
      clientFormData.append('clientType', formData.clientType);
      clientFormData.append('serviceStartDate', formData.serviceStartDate);
      clientFormData.append('gracePeriod', formData.gracePeriod.toString());
      clientFormData.append('isActive', 'false'); // Ensure client is inactive until approved

      if (formData.clientType === 'commercial') {
        clientFormData.append('numberOfUnits', formData.numberOfUnits.toString());
      }

      if (formData.monthlyRate) {
        clientFormData.append('monthlyRate', formData.monthlyRate);
      }

      const response = await apiService.registerClientByDriver(clientFormData);

      if (response.data.success) {
        Alert.alert(
          'Success',
          'Client registered successfully! The client will be inactive until approved by the organization.',
          [
            {
              text: 'OK',
              onPress: () => {
                resetForm();
                onClose();
                onSuccess?.();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', response.data.error || 'Failed to register client');
      }
    } catch (error: any) {
      console.error('Error registering client:', error);
      const errorMessage = error.response?.data?.error || 'Failed to register client. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Register New Client</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              disabled={loading}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter client's full name"
                placeholderTextColor={colors.textSecondary}
                editable={!loading}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email Address *</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="Enter email address"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="Enter phone number"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
                editable={!loading}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Address *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                placeholder="Enter complete address"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
                editable={!loading}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Route *</Text>
              


              {/* Route Selection */}
              <View style={styles.routeSelectionContainer}>
                {!routesLoaded ? (
                  <TouchableOpacity 
                    style={styles.loadRoutesButton}
                    onPress={handleLoadRoutes}
                    disabled={loading || routesLoading}
                  >
                    <Ionicons name="location-outline" size={24} color={colors.primary} />
                    <Text style={styles.loadRoutesText}>
                      {routesLoading ? 'Loading routes...' : 'Tap to load routes'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <>
                  {/* Search Bar - only show when routes are loaded */}
                  <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
                    <TextInput
                      style={styles.searchInput}
                      value={searchQuery}
                      onChangeText={handleRouteSearch}
                      placeholder="Search routes..."
                      placeholderTextColor={colors.textSecondary}
                      editable={!loading}
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                        <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  {filteredRoutes && filteredRoutes.length > 0 ? (
                  <ScrollView style={styles.routeList} nestedScrollEnabled>
                    {filteredRoutes.map((route) => (
                      <TouchableOpacity
                        key={route._id || route.id}
                        style={[
                          styles.routeOption,
                          formData.route === (route._id || route.id) && styles.routeOptionSelected
                        ]}
                        onPress={() => setFormData({ ...formData, route: route._id || route.id })}
                        disabled={loading}
                      >
                        <View style={styles.routeOptionContent}>
                          <Text style={[
                            styles.routeOptionName,
                            formData.route === (route._id || route.id) && styles.routeOptionNameSelected
                          ]}>
                            {route.name}
                          </Text>
                          <Text style={[
                            styles.routeOptionPath,
                            formData.route === (route._id || route.id) && styles.routeOptionPathSelected
                          ]}>
                            {route.path}
                          </Text>
                        </View>
                        {formData.route === (route._id || route.id) && (
                          <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : (
                  <View style={styles.noRoutesContainer}>
                    <Ionicons name="location-outline" size={48} color={colors.textSecondary} />
                    <Text style={styles.noRoutesText}>
                      {searchQuery ? 'No routes match your search' : 'No routes available'}
                    </Text>
                  </View>
                  )}
                )}
              </View>
            </View>


            <View style={styles.formGroup}>
              <Text style={styles.label}>Service Start Date *</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
                disabled={loading}
              >
                <Ionicons name="calendar" size={20} color={colors.primary} />
                <Text style={styles.datePickerText}>
                  {formData.serviceStartDate || 'Select service start date'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              
              
              {/* Calendar Date Picker Modal */}
              <Modal
                visible={showDatePicker}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowDatePicker(false)}
              >
                <View style={styles.datePickerOverlay}>
                  <View style={styles.calendarModal}>
                    {/* Calendar Header */}
                    <View style={styles.calendarHeader}>
                      <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navButton}>
                        <Ionicons name="chevron-back" size={24} color={colors.primary} />
                      </TouchableOpacity>
                      <Text style={styles.monthTitle}>
                        {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </Text>
                      <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navButton}>
                        <Ionicons name="chevron-forward" size={24} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                    
                    {/* Days of Week Header */}
                    <View style={styles.weekHeader}>
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <Text key={day} style={styles.weekDay}>{day}</Text>
                      ))}
                    </View>
                    
                    {/* Calendar Grid */}
                    <View style={styles.calendarGrid}>
                      {generateCalendarDays().map((day, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.calendarDay,
                            !day.isCurrentMonth && styles.calendarDayOtherMonth,
                            day.isToday && styles.calendarDayToday,
                            day.isSelected && styles.calendarDaySelected,
                            day.isPast && styles.calendarDayPast
                          ]}
                          onPress={() => {
                            if (!day.isPast) {
                              setFormData({ ...formData, serviceStartDate: day.dateString });
                              setShowDatePicker(false);
                            }
                          }}
                          disabled={day.isPast}
                        >
                          <Text style={[
                            styles.calendarDayText,
                            !day.isCurrentMonth && styles.calendarDayTextOtherMonth,
                            day.isToday && styles.calendarDayTextToday,
                            day.isSelected && styles.calendarDayTextSelected,
                            day.isPast && styles.calendarDayTextPast
                          ]}>
                            {day.day}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    
                    <TouchableOpacity
                      style={styles.calendarClose}
                      onPress={() => setShowDatePicker(false)}
                    >
                      <Text style={styles.calendarCloseText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Client Type</Text>
              <View style={styles.clientTypeSelector}>
                {clientTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeButton,
                      formData.clientType === type.value && styles.typeButtonSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, clientType: type.value })}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        formData.clientType === type.value && styles.typeButtonTextSelected,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {formData.clientType === 'commercial' && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Number of Units *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.numberOfUnits.toString()}
                  onChangeText={(text) => setFormData({ ...formData, numberOfUnits: parseInt(text) || 1 })}
                  placeholder="Enter number of units"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  editable={!loading}
                />
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.label}>
                {formData.clientType === 'commercial' ? 'Monthly Rate per Unit (KSH)' : 'Monthly Rate (KSH)'}
              </Text>
              <TextInput
                style={styles.input}
                value={formData.monthlyRate}
                onChangeText={(text) => setFormData({ ...formData, monthlyRate: text })}
                placeholder="Enter monthly rate (optional)"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                editable={!loading}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Grace Period (Days)</Text>
              <TextInput
                style={styles.input}
                value={formData.gracePeriod.toString()}
                onChangeText={(text) => setFormData({ ...formData, gracePeriod: parseInt(text) || 5 })}
                placeholder="Enter grace period in days"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                editable={!loading}
              />
            </View>


            <View style={styles.noteContainer}>
              <Ionicons name="information-circle" size={16} color={colors.warning} />
              <Text style={styles.noteText}>
                Note: New clients will be inactive until approved by the organization. Pickup day will be calculated from the service start date.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="person-add" size={20} color="white" />
                  <Text style={styles.submitButtonText}>Register Client</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: colors.cardBackground,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '90%',
      minHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      marginBottom: 12,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      height: 44,
      fontSize: 16,
      color: colors.text,
    },
    clearButton: {
      padding: 4,
    },
    routeSelectionContainer: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      backgroundColor: colors.surface,
      maxHeight: 200,
    },
    routeList: {
      maxHeight: 200,
    },
    routeOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    routeOptionSelected: {
      backgroundColor: colors.primary + '20',
      borderBottomColor: colors.primary,
    },
    routeOptionContent: {
      flex: 1,
    },
    routeOptionName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    routeOptionNameSelected: {
      color: colors.primary,
    },
    routeOptionPath: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    routeOptionPathSelected: {
      color: colors.primary + 'CC',
    },
    noRoutesContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    },
    noRoutesText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 12,
    },
    datePickerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      gap: 8,
    },
    datePickerText: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
    },
    datePickerOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    calendarModal: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 20,
      width: '100%',
      maxWidth: 350,
    },
    calendarHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    navButton: {
      padding: 8,
    },
    monthTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    weekHeader: {
      flexDirection: 'row',
      marginBottom: 10,
    },
    weekDay: {
      flex: 1,
      textAlign: 'center',
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      paddingVertical: 8,
    },
    calendarGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 20,
    },
    calendarDay: {
      width: '14.28%',
      aspectRatio: 1,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 8,
      margin: 1,
    },
    calendarDayOtherMonth: {
      opacity: 0.3,
    },
    calendarDayToday: {
      backgroundColor: colors.warning + '20',
      borderWidth: 1,
      borderColor: colors.warning,
    },
    calendarDaySelected: {
      backgroundColor: colors.primary,
    },
    calendarDayPast: {
      opacity: 0.4,
    },
    calendarDayText: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
    },
    calendarDayTextOtherMonth: {
      color: colors.textSecondary,
    },
    calendarDayTextToday: {
      color: colors.warning,
      fontWeight: 'bold',
    },
    calendarDayTextSelected: {
      color: 'white',
      fontWeight: 'bold',
    },
    calendarDayTextPast: {
      color: colors.textSecondary,
    },
    calendarClose: {
      padding: 12,
      backgroundColor: colors.surface,
      borderRadius: 8,
      alignItems: 'center',
    },
    calendarCloseText: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '600',
    },
    loadRoutesButton: {
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    loadRoutesText: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: '600',
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      flex: 1,
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    formGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.surface,
    },
    textArea: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    clientTypeSelector: {
      flexDirection: 'row',
      gap: 8,
      flexWrap: 'wrap',
    },
    typeButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      flex: 1,
      alignItems: 'center',
    },
    typeButtonSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    typeButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    typeButtonTextSelected: {
      color: 'white',
    },
    noteContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: colors.warning + '20',
      borderRadius: 8,
      padding: 12,
      marginBottom: 20,
      gap: 8,
    },
    noteText: {
      fontSize: 14,
      color: colors.warning,
      flex: 1,
      lineHeight: 20,
    },
    modalFooter: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    button: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    cancelButton: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    submitButton: {
      backgroundColor: colors.primary,
    },
    submitButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: 'white',
    },
  });