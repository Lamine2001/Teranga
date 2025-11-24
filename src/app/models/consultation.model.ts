/**
 * Consultation Models and Interfaces
 * Updated to align with backend DTOs and entities
 */

export interface Consultation {
  id: number;
  appointmentId: string;
  doctorId: number;
  doctorFirstName: string;
  doctorLastName: string;
  doctorName?: string;
  doctorSpecialty: string;
  patientId: string;  // Changed from number to match backend UUID
  patientFirstName: string;
  patientLastName: string;
  patientEmail: string;
  startTime: string;
  startedAt?: string;
  endTime?: string;
  endedAt?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'COMPLETED' | 'IN_PROGRESS' | 'SCHEDULED' | 'CANCELLED';
  consultationType: 'virtual' | 'onsite';
  chiefComplaint?: string;
  symptoms?: string;
  historyOfPresentIllness?: string;
  physicalExamination?: string;
  // Vital Signs
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  // Diagnosis and Treatment
  diagnosis?: string;
  treatment?: string;
  duration?: string;
  // Lab Tests
  testName?: string;
  // Follow-up and Notes
  recommendations?: string;
  additionalNotes?: string;
  treatmentPlan?: string;
  examinationFindings?: string;
  presentIllness?: string;
  durationMinutes?: number;
  followUpDate?: string;
  followUpRequired?: boolean;
  followUpInstructions?: string;
  vitals?: any;
  notes?: string;
  prescriptions?: Prescription[];
  labTests?: LabTest[];
  followUpNotes?: string;
  createdAt: string;
  updatedAt?: string;
  
  // Video Consultation Configuration
  videoConfig?: VideoConsultationConfig;
}

export interface ConsultationNotes {
  chiefComplaint: string;
  presentIllness: string;  // Backend field name (was: symptoms)
  symptoms?: string;  // Keep for backward compatibility
  examinationFindings?: string;  // Backend field name (was: physicalExamination)
  physicalExamination?: string;  // Keep for backward compatibility
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
  appointmentId: string;
  patientId?: number;
  consultationType?: 'virtual' | 'onsite';
  notes?: string;
}

/**
 * End Consultation Request - Aligned with backend EndConsultationRequestDTO
 * Uses flat structure to match backend expectations
 */
export interface EndConsultationRequest {
  appointmentId: string;
  notes: ConsultationNotes;
  duration?: number;
  patientSatisfaction?: number;
}

export interface ConsultationHistoryFilter {
  patientId?: number | string; // Accept both number and string
  doctorId?: number | string;
  startDate?: string;
  endDate?: string;
  status?: string[] | string;
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
  // Platform and basic info
  platform: 'jitsi' | 'zoom' | 'teams' | 'meet' | 'custom';
  meetingId?: string;
  meetingLink?: string;
  meetingPasscode?: string;
  hostKey?: string;
  conferenceId?: string;
  roomName?: string;
  sessionId?: string;
  
  // Consultation reference
  consultationId: string;
  
  // Doctor information
  doctorId: number;
  doctorName: string;
  doctorEmail?: string;
  doctorRole?: string; // 'host' or 'moderator'
  
  // Patient information
  patientId: number;
  patientName: string;
  patientEmail?: string;
  patientRole?: string; // 'participant' or 'guest'
  
  // URLs
  participantUrl?: string;
  hostUrl?: string;
  
  // Join status
  isHostJoined?: boolean;
  isGuestJoined?: boolean;
  
  // Meeting settings
  maxParticipants?: number;
  recordingEnabled?: boolean;
  waitingRoomEnabled?: boolean;
  screenShareEnabled?: boolean;
  chatEnabled?: boolean;
  muteOnEntry?: boolean;
  videoOnEntry?: boolean;
  meetingStatus?: string;
  meetingDuration?: string;
  timeZone?: string;
  
  // Security settings
  securityCode?: string;
  isPasswordProtected?: boolean;
  
  // Legacy/Platform-specific fields (kept for backward compatibility)
  roomId?: string;
  participantToken?: string;
  expiresAt?: string;
  jitsiDomain?: string;
  jitsiRoomName?: string;
  jitsiToken?: string;
  jitsiPassword?: string;
  zoomMeetingId?: string;
  zoomMeetingNumber?: number;
  zoomPasscode?: string;
  zoomPassword?: string;
  zoomSignature?: string;
  zoomApiKey?: string;
  zoomSdkKey?: string;
  zoomSdkSecret?: string;
  zoomRole?: number;
  zoomJoinUrl?: string;
  zoomStartUrl?: string;
  teamsUrl?: string;
  teamsJoinUrl?: string;
  teamsMeetingId?: string;
  teamsThreadId?: string;
  teamsToken?: string;
  meetUrl?: string;
  meetCode?: string;
  meetToken?: string;
  customUrl?: string;
  customPlatformName?: string;
  customToken?: string;
  customApiKey?: string;
  customSettings?: Record<string, any>;
  startTime?: string;
  scheduledStartTime?: Date;
  duration?: number;
  isRecordingEnabled?: boolean;
  isWaitingRoomEnabled?: boolean;
  isChatEnabled?: boolean;
  isScreenSharingEnabled?: boolean;
  requirePassword?: boolean;
  allowAnonymousJoin?: boolean;
  muteParticipantsOnEntry?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
