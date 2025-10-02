import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Enregistrer un nouveau patient
   */
  registerPatient(data: PatientRegistrationDTO): Observable<PatientRegistrationResponseDTO> {
    return this.http.post<PatientRegistrationResponseDTO>(`${this.apiUrl}/patients/register`, data);
  }

  /**
   * Récupérer le profil du patient connecté
   */
  getPatientProfile(): Observable<PatientRegistrationResponseDTO> {
    return this.http.get<PatientRegistrationResponseDTO>(`${this.apiUrl}/patients/profile`);
  }

  /**
   * Mettre à jour le profil du patient
   */
  updatePatientProfile(data: Partial<PatientRegistrationDTO>): Observable<PatientRegistrationResponseDTO> {
    return this.http.put<PatientRegistrationResponseDTO>(`${this.apiUrl}/patients/profile`, data);
  }
}
