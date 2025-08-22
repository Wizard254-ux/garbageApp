import { apiService } from '../../shared/api/axios';
import { Route, ApiResponse } from '../../shared/types';

export const driverRouteService = {
  ...apiService,
  
  getDriverRoutes: () => {
    console.log('driverRouteService: Calling manageRoutes');
    return apiService.manageRoutes({ action: 'read' });
  }
};