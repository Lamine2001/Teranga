/**
 * Consultation Management Component
 * Central hub for managing consultations from doctor dashboard
 */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ConsultationService } from '../../../services/consultation.service';
import { AuthService } from '../../../services/auth.service';
import { Consultation, ConsultationSummary } from '../../../models/consultation.model';
import { DoctorAppointmentsComponent } from '../../appointments/doctor-appointments/doctor-appointments.component';

@Component({
  selector: 'app-consultation-management',
  standalone: true,
  imports: [CommonModule, DoctorAppointmentsComponent],
  templateUrl: './consultation-management.component.html',
  styleUrls: ['./consultation-management.component.scss']
})
export class ConsultationManagementComponent implements OnInit {
  activeTab: 'today' | 'upcoming' | 'history' | 'statistics' = 'today';
  
  // Statistics
  consultationSummary: ConsultationSummary | null = null;
  activeConsultations: Consultation[] = [];
  isLoadingStats = false;
  
  // User info
  currentUser: any = null;
  doctorId: number = 0;

  constructor(
    public router: Router,
    private consultationService: ConsultationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser?.id) {
      this.doctorId = this.currentUser.id;
      this.loadStatistics();
      this.loadActiveConsultations();
    }
  }

  loadStatistics(): void {
    this.isLoadingStats = true;
    this.consultationService.getDoctorConsultationSummary(this.doctorId).subscribe({
      next: (summary) => {
        this.consultationSummary = summary;
        this.isLoadingStats = false;
      },
      error: (error) => {
        console.error('Error loading statistics:', error);
        this.isLoadingStats = false;
        
        // Use default values if API is not ready
        this.consultationSummary = {
          totalConsultations: 0,
          completedConsultations: 0,
          averageDuration: 0,
          patientSatisfactionAverage: 0,
          consultationsByType: { virtual: 0, onsite: 0 }
        };
        
        // Log helpful error message
        if (error.status === 403) {
          console.warn('API endpoint not yet implemented or insufficient permissions');
        } else if (error.status === 404) {
          console.warn('Consultation statistics endpoint not found - backend may need to implement /api/consultations/doctor/{id}/summary');
        }
      }
    });
  }

  loadActiveConsultations(): void {
    console.log('Loading active consultations...');
    this.consultationService.getActiveConsultations().subscribe({
      next: (response: any) => {
        console.log('=== ACTIVE CONSULTATIONS DEBUG ===');
        console.log('Raw response received:', response);
        
        // Le backend renvoie un objet avec appointment, meeting, et record
        // On doit transformer ces données en format Consultation
        let consultations: Consultation[] = [];
        
        if (Array.isArray(response)) {
          // Si c'est un tableau de réponses
          consultations = response.map((item: any) => this.mapResponseToConsultation(item));
        } else if (response.appointment) {
          // Si c'est un seul objet
          consultations = [this.mapResponseToConsultation(response)];
        }
        
        console.log('Mapped consultations:', consultations);
        console.log('Number of consultations:', consultations.length);
        
        if (consultations.length > 0) {
          consultations.forEach((c, index) => {
            console.log(`Consultation ${index}:`, {
              id: c.id,
              patientFirstName: c.patientFirstName,
              patientLastName: c.patientLastName,
              consultationType: c.consultationType,
              appointmentId: c.appointmentId,
              fullObject: c
            });
          });
        }
        
        this.activeConsultations = consultations;
        console.log('activeConsultations after assignment:', this.activeConsultations);
      },
      error: (error) => {
        console.error('Error loading active consultations:', error);
        this.activeConsultations = [];
        
        if (error.status === 403) {
          console.warn('Active consultations endpoint requires authentication or is not implemented');
        } else if (error.status === 404) {
          console.warn('Active consultations endpoint not found - backend may need to implement /api/consultations/active');
        }
      }
    });
  }

  /**
   * Map backend response to Consultation model
   */
  private mapResponseToConsultation(response: any): Consultation {
    const appointment = response.appointment;
    const record = response.record;
    
    return {
      id: record?.id || '',
      appointmentId: appointment?.id || '',
      patientId: appointment?.patientId || '',
      patientFirstName: appointment?.patientFirstName || '',
      patientLastName: appointment?.patientLastName || '',
      doctorId: appointment?.doctorId || '',
      consultationType: record?.consultationType || appointment?.appointmentType || 'onsite',
      status: record?.status || appointment?.status || 'active',
      startedAt: record?.startedAt || appointment?.appointmentTime,
      // Add other necessary fields
    } as Consultation;
  }

  setActiveTab(tab: 'today' | 'upcoming' | 'history' | 'statistics'): void {
    this.activeTab = tab;
  }

  navigateToHistory(): void {
    this.router.navigate(['/consultations/history']);
  }

  navigateToNewConsultation(): void {
    // Navigate to consultation creation page
    this.router.navigate(['/consultations/create']);
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }

  joinActiveConsultation(consultation: Consultation): void {
    if (consultation.consultationType === 'virtual') {
      this.router.navigate(['/consultations/video', consultation.appointmentId]);
    } else {
      this.router.navigate(['/consultations', consultation.id]);
    }
  }

  getStatCardClass(type: string): string {
    const classMap: { [key: string]: string } = {
      'total': 'stat-card-blue',
      'completed': 'stat-card-green',
      'virtual': 'stat-card-purple',
      'onsite': 'stat-card-orange'
    };
    return classMap[type] || 'stat-card-default';
  }
}

