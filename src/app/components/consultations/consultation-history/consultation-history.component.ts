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
  consultations: Consultation[] = [];
  filteredConsultations: Consultation[] = [];
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
        this.consultations = consultations;
        this.filteredConsultations = consultations;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Erreur lors du chargement de l\'historique';
        console.error('Error loading consultations:', error);
      }
    });
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
    const statusMap: { [key: string]: string } = {
      'scheduled': 'status-scheduled',
      'in-progress': 'status-in-progress',
      'completed': 'status-completed',
      'cancelled': 'status-cancelled'
    };
    return statusMap[status] || '';
  }

  getStatusLabel(status: string): string {
    const labelMap: { [key: string]: string } = {
      'scheduled': 'Planifiée',
      'in-progress': 'En cours',
      'completed': 'Terminée',
      'cancelled': 'Annulée'
    };
    return labelMap[status] || status;
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
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

