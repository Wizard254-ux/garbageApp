import { useState } from 'react';
import { apiService } from '../../shared/api/axios';

interface DriverStats {
  todayPickups: number;
  completedPickups: number;
  pendingPickups: number;
  totalRoutes: number;
  todayEarnings?: number;
  activeRoute?: string;
  currentShift?: string;
  totalPickups?: number;
  successRate?: string;
  rating?: string;
}

export const useDriverStats = () => {
  const [stats, setStats] = useState<DriverStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try optimized dashboard API first
      try {
        console.log('🚀 Using optimized dashboard API...');
        const dashboardRes = await apiService.getDashboardData();
        const dashboardData = dashboardRes?.data;
        
        if (dashboardData) {
          const statsData = {
            completedPickups: dashboardData.completedPickups || 0,
            pendingPickups: dashboardData.pendingPickups || 0,
            todayPickups: dashboardData.todayPickups || 0,
            totalRoutes: dashboardData.totalRoutes || 0,
            todayEarnings: dashboardData.todayEarnings || 5212,
            activeRoute: dashboardData.activeRoute || 'No active route',
            currentShift: dashboardData.currentShift || 'Morning Shift',
            totalPickups: dashboardData.totalPickups || 0,
            successRate: dashboardData.successRate || '95%',
            rating: dashboardData.rating || '4.8'
          };
          
          setStats(statsData);
          console.log('✅ Dashboard data loaded in single API call:', statsData);
          return statsData;
        }
      } catch (dashboardError) {
        console.log('⚠️ Optimized API not available, falling back to individual calls...');
      }
      
      // Fallback to individual API calls if dashboard API not available
      console.log('🐌 Using legacy individual API calls...');
      // Initialize stats values
      let completedPickups = 0;
      let pendingPickups = 0;
      let todayPickups = 0;
      let totalRoutes = 0;
      
      // Get completed pickups - filter only active clients
      try {
        console.log('Fetching completed pickups...');
        const completedRes = await apiService.getAllPickedPickups();
        const allCompleted = completedRes?.data?.data || [];
        
        // Filter only active clients
        const activeCompleted = allCompleted.filter((pickup: any) => {
          const isActive = pickup.user?.isActive;
          return isActive === true;
        });
        
        completedPickups = activeCompleted.length;
        console.log('Completed pickups (active only):', completedPickups);
      } catch (err) {
        console.error('Error fetching completed pickups:', err);
      }
      
      // Get all unpicked pickups once and derive stats from it
      let allUnpickedPickups: any[] = [];
      try {
        console.log('📦 Fetching all unpicked pickups (single call)...');
        const unpickedRes = await apiService.getAllUnpickedPickups();
        allUnpickedPickups = unpickedRes?.data?.data || [];
        
        console.log(`📊 Raw unpicked pickups: ${allUnpickedPickups.length}`);
        allUnpickedPickups.forEach((pickup, i) => {
          console.log(`Pickup ${i + 1}:`, {
            id: pickup.id,
            status: pickup.status,
            scheduledDate: pickup.scheduledDate,
            userName: pickup.user?.name,
            userActive: pickup.user?.isActive
          });
        });
        
        // Filter active pickups once
        const activePickups = allUnpickedPickups.filter((pickup: any) => {
          return pickup.user && pickup.user.isActive !== false;
        });
        
        pendingPickups = activePickups.length;
        console.log(`✅ Pending pickups (active only): ${pendingPickups}`);
        
        // Get today's pickups from the same data
        const today = new Date().toISOString().split('T')[0];
        const todayActivePickups = activePickups.filter((pickup: any) => {
          const pickupDate = new Date(pickup.scheduledDate).toISOString().split('T')[0];
          return pickupDate === today;
        });
        
        todayPickups = todayActivePickups.length;
        console.log(`✅ Today's pickups (active only): ${todayPickups}`);
        
      } catch (err) {
        console.error('Error fetching unpicked pickups:', err);
        pendingPickups = 0;
        todayPickups = 0;
      }
      
      // Get active route (single call)
      let activeRouteName = null;
      try {
        console.log('Fetching active route...');
        const activeRouteRes = await apiService.getActiveRoute();
        if (activeRouteRes?.data?.data && activeRouteRes.data.data.name) {
          activeRouteName = activeRouteRes.data.data.name;
        }
        console.log('Active route:', activeRouteName);
      } catch (err) {
        console.log('No active route found');
      }
      
      // Get routes
      try {
        console.log('Fetching routes...');
        const routesRes = await apiService.manageRoutes({ action: 'read' });
        totalRoutes = routesRes?.data?.data?.length || 0;
        console.log('Total routes:', totalRoutes);
      } catch (err) {
        console.error('Error fetching routes:', err);
      }
      
      // Use the active route name we already fetched
      
      // Set stats even if some calls failed
      const statsData = {
        completedPickups,
        pendingPickups,
        todayPickups,
        totalRoutes,
        todayEarnings: Math.floor(Math.random() * 5000) + 1000, // Mock earnings for demo
        activeRoute: activeRouteName || 'No active route',
        currentShift: 'Morning Shift',
        totalPickups: completedPickups,
        successRate: '95%',
        rating: '4.8'
      };
      
      setStats(statsData);
      console.log('Stats set successfully:', statsData);
      
      return statsData;
    } catch (err: any) {
      console.error('General error in fetchStats:', err);
      setError('Failed to fetch stats');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    stats,
    loading,
    error,
    fetchStats,
  };
};