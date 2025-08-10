export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'doctor' | 'patient';
  phone?: string;
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
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
  dateOfBirth: Date;
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
  dateOfBirth?: Date; // Pour les patients
  address?: string; // Pour les patients
}
