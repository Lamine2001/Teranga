/**
 * Consultation History Component
 * Displays list of past consultations with search and filter
 */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ConsultationService } from '../../../services/consultation.service';
import { AuthService } from '../../../services/auth.service';
import { Consultation, ConsultationHistoryFilter } from '../../../models/consultation.model';

@Component({
  selector: 'app-consultation-history',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './consultation-history.component.html',
  styleUrls: ['./consultation-history.component.scss']
})
export class ConsultationHistoryComponent implements OnInit {
  consultations: any[] = []; // Change to any[] to handle backend format
  filteredConsultations: any[] = []; // Change to any[]
  isLoading = false;
  errorMessage = '';
  
  filterForm: FormGroup;
  searchQuery = '';
  
  userType: string | null = null;
  
  // Filter options
  statusOptions = [
    { value: 'completed', label: 'Terminées' },
    { value: 'scheduled', label: 'Planifiées' },
    { value: 'cancelled', label: 'Annulées' }
  ];
  
  consultationTypeOptions = [
    { value: 'virtual', label: 'Téléconsultation' },
    { value: 'onsite', label: 'En cabinet' }
  ];

  constructor(
    private fb: FormBuilder,
    public router: Router,
    private consultationService: ConsultationService,
    private authService: AuthService
  ) {
    this.filterForm = this.fb.group({
      startDate: [''],
      endDate: [''],
      status: [''],
      consultationType: [''],
      searchQuery: ['']
    });
  }

  ngOnInit(): void {
    this.userType = this.authService.getUserRole();
    this.loadConsultations();
    
    // Watch for filter changes
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  loadConsultations(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const filter: ConsultationHistoryFilter = {
      startDate: this.filterForm.get('startDate')?.value,
      endDate: this.filterForm.get('endDate')?.value,
      status: this.filterForm.get('status')?.value ? [this.filterForm.get('status')?.value] : undefined,
      consultationType: this.filterForm.get('consultationType')?.value,
      searchQuery: this.filterForm.get('searchQuery')?.value
    };

    // Load based on user type
    const consultationsObservable = this.userType === 'doctor'
      ? this.consultationService.getDoctorConsultations(filter)
      : this.consultationService.getPatientConsultations(filter);

    consultationsObservable.subscribe({
      next: (consultations) => {
        console.log('Raw consultations from backend:', consultations); // Debug log
        
        // Map backend format to frontend format
        this.consultations = consultations.map((c: any) => ({
          id: c.id,
          appointmentId: c.appointmentId,
          doctorId: c.doctorId,
          doctorFirstName: c.doctorFirstName || this.extractFirstName(c.doctorName),
          doctorLastName: c.doctorLastName || this.extractLastName(c.doctorName),
          doctorName: c.doctorName,
          doctorSpecialty: c.doctorSpecialty,
          patientId: c.patientId,
          patientFirstName: c.patientFirstName,
          patientLastName: c.patientLastName,
          patientEmail: c.patientEmail,
          startTime: c.startedAt || c.startTime,
          startedAt: c.startedAt,
          endTime: c.endedAt || c.endTime,
          endedAt: c.endedAt,
          status: c.status?.toLowerCase() || 'scheduled',
          consultationType: c.consultationType?.toLowerCase() || 'onsite',
          chiefComplaint: c.chiefComplaint,
          symptoms: c.symptoms,
          diagnosis: c.diagnosis,
          treatmentPlan: c.treatmentPlan,
          treatment: c.treatmentPlan || c.treatment,
          examinationFindings: c.examinationFindings,
          presentIllness: c.presentIllness,
          recommendations: c.recommendations,
          durationMinutes: c.durationMinutes,
          followUpRequired: c.followUpRequired,
          followUpDate: c.followUpDate,
          followUpInstructions: c.followUpInstructions,
          vitals: c.vitals,
          additionalNotes: c.additionalNotes,
          notes: c.notes,
          prescriptions: c.prescriptions || [],
          labTests: c.labTests || [],
          createdAt: c.createdAt || c.startedAt
        }));
        
        this.filteredConsultations = this.consultations;
        this.isLoading = false;
        console.log('Mapped consultations:', this.consultations); // Debug log
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Erreur lors du chargement de l\'historique';
        console.error('Error loading consultations:', error);
      }
    });
  }

  // Helper method to extract first name from "Dr. FirstName LastName"
  private extractFirstName(doctorName?: string): string {
    if (!doctorName) return '';
    const parts = doctorName.replace('Dr. ', '').split(' ');
    return parts[0] || '';
  }

  // Helper method to extract last name from "Dr. FirstName LastName"
  private extractLastName(doctorName?: string): string {
    if (!doctorName) return '';
    const parts = doctorName.replace('Dr. ', '').split(' ');
    return parts.slice(1).join(' ') || '';
  }

  applyFilters(): void {
    let filtered = [...this.consultations];

    // Apply search query
    const query = this.filterForm.get('searchQuery')?.value?.toLowerCase();
    if (query) {
      filtered = filtered.filter(c =>
        c.patientFirstName?.toLowerCase().includes(query) ||
        c.patientLastName?.toLowerCase().includes(query) ||
        c.doctorFirstName?.toLowerCase().includes(query) ||
        c.doctorLastName?.toLowerCase().includes(query) ||
        c.doctorName?.toLowerCase().includes(query) || // Add doctorName search
        c.diagnosis?.toLowerCase().includes(query) ||
        c.chiefComplaint?.toLowerCase().includes(query)
      );
    }

    this.filteredConsultations = filtered;
  }

  viewConsultation(consultation: Consultation): void {
    this.router.navigate(['/consultations', consultation.id]);
  }

  getStatusClass(status: string): string {
    const normalizedStatus = status?.toLowerCase();
    const statusMap: { [key: string]: string } = {
      'scheduled': 'status-scheduled',
      'in-progress': 'status-in-progress',
      'completed': 'status-completed',
      'cancelled': 'status-cancelled'
    };
    return statusMap[normalizedStatus] || '';
  }

  getStatusLabel(status: string): string {
    const normalizedStatus = status?.toLowerCase();
    const labelMap: { [key: string]: string } = {
      'scheduled': 'Planifiée',
      'in-progress': 'En cours',
      'completed': 'Terminée',
      'cancelled': 'Annulée'
    };
    return labelMap[normalizedStatus] || status;
  }

  getConsultationTypeIcon(type: string): string {
    return type === 'virtual' ? 'fas fa-video' : 'fas fa-hospital';
  }

  getConsultationTypeLabel(type: string): string {
    return type === 'virtual' ? 'Téléconsultation' : 'En cabinet';
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.filteredConsultations = this.consultations;
  }

  exportHistory(): void {
    // TODO: Implement export to PDF/Excel
    alert('Export functionality coming soon');
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

