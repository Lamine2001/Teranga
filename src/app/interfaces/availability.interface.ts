export interface CreateAvailabilityRequest {
  startTime: string; // ISO 8601 format
  endTime: string;   // ISO 8601 format
  durationMinutes: number;
}

export interface Availability {
  id: string;
  doctorId: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  isBlocked: boolean;
  createdAt?: string;
  updatedAt?: string;
  slots?: TimeSlot[];
}

export interface TimeSlot {
  id?: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  isBooked: boolean;
  patientId?: string;
}

export interface AvailabilityResponse {
  success: boolean;
  data?: Availability;
  message?: string;
  error?: string;
}

export interface AvailabilityListResponse {
  success: boolean;
  data?: Availability[];
  message?: string;
  error?: string;
}
