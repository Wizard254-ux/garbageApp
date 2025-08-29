import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthResponse, User, ApiResponse } from "../types";

// API Configuration
const api = axios.create({
  baseURL: "http://192.168.1.189:8000/api",
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add request logging and FormData detection
api.interceptors.request.use(
  (config) => {
    // Auto-detect FormData and remove Content-Type to let browser/RN set it
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    console.log('🚀 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.baseURL + config.url,
      data: config.data,
    });
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response logging
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });
    return Promise.reject(error);
  }
);
// Auth token interceptor
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.log("Unauthorized - clearing stored auth");
      await AsyncStorage.removeItem("accessToken");
      await AsyncStorage.removeItem("user");
    }
    return Promise.reject(error);
  }
);

// API Endpoints
const ENDPOINTS = {
  AUTH: {
    REGISTER: "/auth/register",
    LOGIN: "/auth/login",
    PROFILE: "/auth/user",
    CHANGE_PASSWORD: "/auth/change-password",
    SEND_VERIFICATION: "/auth/send-verification-code",
    REGISTER_ORGANIZATION: "/auth/register/organization",
    REGISTER_DRIVER: "/auth/register/driver",
    REGISTER_CLIENT: "/auth/register/client",
  },
  ORGANIZATION: {
    MANAGE: "/organization/manage",
    MANAGE_USERS: "/organization/users/manage",
  },
  ROUTES: {
    GET_ALL: "/driver/routes",
    ADDRESSES: "/driver/routes/addresses",
  },
  PICKUPS: {
    UPDATE_STATUS: (pickupId: string) => `/driver/pickups/${pickupId}`,
    BATCH_MARK_UNPICKED: "/driver/pickups/batch-mark-unpicked",
    GET_BY_ROUTE: (routeId: string) => `/driver/pickups/route/${routeId}`,
    GET_ALL_UNPICKED: "/driver/pickups/all/unpicked",
    GET_ALL_PICKED: "/driver/pickups/all/picked",
  },
  BAGS: {
    GET_STATS: "/driver/bags/stats",
    GET_DRIVER_BAGS: "/driver/bags",
    TRANSFER_INITIATE: "/driver/bags/transfer/initiate",
    TRANSFER_COMPLETE: "/driver/bags/transfer/complete",
    TRANSFER_HISTORY: "/driver/bags/transfer/history",
    DISTRIBUTE: "/bags/distribute",
    VERIFY: "/bags/verify",
    HISTORY: (clientId: string) => `/bags/history/${clientId}`,
    CURRENT_WEEK: "/bags/current-week",
  },
};

// API Methods
export const apiService = {
  // Auth methods
  login: (credentials: { email: string; password: string }) =>
    api.post<AuthResponse>(ENDPOINTS.AUTH.LOGIN, credentials),

  register: (userData: FormData) =>
    api.post<AuthResponse>(ENDPOINTS.AUTH.REGISTER, userData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  getProfile: () => api.get<ApiResponse<User>>(ENDPOINTS.AUTH.PROFILE),

  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
    verificationCode: string;
  }) => api.post<ApiResponse<string>>(ENDPOINTS.AUTH.CHANGE_PASSWORD, data),

  sendVerificationCode: () =>
    api.post<ApiResponse<string>>(ENDPOINTS.AUTH.SEND_VERIFICATION),

  registerOrganization: (userData: FormData) =>
    api.post<AuthResponse>(ENDPOINTS.AUTH.REGISTER_ORGANIZATION, userData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  registerDriver: (userData: FormData) =>
    api.post<AuthResponse>(ENDPOINTS.AUTH.REGISTER_DRIVER, userData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  registerClient: (userData: FormData) =>
    api.post<AuthResponse>(ENDPOINTS.AUTH.REGISTER_CLIENT, userData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  registerClientByDriver: (userData: FormData) =>
    api.post<AuthResponse>("/auth/register/client-by-driver", userData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // Organization methods
  manageOrganization: (data: {
    action: "edit" | "delete" | "get" | "list" | "stats";
    organizationId?: string;
    updateData?: any;
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) => api.post<ApiResponse<any>>(ENDPOINTS.ORGANIZATION.MANAGE, data),

  manageUsers: (data: {
    action: "edit" | "delete" | "list";
    userType?: "client" | "driver";
    userId?: string;
    updateData?: Partial<User>;
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) => api.post<ApiResponse<any>>(ENDPOINTS.ORGANIZATION.MANAGE_USERS, data),

  // Routes methods
  manageRoutes: (data: {
    action: "get" | "delete" | "update" | "create" | "read" | "search" | "activate_driver" | "deactivate_driver" | "get_active_route";
    id?: string;
    routeId?: string;
    name?: string;
    path?: string;
    description?: string;
    query?: string;
    [key: string]: any;
  }) => api.post<ApiResponse<any>>(ENDPOINTS.ROUTES.GET_ALL, data),

  getRouteAddresses: () => api.get(ENDPOINTS.ROUTES.ADDRESSES),

  // Driver route activation methods
  activateDriverOnRoute: (routeId: string) => 
    api.post<ApiResponse<any>>(ENDPOINTS.ROUTES.GET_ALL, { action: 'activate_driver', routeId }),
  
  deactivateDriverFromRoute: (routeId: string) => 
    api.post<ApiResponse<any>>(ENDPOINTS.ROUTES.GET_ALL, { action: 'deactivate_driver', routeId }),
  
  getActiveRoute: () => 
    api.post<ApiResponse<any>>(ENDPOINTS.ROUTES.GET_ALL, { action: 'get_active_route' }),

  // Pickups methods
  markPicked: (data: { pickupId: string; notes: string }) => {
    const requestData = {
      status: 'completed',
      notes: data.notes
    };
    console.log(
      "API call to mark pickup:",
      ENDPOINTS.PICKUPS.UPDATE_STATUS(data.pickupId),
      requestData
    );
    return api.put(ENDPOINTS.PICKUPS.UPDATE_STATUS(data.pickupId), requestData);
  },

  batchMarkUnpicked: (data: any) =>
    api.post(ENDPOINTS.PICKUPS.BATCH_MARK_UNPICKED, data),

  getPickupsByRoute: (routeId: string, status: string = "all") => {
    const url = ENDPOINTS.PICKUPS.GET_BY_ROUTE(routeId);
    const params = status !== "all" ? `?status=${status}` : "";
    return api.get(`${url}${params}`);
  },

  getAllUnpickedPickups:async (
    routeId?: string,
    date?: string,
    startDate?: string,
    endDate?: string
  ) => {
    const params = new URLSearchParams();
    if (routeId) params.append("routeId", routeId);
    if (date) params.append("date", date);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    const queryString = params.toString() ? `?${params.toString()}` : "";
    const data = await api.get(`${ENDPOINTS.PICKUPS.GET_ALL_UNPICKED}${queryString}`);
   console.log('inpicked ',data.data)
    return data
  },

  getAllPickedPickups:async (
    routeId?: string,
    date?: string,
    startDate?: string,
    endDate?: string
  ) => {
    const params = new URLSearchParams();
    if (routeId) params.append("routeId", routeId);
    if (date) params.append("date", date);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return await api.get(`${ENDPOINTS.PICKUPS.GET_ALL_PICKED}${queryString}`);
  },

  // Driver specific methods
  getDriverStats: () => api.get<ApiResponse<any>>("/driver/stats"),
  
  // Optimized dashboard API - single call for all dashboard data
  getDashboardData: () => api.get<ApiResponse<any>>("/driver/dashboard"),

  // Bag distribution methods
  distributeBags: (data: {
    client_id: string;
    recipient_email: string;
    number_of_bags: number;
    notes?: string;
  }) => {
    console.log('Sending bag distribution request:', data);
    return api.post(ENDPOINTS.BAGS.DISTRIBUTE, data, {
      timeout: 30000, // 30 second timeout for bag distribution
      headers: {
        'Content-Type': 'application/json'
      }
    });
  },

  verifyBagDistribution: (data: {
    distribution_id: string;
    verification_code: string;
  }) => api.post(ENDPOINTS.BAGS.VERIFY, data),

  getBagDistributionHistory: (clientId: string) =>
    api.get(ENDPOINTS.BAGS.HISTORY(clientId)),
    
  getCurrentWeekBagHistory: (search?: string, routeId?: string) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (routeId) params.append('route_id', routeId);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return api.get(`${ENDPOINTS.BAGS.CURRENT_WEEK}${queryString}`);
  },

  getEligibleClientsForBags: (routeId?: string) => {
    const params = new URLSearchParams();
    if (routeId) params.append('route_id', routeId);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return api.get(`/bags/eligible-clients${queryString}`);
  },

  // Driver bag management
  getDriverBagStats: () => api.get(ENDPOINTS.BAGS.GET_STATS),
  
  getDriverBags: () => api.get(ENDPOINTS.BAGS.GET_DRIVER_BAGS),

  // Bag transfer methods
  initiateBagTransfer: (data: {
    to_driver_id: string;
    number_of_bags: number;
    notes?: string;
    contact?: string;
  }) => api.post(ENDPOINTS.BAGS.TRANSFER_INITIATE, data),

  completeBagTransfer: (data: {
    transfer_id: string;
    otp_code: string;
  }) => api.post(ENDPOINTS.BAGS.TRANSFER_COMPLETE, data),

  getBagTransferHistory: () => api.get(ENDPOINTS.BAGS.TRANSFER_HISTORY),

  // Get organization drivers for transfer
  getOrganizationDrivers: () => api.get('/driver/drivers'),

  // History methods
  getTodayPickups: () => {
    const today = new Date().toISOString().split('T')[0];
    return api.get(`/driver/pickups?date=${today}`);
  },

  getWeekPickups: () => {
    return api.get('/driver/pickups?week=current');
  },

  // Generic HTTP methods
  get: (url: string) => api.get(url),
  post: (url: string, data?: any) => api.post(url, data),
  put: (url: string, data?: any) => api.put(url, data),
  delete: (url: string) => api.delete(url),
};
