import { useState, useEffect } from 'react';
import { apiService } from '../../shared/api/axios';
import { Alert } from 'react-native';

export const useRouteActivation = () => {
  const [activeRoute, setActiveRoute] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current active route on mount
  useEffect(() => {
    fetchActiveRoute();
  }, []);

  const fetchActiveRoute = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/driver/routes/active');
      setActiveRoute(response.data.data?.route);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching active route:', err);
      setError(err.response?.data?.message || 'Failed to fetch active route');
      setActiveRoute(null);
    } finally {
      setLoading(false);
    }
  };

  const activateRoute = async (routeId: string) => {
    try {
      setLoading(true);
      const response = await apiService.post('/driver/routes/activate', { route_id: routeId });
      await fetchActiveRoute();
      setError(null);
      Alert.alert('Success', response.data.message || 'Route activated successfully');
      return true;
    } catch (err: any) {
      console.error('Error activating route:', err);
      const errorMessage = err.response?.data?.error || 'Failed to activate route';
      setError(errorMessage);
      
      if (err.response?.status === 409) {
        Alert.alert('Route Occupied', errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deactivateRoute = async (routeId: string) => {
    try {
      setLoading(true);
      const response = await apiService.post('/driver/routes/deactivate', { route_id: routeId });
      setActiveRoute(null);
      setError(null);
      Alert.alert('Success', response.data.message || 'Route deactivated successfully');
      return true;
    } catch (err: any) {
      console.error('Error deactivating route:', err);
      const errorMessage = err.response?.data?.error || 'Failed to deactivate route';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const isActiveOnRoute = (routeId: string): boolean => {

    return activeRoute?.id === routeId;
  };

  return {
    activeRoute,
    loading,
    error,
    activateRoute,
    deactivateRoute,
    fetchActiveRoute,
    isActiveOnRoute
  };
};