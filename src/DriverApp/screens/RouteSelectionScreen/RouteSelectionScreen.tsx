import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Platform, Modal, Alert, TextInput, RefreshControl, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../shared/context/ThemeContext';
import { useNavigation } from '@react-navigation/native';

import { apiService } from '../../../shared/api/axios';

// Global cache to prevent multiple API calls
let routesCache: any[] | null = null;
let isLoading = false;


interface RouteSelectionScreenProps {
  onClose?: () => void;
}

export const RouteSelectionScreen: React.FC<RouteSelectionScreenProps> = ({ onClose }) => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [showMenu, setShowMenu] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activating, setActivating] = useState(false);
  const [currentDriverId, setCurrentDriverId] = useState<number>(45); // Hardcoded driver ID
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'empty', 'occupied'
  const [allRoutes, setAllRoutes] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      fetchDriverRoutes();
      // getCurrentDriverId(); // Remove automatic call
    }
  }, []);

  const getCurrentDriverId = async () => {
    try {
      const response = await apiService.get('/auth/user');
      setCurrentDriverId(response.data.id);
    } catch (error) {
      console.error('Error getting current driver:', error);
    }
  };

  const fetchDriverRoutes = async (page = 1) => {
    // Use cache if available
    if (routesCache && page === 1) {
      setRoutes(routesCache);
      setLoading(false);
      return;
    }
    
    // Prevent multiple simultaneous calls
    if (isLoading && page === 1) return;
    
    try {
      if (page === 1) {
        isLoading = true;
        setLoading(true);
      }
      console.log('Fetching organization routes...');
      const response = await apiService.get(`/organization/routes?page=${page}&limit=20`);
      console.log('Routes response:', response.data);
      if (response.data?.status) {
        const newRoutes = response.data.data.data || [];
        if (page === 1) {
          routesCache = newRoutes; // Cache first page
        }
        if (page === 1) {
          setAllRoutes(newRoutes);
          // Apply filters immediately to new data
          applyFiltersToRoutes(newRoutes, searchText, filterStatus);
        } else {
          const updatedRoutes = [...allRoutes, ...newRoutes];
          setAllRoutes(updatedRoutes);
          // Apply filters immediately to updated data
          applyFiltersToRoutes(updatedRoutes, searchText, filterStatus);
        }
        console.log('Routes set:', newRoutes);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
    } finally {
      if (page === 1) {
        isLoading = false;
        setLoading(false);
      }
    }
  };

  const handleActivateRoute = (route: any) => {
    setSelectedRoute(route);
    const isCurrentDriverActive = route.active_drivers?.some((driver: any) => driver.id === currentDriverId);
    if (isCurrentDriverActive) {
      setShowDeactivateModal(true);
    } else {
      setShowActivateModal(true);
    }
  };

  const getCurrentActiveRoute = () => {
    return allRoutes.find(route => 
      route.active_drivers?.some((driver: any) => driver.id === currentDriverId)
    );
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    applyFilters(text, filterStatus);
  };

  const handleFilter = (status: string) => {
    setFilterStatus(status);
    applyFilters(searchText, status);
  };

  const applyFiltersToRoutes = (routesToFilter: any[], search: string, status: string) => {
    let filtered = [...routesToFilter];
    
    // Apply search filter first
    if (search.trim()) {
      filtered = filtered.filter((route: any) => 
        route.name?.toLowerCase().includes(search.toLowerCase()) ||
        route.path?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Apply status filter
    if (status === 'empty') {
      filtered = filtered.filter((route: any) => 
        !route.active_drivers || route.active_drivers.length === 0
      );
    } else if (status === 'occupied') {
      filtered = filtered.filter((route: any) => 
        route.active_drivers && route.active_drivers.length > 0
      );
    }
    
    setRoutes(filtered);
  };

  const applyFilters = (search: string, status: string) => {
    applyFiltersToRoutes(allRoutes, search, status);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setShowMenu(null); // Close any open menus
    routesCache = null;
    await fetchDriverRoutes(1);
    setRefreshing(false);
  };

  const confirmActivation = async () => {
    if (selectedRoute) {
      try {
        setActivating(true);
        const response = await apiService.post('/driver/routes/activate', { route_id: selectedRoute.id });
        
        // Update UI immediately - remove driver from previous route and add to new route
        const updatedRoutes = allRoutes.map(route => {
          if (route.active_drivers?.some((driver: any) => driver.id === currentDriverId)) {
            // Remove driver from previous route
            return {
              ...route,
              active_drivers: route.active_drivers.filter((driver: any) => driver.id !== currentDriverId)
            };
          } else if (route.id === selectedRoute.id) {
            // Add driver to new route
            return {
              ...route,
              active_drivers: [...(route.active_drivers || []), { id: currentDriverId, name: 'You' }]
            };
          }
          return route;
        });
        
        setAllRoutes(updatedRoutes);
        // Apply filters immediately to updated routes
        applyFiltersToRoutes(updatedRoutes, searchText, filterStatus);
        
        Alert.alert('Success', 'Route activated successfully');
        setShowActivateModal(false);
        setSelectedRoute(null);
      } catch (error: any) {
        console.error('Error activating route:', error);
        const message = error.response?.data?.message || 'Failed to activate route';
        setErrorMessage(message);
        setShowActivateModal(false);
        setShowErrorModal(true);
      } finally {
        setActivating(false);
      }
    }
  };

  const confirmDeactivation = async () => {
    if (selectedRoute) {
      try {
        setActivating(true);
        const response = await apiService.post('/driver/routes/deactivate', { route_id: selectedRoute.id });
        
        // Update UI immediately - remove driver from route
        const updatedRoutes = allRoutes.map(route => {
          if (route.id === selectedRoute.id) {
            return {
              ...route,
              active_drivers: route.active_drivers?.filter((driver: any) => driver.id !== currentDriverId) || []
            };
          }
          return route;
        });
        
        setAllRoutes(updatedRoutes);
        // Apply filters immediately to updated routes
        applyFiltersToRoutes(updatedRoutes, searchText, filterStatus);
        
        Alert.alert('Success', 'Route deactivated successfully');
        setShowDeactivateModal(false);
        setSelectedRoute(null);
      } catch (error: any) {
        console.error('Error deactivating route:', error);
        const message = error.response?.data?.message || 'Failed to deactivate route';
        setErrorMessage(message);
        setShowDeactivateModal(false);
        setShowErrorModal(true);
      } finally {
        setActivating(false);
      }
    }
  };

  const renderRouteItem = ({ item }: { item: any }) => {
    const isOccupied = item.active_drivers && item.active_drivers.length > 0;
    const isCurrentDriverActive = item.active_drivers?.some((driver: any) => driver.id === currentDriverId);
    
    return (
      <View style={[styles.routeCard, { backgroundColor: colors.surface }, isCurrentDriverActive && { borderColor: colors.primary, borderWidth: 2 }]}>
        <View style={styles.routeHeader}>
          <View style={styles.routeInfo}>
            <View style={styles.routeNameContainer}>
              <Text style={[styles.routeName, { color: colors.text }]}>{item.name}</Text>
              {isCurrentDriverActive && (
                <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />
              )}
            </View>
            <Text style={[styles.activeRouteText, { color: colors.primary }]}>
              {!isOccupied ? 'Route is empty' :
                isCurrentDriverActive ? 
                  (item.active_drivers.length === 1 ? 'You are in this route' : `You and ${item.active_drivers.length - 1} other${item.active_drivers.length > 2 ? 's' : ''} are in this route`) :
                  `${item.active_drivers.length} driver${item.active_drivers.length > 1 ? 's' : ''} in this route`
              }
            </Text>
          </View>
          
          <View>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={(event) => {
                if (showMenu === item.id) {
                  setShowMenu(null);
                } else {
                  // Measure the button position
                  event.currentTarget.measure((x, y, width, height, pageX, pageY) => {
                    const screenHeight = Dimensions.get('window').height;
                    const menuHeight = 100; // Approximate menu height
                    const spaceBelow = screenHeight - (pageY + height);
                    
                    // If not enough space below, position above
                    const menuY = spaceBelow < menuHeight ? pageY - menuHeight : pageY + height;
                    
                    setMenuPosition({ x: pageX, y: menuY });
                    setShowMenu(item.id);
                  });
                }
              }}
            >
              <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
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
          <Text style={styles.title}>Route Selection</Text>
        </View>
      </View>
      
      <View style={styles.searchContainer}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search routes..."
            placeholderTextColor={colors.textSecondary}
            value={searchText}
            onChangeText={handleSearch}
          />
        </View>
        
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: filterStatus === 'all' ? colors.primary : colors.surface }]}
            onPress={() => {
              setShowMenu(null);
              handleFilter('all');
            }}
          >
            <Text style={[styles.filterText, { color: filterStatus === 'all' ? 'white' : colors.text }]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: filterStatus === 'empty' ? colors.primary : colors.surface }]}
            onPress={() => {
              setShowMenu(null);
              handleFilter('empty');
            }}
          >
            <Ionicons name="radio-button-off" size={16} color={filterStatus === 'empty' ? 'white' : colors.text} />
            <Text style={[styles.filterText, { color: filterStatus === 'empty' ? 'white' : colors.text }]}>Empty</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: filterStatus === 'occupied' ? colors.primary : colors.surface }]}
            onPress={() => {
              setShowMenu(null);
              handleFilter('occupied');
            }}
          >
            <Ionicons name="people" size={16} color={filterStatus === 'occupied' ? 'white' : colors.text} />
            <Text style={[styles.filterText, { color: filterStatus === 'occupied' ? 'white' : colors.text }]}>Occupied</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <FlatList
          data={routes}
          renderItem={renderRouteItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={routes.length === 0 ? styles.emptyListContainer : styles.listContainer}
          showsVerticalScrollIndicator={true}
          bounces={routes.length > 0}
          scrollEnabled={routes.length > 0}
          onEndReached={() => {
            if (!loading && allRoutes.length >= 20) {
              fetchDriverRoutes(Math.floor(allRoutes.length / 20) + 1);
            }
          }}
          onEndReachedThreshold={0.3}
          onScroll={() => setShowMenu(null)}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            loading ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Loading routes...
                </Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="location-outline" size={64} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No routes available
                </Text>
              </View>
            )
          }
        />
      </View>
      
      {/* Floating Menu */}
      {showMenu !== null && (
        <>
          <TouchableOpacity 
            style={styles.menuOverlay}
            activeOpacity={1}
            onPress={() => setShowMenu(null)}
          />
          <View style={[styles.floatingMenu, { 
            backgroundColor: colors.surface, 
            borderColor: colors.border,
            left: Math.max(10, menuPosition.x - 140), // Ensure menu doesn't go off screen
            top: menuPosition.y
          }]}>
            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => {
                const route = allRoutes.find(r => r.id === showMenu);
                if (route) {
                  handleActivateRoute(route);
                  setShowMenu(null);
                }
              }}
            >
              <Ionicons 
                name={allRoutes.find(r => r.id === showMenu)?.active_drivers?.some((driver: any) => driver.id === currentDriverId) ? 'remove-circle-outline' : 'add-circle-outline'} 
                size={18} 
                color={allRoutes.find(r => r.id === showMenu)?.active_drivers?.some((driver: any) => driver.id === currentDriverId) ? colors.error : colors.success} 
              />
              <Text style={[styles.menuOptionText, { color: colors.text, marginLeft: 8 }]}>
                {allRoutes.find(r => r.id === showMenu)?.active_drivers?.some((driver: any) => driver.id === currentDriverId) ? 'Deactivate' : 'Activate'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => {
                const route = allRoutes.find(r => r.id === showMenu);
                if (route) {
                  setSelectedRoute(route);
                  setShowMenu(null);
                  setShowDetailsModal(true);
                }
              }}
            >
              <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
              <Text style={[styles.menuOptionText, { color: colors.text, marginLeft: 8 }]}>View Details</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
      
      <Modal
        visible={showActivateModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowActivateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Activate Route</Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              {activating ? 'Activating...' : (
                <>Are you sure you want to activate "{selectedRoute?.name}"?{getCurrentActiveRoute() && `\n\nNote: You will be automatically removed from "${getCurrentActiveRoute()?.name}" where you are currently active.`}</>
              )}
            </Text>
            {!activating && (
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.border }]}
                  onPress={() => setShowActivateModal(false)}
                >
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={confirmActivation}
                >
                  <Text style={[styles.modalButtonText, { color: 'white' }]}>Activate</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
      
      <Modal
        visible={showDeactivateModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeactivateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Deactivate Route</Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              {activating ? 'Deactivating...' : `Are you sure you want to deactivate from "${selectedRoute?.name}"?`}
            </Text>
            {!activating && (
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.border }]}
                  onPress={() => setShowDeactivateModal(false)}
                >
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.error }]}
                  onPress={confirmDeactivation}
                >
                  <Text style={[styles.modalButtonText, { color: 'white' }]}>Deactivate</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
      
      <Modal
        visible={showErrorModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.error }]}>Error</Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              {errorMessage}
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowErrorModal(false)}
            >
              <Text style={[styles.modalButtonText, { color: 'white' }]}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      <Modal
        visible={showDetailsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.detailsModalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Route Details</Text>
            
            <View style={styles.detailSection}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Route Name</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{selectedRoute?.name || 'N/A'}</Text>
            </View>
            
            <View style={styles.detailSection}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Route Path</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{selectedRoute?.path || 'N/A'}</Text>
            </View>
            
            <View style={styles.detailSection}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Description</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{selectedRoute?.description || 'No description available'}</Text>
            </View>
            
            <View style={styles.detailSection}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Status</Text>
              <Text style={[styles.detailValue, { color: selectedRoute?.active_drivers?.length > 0 ? colors.success : colors.textSecondary }]}>
                {selectedRoute?.active_drivers?.length > 0 ? 'Occupied' : 'Empty'}
              </Text>
            </View>
            
            <View style={styles.detailSection}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Total Clients</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{selectedRoute?.clients_count || 0}</Text>
            </View>
            
            <View style={styles.detailSection}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Active Drivers ({selectedRoute?.active_drivers?.length || 0})</Text>
              {selectedRoute?.active_drivers && selectedRoute.active_drivers.length > 0 ? (
                selectedRoute.active_drivers.map((driver: any, index: number) => (
                  <View key={index} style={styles.driverItem}>
                    <View style={[styles.driverDot, { backgroundColor: driver.id === currentDriverId ? colors.primary : colors.textSecondary }]} />
                    <Text style={[styles.detailValue, { color: driver.id === currentDriverId ? colors.primary : colors.text }]}>
                      {driver.name} {driver.id === currentDriverId ? '(You)' : ''}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={[styles.detailValue, { color: colors.textSecondary, fontStyle: 'italic' }]}>No active drivers</Text>
              )}
            </View>
            
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary, marginTop: 20 }]}
              onPress={() => setShowDetailsModal(false)}
            >
              <Text style={[styles.modalButtonText, { color: 'white' }]}>Close</Text>
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
    backgroundColor: colors.headerBackground,
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
  listContainer: {
    padding: 16,
  },
  routeCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 1,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  routeInfo: {
    flex: 1,
  },
  routeNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  activeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: colors.background,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  menuButton: {
    padding: 8,
    borderRadius: 20,
  },
  floatingMenu: {
    position: 'absolute',
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 15,
    zIndex: 10000,
    minWidth: 160,
    backgroundColor: 'white',
  },
  menuContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuSeparator: {
    height: 1,
    marginHorizontal: 8,
  },
  menuOptionText: {
    fontSize: 15,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    margin: 20,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    minWidth: 280,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  detailsModalContent: {
    margin: 20,
    borderRadius: 12,
    padding: 24,
    minWidth: 300,
    maxWidth: '90%',
  },
  detailSection: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    lineHeight: 22,
  },
  activeRouteText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    marginTop: 16,
    textAlign: 'center',
  },
  driverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  driverDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
});