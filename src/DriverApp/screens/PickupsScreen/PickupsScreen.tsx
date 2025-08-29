import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Alert, TextInput, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../shared/context/ThemeContext';
import { usePickupOperations } from '../../hooks/usePickupOperations';
import { useRoutes } from '../../hooks/useRoutes';
import { useRouteActivation } from '../../hooks/useRouteActivation';
import { ModernHeader } from '../../components/ModernHeader/ModernHeader';
import { Loading } from '../../../shared/components';
import { apiService } from '../../../shared/api/axios';
import { useRoute } from '@react-navigation/native';

type PickupTab = 'pending' | 'completed';

export const PickupsScreen: React.FC = () => {
  const { colors } = useTheme();
  const route = useRoute();
  const {
    loading,
    users,
    markPickupCompleted,
    fetchUsersByStatus,
    selectedRouteId,
    setSelectedRouteId,
    distributeBags,
    verifyBagDistribution,
    setUsers
  } = usePickupOperations();
  const { routes, fetchRoutes } = useRoutes();
  const { activeRoute, activateRoute, deactivateRoute, isActiveOnRoute } = useRouteActivation();

  const [activeTab, setActiveTab] = useState<PickupTab>('pending');
  const [refreshing, setRefreshing] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<any>(null);
  const [showRouteSelector, setShowRouteSelector] = useState(false);
  const [showBagHistory, setShowBagHistory] = useState(false);
  const [bagHistory, setBagHistory] = useState<any[]>([]);
  const [bagHistoryLoading, setBagHistoryLoading] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Bag distribution state
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [numberOfBags, setNumberOfBags] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [distributionId, setDistributionId] = useState('');

  // Client registration state

  // Fetch routes on component mount
  useEffect(() => {
    const loadRoutes = async () => {
      try {
        await fetchRoutes();
      } catch (error) {
        console.error('Failed to fetch routes:', error);
      }
    };
    loadRoutes();
  }, []);

  // Handle navigation parameter to open route filter
  useEffect(() => {
    const params = route.params as any;
    if (params?.openRouteFilter) {
      setShowRouteSelector(true);
    }
  }, [route.params]);

  useEffect(() => {
    console.log('Routes in PickupsScreen:', routes);
    loadPickups();

    // Find current route details
    if (selectedRouteId && routes.length > 0) {
      const route = routes.find(r => r.id === selectedRouteId);
      if (route) {
      console.log('                         routessssssssssssssssssssss',route)
        setCurrentRoute(route);
      }
    }
  }, [activeTab, selectedRouteId, routes]);

  const loadPickups = async () => {
    const status = activeTab === 'pending' ? 'unpicked' : 'picked';
    // Pass the selectedRouteId (empty string means all routes)
    await fetchUsersByStatus(selectedRouteId || undefined, status);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPickups();
    setRefreshing(false);
  };

  const handleDistributeBags = async (clientId: string, clientName: string) => {
    console.log('sending to ',clientId)
    if (!recipientEmail || !numberOfBags) {
      Alert.alert('Error', 'Please enter recipient email and number of bags');
      return;
    }

    try {
      const result = await distributeBags({
        client_id: clientId,
        recipient_email: recipientEmail,
        number_of_bags: parseInt(numberOfBags),
        notes: `Bags distributed to ${clientName}`
      });

      if (result?.data?.distribution_id) {
        setDistributionId(result.data.distribution_id);
        Alert.alert(
          'Verification Code Sent',
          `A verification code has been sent to ${recipientEmail}. Please enter the code to complete the distribution.`
        );
      }
    } catch (error) {
      console.error('Error distributing bags:', error);
    }
  };

  const handleVerifyDistribution = async () => {
    if (!distributionId || !verificationCode) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    setVerificationLoading(true);
    try {
      await verifyBagDistribution({
        distribution_id: distributionId,
        verification_code: verificationCode
      });

      // Reset form after successful verification
      setRecipientEmail('');
      setNumberOfBags('');
      setVerificationCode('');
      setDistributionId('');
    } catch (error) {
      console.error('Error verifying distribution:', error);
    } finally {
      setVerificationLoading(false);
    }
  };

  const fetchBagHistory = async () => {
    setBagHistoryLoading(true);
    try {
      const response = await apiService.getCurrentWeekBagHistory(searchQuery, selectedRouteId);
      if (response?.data?.data) {
        setBagHistory(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching bag history:', error);
      Alert.alert('Error', 'Failed to load bag distribution history');
    } finally {
      setBagHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (showBagHistory) {
      fetchBagHistory();
    }
  }, [showBagHistory, searchQuery, selectedRouteId]);

  const handleMarkComplete = async (pickupId: string, clientName: string,item:any) => {
    try {
      console.log('complete ',item)
      const success = await markPickupCompleted({
        pickupId: pickupId,
        notes: `Pickup completed successfully for ${clientName}`
      });

      if (success) {
        Alert.alert(
          'Success',
          `Pickup for ${clientName} has been marked as completed!`,
          [{ text: 'OK', onPress: () => loadPickups() }]
        );
      } else {
        Alert.alert('Error', 'Failed to mark pickup as completed');
      }
    } catch (error) {
      console.error('Error marking pickup complete:', error);
      Alert.alert('Error', 'An error occurred while marking pickup as completed');
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'picked' ? colors.success : colors.warning;
  };

  const renderPickupItem = ({ item }: { item: any }) => (
    <View style={[styles.pickupCard, { backgroundColor: colors.cardBackground }]}>
      <View style={styles.pickupHeader}>
        <Text style={[styles.clientName, { color: colors.text }]}>{item.name || 'Unknown Client'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status || 'unpicked') }]}>
          <Text style={styles.statusText}>
            {activeTab === 'pending' ? 'Pending' : 'Completed'}
          </Text>
        </View>
      </View>

      <Text style={[styles.address, { color: colors.textSecondary }]}>
        {item.address || 'No address provided'}
      </Text>

      <View style={styles.contactInfo}>
        <View style={styles.contactItem}>
          <Ionicons name="call" size={16} color={colors.textSecondary} />
          <Text style={[styles.contactText, { color: colors.textSecondary }]}>
            {item.phone || 'No phone'}
          </Text>
        </View>

        <View style={styles.contactItem}>
          <Ionicons name="calendar" size={16} color={colors.textSecondary} />
          <Text style={[styles.contactText, { color: colors.textSecondary }]}>
            {item.pickupDay || 'No schedule'}
          </Text>
        </View>

        {!selectedRouteId && (
          <View style={styles.contactItem}>
            <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.contactText, { color: colors.textSecondary }]}>
              {item.routeName || 'No route'}
            </Text>
          </View>
        )}
      </View>

      {activeTab === 'pending' && (
        <>
          {isActiveOnRoute(item.routeId) ? (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => handleMarkComplete(item.id, item.name,item)}
            >
              <Ionicons name="checkmark" size={20} color="white" />
              <Text style={styles.actionButtonText}>Mark Complete</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.disabledButton, { backgroundColor: colors.textSecondary }]}>
              <Ionicons name="lock-closed" size={16} color="white" />
              <Text style={styles.disabledButtonText}>
                {currentRoute?.activeDriverId ? 'Not Active Driver' : 'Activate Route First'}
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <ModernHeader />

      <View style={styles.content}>
        {/* Route Selector */}
        <View style={[styles.routeSelectorContainer, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.selectorMainRow}>
            <View style={styles.selectorSection}>
              <Text style={[styles.selectorLabel, { color: colors.text }]}>Filter by Route:</Text>
              <TouchableOpacity
                style={[styles.routeSelectorButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setShowRouteSelector(true)}
              >
                <Ionicons name="location-outline" size={16} color={colors.primary} />
                <Text style={[styles.routeSelectorText, { color: colors.text }]}>
                  {currentRoute ? currentRoute.name : 'All Routes'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Active Route Display */}
            {activeRoute && (
              <View style={[styles.activeRouteDisplay, { backgroundColor: colors.success + '20', borderColor: colors.success }]}>
                <View style={styles.activeRouteContent}>
                  <Ionicons name="navigate-circle" size={16} color={colors.success} />
                  <Text style={[styles.activeRouteLabel, { color: colors.success }]}>Active:</Text>
                  <Text style={[styles.activeRouteName, { color: colors.success }]}>{activeRoute.name}</Text>
                </View>
                {/*<TouchableOpacity*/}
                {/*  style={[styles.deactivateBtn, { backgroundColor: colors.error }]}*/}
                {/*  onPress={() => deactivateRoute(activeRoute.id)}*/}
                {/*>*/}
                {/*  <Ionicons name="stop" size={12} color="white" />*/}
                {/*</TouchableOpacity>*/}
              </View>
            )}
          </View>
        </View>

        {currentRoute && (
          <View style={[styles.routeInfoContainer, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.routeInfoLeft}>
              <Ionicons name="location-outline" size={16} color={colors.primary} />
              <Text style={[styles.routeInfoTitle, { color: colors.text }]}>Route:</Text>
              <Text style={[styles.routeInfoName, { color: colors.text }]}>Name: <Text style={[styles.routeInfoPath, { color: colors.textSecondary }]}> {currentRoute.name}</Text></Text>
             <Text style={[styles.routeInfoName, { color: colors.text }]}>Path: <Text style={[styles.routeInfoPath, { color: colors.textSecondary }]}>{currentRoute.path}</Text></Text>
              {currentRoute.activeDriverId && currentRoute.activeDriver?.name && (
                <Text style={[styles.activeDriverText, { color: colors.success }]}>
                  Active Driver: {currentRoute.activeDriver.name}
                </Text>
              )}
            </View>
            {/*<View style={styles.routeActions}>*/}
            {/*  {isActiveOnRoute(currentRoute._id) ? (*/}
            {/*    <TouchableOpacity*/}
            {/*      style={[styles.activationButton, { backgroundColor: colors.error }]}*/}
            {/*      onPress={() => deactivateRoute(currentRoute._id)}*/}
            {/*    >*/}
            {/*      <Ionicons name="stop-circle" size={16} color="white" />*/}
            {/*      <Text style={styles.activationButtonText}>Deactivate</Text>*/}
            {/*    </TouchableOpacity>*/}
            {/*  ) : !currentRoute.activeDriverId ? (*/}
            {/*    <TouchableOpacity*/}
            {/*      style={[styles.activationButton, { backgroundColor: colors.success }]}*/}
            {/*      onPress={() => activateRoute(currentRoute._id)}*/}
            {/*    >*/}
            {/*      <Ionicons name="play-circle" size={16} color="white" />*/}
            {/*      <Text style={styles.activationButtonText}>Activate</Text>*/}
            {/*    </TouchableOpacity>*/}
            {/*  ) : (*/}
            {/*    <View style={[styles.occupiedIndicator, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>*/}
            {/*      <Ionicons name="lock-closed" size={14} color={colors.warning} />*/}
            {/*      <Text style={[styles.occupiedText, { color: colors.warning }]}>*/}
            {/*        Route Occupied*/}
            {/*      </Text>*/}
            {/*    </View>*/}
            {/*  )}*/}
            {/*  <TouchableOpacity*/}
            {/*    style={[styles.changeRouteButton, { backgroundColor: colors.surface, borderColor: colors.border }]}*/}
            {/*    onPress={() => {*/}
            {/*      setSelectedRouteId('');*/}
            {/*      setCurrentRoute(null);*/}
            {/*    }}*/}
            {/*  >*/}
            {/*    <Text style={[styles.changeRouteText, { color: colors.text }]}>View All</Text>*/}
            {/*  </TouchableOpacity>*/}
            {/*</View>*/}
          </View>

        )}

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
            onPress={() => setActiveTab('pending')}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'pending' ? colors.primary : colors.textSecondary }
            ]}>
              Unpicked
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
            onPress={() => setActiveTab('completed')}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'completed' ? colors.primary : colors.textSecondary }
            ]}>
              Picked
            </Text>
          </TouchableOpacity>


        </View>

        {loading ? (
          <Loading message="Loading pickups..." />
        ) : (
          <FlatList
            data={users}
            renderItem={renderPickupItem}
            keyExtractor={(item, index) => item.id || index.toString()}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name={activeTab === 'pending' ? 'time-outline' : 'checkmark-circle-outline'}
                  size={64}
                  color={colors.textSecondary}
                />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No {activeTab === 'pending' ? 'unpicked' : 'picked'} pickups found
                  {selectedRouteId && currentRoute ? ` in ${currentRoute.name}` : ''}
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                  {selectedRouteId ? 'Try selecting a different route or check another tab' : 'Select a route to filter pickups'}
                </Text>
              </View>
            }
          />
        )}

        {/* Route Selector Modal */}
        <Modal
          visible={showRouteSelector}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowRouteSelector(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Select Route</Text>
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: colors.surface }]}
                  onPress={() => setShowRouteSelector(false)}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.refreshContainer}>
                <TouchableOpacity
                  style={[styles.refreshButton, { backgroundColor: colors.primary }]}
                  onPress={async () => {
                    try {
                      await fetchRoutes();
                    } catch (error) {
                      console.error('Failed to reload routes:', error);
                    }
                  }}
                >
                  <Ionicons name="refresh" size={16} color="white" />
                  <Text style={styles.refreshButtonText}>Refresh Routes</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.routeList}>
                <TouchableOpacity
                  style={[
                    styles.routeItem,
                    { backgroundColor: colors.surface },
                    !selectedRouteId && { borderColor: colors.primary, borderWidth: 2 }
                  ]}
                  onPress={() => {
                    setSelectedRouteId('');
                    setCurrentRoute(null);
                    setShowRouteSelector(false);
                  }}
                >
                  <View style={styles.routeItemContent}>
                    <Ionicons name="globe-outline" size={20} color={colors.primary} />
                    <Text style={[styles.routeItemText, { color: colors.text }]}>All Routes</Text>
                    <Text style={[styles.routeItemSubtext, { color: colors.textSecondary }]}>View all pickups</Text>
                  </View>
                  {!selectedRouteId && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>

                {routes && routes.length > 0 ? (

                  routes.map((route) => (
                    <View key={route.id} style={styles.routeItemWrapper}>
                      <TouchableOpacity
                        style={[
                          styles.routeItem,
                          { backgroundColor: colors.surface },
                          selectedRouteId === route._d && { borderColor: colors.primary, borderWidth: 2 }
                        ]}
                        onPress={() => {
                          setSelectedRouteId(route.id);
                          setCurrentRoute(route);
                          setShowRouteSelector(false);
                        }}
                      >
                        <View style={styles.routeItemContent}>
                          <Ionicons name="location" size={20} color={colors.primary} />
                          <View style={styles.routeItemDetails}>
                            <Text style={[styles.routeItemText, { color: colors.text }]}>{route.name}</Text>
                            <Text style={[styles.routeItemSubtext, { color: colors.textSecondary }]}>{route.path}</Text>
                            {route.activeDriverId && route.activeDriver?.name && (
                              <View style={styles.routeDriverInfo}>
                                <Ionicons name="person" size={12} color={colors.warning} />
                                <Text style={[styles.routeDriverText, { color: colors.warning }]}>
                                  Active: {route.activeDriver.name}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <View style={styles.routeActions}>
                          {selectedRouteId === route.id && (
                            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                          )}
                        </View>
                      </TouchableOpacity>

                      {/* Route Activation Button */}
                      <View style={styles.routeActivationContainer}>
                        {isActiveOnRoute(route.id) ? (
                          <TouchableOpacity
                            style={[styles.routeActivationButton, { backgroundColor: colors.error }]}
                            onPress={() => {
                              deactivateRoute(route.id);
                              setShowRouteSelector(false);
                            }}
                          >
                            <Ionicons name="stop-circle" size={16} color="white" />
                            <Text style={styles.routeActivationText}>Deactivate</Text>
                          </TouchableOpacity>
                        ) : (!route.activeDriverId || !route.activeDriver?.name) ? (
                          <TouchableOpacity
                            style={[styles.routeActivationButton, { backgroundColor: colors.success }]}
                            onPress={() => {
                              activateRoute(route.id);
                              setShowRouteSelector(false);
                            }}
                          >
                            <Ionicons name="play-circle" size={16} color="white" />
                            <Text style={styles.routeActivationText}>Activate</Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={[styles.routeOccupiedIndicator, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
                            <Ionicons name="lock-closed" size={14} color={colors.warning} />
                            <Text style={[styles.routeOccupiedText, { color: colors.warning }]}>Occupied</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyRoutes}>
                    <Ionicons name="location-outline" size={48} color={colors.textSecondary} />
                    <Text style={[styles.emptyRoutesText, { color: colors.textSecondary }]}>No routes available</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Bag History Modal */}
        <Modal
          visible={showBagHistory}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowBagHistory(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Bag Distribution History</Text>
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: colors.surface }]}
                  onPress={() => setShowBagHistory(false)}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.historyFilters}>
                <TextInput
                  style={[styles.searchInput, { borderColor: colors.border, color: colors.text }]}
                  placeholder="Search clients..."
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                <TouchableOpacity
                  style={[styles.filterButton, { backgroundColor: colors.primary }]}
                  onPress={fetchBagHistory}
                >
                  <Ionicons name="refresh" size={16} color="white" />
                  <Text style={styles.filterButtonText}>Refresh</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.historyList}>
                {bagHistoryLoading ? (
                  <Loading message="Loading bag history..." />
                ) : bagHistory.length > 0 ? (
                  bagHistory.map((item, index) => (
                    <View key={index} style={[styles.historyItem, { backgroundColor: colors.surface }]}>
                      <View style={styles.historyItemHeader}>
                        <Text style={[styles.historyClientName, { color: colors.text }]}>
                          {item.client_id?.name || 'Unknown Client'}
                        </Text>
                        <Text style={[styles.historyDate, { color: colors.textSecondary }]}>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                      <View style={styles.historyItemDetails}>
                        <Text style={[styles.historyDetail, { color: colors.textSecondary }]}>
                          <Ionicons name="mail" size={12} color={colors.textSecondary} /> {item.recipient_email}
                        </Text>
                        <Text style={[styles.historyDetail, { color: colors.textSecondary }]}>
                          <Ionicons name="bag" size={12} color={colors.textSecondary} /> {item.number_of_bags} bags
                        </Text>
                        {item.client_id?.routeId && (
                          <Text style={[styles.historyDetail, { color: colors.textSecondary }]}>
                            <Ionicons name="location" size={12} color={colors.textSecondary} /> {item.client_id.routeId.name}
                          </Text>
                        )}
                      </View>
                      {item.is_verified && (
                        <View style={[styles.verifiedBadge, { backgroundColor: colors.success + '20' }]}>
                          <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                          <Text style={[styles.verifiedText, { color: colors.success }]}>Verified</Text>
                        </View>
                      )}
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyHistory}>
                    <Ionicons name="bag-outline" size={48} color={colors.textSecondary} />
                    <Text style={[styles.emptyHistoryText, { color: colors.textSecondary }]}>No bag distributions this week</Text>
                    <Text style={[styles.emptyHistorySubtext, { color: colors.textSecondary }]}>Distributed bags will appear here</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>


      </View>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  routeSelectorContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginTop: 5
  },
  selectorMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  selectorSection: {
    flex: 1,
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  routeSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    gap: 8,
  },
  routeSelectorText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  reloadButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
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
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshContainer: {
    marginBottom: 16,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    alignSelf: 'flex-start',
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  routeList: {
    maxHeight: 400,
  },
  routeItemWrapper: {
    marginBottom: 12,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  routeItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  routeItemDetails: {
    flex: 1,
  },
  routeItemText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  routeItemSubtext: {
    fontSize: 14,
    marginBottom: 4,
  },
  routeDriverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  routeDriverText: {
    fontSize: 12,
    fontWeight: '500',
  },
  routeActions: {
    alignItems: 'center',
  },
  routeActivationContainer: {
    paddingLeft: 48,
    paddingRight: 16,
  },
  routeActivationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 4,
  },
  routeActivationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  routeOccupiedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  routeOccupiedText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyRoutes: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyRoutesText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  // Bag History Modal Styles
  historyFilters: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  filterButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  historyList: {
    maxHeight: 300,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyHistoryText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  emptyHistorySubtext: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  historyItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyClientName: {
    fontSize: 16,
    fontWeight: '600',
  },
  historyDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  historyItemDetails: {
    gap: 4,
    marginBottom: 8,
  },
  historyDetail: {
    fontSize: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bagsHeaderActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  activeRouteDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 120,
  },
  activeRouteContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:"center",
    gap: 4,
    flex: 1,
  },
  activeRouteLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  activeRouteName: {
    fontSize: 12,
    fontWeight: '700',
  },
  deactivateBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  occupiedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  occupiedText: {
    fontSize: 12,
    fontWeight: '500',
  },
  routeInfoContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  routeInfoLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap:10,
    justifyContent:"flex-start",

    flex: 1,
  },
  routeActions: {

    flexDirection: 'column',
    gap: 8,
    alignItems: 'flex-end',
  },
  activeDriverText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  activationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  activationButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  changeRouteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  changeRouteText: {
    fontSize: 12,
    fontWeight: '500',
  },
  disabledButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
    opacity: 0.6,
  },
  disabledButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  routeInfoTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  routeInfoName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  routeInfoPath: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  bagsContainer: {
    flex: 1,
    padding: 16,
  },
  bagsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  bagsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bagsSubtitle: {
    fontSize: 14,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  clientsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
  },
  clientCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clientCardContent: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  clientDetails: {
    fontSize: 14,
    marginBottom: 2,
  },
  selectedClientCard: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedClientInfo: {
    flex: 1,
  },
  selectedClientName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  selectedClientDetails: {
    fontSize: 14,
    marginBottom: 2,
  },
  changeClientButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  changeClientText: {
    fontSize: 12,
    fontWeight: '500',
  },
  distributeButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  distributeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  clientAddress: {
    fontSize: 14,
  },
  clientsList: {
    paddingBottom: 100,
  },
  verificationText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  verifyButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    marginVertical: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: colors.background,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 100,
  },
  pickupCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pickupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  address: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  contactInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactText: {
    fontSize: 14,
    marginLeft: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal:10,
    borderRadius: 8,
    marginTop: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});