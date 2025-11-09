/**
 * Consultation Models and Interfaces
 * Updated to align with backend DTOs and entities
 */

export interface Consultation {
  id: string;  // Changed from number to match backend UUID
  appointmentId: string;  // Changed from number to match backend UUID
  doctorId: string;  // Changed from number to match backend UUID
  doctorFirstName: string;
  doctorLastName: string;
  doctorSpecialty: string;
  patientId: string;  // Changed from number to match backend UUID
  patientFirstName: string;
  patientLastName: string;
  patientEmail: string;
  startTime: string;
  endTime?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  consultationType: 'virtual' | 'onsite';
  chiefComplaint?: string;
  presentIllness?: string;  // Backend field name (was: symptoms)
  symptoms?: string;  // Keep for backward compatibility
  diagnosis?: string;
  treatmentPlan?: string;  // Backend field name (was: treatment)
  treatment?: string;  // Keep for backward compatibility
  examinationFindings?: string;  // Backend field name (was: physicalExamination)
  notes?: string;
  prescriptions?: Prescription[];
  labTests?: LabTest[];
  followUpDate?: string;
  followUpInstructions?: string;  // Backend field name (was: followUpNotes)
  followUpNotes?: string;  // Keep for backward compatibility
  durationMinutes?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ConsultationNotes {
  chiefComplaint: string;
  presentIllness: string;  // Backend field name (was: symptoms)
  symptoms?: string;  // Keep for backward compatibility
  examinationFindings?: string;  // Backend field name (was: physicalExamination)
  physicalExamination?: string;  // Keep for backward compatibility
  diagnosis: string;
  treatmentPlan: string;  // Backend field name (was: treatment)
  treatment?: string;  // Keep for backward compatibility
  recommendations?: string;
  prescriptions?: Prescription[];
  labTests?: LabTest[];
  followUpDate?: string;
  followUpInstructions?: string;
  additionalNotes?: string;
}

export interface Prescription {
  id?: string;  // Changed from number to match backend UUID
  consultationId?: string;  // Changed from number to match backend UUID
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  notes?: string;
  quantity?: number;
  unit?: string;
  doctorNotes?: string;
  warnings?: string;
  status?: string;
  prescribedDate?: string;
  startDate?: string;
  endDate?: string;
  refillable?: boolean;  // Made optional for compatibility
  refillsAllowed?: number;
  refillsRemaining?: number;
  pharmacyInstructions?: string;
  doctorName?: string;
  patientName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LabTest {
  id?: string;  // Changed from number to match backend UUID
  consultationId?: string;  // Changed from number to match backend UUID
  testName: string;
  testCode?: string;  // Backend field name
  testType?: string;  // Keep for backward compatibility
  description?: string;
  urgency: 'routine' | 'urgent' | 'stat' | string;  // Backend uses string
  instructions?: string;
  notes?: string;
  labLocation?: string;  // Backend field name
  labName?: string;  // Keep for backward compatibility
  preferredDate?: string;
  status?: string;
  requiredPreparations?: string;
  results?: string;
  completedAt?: string;
  resultUnit?: string;
  referenceRange?: string;
  resultInterpretation?: string;
  labTechnician?: string;
  sampleType?: string;
  fastingRequired?: boolean;
  priorityLevel?: number;
  estimatedCost?: number;
  doctorName?: string;
  patientName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StartConsultationRequest {
  appointmentId: string;  // Changed from number to match backend UUID
  patientId?: string;  // Changed from number to match backend UUID
  consultationType?: 'virtual' | 'onsite';
  notes?: string;
}

/**
 * End Consultation Request - Aligned with backend EndConsultationRequestDTO
 * Uses flat structure to match backend expectations
 */
export interface EndConsultationRequest {
  appointmentId: string;  // Changed from number to match backend UUID
  diagnosis: string;
  treatmentPlan: string;  // Backend field name (not 'treatment')
  examinationFindings?: string;  // Backend field name (not 'physicalExamination')
  chiefComplaint?: string;
  presentIllness?: string;  // Backend field name (not 'symptoms')
  prescriptionsJson?: string;  // Backend expects JSON string
  labTestsJson?: string;  // Backend expects JSON string
  followUpRequired?: boolean;
  followUpDate?: string;
  followUpInstructions?: string;
  duration?: number;
  patientSatisfaction?: number;
  
  // Keep old structure for backward compatibility
  notes?: ConsultationNotes;
}

export interface ConsultationHistoryFilter {
  patientId?: string;  // Changed from number to match backend UUID
  doctorId?: string;  // Changed from number to match backend UUID
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
  consultationId: string;  // Changed from number to match backend UUID
  roomId: string;
  participantToken: string;
  platform: 'jitsi' | 'zoom' | 'meet' | 'custom';
  expiresAt: string;
}

/**
 * Helper function to convert ConsultationNotes to flat EndConsultationRequest
 * This ensures compatibility with backend EndConsultationRequestDTO
 */
export function toEndConsultationRequest(
  appointmentId: string,
  notes: ConsultationNotes,
  duration?: number,
  patientSatisfaction?: number
): EndConsultationRequest {
  return {
    appointmentId,
    diagnosis: notes.diagnosis,
    treatmentPlan: notes.treatmentPlan || notes.treatment || '',
    examinationFindings: notes.examinationFindings || notes.physicalExamination,
    chiefComplaint: notes.chiefComplaint,
    presentIllness: notes.presentIllness || notes.symptoms || '',
    prescriptionsJson: notes.prescriptions ? JSON.stringify(notes.prescriptions) : undefined,
    labTestsJson: notes.labTests ? JSON.stringify(notes.labTests) : undefined,
    followUpRequired: !!notes.followUpDate,
    followUpDate: notes.followUpDate,
    followUpInstructions: notes.followUpInstructions,
    duration,
    patientSatisfaction
  };
}

