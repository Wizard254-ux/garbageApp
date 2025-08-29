export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'organization' | 'driver' | 'client';
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Organization extends User {
  role: 'organization';
}

export interface Driver extends User {
  role: 'driver';
  organizationId: string;
}

export interface Client extends User {
  role: 'client';
  organizationId: string;
  route: string;
  pickUpDay: string;
  address: string;
}

export interface Route {
  _id: string;
  name: string;
  path: string;
  description: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PickupRecord {
  _id: string;
  user_id: string;
  date: string;
  notes?: string;
  isPicked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface BagStats {
  allocated_bags: number;
  used_bags: number;
  available_bags: number;
}

export interface BagTransfer {
  id: string;
  from_driver_id: string;
  to_driver_id: string;
  organization_id: string;
  number_of_bags: number;
  status: 'pending' | 'completed' | 'expired';
  notes?: string;
  created_at: string;
  completed_at?: string;
  otp_expires_at?: string;
  from_driver?: { id: string; name: string };
  to_driver?: { id: string; name: string };
}