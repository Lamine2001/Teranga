import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Appointment {
  id: number;
  patientId?: number;
  patientFirstName: string;
  patientLastName: string;
  patientEmail: string;
  patientPhone: string;
  appointmentTime: string;
  endTime: string;
  appointmentType: 'virtual' | 'onsite';
  status: string;
  notes?: string;
  consultationFee?: number;
}

@Component({
  selector: 'app-appointment-details-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './appointment-details-modal.component.html',
  styleUrls: ['./appointment-details-modal.component.css']
})
export class AppointmentDetailsModalComponent {
  @Input() isOpen = false;
  @Input() appointment: Appointment | null = null;
  @Output() closed = new EventEmitter<void>();

  close(): void {
    this.isOpen = false;
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  getDateDisplay(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  getTimeDisplay(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'CONFIRMED': 'Confirmé',
      'PENDING': 'En attente',
      'CANCELLED': 'Annulé',
      'COMPLETED': 'Terminé'
    };
    return statusLabels[status] || status;
  }

  getStatusClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }

  getTypeLabel(type: string): string {
    return type === 'virtual' ? 'Téléconsultation' : 'Consultation en cabinet';
  }
}
