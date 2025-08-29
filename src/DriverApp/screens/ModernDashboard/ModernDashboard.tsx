import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../shared/context/ThemeContext';

import { apiService } from '../../../shared/api/axios';

// Import new components
import { ModernHeader } from '../../components/ModernHeader/ModernHeader';
import { StatusCard } from '../../components/StatusCard/StatusCard';
import { ActionButtons } from '../../components/ActionButtons/ActionButtons';
import { StatisticsCards } from '../../components/StatisticsCards/StatisticsCards';

import { BagStatsCard } from '../../components/BagStatsCard/BagStatsCard';


interface ModernDashboardProps {
  onRegisterClient?: () => void;
  onSelectRoute?: () => void;
}

export const ModernDashboard: React.FC<ModernDashboardProps> = ({ onRegisterClient, onSelectRoute }) => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [activeRoute, setActiveRoute] = useState('No active route');
  const [bagStats, setBagStats] = useState(null);


  const [refreshing, setRefreshing] = useState(false);



  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setRefreshing(true);
      const response = await apiService.get('/driver/dashboard/stats');
      
      if (response.data?.status) {
        const { active_route, bag_stats } = response.data.data;
        setActiveRoute(active_route?.name || 'No active route');
        setBagStats(bag_stats);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data. Please try again.');
      setActiveRoute('No active route');
      setBagStats({ allocated_bags: 0, used_bags: 0, available_bags: 0 });
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







  const handleRegisterClient = () => {
    onRegisterClient?.();
  };

  const handleSelectRoute = () => {
    console.log('Route button clicked');
    onSelectRoute?.();
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
          activeRoute={activeRoute}
          loading={refreshing}
          showActiveRoute={true}
        />
        
        <BagStatsCard
          allocated={bagStats?.allocated_bags || 0}
          used={bagStats?.used_bags || 0}
          available={bagStats?.available_bags || 0}
          onTransferPress={() => navigation.navigate('Bags' as never)}
          loading={refreshing}
        />
        
        <ActionButtons
          onRegisterClient={handleRegisterClient}
          onSelectRoute={handleSelectRoute}
          activeRoute={activeRoute}
          availablePickups={0}
        />
        

        

      </ScrollView>
      

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