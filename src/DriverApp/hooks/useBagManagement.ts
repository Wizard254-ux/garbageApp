import { useState, useEffect } from 'react';
import { driverBagService } from '../services/driverBagService';

interface BagStats {
  allocated_bags: number;
  used_bags: number;
  available_bags: number;
}

interface BagTransfer {
  id: string;
  from_driver_id: string;
  to_driver_id: string;
  number_of_bags: number;
  status: 'pending' | 'completed' | 'expired';
  notes?: string;
  created_at: string;
  completed_at?: string;
  from_driver?: { id: string; name: string };
  to_driver?: { id: string; name: string };
}

export const useBagManagement = () => {
  const [bagStats, setBagStats] = useState<BagStats | null>(null);
  const [transferHistory, setTransferHistory] = useState<BagTransfer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBagStats = async () => {
    try {
      setLoading(true);
      const response = await driverBagService.getBagStats();
      if (response.data.status) {
        setBagStats(response.data.data.bags);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch bag stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransferHistory = async () => {
    try {
      const response = await driverBagService.getTransferHistory();
      if (response.data.status) {
        setTransferHistory(response.data.data.data || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch transfer history:', err);
    }
  };

  const initiateBagTransfer = async (data: {
    to_driver_id: string;
    number_of_bags: number;
    notes?: string;
  }) => {
    try {
      setLoading(true);
      const response = await driverBagService.initiateBagTransfer(data);
      if (response.data.status) {
        return response.data;
      }
      throw new Error(response.data.message);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to initiate transfer';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const completeBagTransfer = async (data: {
    transfer_id: string;
    otp_code: string;
  }) => {
    try {
      setLoading(true);
      const response = await driverBagService.completeBagTransfer(data);
      if (response.data.status) {
        await fetchTransferHistory(); // Refresh history only
        return response.data;
      }
      throw new Error(response.data.message);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to complete transfer';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Remove automatic API calls on hook initialization
    // fetchBagStats();
    // fetchTransferHistory();
  }, []);

  return {
    bagStats,
    transferHistory,
    loading,
    error,
    fetchBagStats,
    fetchTransferHistory,
    initiateBagTransfer,
    completeBagTransfer,
    clearError: () => setError(null),
  };
};