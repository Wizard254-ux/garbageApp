import { apiService } from '../../shared/api/axios';

export const driverBagService = {
  // Get driver bag statistics
  getBagStats: () => {
    console.log('Getting driver bag stats');
    return apiService.getDriverBagStats();
  },

  // Get driver bags details
  getDriverBags: () => {
    console.log('Getting driver bags');
    return apiService.getDriverBags();
  },

  // Initiate bag transfer to another driver
  initiateBagTransfer: (data: {
    to_driver_id: string;
    number_of_bags: number;
    notes?: string;
  }) => {
    console.log('Initiating bag transfer:', data);
    return apiService.initiateBagTransfer(data);
  },

  // Complete bag transfer with OTP
  completeBagTransfer: (data: {
    transfer_id: string;
    otp_code: string;
  }) => {
    console.log('Completing bag transfer:', data);
    return apiService.completeBagTransfer(data);
  },

  // Get bag transfer history
  getTransferHistory: () => {
    console.log('Getting bag transfer history');
    return apiService.getBagTransferHistory();
  },
};