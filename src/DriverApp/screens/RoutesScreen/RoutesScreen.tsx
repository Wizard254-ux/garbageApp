import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../shared/context/ThemeContext';
import { apiService } from '../../../shared/api/axios';

interface Route {
  id: string;
  name: string;
  path: string;
  description?: string;
  isActive: boolean;
  activeDriverId?: string;
  activeDriver?: { name: string };
  clientCount?: number;
}

export const RoutesScreen: React.FC = () => {
  const { colors } = useTheme();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRoutes = async () => {
    try {
      const routesRes = await apiService.manageRoutes({ action: 'read' });
      const routesData = routesRes?.data?.data || [];
      
      // Fetch client counts for each route
      const routesWithCounts = await Promise.all(
        routesData.map(async (route: any) => {
          try {
            const clientsRes = await apiService.listClients();
            const allClients = clientsRes?.data?.users || [];
            const routeClients = allClients.filter((client: any) => 
              client.routeId === route.id && client.isActive === true
            );
            
            return {
              ...route,
              clientCount: routeClients.length
            };
          } catch (error) {
            console.error(`Error fetching clients for route ${route.id}:`, error);
            return { ...route, clientCount: 0 };
          }
        })
      );
      
      setRoutes(routesWithCounts);
    } catch (error) {
      console.error('Error fetching routes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRoutes();
  };

  const styles = createStyles(colors);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading routes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Routes Overview</Text>
          <Text style={styles.subtitle}>All routes and client distribution</Text>
        </View>

        {routes.map((route) => (
          <View key={route.id} style={styles.routeCard}>
            <View style={styles.routeHeader}>
              <View style={styles.routeInfo}>
                <Text style={styles.routeName}>{route.name}</Text>
                <Text style={styles.routePath}>{route.path}</Text>
                {route.description && (
                  <Text style={styles.routeDescription}>{route.description}</Text>
                )}
              </View>
              <View style={styles.routeStatus}>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: route.isActive ? colors.success + '20' : colors.error + '20' }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: route.isActive ? colors.success : colors.error }
                  ]}>
                    {route.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.routeStats}>
              <View style={styles.statItem}>
                <Ionicons name="people" size={20} color={colors.primary} />
                <Text style={styles.statValue}>{route.clientCount || 0}</Text>
                <Text style={styles.statLabel}>Clients</Text>
              </View>
              
              {route.activeDriverId && route.activeDriver && (
                <View style={styles.statItem}>
                  <Ionicons name="car" size={20} color={colors.warning} />
                  <Text style={styles.statValue}>1</Text>
                  <Text style={styles.statLabel}>Active Driver</Text>
                </View>
              )}
            </View>

            {route.activeDriver && (
              <View style={styles.activeDriverInfo}>
                <Ionicons name="person" size={16} color={colors.warning} />
                <Text style={styles.activeDriverText}>
                  Driver: {route.activeDriver.name}
                </Text>
              </View>
            )}
          </View>
        ))}

        {routes.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="map-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Routes Found</Text>
            <Text style={styles.emptySubtitle}>Routes will appear here once created</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.textSecondary,
    },
    scrollView: {
      flex: 1,
      padding: 16,
    },
    header: {
      marginBottom: 24,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    routeCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    routeHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    routeInfo: {
      flex: 1,
    },
    routeName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    routePath: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    routeDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    routeStatus: {
      marginLeft: 16,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
    },
    routeStats: {
      flexDirection: 'row',
      gap: 24,
      marginBottom: 12,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    statValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
    },
    statLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    activeDriverInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    activeDriverText: {
      fontSize: 14,
      color: colors.warning,
      fontWeight: '500',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 64,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.textSecondary,
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });