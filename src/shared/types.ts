export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  address?: string;
  pickUpDay?: string;
  route?: string;
  isActive: boolean;
}

export interface Route {
    activeDriverId: React.JSX.Element;
  _id: string;
  name: string;
  path: string;
  description?: string;
}

export interface PickupRecord {
  _id: string;
  user_id: string;
  pickup_dates: Map<string, {
    status: 'picked' | 'unpicked';
    timestamp: Date;
    notes?: string;
  }>;
}

export interface BagDistribution {
  _id: string;
  client_id: string;
  recipient_email: string;
  number_of_bags: number;
  verification_code: string;
  is_verified: boolean;
  verification_timestamp?: Date;
  distribution_timestamp: Date;
  driver_id: string;
  notes?: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
  error?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}