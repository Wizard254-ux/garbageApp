import { apiService } from '../../shared/api/axios';
import { PickupRecord, ApiResponse } from '../../shared/types';

export const driverPickupService = {
  // Mark pickup as completed
  markPickupCompleted: (data: {
    pickupId: string;
    notes: string;
  }) => {
    console.log('Marking pickup as completed with data:', data);
    return apiService.markPicked(data);
  },

  // Get users by pickup status - picked
  getPickedUsers: (routeId?: string, date?: string, startDate?: string, endDate?: string) => {
    console.log('driverPickupService: Getting picked users', { routeId, date, startDate, endDate });
    if (routeId) {
      return apiService.getPickupsByRoute(routeId, 'picked');
    }
    return apiService.getAllPickedPickups(routeId, date, startDate, endDate);
  },

  // Get users by pickup status - unpicked
  getUnpickedUsers: (routeId?: string, date?: string, startDate?: string, endDate?: string) => {
    console.log('driverPickupService: Getting unpicked users', { routeId, date, startDate, endDate });
    if (routeId) {
      return apiService.getPickupsByRoute(routeId, 'unpicked');
    }
    return apiService.getAllUnpickedPickups(routeId, date, startDate, endDate);
  },

  // Get users by pickup status - not yet marked
  getNotYetMarkedUsers: (routeId: string) =>
    apiService.getPickupsByRoute(routeId, 'not_yet_marked'),

  // Get all users in route
  getAllUsersInRoute: (routeId: string, day?: string) => {
    const queryString = day ? `?day=${day}` : '';
    return apiService.getPickupsByRoute(routeId, 'all');
  },

  // Batch mark unpicked (cron job)
  batchMarkUnpicked: () =>
    apiService.batchMarkUnpicked({}),

  // Get driver stats
  getStats: () =>
    apiService.getDriverStats(),
};