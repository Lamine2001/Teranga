/**
 * Consultation Models and Interfaces
 */

export interface Consultation {
  id: number;
  appointmentId: number;
  doctorId: number;
  doctorFirstName: string;
  doctorLastName: string;
  doctorSpecialty: string;
  patientId: number;
  patientFirstName: string;
  patientLastName: string;
  patientEmail: string;
  startTime: string;
  endTime?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  consultationType: 'virtual' | 'onsite';
  chiefComplaint?: string;
  symptoms?: string;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
  prescriptions?: Prescription[];
  labTests?: LabTest[];
  followUpDate?: string;
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
  recommendations: string;
  prescriptions?: Prescription[];
  labTests?: LabTest[];
  followUpDate?: string;
  followUpInstructions?: string;
  additionalNotes?: string;
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
  appointmentId: number;
  consultationType: 'virtual' | 'onsite';
  videoCallLink?: string;
}

export interface EndConsultationRequest {
  consultationId: number;
  notes: ConsultationNotes;
  duration?: number;
  patientSatisfaction?: number;
}

export interface ConsultationHistoryFilter {
  patientId?: number;
  doctorId?: number;
  startDate?: string;
  endDate?: string;
  status?: string[];
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

