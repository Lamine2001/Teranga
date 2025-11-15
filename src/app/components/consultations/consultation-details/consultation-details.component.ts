/**
 * Consultation Details Component
 * Displays complete consultation information
 */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ConsultationService } from '../../../services/consultation.service';
import { Consultation } from '../../../models/consultation.model';
import { ConsultationNotesComponent } from '../consultation-notes/consultation-notes.component';

@Component({
  selector: 'app-consultation-details',
  standalone: true,
  imports: [CommonModule, ConsultationNotesComponent],
  templateUrl: './consultation-details.component.html',
  styleUrls: ['./consultation-details.component.scss']
})
export class ConsultationDetailsComponent implements OnInit {
  consultation: Consultation | null = null;
  isLoading = true;
  errorMessage = '';
  consultationId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private consultationService: ConsultationService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.consultationId = id;
        this.loadConsultation();
      }
    });
  }

  loadConsultation(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.consultationService.getConsultation(this.consultationId).subscribe({
      next: (consultation) => {
        this.consultation = consultation;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Erreur lors du chargement de la consultation';
        console.error('Error loading consultation:', error);
      }
    });
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

  downloadReport(): void {
    if (!this.consultation) return;

    this.consultationService.generateConsultationReport(this.consultation.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `consultation-${this.consultation?.id}-report.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error downloading report:', error);
        alert('Erreur lors du téléchargement du rapport');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/consultations/history']);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDuration(start: string, end?: string): string {
    if (!end) return 'En cours';
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    const durationMinutes = Math.floor((endDate.getTime() - startDate.getTime()) / 60000);
    
    if (durationMinutes < 60) {
      return `${durationMinutes} minutes`;
    } else {
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      return `${hours}h ${minutes}min`;
    }
  }
}

