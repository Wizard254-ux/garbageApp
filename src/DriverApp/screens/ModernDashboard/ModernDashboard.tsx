import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Modal, Text, TextInput, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../shared/context/ThemeContext';
import { useDriverStats } from '../../hooks/useDriverStats';
import { usePickupOperations } from '../../hooks/usePickupOperations';
import { useRoutes } from '../../hooks/useRoutes';
import { apiService } from '../../../shared/api/axios';

// Import new components
import { ModernHeader } from '../../components/ModernHeader/ModernHeader';
import { StatusCard } from '../../components/StatusCard/StatusCard';
import { ActionButtons } from '../../components/ActionButtons/ActionButtons';
import { StatisticsCards } from '../../components/StatisticsCards/StatisticsCards';
import { PromotionalCards } from '../../components/PromotionalCards/PromotionalCards';
import { ClientRegistrationModal } from '../../components/ClientRegistrationModal/ClientRegistrationModal';

export const ModernDashboard: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { stats, loading, error, fetchStats } = useDriverStats();
  const { 
    loading: pickupLoading, 
    users, 
    markPickupCompleted, 
    fetchUsersByStatus 
  } = usePickupOperations();
  const { routes, fetchRoutes } = useRoutes();

  const [refreshing, setRefreshing] = useState(false);
  const [showClientRegistration, setShowClientRegistration] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setRefreshing(true);
      // Single optimized call instead of 6 separate calls
      await fetchStats();
      // Routes are already included in stats, no need for separate call
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleNotificationPress = () => {
    Alert.alert(
      'Notifications',
      'You have 3 new notifications:\n• Route update available\n• New pickup request\n• Weekly summary ready',
      [{ text: 'OK' }]
    );
  };

  const handleProfilePress = () => {
    navigation.navigate('Profile' as never);
  };



  const handleCompletePickup = () => {
    navigation.navigate('Pickups' as never);
  };

  const handleViewPending = () => {
    navigation.navigate('Pickups' as never);
  };



  const handleSeeAllStats = () => {
    Alert.alert('Statistics', 'Detailed statistics view will open here');
  };

  const handlePromoCardPress = (cardId: string) => {
    Alert.alert('Information', `Opening ${cardId} details`);
  };

  const handleRegisterClient = () => {
    setShowClientRegistration(true);
  };

  const handleSelectRoute = () => {
    navigation.navigate('Pickups' as never, { openRouteFilter: true } as never);
  };



  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <ModernHeader 
        onNotificationPress={handleNotificationPress}
        onProfilePress={handleProfilePress}
      />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadDashboardData}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <StatusCard 
          driverStatus="active"
          activeRoute={stats?.activeRoute || "No active route"}
          loading={loading}
        />
        
        <ActionButtons
          onCompletePickup={handleCompletePickup}
          onViewPending={handleViewPending}
          onRegisterClient={handleRegisterClient}
          onSelectRoute={handleSelectRoute}
          totalRoutes={stats?.totalRoutes || 0}
          pendingPickups={stats?.pendingPickups || 0}
        />
        
        <StatisticsCards
          completedPickups={stats?.completedPickups || 0}
          pendingPickups={stats?.pendingPickups || 0}
          todayPickups={stats?.todayPickups || 0}
          totalRoutes={stats?.totalRoutes || 0}
          onSeeAll={handleSeeAllStats}
        />
        
        <PromotionalCards 
          onCardPress={handlePromoCardPress}
        />
      </ScrollView>
      
      {/* Client Registration Modal */}
      <ClientRegistrationModal
        visible={showClientRegistration}
        onClose={() => setShowClientRegistration(false)}
        onSuccess={() => {
          // Optionally refresh dashboard data
          loadDashboardData();
        }}
      />
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
});