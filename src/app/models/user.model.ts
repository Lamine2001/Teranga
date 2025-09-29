export interface UserProfile {
  id: string;
  username?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  userType?: 'PATIENT' | 'DOCTOR';
  enabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
  address?: string;
  dateOfBirth?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  specialty?: string;
  licenseNumber?: string;
  department?: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  success: boolean;
  timestamp?: string;
}
