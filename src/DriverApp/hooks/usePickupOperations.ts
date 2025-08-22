import { useState } from 'react';
import { driverPickupService } from '../services/driverPickupService';
import { Alert } from 'react-native';
import { apiService } from '../../shared/api/axios';
import { useAuth } from '../../shared/context/AuthContext';

export const usePickupOperations = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');

  const markPickupCompleted = async (data: {
    pickupId: string;
    notes: string;
  }) => {
    setLoading(true);
    try {
      await driverPickupService.markPickupCompleted(data);
      Alert.alert('Success', 'Pickup marked as completed');
      return true;
    } catch (error) {
      Alert.alert('Error', 'Failed to mark pickup as completed');
      console.error('Mark pickup error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersByStatus = async (
    routeId?: string,
    status?: 'picked' | 'unpicked' | 'not_yet_marked' | 'all',
    filters?: {
      date?: string;
      startDate?: string;
      endDate?: string;
      day?: string;
    }
  ) => {
    if (!status) return [];
    
    // Save the selected route ID
    if (routeId) {
      setSelectedRouteId(routeId);
    }
    
    const effectiveRouteId = routeId || selectedRouteId;
    
    setLoading(true);
    try {
      let response;
      
      switch (status) {
        case 'picked':
          response = await driverPickupService.getPickedUsers(
            effectiveRouteId,
            filters?.date,
            filters?.startDate,
            filters?.endDate
          );
          break;
        case 'unpicked':
          response = await driverPickupService.getUnpickedUsers(
            effectiveRouteId,
            filters?.date,
            filters?.startDate,
            filters?.endDate
          );
          break;
        case 'not_yet_marked':
          response = await driverPickupService.getNotYetMarkedUsers(effectiveRouteId || '');
          break;
        case 'all':
          response = await driverPickupService.getAllUsersInRoute(effectiveRouteId || '', filters?.day);
          break;
        default:
          throw new Error('Invalid status');
      }

      const rawData = response.data.users || response.data.data || [];
      console.log('=== PICKUP DEBUG ===');
      console.log('Status requested:', status);
      console.log('Route ID:', effectiveRouteId);
      console.log('API Response:', response.data);
      console.log('Raw pickups count:', rawData.length);
      
      // Log each pickup's details
      rawData.forEach((pickup: any, index: number) => {
        console.log(`Pickup ${index + 1}:`, {
          id: pickup.id,
          status: pickup.status,
          driverId: pickup.driverId,
          scheduledDate: pickup.scheduledDate,
          userName: pickup.user?.name,
          userActive: pickup.user?.isActive,
          routeId: pickup.routeId
        });
      });
      
      // Check if we have any pickups at all
      if (rawData.length === 0) {
        console.log('❌ NO PICKUP RECORDS FOUND - Backend needs to generate pickups for active clients');
      }
      
      // Transform the nested data structure to flatten user info and filter only active clients
      const transformedData = rawData
        .filter((pickup: any) => {
          console.log(`🔍 Pickup ${pickup.id}:`, {
            userId: pickup.userId,
            userName: pickup.user?.name,
            userActive: pickup.user?.isActive,
            status: pickup.status,
            fullUser: JSON.stringify(pickup.user, null, 2)
          });
          
          // More lenient filtering - if user exists and isActive is not explicitly false
          const isActive = pickup.user && pickup.user.isActive !== false;
          console.log(`✅ Pickup ${pickup.id} included: ${isActive}`);
          return isActive;
        })
        .map((pickup: any) => ({
          id: pickup.id, // Pickup ID (Sequelize primary key)
          userId: pickup.userId, // Client ID
          name: pickup.user?.name || 'Unknown Client',
          email: pickup.user?.email || '',
          phone: pickup.user?.phone || 'No phone',
          address: pickup.user?.address || 'No address provided',
          accountNumber: pickup.user?.accountNumber || '',
          routeId: pickup.routeId,
          routeName: pickup.route?.name || 'Unknown Route',
          routePath: pickup.route?.path || '',
          driverId: pickup.driverId,
          scheduledDate: pickup.scheduledDate,
          pickupDay: pickup.pickupDay,
          status: pickup.status,
          completedAt: pickup.completedAt,
          notes: pickup.notes,
          bagsCollected: pickup.bagsCollected || 0,
          isActive: pickup.user?.isActive
        }));
      
      console.log('Filtered active pickups:', transformedData.length);
      console.log('Active pickups data:', transformedData);
      setUsers(transformedData);
      return transformedData;
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch users');
      console.error('Fetch users error:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const batchMarkUnpicked = async () => {
    setLoading(true);
    try {
      await driverPickupService.batchMarkUnpicked();
      Alert.alert('Success', 'Batch operation completed successfully');
      return true;
    } catch (error) {
      Alert.alert('Error', 'Batch operation failed');
      console.error('Batch operation error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Bag distribution functions
  const distributeBags = async (data: {
    client_id: string;
    recipient_email: string;
    number_of_bags: number;
    notes?: string;
  }) => {
    setLoading(true);
    try {
      console.log('Sending bag distribution request:', data);
      const response = await apiService.distributeBags(data);
      console.log('Bag distribution response:', response.data);
      
      if (response.data.success) {
        const message = response.data.data.email_sent 
          ? 'Verification code sent to recipient' 
          : 'Bag distribution created (email failed)';
        Alert.alert('Success', message);
        return response.data;
      } else {
        Alert.alert('Error', response.data.error || 'Failed to create bag distribution');
        return null;
      }
    } catch (error: any) {
      console.error('Bag distribution error:', error);
      let errorMessage = 'Failed to initiate bag distribution';
      
      if (error.response) {
        // Server responded with error status
        console.log('Error response:', error.response.data);
        errorMessage = error.response.data?.error || error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Network error
        console.log('Network error:', error.request);
        errorMessage = 'Network error - please check your connection';
      } else {
        // Something else happened
        errorMessage = error.message || 'Unknown error occurred';
      }
      
      Alert.alert('Error', errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  const verifyBagDistribution = async (data: {
    distribution_id: string;
    verification_code: string;
  }) => {
    setLoading(true);
    try {
      const response = await apiService.verifyBagDistribution(data);
      Alert.alert('Success', 'Bag distribution verified successfully');
      return response.data;
    } catch (error) {
      Alert.alert('Error', 'Failed to verify bag distribution');
      console.error('Bag verification error:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    users,
    selectedRouteId,
    setSelectedRouteId,
    markPickupCompleted,
    fetchUsersByStatus,
    batchMarkUnpicked,
    setUsers,
    distributeBags,
    verifyBagDistribution
  };
};