export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  gender: 'M' | 'F';
}

export interface PatientsResponse {
  success: boolean;
  count: number;
  doctorId?: string;
  query?: string;
  patients: Patient[];
}

export interface AppointmentHistory {
  appointmentId: string;
  doctorName: string;
  specialty: string;
  appointmentDate: string;
  status: string;
  notes: string;
}

export interface MedicalRecord {
  patientId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  gender: 'M' | 'F';
  appointmentHistory: AppointmentHistory[];
  totalAppointments: number;
  lastVisitDate: string;
}

export interface MedicalRecordResponse {
  success: boolean;
  medicalRecord: MedicalRecord;
}
