import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ContactUsRequestDTO {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface ContactUsResponseDTO {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private apiUrl = `${environment.apiUrl}/public/contact`;

  constructor(private http: HttpClient) {}

  submitContactForm(data: ContactUsRequestDTO): Observable<ContactUsResponseDTO> {
    return this.http.post<ContactUsResponseDTO>(`${this.apiUrl}/submit`, data);
  }
}
