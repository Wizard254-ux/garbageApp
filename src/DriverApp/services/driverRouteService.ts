import { apiService } from '../../shared/api/axios';

export const driverRouteService = {
  ...apiService,
  
  getDriverRoutes: () => {
    console.log('driverRouteService: Calling driver routes endpoint');
    return apiService.get('/driver/routes');
  }
};