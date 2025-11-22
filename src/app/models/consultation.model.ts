/**
 * Consultation Models and Interfaces
 */

export interface Consultation {
  id: number;
  appointmentId: string;
  doctorId: number;
  doctorFirstName: string;
  doctorLastName: string;
  doctorName?: string;
  doctorSpecialty: string;
  patientId: number;
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
  examinationFindings?: string;
  presentIllness?: string;
  // Vital Signs
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  vitals?: any;
  // Diagnosis and Treatment
  diagnosis?: string;
  treatmentPlan?: string;
  treatment?: string;
  duration?: string;
  durationMinutes?: number;
  // Lab Tests
  testName?: string;
  // Follow-up and Notes
  recommendations?: string;
  followUpDate?: string;
  followUpRequired?: boolean;
  followUpInstructions?: string;
  additionalNotes?: string;
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