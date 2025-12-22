import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { UserManagement, UsersResponse } from '../interfaces/user-management.interface';

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {
  private readonly apiUrl = `${environment.apiUrl}/auth/users`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
  }

  getPendingUsers(): Observable<UsersResponse> {
    return this.http.get<UsersResponse>(`${this.apiUrl}/pending-activation`, { headers: this.getHeaders() });
  }

  getActiveUsers(): Observable<UsersResponse> {
    return this.http.get<UsersResponse>(`${this.apiUrl}/active`, { headers: this.getHeaders() });
  }

  getDisabledUsers(): Observable<UsersResponse> {
    return this.http.get<UsersResponse>(`${this.apiUrl}/inactive`, { headers: this.getHeaders() });
  }

  activateUser(email: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/enableDisableUser`, { email }, { headers: this.getHeaders() });
  }

  disableUser(email: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/enableDisableUser`, { email }, { headers: this.getHeaders() });
  }

  deleteUser(userId: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/auth/users/${userId}`, { headers: this.getHeaders() });
  }
}
