/**
 * Consultation Service - Handles all consultation-related operations
 * All requests automatically include JWT token via auth interceptor
 */
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  Consultation,
  ConsultationNotes,
  Prescription,
  LabTest,
  StartConsultationRequest,
  EndConsultationRequest,
  ConsultationHistoryFilter,
  ConsultationSummary,
  VideoConsultationConfig
} from '../models/consultation.model';

@Injectable({
  providedIn: 'root'
})
export class ConsultationService {
  private readonly apiUrl = `${environment.apiUrl}/consultations`;

  constructor(private http: HttpClient) {}

  /**
   * Get authentication headers with JWT token
   * Note: The auth interceptor should handle this automatically,
   * but we provide this as a fallback
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || 
                  localStorage.getItem('authToken') || 
                  sessionStorage.getItem('token');
    
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    if (token) {
      // Add Bearer prefix if not already present
      const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      headers = headers.set('Authorization', authToken);
      console.log('ConsultationService: Adding auth header to request');
    } else {
      console.warn('ConsultationService: No token found in storage');
    }
    
    return headers;
  }

  /**
   * Log API request for debugging
   */
  private logRequest(method: string, url: string): void {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    console.log(`ConsultationService: ${method} ${url}`);
    console.log('Token available:', !!token);
    if (token) {
      console.log('Token length:', token.length);
      console.log('Token preview:', token.substring(0, 20) + '...');
    }
  }

  /**
   * Start a new consultation from an appointment
   */
  startConsultation(request: StartConsultationRequest): Observable<Consultation> {
    this.logRequest('POST', `${this.apiUrl}/${request.appointmentId}/start`);
    
    return this.http.post<Consultation>(`${this.apiUrl}/${request.appointmentId}/start`, request, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      tap(() => console.log('Consultation started successfully')),
      catchError(error => {
        console.error('Error starting consultation:', error);
        console.error('Status:', error.status, 'Message:', error.message);
        throw error;
      })
    );
  }

  /**
   * End an ongoing consultation
   */
  endConsultation(request: EndConsultationRequest): Observable<Consultation> {
    this.logRequest('POST', `${this.apiUrl}/${request.appointmentId}/end`);
    
    return this.http.post<Consultation>(
      `${this.apiUrl}/${request.appointmentId}/end`,
      request.notes,
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(() => console.log('Consultation ended successfully')),
      catchError(error => {
        console.error('Error ending consultation:', error);
        console.error('Status:', error.status, 'Message:', error.message);
        throw error;
      })
    );
  }

  /**
   * Get consultation details by ID
   */
  getConsultation(id: number): Observable<Consultation> {
    this.logRequest('GET', `${this.apiUrl}/${id}`);
    
    return this.http.get<Consultation>(`${this.apiUrl}/${id}`, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      tap(() => console.log('Consultation fetched successfully')),
      catchError(error => {
        console.error('Error fetching consultation:', error);
        console.error('Status:', error.status, 'Message:', error.message);
        throw error;
      })
    );
  }

  /**
   * Get all consultations for current patient
   */
  getPatientConsultations(filter?: ConsultationHistoryFilter): Observable<Consultation[]> {
    this.logRequest('POST', `${this.apiUrl}/patient/history`);
    
    return this.http.post<Consultation[]>(`${this.apiUrl}/patient/history`, filter || {}, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      tap(consultations => console.log(`Fetched ${consultations.length} patient consultations`)),
      catchError(error => {
        console.error('Error fetching patient consultations:', error);
        console.error('Status:', error.status, 'Message:', error.message);
        return of([]);
      })
    );
  }

  /**
   * Get all consultations for current doctor
   */
  getDoctorConsultations(filter?: ConsultationHistoryFilter): Observable<Consultation[]> {
    this.logRequest('POST', `${this.apiUrl}/doctor/history`);
    
    return this.http.post<Consultation[]>(`${this.apiUrl}/doctor/history`, filter || {}, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      tap(consultations => console.log(`Fetched ${consultations.length} doctor consultations`)),
      catchError(error => {
        console.error('Error fetching doctor consultations:', error);
        console.error('Status:', error.status, 'Message:', error.message);
        return of([]);
      })
    );
  }

  /**
   * Get consultation by appointment ID
   */
  getConsultationByAppointmentId(appointmentId: number): Observable<Consultation> {
    this.logRequest('GET', `${this.apiUrl}/appointment/${appointmentId}`);
    
    return this.http.get<Consultation>(`${this.apiUrl}/appointment/${appointmentId}`, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      tap(() => console.log('Consultation fetched by appointment ID')),
      catchError(error => {
        console.error('Error fetching consultation by appointment:', error);
        console.error('Status:', error.status, 'Message:', error.message);
        throw error;
      })
    );
  }

  /**
   * Save consultation notes (can be called multiple times during consultation)
   */
  saveConsultationNotes(consultationId: number, notes: Partial<ConsultationNotes>): Observable<void> {
    this.logRequest('PUT', `${this.apiUrl}/${consultationId}/notes`);
    
    return this.http.put<void>(`${this.apiUrl}/${consultationId}/notes`, notes, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      tap(() => console.log('Consultation notes saved successfully')),
      catchError(error => {
        console.error('Error saving consultation notes:', error);
        console.error('Status:', error.status, 'Message:', error.message);
        throw error;
      })
    );
  }

  /**
   * Update consultation status
   */
  updateConsultationStatus(consultationId: number, status: string): Observable<Consultation> {
    this.logRequest('PATCH', `${this.apiUrl}/${consultationId}/status`);
    
    return this.http.patch<Consultation>(`${this.apiUrl}/${consultationId}/status`, { status }, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      tap(() => console.log('Consultation status updated')),
      catchError(error => {
        console.error('Error updating consultation status:', error);
        console.error('Status:', error.status, 'Message:', error.message);
        throw error;
      })
    );
  }

  /**
   * Create prescription for a consultation
   */
  createPrescription(consultationId: number, prescription: Prescription): Observable<Prescription> {
    this.logRequest('POST', `${this.apiUrl}/${consultationId}/prescriptions`);
    
    return this.http.post<Prescription>(
      `${this.apiUrl}/${consultationId}/prescriptions`,
      prescription,
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(() => console.log('Prescription created successfully')),
      catchError(error => {
        console.error('Error creating prescription:', error);
        console.error('Status:', error.status, 'Message:', error.message);
        throw error;
      })
    );
  }

  /**
   * Get all prescriptions for a consultation
   */
  getPrescriptions(consultationId: number): Observable<Prescription[]> {
    this.logRequest('GET', `${this.apiUrl}/${consultationId}/prescriptions`);
    
    return this.http.get<Prescription[]>(`${this.apiUrl}/${consultationId}/prescriptions`, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      tap(prescriptions => console.log(`Fetched ${prescriptions.length} prescriptions`)),
      catchError(error => {
        console.error('Error fetching prescriptions:', error);
        console.error('Status:', error.status, 'Message:', error.message);
        return of([]);
      })
    );
  }

  /**
   * Update prescription
   */
  updatePrescription(prescriptionId: number, prescription: Partial<Prescription>): Observable<Prescription> {
    return this.http.put<Prescription>(`${this.apiUrl}/prescriptions/${prescriptionId}`, prescription).pipe(
      catchError(error => {
        console.error('Error updating prescription:', error);
        throw error;
      })
    );
  }

  /**
   * Delete prescription
   */
  deletePrescription(prescriptionId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/prescriptions/${prescriptionId}`).pipe(
      catchError(error => {
        console.error('Error deleting prescription:', error);
        throw error;
      })
    );
  }

  /**
   * Create lab test order
   */
  createLabTest(consultationId: number, labTest: LabTest): Observable<LabTest> {
    return this.http.post<LabTest>(`${this.apiUrl}/${consultationId}/lab-tests`, labTest).pipe(
      catchError(error => {
        console.error('Error creating lab test:', error);
        throw error;
      })
    );
  }

  /**
   * Get lab tests for a consultation
   */
  getLabTests(consultationId: number): Observable<LabTest[]> {
    return this.http.get<LabTest[]>(`${this.apiUrl}/${consultationId}/lab-tests`).pipe(
      catchError(error => {
        console.error('Error fetching lab tests:', error);
        return of([]);
      })
    );
  }

  /**
   * Get consultation summary/statistics for doctor
   */
  getDoctorConsultationSummary(doctorId: number): Observable<ConsultationSummary> {
    this.logRequest('GET', `${this.apiUrl}/doctor/${doctorId}/summary`);
    
    return this.http.get<ConsultationSummary>(`${this.apiUrl}/doctor/${doctorId}/summary`, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      tap(summary => console.log('Consultation summary fetched:', summary)),
      catchError(error => {
        console.error('Error fetching consultation summary:', error);
        console.error('Status:', error.status, 'Message:', error.message);
        
        if (error.status === 403) {
          console.warn('⚠️ Backend endpoint /api/consultations/doctor/{id}/summary requires authentication or is not implemented');
        }
        
        return of({
          totalConsultations: 0,
          completedConsultations: 0,
          averageDuration: 0,
          patientSatisfactionAverage: 0,
          consultationsByType: { virtual: 0, onsite: 0 }
        });
      })
    );
  }

  /**
   * Get video consultation configuration
   */
  getVideoConsultationConfig(consultationId: number): Observable<VideoConsultationConfig> {
    this.logRequest('GET', `${this.apiUrl}/${consultationId}/video-config`);
    
    return this.http.get<VideoConsultationConfig>(`${this.apiUrl}/${consultationId}/video-config`, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      tap(() => console.log('Video config fetched')),
      catchError(error => {
        console.error('Error fetching video config:', error);
        console.error('Status:', error.status, 'Message:', error.message);
        throw error;
      })
    );
  }

  /**
   * Generate consultation report/summary
   */
  generateConsultationReport(consultationId: number): Observable<Blob> {
    this.logRequest('GET', `${this.apiUrl}/${consultationId}/report`);
    
    return this.http.get(`${this.apiUrl}/${consultationId}/report`, {
      responseType: 'blob',
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => console.log('Report generated successfully')),
      catchError(error => {
        console.error('Error generating consultation report:', error);
        console.error('Status:', error.status, 'Message:', error.message);
        throw error;
      })
    );
  }

  /**
   * Search consultations
   */
  searchConsultations(query: string, filter?: ConsultationHistoryFilter): Observable<Consultation[]> {
    this.logRequest('POST', `${this.apiUrl}/search`);
    
    return this.http.post<Consultation[]>(`${this.apiUrl}/search`, {
      query,
      ...filter
    }, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      tap(results => console.log(`Search found ${results.length} consultations`)),
      catchError(error => {
        console.error('Error searching consultations:', error);
        console.error('Status:', error.status, 'Message:', error.message);
        return of([]);
      })
    );
  }

  /**
   * Get upcoming consultations for doctor
   */
  getUpcomingConsultations(doctorId: number): Observable<Consultation[]> {
    this.logRequest('GET', `${this.apiUrl}/doctor/${doctorId}/upcoming`);
    
    return this.http.get<Consultation[]>(`${this.apiUrl}/doctor/${doctorId}/upcoming`, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      tap(consultations => console.log(`Fetched ${consultations.length} upcoming consultations`)),
      catchError(error => {
        console.error('Error fetching upcoming consultations:', error);
        console.error('Status:', error.status, 'Message:', error.message);
        return of([]);
      })
    );
  }

  /**
   * Get active/in-progress consultations
   */
  getActiveConsultations(): Observable<Consultation[]> {
    this.logRequest('GET', `${this.apiUrl}/active`);
    
    return this.http.get<Consultation[]>(`${this.apiUrl}/active`, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      tap(consultations => console.log(`Fetched ${consultations.length} active consultations`)),
      catchError(error => {
        console.error('Error fetching active consultations:', error);
        console.error('Status:', error.status, 'Message:', error.message);
        
        if (error.status === 403) {
          console.warn('⚠️ Backend endpoint /api/consultations/active requires authentication or is not implemented');
        }
        
        return of([]);
      })
    );
  }

  /**
   * Add attachment to consultation
   */
  addConsultationAttachment(consultationId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`${this.apiUrl}/${consultationId}/attachments`, formData).pipe(
      catchError(error => {
        console.error('Error uploading attachment:', error);
        throw error;
      })
    );
  }

  /**
   * Get consultation attachments
   */
  getConsultationAttachments(consultationId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${consultationId}/attachments`).pipe(
      catchError(error => {
        console.error('Error fetching attachments:', error);
        return of([]);
      })
    );
  }
}

