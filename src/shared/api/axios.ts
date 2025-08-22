import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthResponse, User, ApiResponse } from "../types";

// API Configuration
const api = axios.create({
  baseURL: "http://192.168.1.189:3000",

  timeout: 10000,
});
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
    console.log(error.response)
    return Promise.reject(error);
  }
);

// API Endpoints
const ENDPOINTS = {
  AUTH: {
    REGISTER: "/api/auth/register",
    LOGIN: "/api/auth/login",
    PROFILE: "/api/auth/profile",
    CHANGE_PASSWORD: "/api/auth/change-password",
    SEND_VERIFICATION: "/api/auth/send-verification-code",
    REGISTER_ORGANIZATION: "/api/auth/register/organization",
    REGISTER_DRIVER: "/api/auth/register/driver",
    REGISTER_CLIENT: "/api/auth/register/client",
  },
  ORGANIZATION: {
    MANAGE: "/api/auth/organization/manage",
    MANAGE_USERS: "/api/auth/organization/users/manage",
  },
  ROUTES: {
    GET_ALL: "/api/routes",
    ADDRESSES: "/api/auth/routes/addresses",
  },
  PICKUPS: {
    UPDATE_STATUS: (pickupId: string) => `/api/pickUps/${pickupId}`,
    BATCH_MARK_UNPICKED: "/api/pickUps/batch-mark-unpicked",
    GET_BY_ROUTE: (routeId: string) => `/api/pickUps/route/${routeId}`,
    GET_ALL_UNPICKED: "/api/pickUps/all/unpicked",
    GET_ALL_PICKED: "/api/pickUps/all/picked",
  },
  BAGS: {
    DISTRIBUTE: "/api/bags/distribute",
    VERIFY: "/api/bags/verify",
    HISTORY: (clientId: string) => `/api/bags/history/${clientId}`,
    CURRENT_WEEK: "/api/bags/current-week",
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
    api.post<AuthResponse>("/api/auth/register/client-by-driver", userData, {
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
  getDriverStats: () => api.get<ApiResponse<any>>("/api/driver/stats"),
  
  // Optimized dashboard API - single call for all dashboard data
  getDashboardData: () => api.get<ApiResponse<any>>("/api/driver/dashboard"),

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
    return api.get(`/api/bags/eligible-clients${queryString}`);
  },
};
