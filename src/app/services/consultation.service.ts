/**
 * Consultation Service - Handles all consultation-related operations
 */
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
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
   * Start a new consultation from an appointment
   */
  startConsultation(request: StartConsultationRequest): Observable<Consultation> {
    return this.http.post<Consultation>(`${this.apiUrl}/start`, request).pipe(
      catchError(error => {
        console.error('Error starting consultation:', error);
        throw error;
      })
    );
  }

  /**
   * End an ongoing consultation
   */
  endConsultation(request: EndConsultationRequest): Observable<Consultation> {
    return this.http.post<Consultation>(
      `${this.apiUrl}/${request.consultationId}/end`,
      request.notes
    ).pipe(
      catchError(error => {
        console.error('Error ending consultation:', error);
        throw error;
      })
    );
  }

  /**
   * Get consultation details by ID
   */
  getConsultation(id: number): Observable<Consultation> {
    return this.http.get<Consultation>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error('Error fetching consultation:', error);
        throw error;
      })
    );
  }

  /**
   * Get all consultations for current patient
   */
  getPatientConsultations(filter?: ConsultationHistoryFilter): Observable<Consultation[]> {
    return this.http.post<Consultation[]>(`${this.apiUrl}/patient/history`, filter || {}).pipe(
      catchError(error => {
        console.error('Error fetching patient consultations:', error);
        return of([]);
      })
    );
  }

  /**
   * Get all consultations for current doctor
   */
  getDoctorConsultations(filter?: ConsultationHistoryFilter): Observable<Consultation[]> {
    return this.http.post<Consultation[]>(`${this.apiUrl}/doctor/history`, filter || {}).pipe(
      catchError(error => {
        console.error('Error fetching doctor consultations:', error);
        return of([]);
      })
    );
  }

  /**
   * Get consultation by appointment ID
   */
  getConsultationByAppointmentId(appointmentId: number): Observable<Consultation> {
    return this.http.get<Consultation>(`${this.apiUrl}/appointment/${appointmentId}`).pipe(
      catchError(error => {
        console.error('Error fetching consultation by appointment:', error);
        throw error;
      })
    );
  }

  /**
   * Save consultation notes (can be called multiple times during consultation)
   */
  saveConsultationNotes(consultationId: number, notes: Partial<ConsultationNotes>): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${consultationId}/notes`, notes).pipe(
      catchError(error => {
        console.error('Error saving consultation notes:', error);
        throw error;
      })
    );
  }

  /**
   * Update consultation status
   */
  updateConsultationStatus(consultationId: number, status: string): Observable<Consultation> {
    return this.http.patch<Consultation>(`${this.apiUrl}/${consultationId}/status`, { status }).pipe(
      catchError(error => {
        console.error('Error updating consultation status:', error);
        throw error;
      })
    );
  }

  /**
   * Create prescription for a consultation
   */
  createPrescription(consultationId: number, prescription: Prescription): Observable<Prescription> {
    return this.http.post<Prescription>(
      `${this.apiUrl}/${consultationId}/prescriptions`,
      prescription
    ).pipe(
      catchError(error => {
        console.error('Error creating prescription:', error);
        throw error;
      })
    );
  }

  /**
   * Get all prescriptions for a consultation
   */
  getPrescriptions(consultationId: number): Observable<Prescription[]> {
    return this.http.get<Prescription[]>(`${this.apiUrl}/${consultationId}/prescriptions`).pipe(
      catchError(error => {
        console.error('Error fetching prescriptions:', error);
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
    return this.http.get<ConsultationSummary>(`${this.apiUrl}/doctor/${doctorId}/summary`).pipe(
      catchError(error => {
        console.error('Error fetching consultation summary:', error);
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
    return this.http.get<VideoConsultationConfig>(`${this.apiUrl}/${consultationId}/video-config`).pipe(
      catchError(error => {
        console.error('Error fetching video config:', error);
        throw error;
      })
    );
  }

  /**
   * Generate consultation report/summary
   */
  generateConsultationReport(consultationId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${consultationId}/report`, {
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('Error generating consultation report:', error);
        throw error;
      })
    );
  }

  /**
   * Search consultations
   */
  searchConsultations(query: string, filter?: ConsultationHistoryFilter): Observable<Consultation[]> {
    return this.http.post<Consultation[]>(`${this.apiUrl}/search`, {
      query,
      ...filter
    }).pipe(
      catchError(error => {
        console.error('Error searching consultations:', error);
        return of([]);
      })
    );
  }

  /**
   * Get upcoming consultations for doctor
   */
  getUpcomingConsultations(doctorId: number): Observable<Consultation[]> {
    return this.http.get<Consultation[]>(`${this.apiUrl}/doctor/${doctorId}/upcoming`).pipe(
      catchError(error => {
        console.error('Error fetching upcoming consultations:', error);
        return of([]);
      })
    );
  }

  /**
   * Get active/in-progress consultations
   */
  getActiveConsultations(): Observable<Consultation[]> {
    return this.http.get<Consultation[]>(`${this.apiUrl}/active`).pipe(
      catchError(error => {
        console.error('Error fetching active consultations:', error);
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

