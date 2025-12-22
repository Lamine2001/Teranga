export interface UserManagement {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  userType: 'PATIENT' | 'DOCTOR' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
  specialty?: string;
  hospital?: string;
}

export interface UserStats {
  pending: number;
  active: number;
  disabled: number;
  total: number;
}

export interface UsersResponse {
  success: boolean;
  count: number;
  description: string;
  users: UserManagement[];
}
