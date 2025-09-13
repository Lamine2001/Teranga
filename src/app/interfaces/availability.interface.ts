export interface CreateAvailabilityRequest {
  startTime: string; // ISO 8601 format
  endTime: string;   // ISO 8601 format
  durationMinutes: number;
}

export interface Availability {
  id?: number;
  doctorId: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  isAvailable: boolean;
  isBlocked?: boolean;
  slots?: TimeSlot[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TimeSlot {
  id?: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  isBooked: boolean;
}

export interface AvailabilityResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: Availability;
}

export interface AvailabilityListResponse {
  success: boolean;
  data?: Availability[];
  message?: string;
  error?: string;
}
