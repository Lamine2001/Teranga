export interface User {
  id?: number | string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string; // Add dateOfBirth property
  gender?: string; // Add gender property
  address?: string; // Add address property
  city?: string; // Add city property
  userType?: 'patient' | 'doctor' | string;
  role?: string;  // Add role property for compatibility
  isActive?: boolean; // Add isActive property
  createdAt?: string; // Add createdAt property
  updatedAt?: string; // Add updatedAt property
}

export interface Doctor extends User {
  userType: 'doctor';
  specialization: string;
  licenseNumber: string;
  department: string;
  availableHours: string[];
}

export interface Patient extends User {
  userType: 'patient';
  dateOfBirth: string; // Changed from Date to string to match User interface
  address: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalHistory?: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
  userType: 'doctor' | 'patient';
}

export interface RegisterData extends LoginCredentials {
  firstName: string;
  lastName: string;
  phone?: string;
  confirmPassword: string;
  // Champs spécifiques selon le type d'utilisateur
  specialization?: string; // Pour les médecins
  licenseNumber?: string; // Pour les médecins
  dateOfBirth?: string; // Pour les patients - Changed from Date to string
  address?: string; // Pour les patients
}

