import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UserProfile, UpdateProfileRequest, ChangePasswordRequest, ApiResponse } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getCurrentUserProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/profile`, { 
      headers: this.getHeaders() 
    });
  }

  getUserProfileById(userId: string): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/${userId}/profile`, { 
      headers: this.getHeaders() 
    });
  }

  updateCurrentUserProfile(profileData: UpdateProfileRequest): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}/profile`, profileData, { 
      headers: this.getHeaders() 
    });
  }

  changePassword(passwordData: ChangePasswordRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/change-password`, passwordData, { 
      headers: this.getHeaders() 
    });
  }

  /**
   * Get user by ID (for consultation purposes)
   */
  getUserById(userId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${userId}`, { 
      headers: this.getHeaders() 
    }).pipe(
      catchError(error => {
        console.error('Error fetching user by ID:', error);
        throw error;
      })
    );
  }

  /**
   * Search users (patients/doctors)
   */
  searchUsers(query: string, userType?: 'PATIENT' | 'DOCTOR'): Observable<any[]> {
    const params: any = { q: query };
    if (userType) {
      params.userType = userType;
    }

    return this.http.get<any[]>(`${this.apiUrl}/search`, { 
      headers: this.getHeaders(),
      params
    }).pipe(
      catchError(error => {
        console.error('Error searching users:', error);
        return of([]);
      })
    );
  }

  /**
   * Get patient medical history
   */
  getPatientMedicalHistory(patientId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${patientId}/medical-history`, { 
      headers: this.getHeaders() 
    }).pipe(
      catchError(error => {
        console.error('Error fetching medical history:', error);
        return of({ medicalHistory: [] });
      })
    );
  }
}
