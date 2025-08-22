import { useState } from 'react';
import { driverRouteService } from '../services/driverRouteService';
import { Route } from '../../shared/types';

export const useRoutes = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoutes = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('useRoutes: Calling driverRouteService.getDriverRoutes()');
      const response = await driverRouteService.getDriverRoutes();
      console.log('useRoutes: Routes response:', response);
      setRoutes(response.data.data || []);
      return response;
    } catch (err: any) {
      console.error('useRoutes: Error fetching routes:', err);
      setError(err.response?.data?.message || 'Failed to fetch routes');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    routes,
    loading,
    error,
    fetchRoutes,
  };
};