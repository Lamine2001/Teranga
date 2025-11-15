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
  doctorId: string = '';

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
    this.consultationService.getActiveConsultations().subscribe({
      next: (consultations) => {
        this.activeConsultations = consultations;
      },
      error: (error) => {
        console.error('Error loading active consultations:', error);
        // Set empty array if API is not ready
        this.activeConsultations = [];
        
        if (error.status === 403) {
          console.warn('Active consultations endpoint requires authentication or is not implemented');
        } else if (error.status === 404) {
          console.warn('Active consultations endpoint not found - backend may need to implement /api/consultations/active');
        }
      }
    });
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

