import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PatientsResponse, MedicalRecordResponse } from '../interfaces/patient.interface';

export interface PatientRegistrationDTO {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address?: string;
  city?: string;
  postalCode?: string;
}

export interface PatientRegistrationResponseDTO {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address?: string;
  city?: string;
  postalCode?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private readonly apiUrl = `${environment.apiUrl}/patients`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
  }

  /**
   * Enregistrer un nouveau patient
   */
  registerPatient(data: PatientRegistrationDTO): Observable<PatientRegistrationResponseDTO> {
    return this.http.post<PatientRegistrationResponseDTO>(`${this.apiUrl}/register`, data);
  }

  /**
   * Récupérer le profil du patient connecté
   */
  getPatientProfile(): Observable<PatientRegistrationResponseDTO> {
    return this.http.get<PatientRegistrationResponseDTO>(`${this.apiUrl}/profile`);
  }

  /**
   * Mettre à jour le profil du patient
   */
  updatePatientProfile(data: Partial<PatientRegistrationDTO>): Observable<PatientRegistrationResponseDTO> {
    return this.http.put<PatientRegistrationResponseDTO>(`${this.apiUrl}/profile`, data);
  }

  /**
   * Récupérer les patients d'un médecin
   */
  getDoctorPatients(doctorId: string): Observable<PatientsResponse> {
    return this.http.get<PatientsResponse>(`${this.apiUrl}/doctor/${doctorId}`, { headers: this.getHeaders() });
  }

  /**
   * Rechercher des patients
   */
  searchPatients(query: string): Observable<PatientsResponse> {
    return this.http.get<PatientsResponse>(`${this.apiUrl}/search?query=${encodeURIComponent(query)}`, { headers: this.getHeaders() });
  }

  /**
   * Récupérer le dossier médical d'un patient
   */
  getPatientMedicalRecord(patientId: string): Observable<MedicalRecordResponse> {
    return this.http.get<MedicalRecordResponse>(`${this.apiUrl}/${patientId}/medical-record`, { headers: this.getHeaders() });
  }
}
