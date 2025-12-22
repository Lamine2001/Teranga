import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AvailabilityDTO {
  id: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  startTime: string;
  endTime: string;
  status: 'AVAILABLE' | 'BOOKED' | 'CANCELLED';
}

export interface Doctor {
  id: string;
  firstName: string | null;
  lastName: string | null;
  specialty: string;
  department: string | null;
  bio: string | null;
  education: string | null;
  experience: string | null;
  consultationFee: string | null;
  languages: string | null;
  workingHours: string | null;
  rating: number | null;
  totalReviews: number | null;
  availabilities: AvailabilityDTO[];
}

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAllDoctors(): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(`${this.apiUrl}/doctors`);
  }

  getDoctorById(id: string): Observable<Doctor> {
    return this.http.get<Doctor>(`${this.apiUrl}/doctors/${id}`);
  }

  getDoctorsBySpecialty(specialty: string): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(`${this.apiUrl}/doctors/specialty/${specialty}`);
  }

  getAvailableDoctors(): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(`${this.apiUrl}/doctors/available`);
  }

  searchDoctors(query: string): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(`${this.apiUrl}/doctors/search`, {
      params: { q: query }
    });
  }
}
