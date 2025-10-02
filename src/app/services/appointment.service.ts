import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

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

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  searchAvailableSlots(request: SearchAvailabilityRequestDTO): Observable<AppointmentResponseDTO[]> {
    return this.http.post<AppointmentResponseDTO[]>(`${this.apiUrl}/appointments/search`, request);
  }

  searchAvailableSlotsPublic(request: SearchAvailabilityRequestDTO): Observable<AppointmentResponseDTO[]> {
    return this.http.post<AppointmentResponseDTO[]>(`${this.apiUrl}/appointments/search-public`, request);
  }

  /**
   * Réservation pour un patient existant connecté
   */
  bookAppointment(request: any): Observable<any> {
    console.log('=== APPOINTMENT SERVICE - bookAppointment ===');
    console.log('Request:', request);
    
    // Récupérer le token depuis le localStorage
    const token = localStorage.getItem('token') || localStorage.getItem('authToken') || sessionStorage.getItem('token');
    console.log('Token found:', !!token);
    
    if (!token) {
      console.error('No token found for authenticated request!');
    }
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
    
    console.log('Headers:', headers.keys());
    console.log('Making POST request to:', `${this.apiUrl}/book`);
    
    return this.http.post<any>(`${this.apiUrl}/book`, request, { headers }).pipe(
      tap(response => {
        console.log('API Response received:', response);
      }),
      catchError(error => {
        console.error('API Error:', error);
        throw error;
      })
    );
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

  createAppointment(appointmentData: any): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    // Prepare the appointment request
    const request = {
      doctorId: appointmentData.doctorId,
      slotId: appointmentData.slotId,
      consultationType: appointmentData.consultationType || 'IN_PERSON',
      notes: appointmentData.notes || ''
    };

    console.log('Creating appointment with data:', request);

    return this.http.post(`${this.apiUrl}/appointments`, request, { headers }).pipe(
      map(response => {
        console.log('Appointment created:', response);
        return response;
      }),
      catchError(error => {
        console.error('Error creating appointment:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Inscription et réservation en une seule étape pour un nouveau patient
   */
  registerAndBook(request: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    console.log('Calling register-and-book API:', request);
    
    return this.http.post<any>(`${this.apiUrl}/appointments/register-and-book`, request, { headers });
  }

  /**
   * Réservation pour un invité (sans création de compte)
   */
  bookAsGuest(request: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    console.log('Calling guest booking API:', request);
    
    // Utiliser l'URL correcte du backend
    return this.http.post<any>(`${this.apiUrl}/appointments/book-as-guest`, request, { headers });
  }
}
