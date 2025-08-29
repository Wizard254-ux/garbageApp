import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, RefreshControl, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../../shared/context/ThemeContext';
import { apiService } from '../../../shared/api/axios';
import { Loading } from '../../../shared/components';

type FilterType = 'all' | 'picked' | 'unpicked';

export const TodayHistoryScreen: React.FC = () => {
  const { colors } = useTheme();
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [routeFilter, setRouteFilter] = useState<string>('all');
  const [showRouteDropdown, setShowRouteDropdown] = useState(false);
  const [allPickups, setAllPickups] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [showMenu, setShowMenu] = useState<number | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPickModal, setShowPickModal] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState<any>(null);
  const [marking, setMarking] = useState(false);
  const [showAuthErrorModal, setShowAuthErrorModal] = useState(false);
  const [showRouteErrorModal, setShowRouteErrorModal] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchTodayPickups();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filter, routeFilter, allPickups]);

  const fetchTodayPickups = async (useCache = true) => {
    const cacheKey = `today_pickups_${today}`;
    
    if (useCache) {
      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          const cachedData = JSON.parse(cached);
          setAllPickups(cachedData.pickups);
          setRoutes(cachedData.routes);
        }
      } catch (error) {
        console.error('Cache read error:', error);
      }
    }
    
    // Only show loading on initial load when no cached data
    if (allPickups.length === 0) {
      setLoading(true);
    }
    
    try {
      const response = await apiService.getTodayPickups();
      if (response.data.status) {
        const data = response.data.data;
        const picked = (data.picked || []).map(item => ({ ...item, _type: 'picked' }));
        const unpicked = (data.unpicked || []).map(item => ({ ...item, _type: 'unpicked' }));
        const allData = [...picked, ...unpicked];
        
        setAllPickups(allData);
        
        // Extract unique routes
        const uniqueRoutes = [...new Set(allData.map(item => item.route?.name).filter(Boolean))];
        setRoutes(uniqueRoutes);
        
        // Cache the data
        await AsyncStorage.setItem(cacheKey, JSON.stringify({
          pickups: allData,
          routes: uniqueRoutes,
          timestamp: Date.now()
        }));
      }
    } catch (error) {
      console.error('Failed to fetch today pickups:', error);
    } finally {
      setLoading(false);
    }
  };

  const isPickupMissed = (item: any) => {
    if (item._type === 'picked') return false;
    
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDayName = dayNames[currentDay];
    
    const pickupDay = item.pickUpDay?.toLowerCase();
    const pickupDayIndex = dayNames.indexOf(pickupDay);
    
    return pickupDayIndex !== -1 && pickupDayIndex < currentDay;
  };

  const applyFilters = () => {
    let filtered = [...allPickups];
    
    // Apply status filter
    if (filter === 'picked') {
      filtered = filtered.filter(item => item._type === 'picked');
    } else if (filter === 'unpicked') {
      filtered = filtered.filter(item => item._type === 'unpicked' && !isPickupMissed(item));
    }
    
    // Apply route filter
    if (routeFilter !== 'all') {
      filtered = filtered.filter(item => item.route?.name === routeFilter);
    }
    
    setPickups(filtered);
  };

  const handleMarkPicked = async () => {
    if (!selectedPickup) return;
    
    try {
      setMarking(true);
      await apiService.post('/driver/pickups/mark', {
        pickup_id: selectedPickup.id,
        status: 'picked'
      });
      
      // Update local data
      const updatedPickups = allPickups.map(item => 
        item.id === selectedPickup.id 
          ? { ...item, _type: 'picked', pickup_status: 'picked' }
          : item
      );
      setAllPickups(updatedPickups);
      
      setShowPickModal(false);
      setSelectedPickup(null);
    } catch (error: any) {
      console.error('Failed to mark pickup:', error);
      if (error.response?.status === 401) {
        setShowAuthErrorModal(true);
        setShowPickModal(false);
      } else if (error.response?.status === 403) {
        setShowRouteErrorModal(true);
        setShowPickModal(false);
      } else {
        Alert.alert('Error', error.response?.data?.message || 'Failed to mark pickup');
      }
    } finally {
      setMarking(false);
    }
  };

  const handleLogout = () => {
    // Clear auth data and redirect to login
    // This should be handled by your auth context
    setShowAuthErrorModal(false);
    // Add your logout logic here
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTodayPickups(false); // Force fresh data on refresh
    setRefreshing(false);
  };

  const renderPickupItem = ({ item }: { item: any }) => {
    let status = item.pickup_status || item._type || 'unpicked';
    if (status === 'unpicked' && isPickupMissed(item)) {
      status = 'missed';
    }
    const clientName = item.client?.name || item.user?.name || 'Unknown Client';
    const clientAddress = item.client?.address || item.user?.address || 'No address';
    
    return (
      <View style={[styles.pickupCard, { backgroundColor: colors.surface }]}>
        <View style={styles.pickupHeader}>
          <Text style={[styles.clientName, { color: colors.text }]}>{clientName}</Text>
          <View style={styles.headerActions}>
            <View style={[styles.statusBadge, { 
              backgroundColor: status === 'picked' ? colors.success : 
                             status === 'missed' ? colors.error : colors.warning 
            }]}>
              <Text style={styles.statusText}>{status}</Text>
            </View>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setShowMenu(showMenu === item.id ? null : item.id)}
            >
              <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={[styles.address, { color: colors.textSecondary }]}>
          {clientAddress}
        </Text>
        
        <View style={styles.pickupInfo}>
          <View style={styles.infoItem}>
            <Ionicons name="location" size={16} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              {item.route?.name || 'No route'}
            </Text>
          </View>
          
          {item._type === 'unpicked' && (
            <View style={styles.infoItem}>
              <Ionicons name="calendar" size={16} color={colors.textSecondary} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Pickup Day: {item.pickUpDay || 'Not set'}
              </Text>
            </View>
          )}
        </View>
        
        {item._type === 'unpicked' && (
          <TouchableOpacity
            style={[styles.pickButton, { backgroundColor: colors.success }]}
            onPress={() => {
              setSelectedPickup(item);
              setShowPickModal(true);
            }}
          >
            <Ionicons name="checkmark" size={16} color="white" />
            <Text style={styles.pickButtonText}>Mark as Picked</Text>
          </TouchableOpacity>
        )}
        
        {showMenu === item.id && (
          <View style={[styles.menuDropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => {
                setSelectedPickup(item);
                setShowMenu(null);
                setShowDetailsModal(true);
              }}
            >
              <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
              <Text style={[styles.menuOptionText, { color: colors.text, marginLeft: 8 }]}>View Details</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.headerBackground} barStyle="light-content" translucent={false} />
      <View style={styles.header}>
        <Text style={styles.title}>Today's Updates</Text>
        <Text style={styles.subtitle}>{new Date().toLocaleDateString()}</Text>
      </View>

      <View style={styles.filterContainer}>
        {(['all', 'picked', 'unpicked'] as FilterType[]).map((filterType) => (
          <TouchableOpacity
            key={filterType}
            style={[
              styles.filterButton,
              filter === filterType && { backgroundColor: colors.primary }
            ]}
            onPress={() => setFilter(filterType)}
          >
            <Text style={[
              styles.filterText,
              { color: filter === filterType ? 'white' : colors.text }
            ]}>
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.routeFilterContainer}>
        <Text style={[styles.filterLabel, { color: colors.text }]}>Route:</Text>
        <TouchableOpacity
          style={[styles.routeDropdown, { borderColor: colors.border, backgroundColor: colors.surface }]}
          onPress={() => setShowRouteDropdown(!showRouteDropdown)}
        >
          <Text style={[styles.routeDropdownText, { color: colors.text }]}>
            {routeFilter === 'all' ? 'All Routes' : routeFilter}
          </Text>
          <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      
      {showRouteDropdown && (
        <TouchableOpacity 
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setShowRouteDropdown(false)}
        >
          <View style={[styles.routeDropdownMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.routeDropdownItem}
              onPress={() => {
                setRouteFilter('all');
                setShowRouteDropdown(false);
              }}
            >
              <Text style={[styles.routeDropdownItemText, { color: colors.text }]}>All Routes</Text>
            </TouchableOpacity>
            {routes.map((route) => (
              <TouchableOpacity
                key={route}
                style={styles.routeDropdownItem}
                onPress={() => {
                  setRouteFilter(route);
                  setShowRouteDropdown(false);
                }}
              >
                <Text style={[styles.routeDropdownItemText, { color: colors.text }]}>{route}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      )}

      {loading ? (
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <Text style={[styles.loadingText, { color: colors.primary }]}>Loading today's pickups...</Text>
        </View>
      ) : (
        <FlatList
          data={pickups}
          renderItem={renderPickupItem}
          keyExtractor={(item, index) => `${item.id}-${item._type || 'default'}-${index}`}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          onScroll={() => setShowMenu(null)}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={true}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No pickups found for today
              </Text>
            </View>
          }
        />
      )}
      
      {/* Details Modal */}
      <Modal visible={showDetailsModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Pickup Details</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowDetailsModal(false)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            {selectedPickup && (
              <View style={styles.detailsContent}>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Client Name</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {selectedPickup.client?.name || selectedPickup.user?.name || 'Unknown'}
                  </Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Address</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {selectedPickup.client?.address || selectedPickup.user?.address || 'No address'}
                  </Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Status</Text>
                  <Text style={[styles.detailValue, { color: selectedPickup.pickup_status === 'picked' ? colors.success : colors.warning }]}>
                    {selectedPickup.pickup_status || selectedPickup._type || 'unpicked'}
                  </Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Route</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {selectedPickup.route?.name || 'Unknown Route'}
                  </Text>
                </View>
                
                {selectedPickup.driver && (
                  <View style={styles.detailItem}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Driver</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {selectedPickup.driver.name}
                    </Text>
                  </View>
                )}
                
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Date</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {new Date(selectedPickup.pickup_date || selectedPickup.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
      
      {/* Pick Confirmation Modal */}
      <Modal visible={showPickModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Mark as Picked</Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              {marking ? 'Marking pickup...' : `Are you sure you want to mark this pickup as completed for ${selectedPickup?.user?.name || selectedPickup?.client?.name}?`}
            </Text>
            
            {!marking && (
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: colors.border }]}
                  onPress={() => setShowPickModal(false)}
                >
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: colors.success }]}
                  onPress={handleMarkPicked}
                >
                  <Text style={styles.modalButtonText}>Mark as Picked</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
      
      {/* Auth Error Modal */}
      <Modal visible={showAuthErrorModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.authErrorContainer}>
              <Ionicons name="warning" size={64} color={colors.error} />
              <Text style={[styles.authErrorTitle, { color: colors.text }]}>Authentication Failed</Text>
              <Text style={[styles.authErrorMessage, { color: colors.textSecondary }]}>
                Your session has expired or you're not authorized to perform this action. Please log in again to continue.
              </Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.modalButton, { backgroundColor: colors.primary, marginTop: 20 }]}
              onPress={handleLogout}
            >
              <Text style={styles.modalButtonText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Route Error Modal */}
      <Modal visible={showRouteErrorModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowRouteErrorModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            
            <View style={styles.authErrorContainer}>
              <Ionicons name="location-outline" size={64} color={colors.warning} />
              <Text style={[styles.authErrorTitle, { color: colors.text }]}>Route Not Active</Text>
              <Text style={[styles.authErrorMessage, { color: colors.textSecondary }]}>
                You're not active on the route for this client. Please activate on the correct route to mark pickups.
              </Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.modalButton, { backgroundColor: colors.primary, marginTop: 20 }]}
              onPress={() => setShowRouteErrorModal(false)}
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
    backgroundColor: colors.background,
  },
  header: {
    padding: 12,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
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
    textTransform: 'capitalize',
  },
  address: {
    fontSize: 14,
    marginBottom: 12,
  },
  pickupInfo: {
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuButton: {
    padding: 4,
  },
  menuDropdown: {
    position: 'absolute',
    top: 40,
    right: 16,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
    minWidth: 140,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuOptionText: {
    fontSize: 15,
    fontWeight: '500',
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
    padding: 4,
  },
  detailsContent: {
    gap: 16,
  },
  detailItem: {
    gap: 4,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 16,
    lineHeight: 22,
  },
  pickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginTop: 12,
    gap: 6,
  },
  pickButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  routeFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 12,
    position: 'relative',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  routeDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 120,
  },
  routeDropdownText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    backgroundColor: 'transparent',
  },
  routeDropdownMenu: {
    position: 'absolute',
    top: 100,
    left: 60,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 120,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  routeDropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
  },
  routeDropdownItemText: {
    fontSize: 14,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  authErrorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  authErrorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  authErrorMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});