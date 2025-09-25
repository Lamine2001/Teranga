import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AppointmentResponseDTO {
  id: number;
  patientId: number;
  patientFirstName: string;
  patientLastName: string;
  patientEmail: string;
  patientPhone: string;
  doctorId: number;
  doctorFirstName: string;
  doctorLastName: string;
  doctorEmail: string;
  doctorSpecialty: string;
  doctorDepartment: string;
  appointmentTime: string;
  endTime: string;
  appointmentType?: 'virtual' | 'onsite';
  consultationFee?: number;
  status: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface SearchAvailabilityRequestDTO {
  date: Date;
  specialty?: string;
  doctorId?: number;
  doctorName?: string;
  appointmentType?: 'virtual' | 'onsite';
  preferredTimes?: string[];
  maxDistance?: number;
  location?: string;
}

export interface BookAppointmentRequestDTO {
  availabilityId: number;
  patientId?: string;
  appointmentType?: 'virtual' | 'onsite';
  reasonForVisit?: string;
  symptoms?: string;
  urgency?: 'low' | 'medium' | 'high';
  preferredLanguage?: string;
  technicalRequirements?: {
    hasStableInternet?: boolean;
    hasWebcam?: boolean;
    hasMicrophone?: boolean;
    hasSpeaker?: boolean;
    platformPreference?: string;
  };
  transportationMethod?: string;
  accessibilityNeeds?: string;
  reminderPreferences?: {
    method: string;
    timing: string;
  };
  additionalNotes?: string;
  paymentData?: any;
  paymentId?: string;
  notes?: string;
}

export interface BookingResponseDTO {
  success: boolean;
  appointment?: AppointmentResponseDTO;
  error?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  searchAvailableSlots(request: SearchAvailabilityRequestDTO): Observable<AppointmentResponseDTO[]> {
    return this.http.post<AppointmentResponseDTO[]>(`${this.apiUrl}/appointments/search`, request);
  }

  searchAvailableSlotsPublic(request: SearchAvailabilityRequestDTO): Observable<AppointmentResponseDTO[]> {
    return this.http.post<AppointmentResponseDTO[]>(`${this.apiUrl}/appointments/search-public`, request);
  }

  bookAppointment(request: BookAppointmentRequestDTO): Observable<BookingResponseDTO> {
    return this.http.post<BookingResponseDTO>(`${this.apiUrl}/appointments/book`, request);
  }

  getPatientAppointments(): Observable<AppointmentResponseDTO[]> {
    return this.http.get<AppointmentResponseDTO[]>(`${this.apiUrl}/appointments/patient`);
  }

  getDoctorAppointments(): Observable<AppointmentResponseDTO[]> {
    return this.http.get<AppointmentResponseDTO[]>(`${this.apiUrl}/appointments/doctor`);
  }

  cancelAppointment(appointmentId: number): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/appointments/${appointmentId}`);
  }

  rescheduleAppointment(appointmentId: number, newAvailabilityId: number): Observable<AppointmentResponseDTO> {
    return this.http.post<AppointmentResponseDTO>(
      `${this.apiUrl}/appointments/${appointmentId}/reschedule?newAvailabilityId=${newAvailabilityId}`,
      {}
    );
  }

  getUpcomingAppointments(): Observable<AppointmentResponseDTO[]> {
    return this.http.get<AppointmentResponseDTO[]>(`${this.apiUrl}/appointments/upcoming`);
  }

  /**
   * Get doctor availability slots
   */
  getDoctorAvailability(doctorId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/doctors/${doctorId}/availability`);
  }

  /**
   * Alternative method name that might be used
   * Get all availabilities for a specific doctor
   */
  getAvailabilities(doctorId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/availabilities?doctorId=${doctorId}`);
  }
}
