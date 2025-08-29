import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TextInput, TouchableOpacity, Modal, FlatList, RefreshControl, StatusBar } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../../shared/context/ThemeContext';
import { useBagManagement } from '../../hooks/useBagManagement';
import { apiService } from '../../../shared/api/axios';

export const BagTransferScreen: React.FC = () => {
  const { colors } = useTheme();
  const { bagStats, transferHistory, initiateBagTransfer, completeBagTransfer, loading, fetchTransferHistory } = useBagManagement();
  const [drivers, setDrivers] = useState([]);
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [driverSearchTerm, setDriverSearchTerm] = useState('');
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [refreshingDrivers, setRefreshingDrivers] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDriverPicker, setShowDriverPicker] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showIssueBagsModal, setShowIssueBagsModal] = useState(false);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [loadingClients, setLoadingClients] = useState(false);
  const [refreshingClients, setRefreshingClients] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [transferForm, setTransferForm] = useState({
    number_of_bags: '',
    notes: '',
    contact: '',
  });
  const [transferring, setTransferring] = useState(false);
  const [completingTransfer, setCompletingTransfer] = useState(false);
  const [otpForm, setOtpForm] = useState({
    transfer_id: '',
    otp_code: '',
  });
  const [issueBagsForm, setIssueBagsForm] = useState({
    number_of_bags: '',
    client_id: '',
    contact: '',
  });
  const [pendingTransferId, setPendingTransferId] = useState(null);
  const [issuingBags, setIssuingBags] = useState(false);
  const [showBagOtpModal, setShowBagOtpModal] = useState(false);
  const [bagIssueId, setBagIssueId] = useState(null);
  const [bagOtpCode, setBagOtpCode] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    // Load bag stats on component mount
    fetchBagStats();
  }, []);

  const fetchBagStats = async () => {
    try {
      const response = await apiService.getDriverBagStats();
      if (response.data.status) {
        // Update bagStats through the hook or set local state
        console.log('Bag stats:', response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch bag stats:', error);
    }
  };

  const fetchDrivers = async () => {
    try {
      setLoadingDrivers(true);
      console.log('Fetching drivers...');
      const response = await apiService.getOrganizationDrivers();
      console.log('Drivers response:', response.data);
      if (response.data.status) {
        const driversData = response.data.data || [];
        console.log('Drivers data:', driversData);
        setDrivers(driversData);
        setFilteredDrivers(driversData);
      }
    } catch (error: any) {
      console.error('Failed to fetch drivers:', error);
      console.error('Error response:', error.response?.data);
      Alert.alert('Error', error.response?.data?.message || 'Failed to load drivers');
    } finally {
      setLoadingDrivers(false);
    }
  };

  const handleRefreshDrivers = async () => {
    try {
      setRefreshingDrivers(true);
      const response = await apiService.getOrganizationDrivers();
      if (response.data.status) {
        const driversData = response.data.data || [];
        setDrivers(driversData);
        setFilteredDrivers(driversData);
      }
    } catch (error: any) {
      console.error('Failed to refresh drivers:', error);
    } finally {
      setRefreshingDrivers(false);
    }
  };

  const handleDriverSearch = (text) => {
    setDriverSearchTerm(text);
    if (text.trim() === '') {
      setFilteredDrivers(drivers);
    } else {
      const filtered = drivers.filter(driver => 
        driver.name?.toLowerCase().includes(text.toLowerCase()) ||
        driver.email?.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredDrivers(filtered);
    }
  };

  const fetchClients = async () => {
    try {
      setLoadingClients(true);
      console.log('Fetching clients...');
      const response = await apiService.get('/driver/pickups/clients');
      console.log('Clients response:', response.data);
      if (response.data.status) {
        const clientsData = response.data.data?.clients || [];
        console.log('Clients data:', clientsData);
        setClients(clientsData);
        setFilteredClients(clientsData);
      }
    } catch (error: any) {
      console.error('Failed to fetch clients:', error);
      console.error('Error response:', error.response?.data);
      Alert.alert('Error', error.response?.data?.message || 'Failed to load clients');
    } finally {
      setLoadingClients(false);
    }
  };

  const handleRefreshClients = async () => {
    try {
      setRefreshingClients(true);
      const response = await apiService.get('/driver/pickups/clients');
      if (response.data.status) {
        const clientsData = response.data.data?.clients || [];
        setClients(clientsData);
        setFilteredClients(clientsData);
      }
    } catch (error: any) {
      console.error('Failed to refresh clients:', error);
    } finally {
      setRefreshingClients(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      setLoadingHistory(true);
      await fetchTransferHistory();
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setRefreshing(false);
      setLoadingHistory(false);
    }
  };

  const handleInitiateTransfer = async () => {
    if (!selectedDriver || !transferForm.number_of_bags || !transferForm.contact) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setTransferring(true);
      const result = await initiateBagTransfer({
        to_driver_id: selectedDriver.id,
        number_of_bags: parseInt(transferForm.number_of_bags),
        notes: transferForm.notes,
        contact: transferForm.contact,
      });

      setPendingTransferId(result.data.transfer_id);
      setShowTransferModal(false);
      setShowOtpModal(true);
      setTransferForm({ number_of_bags: '', notes: '', contact: '' });
      setSelectedDriver(null);
      Alert.alert('Success', 'Transfer initiated! OTP sent to receiving driver.');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setTransferring(false);
    }
  };

  const handleCompleteTransfer = async () => {
    if (!otpForm.otp_code) {
      Alert.alert('Error', 'Please enter OTP code');
      return;
    }

    try {
      setCompletingTransfer(true);
      const result = await completeBagTransfer({
        transfer_id: pendingTransferId,
        otp_code: otpForm.otp_code,
      });
      Alert.alert('Success', 'Bag transfer completed successfully!');
      setOtpForm({ transfer_id: '', otp_code: '' });
      setShowOtpModal(false);
      setPendingTransferId(null);
      fetchTransferHistory();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setCompletingTransfer(false);
    }
  };

  const handleIssueBags = async () => {
    if (!selectedClient || !issueBagsForm.number_of_bags || !issueBagsForm.contact) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setIssuingBags(true);
      const response = await apiService.post('/driver/bags/issue/request', {
        client_id: selectedClient.id,
        number_of_bags: parseInt(issueBagsForm.number_of_bags),
        contact: issueBagsForm.contact,
      });
      
      if (response.data.status) {
        setBagIssueId(response.data.data.bag_issue_id);
        setShowIssueBagsModal(false);
        setShowBagOtpModal(true);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to issue bags');
    } finally {
      setIssuingBags(false);
    }
  };

  const renderDriverItem = ({ item, index }) => (
    <TouchableOpacity
      style={[styles.driverItem, { borderColor: colors.border }]}
      onPress={() => {
        setSelectedDriver(item);
        setTransferForm(prev => ({ ...prev, contact: item.email || '' }));
        setShowDriverPicker(false);
        setDriverSearchTerm('');
        setFilteredDrivers(drivers);
      }}
    >
      <View style={styles.driverNumber}>
        <Text style={[styles.driverNumberText, { color: colors.primary }]}>{index + 1}</Text>
      </View>
      <View style={styles.driverInfo}>
        <Text style={[styles.driverName, { color: colors.text }]}>{item.name || 'Unknown Driver'}</Text>
        <Text style={[styles.driverEmail, { color: colors.textSecondary }]}>{item.email || 'No email'}</Text>
      </View>
    </TouchableOpacity>
  );

  const handleClientSearch = (text) => {
    setClientSearchTerm(text);
    if (text.trim() === '') {
      setFilteredClients(clients);
    } else {
      const filtered = clients.filter(client => 
        client.user?.name?.toLowerCase().includes(text.toLowerCase()) ||
        client.accountNumber?.toLowerCase().includes(text.toLowerCase()) ||
        client.user?.email?.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredClients(filtered);
    }
  };

  const handleVerifyBagOtp = async () => {
    if (!bagOtpCode || bagOtpCode.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setVerifyingOtp(true);
      const response = await apiService.post('/driver/bags/issue/verify', {
        bag_issue_id: bagIssueId,
        otp_code: bagOtpCode,
      });
      
      if (response.data.status) {
        setShowBagOtpModal(false);
        setShowSuccessModal(true);
        setBagOtpCode('');
        setBagIssueId(null);
        setIssueBagsForm({ number_of_bags: '', client_id: '', contact: '' });
        setSelectedClient(null);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Invalid OTP');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const renderClientItem = ({ item, index }) => (
    <TouchableOpacity
      style={[styles.clientItem, { borderColor: colors.border }]}
      onPress={() => {
        setSelectedClient(item);
        setIssueBagsForm(prev => ({ ...prev, contact: item.user?.email || '' }));
        setShowClientPicker(false);
        setClientSearchTerm('');
        setFilteredClients(clients);
      }}
    >
      <View style={styles.clientNumber}>
        <Text style={[styles.clientNumberText, { color: colors.primary }]}>{index + 1}</Text>
      </View>
      <View style={styles.clientInfo}>
        <Text style={[styles.clientName, { color: colors.text }]}>{item.user?.name || 'Unknown Client'}</Text>
        <Text style={[styles.clientDetails, { color: colors.textSecondary }]}>{item.accountNumber} • {item.user?.email || 'No email'}</Text>
      </View>
    </TouchableOpacity>
  );

  const styles = createStyles(colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar backgroundColor={colors.headerBackground} barStyle="light-content" translucent={false} />
      
      {/* Bag Management Section - Fixed at top */}
      <View style={[styles.fixedCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Bag Management</Text>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowIssueBagsModal(true)}
        >
          <MaterialIcons name="person-add" size={20} color="white" />
          <Text style={styles.buttonText}>Issue Bags to Client</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: colors.secondary }]}
          onPress={() => setShowTransferModal(true)}
        >
          <MaterialIcons name="swap-horiz" size={20} color="white" />
          <Text style={styles.buttonText}>Transfer Bags</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Transfer History */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          

          <View style={styles.historyHeaderContainer}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Transfer History</Text>
            {transferHistory.length === 0 && !loadingHistory && (
              <TouchableOpacity 
                style={[styles.loadHistoryButton, { backgroundColor: colors.primary }]}
                onPress={async () => {
                  setLoadingHistory(true);
                  await fetchTransferHistory();
                  setLoadingHistory(false);
                }}
              >
                <Text style={styles.loadHistoryText}>Load History</Text>
              </TouchableOpacity>
            )}
          </View>
          {loadingHistory ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Fetching history...</Text>
            </View>
          ) : transferHistory.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No transfers yet</Text>
          ) : (
            transferHistory.slice(0, 5).map((transfer) => (
              <View key={transfer.id} style={[styles.historyItem, { borderBottomColor: colors.border }]}>
                <View style={styles.historyHeader}>
                  <Text style={[styles.historyTitle, { color: colors.text }]}>
                    {transfer.from_driver?.name} → {transfer.to_driver?.name}
                  </Text>
                  <Text style={[styles.status, { 
                    color: transfer.status === 'completed' ? colors.success : 
                           transfer.status === 'pending' ? colors.warning : 
                           colors.error 
                  }]}>
                    {transfer.status}
                  </Text>
                </View>
                <Text style={[styles.historyDetail, { color: colors.textSecondary }]}>
                  {transfer.number_of_bags} bags • {new Date(transfer.created_at).toLocaleDateString()}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Transfer Modal */}
      <Modal visible={showTransferModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Transfer Bags</Text>
            
            <TouchableOpacity 
              style={[styles.input, { borderColor: colors.border }]}
              onPress={() => {
                setShowDriverPicker(true);
                if (drivers.length === 0) {
                  fetchDrivers();
                }
              }}
            >
              <Text style={[styles.inputText, { color: selectedDriver ? colors.text : colors.textSecondary }]}>
                {selectedDriver ? selectedDriver.name : 'Select Driver'}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
            
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="Number of Bags"
              placeholderTextColor={colors.textSecondary}
              value={transferForm.number_of_bags}
              onChangeText={(text) => setTransferForm(prev => ({ ...prev, number_of_bags: text }))}
              keyboardType="numeric"
            />
            
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="Contact (Email for OTP)"
              placeholderTextColor={colors.textSecondary}
              value={transferForm.contact}
              onChangeText={(text) => setTransferForm(prev => ({ ...prev, contact: text }))}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="Notes (optional)"
              placeholderTextColor={colors.textSecondary}
              value={transferForm.notes}
              onChangeText={(text) => setTransferForm(prev => ({ ...prev, notes: text }))}
              multiline
            />
            
            {transferring ? (
              <View style={styles.loadingContainer}>
                <Text style={[styles.loadingText, { color: colors.primary }]}>Transferring...</Text>
              </View>
            ) : (
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: colors.border }]}
                  onPress={() => setShowTransferModal(false)}
                >
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={handleInitiateTransfer}
                >
                  <Text style={styles.modalButtonText}>Transfer</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Driver Picker Modal */}
      <Modal visible={showDriverPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.clientModalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Driver</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  setShowDriverPicker(false);
                  setDriverSearchTerm('');
                  setFilteredDrivers(drivers);
                }}
              >
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchContainer}>
              <TextInput
                style={[styles.searchInput, { borderColor: colors.border, color: colors.text }]}
                placeholder="Search drivers..."
                placeholderTextColor={colors.textSecondary}
                value={driverSearchTerm}
                onChangeText={handleDriverSearch}
              />
              <MaterialIcons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
            </View>
            
            <View style={styles.refreshContainer}>
              <TouchableOpacity 
                style={[styles.refreshButton, { backgroundColor: colors.primary }]}
                onPress={handleRefreshDrivers}
                disabled={refreshingDrivers}
              >
                <MaterialIcons name="refresh" size={20} color="white" />
                <Text style={styles.refreshButtonText}>
                  {refreshingDrivers ? 'Refreshing...' : 'Refresh'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {loadingDrivers ? (
              <View style={styles.loadingContainer}>
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading drivers...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredDrivers}
                renderItem={renderDriverItem}
                keyExtractor={(item) => item.id.toString()}
                style={styles.driverList}
                ListEmptyComponent={
                  <View style={styles.loadingContainer}>
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                      {driverSearchTerm ? 'No drivers match your search' : 'No drivers found'}
                    </Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Issue Bags Modal */}
      <Modal visible={showIssueBagsModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Issue Bags to Client</Text>
            
            <TouchableOpacity 
              style={[styles.input, { borderColor: colors.border }]}
              onPress={() => {
                setShowClientPicker(true);
                if (clients.length === 0) {
                  fetchClients();
                }
              }}
            >
              <Text style={[styles.inputText, { color: selectedClient ? colors.text : colors.textSecondary }]}>
                {selectedClient ? selectedClient.user?.name || 'Unknown Client' : 'Select Client'}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
            
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="Number of Bags"
              placeholderTextColor={colors.textSecondary}
              value={issueBagsForm.number_of_bags}
              onChangeText={(text) => setIssueBagsForm(prev => ({ ...prev, number_of_bags: text }))}
              keyboardType="numeric"
            />
            
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="Contact (Email for OTP)"
              placeholderTextColor={colors.textSecondary}
              value={issueBagsForm.contact}
              onChangeText={(text) => setIssueBagsForm(prev => ({ ...prev, contact: text }))}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            {issuingBags ? (
              <View style={styles.loadingContainer}>
                <Text style={[styles.loadingText, { color: colors.primary }]}>Issuing...</Text>
              </View>
            ) : (
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: colors.border }]}
                  onPress={() => setShowIssueBagsModal(false)}
                >
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={handleIssueBags}
                >
                  <Text style={styles.modalButtonText}>Issue Bags</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Client Picker Modal */}
      <Modal visible={showClientPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.clientModalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Client</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  setShowClientPicker(false);
                  setClientSearchTerm('');
                  setFilteredClients(clients);
                }}
              >
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchContainer}>
              <TextInput
                style={[styles.searchInput, { borderColor: colors.border, color: colors.text }]}
                placeholder="Search clients..."
                placeholderTextColor={colors.textSecondary}
                value={clientSearchTerm}
                onChangeText={handleClientSearch}
              />
              <MaterialIcons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
            </View>
            
            <View style={styles.refreshContainer}>
              <TouchableOpacity 
                style={[styles.refreshButton, { backgroundColor: colors.primary }]}
                onPress={handleRefreshClients}
                disabled={refreshingClients}
              >
                <MaterialIcons name="refresh" size={20} color="white" />
                <Text style={styles.refreshButtonText}>
                  {refreshingClients ? 'Refreshing...' : 'Refresh'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {loadingClients ? (
              <View style={styles.loadingContainer}>
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading clients...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredClients}
                renderItem={renderClientItem}
                keyExtractor={(item) => item.id.toString()}
                style={styles.clientList}
                ListEmptyComponent={
                  <View style={styles.loadingContainer}>
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                      {clientSearchTerm ? 'No clients match your search' : 'No clients found'}
                    </Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>

      {/* OTP Modal */}
      <Modal visible={showOtpModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Enter OTP</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>Enter the OTP sent to the receiving driver</Text>
            
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="OTP Code"
              placeholderTextColor={colors.textSecondary}
              value={otpForm.otp_code}
              onChangeText={(text) => setOtpForm(prev => ({ ...prev, otp_code: text }))}
              keyboardType="numeric"
              maxLength={6}
            />
            
            {completingTransfer ? (
              <View style={styles.loadingContainer}>
                <Text style={[styles.loadingText, { color: colors.primary }]}>Verifying...</Text>
              </View>
            ) : (
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: colors.border }]}
                  onPress={() => setShowOtpModal(false)}
                >
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: colors.success }]}
                  onPress={handleCompleteTransfer}
                >
                  <Text style={styles.modalButtonText}>Complete</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Bag OTP Verification Modal */}
      <Modal visible={showBagOtpModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Enter OTP</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>Enter the OTP sent to the client's email</Text>
            
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="6-digit OTP"
              placeholderTextColor={colors.textSecondary}
              value={bagOtpCode}
              onChangeText={setBagOtpCode}
              keyboardType="numeric"
              maxLength={6}
            />
            
            {verifyingOtp ? (
              <View style={styles.loadingContainer}>
                <Text style={[styles.loadingText, { color: colors.primary }]}>Verifying...</Text>
              </View>
            ) : (
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: colors.border }]}
                  onPress={() => {
                    setShowBagOtpModal(false);
                    setBagOtpCode('');
                    setBagIssueId(null);
                  }}
                >
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: colors.success }]}
                  onPress={handleVerifyBagOtp}
                >
                  <Text style={styles.modalButtonText}>Verify</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <TouchableOpacity 
              style={styles.successCloseButton}
              onPress={() => setShowSuccessModal(false)}
            >
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            
            <View style={styles.successContainer}>
              <MaterialIcons name="check-circle" size={64} color={colors.success} />
              <Text style={[styles.successTitle, { color: colors.text }]}>Success!</Text>
              <Text style={[styles.successMessage, { color: colors.textSecondary }]}>Bags have been issued to the client successfully.</Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.modalButton, { backgroundColor: colors.primary, marginTop: 20 }]}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  fixedCard: {
    padding: 16,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
  historyItem: {
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  historyDetail: {
    fontSize: 14,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputText: {
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  driverList: {
    flex: 1,
  },
  driverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  driverNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  driverNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '500',
  },
  driverEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  historyHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadHistoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  loadHistoryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeButton: {
    padding: 4,
  },
  refreshContainer: {
    marginBottom: 16,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  clientModalContent: {
    width: '95%',
    height: '80%',
    borderRadius: 12,
    padding: 20,
  },
  searchContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    paddingRight: 40,
    fontSize: 16,
  },
  searchIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  clientList: {
    flex: 1,
  },
  clientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  clientNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clientNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '500',
  },
  clientDetails: {
    fontSize: 14,
    marginTop: 2,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  successCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
    zIndex: 1,
  },
});