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
  status: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface SearchAvailabilityRequestDTO {
  date: Date;
  specialty?: string;
  doctorId?: number;
  preferredTimes?: string[];
  maxDistance?: number;
}

export interface BookAppointmentRequestDTO {
  availabilityId: number;
  notes?: string;
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

  bookAppointment(request: BookAppointmentRequestDTO): Observable<AppointmentResponseDTO> {
    return this.http.post<AppointmentResponseDTO>(`${this.apiUrl}/appointments/book`, request);
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
}
