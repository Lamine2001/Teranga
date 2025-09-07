import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, throwError, of } from 'rxjs';
import { UserProfile, UpdateProfileRequest, ChangePasswordRequest } from '../models/user-profile.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  private apiUrl = 'http://localhost:8080/api';
  private currentUserSubject = new BehaviorSubject<UserProfile | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getCurrentUserProfile(): Observable<UserProfile> {
    // Debug log to check if the interceptor is working
    console.log('Fetching user profile from:', `${this.apiUrl}/users/profile`);
    console.log('Token available:', !!this.authService.getToken());
    
    // The auth interceptor will automatically add the token
    return this.http.get<UserProfile>(`${this.apiUrl}/users/profile`).pipe(
      tap(profile => {
        console.log('Profile received:', profile);
        this.currentUserSubject.next(profile);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error fetching profile:', error);
        return throwError(() => error);
      })
    );
  }

  updateCurrentUserProfile(profileData: UpdateProfileRequest): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}/users/profile`, profileData).pipe(
      tap(profile => this.currentUserSubject.next(profile))
    );
  }

  changePassword(passwordData: ChangePasswordRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/change-password`, passwordData, { 
      responseType: 'text' as 'json' // Handle text response
    }).pipe(
      tap(response => {
        console.log('Change password response:', response);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Change password error:', error);
        // If the response is actually successful but returned as text
        if (error.status >= 200 && error.status < 300) {
          return of({ success: true, message: 'Password changed successfully' });
        }
        return throwError(() => error);
      })
    );
  }

  getCurrentUser(): UserProfile | null {
    return this.currentUserSubject.value;
  }
}

