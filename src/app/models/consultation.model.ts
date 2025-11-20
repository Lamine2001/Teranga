/**
 * Consultation Models and Interfaces
 */

export interface Consultation {
  id: number;
  appointmentId: string;
  doctorId: number;
  doctorFirstName: string;
  doctorLastName: string;
  doctorName?: string; // Add doctorName property
  doctorSpecialty: string;
  patientId: number;
  patientFirstName: string;
  patientLastName: string;
  patientEmail: string;
  startTime: string;
  startedAt?: string; // Add startedAt property
  endTime?: string;
  endedAt?: string; // Add endedAt property
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'COMPLETED' | 'IN_PROGRESS' | 'SCHEDULED' | 'CANCELLED'; // Add uppercase status values
  consultationType: 'virtual' | 'onsite';
  chiefComplaint?: string;
  symptoms?: string;
  historyOfPresentIllness?: string;
  physicalExamination?: string;
  examinationFindings?: string; // Add examinationFindings
  presentIllness?: string; // Add presentIllness
  // Vital Signs
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  vitals?: any; // Add vitals object
  // Diagnosis and Treatment
  diagnosis?: string;
  treatmentPlan?: string;
  treatment?: string;
  duration?: string;
  durationMinutes?: number; // Add durationMinutes
  // Lab Tests
  testName?: string;
  // Follow-up and Notes
  recommendations?: string;
  followUpDate?: string;
  followUpRequired?: boolean; // Add followUpRequired
  followUpInstructions?: string;
  additionalNotes?: string;
  notes?: string;
  prescriptions?: Prescription[];
  labTests?: LabTest[];
  followUpNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ConsultationNotes {
  chiefComplaint: string;
  symptoms: string;
  physicalExamination?: string;
  diagnosis: string;
  treatment: string;
  treatmentPlan?: string;
  recommendations: string;
  prescriptions?: Prescription[];
  labTests?: LabTest[];
  followUpDate?: string;
  followUpInstructions?: string;
  additionalNotes?: string;
  status?: string
}

export interface Prescription {
  id?: number;
  consultationId?: number;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  refillable: boolean;
  refillsAllowed?: number;
  createdAt?: string;
}

export interface LabTest {
  id?: number;
  consultationId?: number;
  testName: string;
  testType: string;
  urgency: 'routine' | 'urgent' | 'stat';
  instructions?: string;
  labName?: string;
  estimatedCost?: number;
  createdAt?: string;
}

export interface StartConsultationRequest {
  appointmentId: string;
  patientId?: number;
  consultationType?: 'virtual' | 'onsite';
  notes?: string;
}

export interface EndConsultationRequest {
  appointmentId: string;
  notes: ConsultationNotes;
  duration?: number;
  patientSatisfaction?: number;
}

export interface ConsultationHistoryFilter {
  patientId?: number;
  doctorId?: number;
  startDate?: string;
  endDate?: string;
  status?: string[] | string; // Updated to allow both array and single string
  consultationType?: 'virtual' | 'onsite';
  searchQuery?: string;
}

export interface ConsultationSummary {
  totalConsultations: number;
  completedConsultations: number;
  averageDuration: number;
  patientSatisfactionAverage: number;
  consultationsByType: {
    virtual: number;
    onsite: number;
  };
}

export interface VideoConsultationConfig {
  consultationId: number;
  roomId: string;
  participantToken: string;
  platform: 'jitsi' | 'zoom' | 'meet' | 'custom';
  expiresAt: string;
}