import { apiService } from '../../shared/api/axios';
import { Route, ApiResponse } from '../../shared/types';

export const driverRouteService = {
  ...apiService,
  
  getDriverRoutes: () => {
    console.log('driverRouteService: Calling driver routes endpoint');
    return apiService.get('/driver/routes');
  }
};