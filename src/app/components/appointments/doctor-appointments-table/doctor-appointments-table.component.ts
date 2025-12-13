import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { NotificationComponent } from '../../../shared/components/notification/notification.component';
import { AppointmentDetailsModalComponent } from '../../../shared/components/appointment-details-modal/appointment-details-modal.component';
import { AppointmentResponseDTO } from '../../../services/appointment.service';

@Component({
  selector: 'app-doctor-appointments-table',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, NotificationComponent, AppointmentDetailsModalComponent],
  templateUrl: './doctor-appointments-table.component.html',
  styleUrls: ['./doctor-appointments-table.component.css']
})
export class DoctorAppointmentsTableComponent implements OnInit {
  @Input() type: 'today' | 'upcoming' | 'history' = 'today';
  
  appointments: AppointmentResponseDTO[] = [];
  filteredAppointments: AppointmentResponseDTO[] = [];
  isLoading = false;
  error = '';
  
  // Propriétés de recherche
  searchQuery = '';
  
  // Propriétés de pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  
  // Propriétés pour le modal de confirmation
  showConfirmDialog = false;
  confirmDialogTitle = '';
  confirmDialogMessage = '';
  appointmentToCancel: AppointmentResponseDTO | null = null;

  // Propriétés pour le modal de détails
  showDetailsModal = false;
  selectedAppointment: AppointmentResponseDTO | null = null;

  // Propriétés pour les notifications
  showNotification = false;
  notificationMessage = '';
  notificationType: 'success' | 'error' | 'info' | 'warning' = 'info';
  private notificationTimeout: any;
  
  private readonly apiUrl = `${environment.apiUrl}/appointments/doctor`;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadAppointments();
  }

  loadAppointments() {
    this.isLoading = true;
    this.error = '';
    
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });

    let endpoint = `${this.apiUrl}/${this.type}`;
    
    this.http.get<AppointmentResponseDTO[]>(endpoint, { headers }).subscribe({
      next: (data) => {
        this.appointments = data;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading appointments:', error);
        this.error = 'Erreur lors du chargement des rendez-vous';
        this.isLoading = false;
      }
    });
  }

  getTitle(): string {
    switch(this.type) {
      case 'today': return 'Rendez-vous du Jour';
      case 'upcoming': return 'Rendez-vous à Venir';
      case 'history': return 'Historique des Rendez-vous';
      default: return 'Rendez-vous';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  formatTime(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'CONFIRMED': 'Confirmé',
      'PENDING': 'En attente',
      'CANCELLED': 'Annulé',
      'COMPLETED': 'Terminé'
    };
    return labels[status] || status;
  }

  isToday(dateString: string): boolean {
    const appointmentDate = new Date(dateString);
    const today = new Date();
    return appointmentDate.toDateString() === today.toDateString();
  }

  startConsultation(appointment: AppointmentResponseDTO) {
    this.router.navigate(['/consultations/create', appointment.id]);
  }

  startVideoConsultation(appointment: AppointmentResponseDTO) {
    this.router.navigate(['/consultations/video', appointment.id]);
  }

  cancelAppointment(appointment: AppointmentResponseDTO) {
    this.appointmentToCancel = appointment;
    this.confirmDialogTitle = 'Annuler le rendez-vous';
    this.confirmDialogMessage = `Êtes-vous sûr de vouloir annuler ce rendez-vous avec ${appointment.patientFirstName} ${appointment.patientLastName} prévu le ${this.formatDate(appointment.appointmentTime)} à ${this.formatTime(appointment.appointmentTime)} ?`;
    this.showConfirmDialog = true;
  }

  onConfirmCancel(): void {
    if (this.appointmentToCancel) {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const headers = new HttpHeaders({
        'Authorization': token ? `Bearer ${token}` : ''
      });

      this.http.delete(`${environment.apiUrl}/appointments/${this.appointmentToCancel.id}`, { headers }).subscribe({
        next: () => {
          this.showNotificationMessage('Rendez-vous annulé avec succès', 'success');
          this.loadAppointments();
          this.showConfirmDialog = false;
          this.appointmentToCancel = null;
        },
        error: (error) => {
          console.error('Error canceling appointment:', error);
          this.showNotificationMessage('Erreur lors de l\'annulation du rendez-vous', 'error');
          this.showConfirmDialog = false;
        }
      });
    }
  }

  onCancelDialog(): void {
    this.showConfirmDialog = false;
    this.appointmentToCancel = null;
  }

  viewDetails(appointment: AppointmentResponseDTO): void {
    this.selectedAppointment = appointment;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedAppointment = null;
  }

  private showNotificationMessage(message: string, type: 'success' | 'error' | 'info' | 'warning'): void {
    this.notificationMessage = message;
    this.notificationType = type;
    this.showNotification = true;

    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
    this.notificationTimeout = setTimeout(() => {
      this.showNotification = false;
    }, 5000);
  }

  onNotificationClosed(): void {
    this.showNotification = false;
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
  }

  // Méthodes de recherche et pagination
  onSearchChange(): void {
    this.currentPage = 1; // Réinitialiser à la première page lors d'une nouvelle recherche
    this.applyFilters();
  }

  applyFilters(): void {
    // Filtrer les rendez-vous selon la recherche
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      this.filteredAppointments = this.appointments.filter(appointment => 
        appointment.patientFirstName?.toLowerCase().includes(query) ||
        appointment.patientLastName?.toLowerCase().includes(query) ||
        appointment.patientEmail?.toLowerCase().includes(query) ||
        appointment.patientPhone?.includes(query) ||
        `${appointment.patientFirstName} ${appointment.patientLastName}`.toLowerCase().includes(query)
      );
    } else {
      this.filteredAppointments = [...this.appointments];
    }
    
    // Calculer le nombre total de pages
    this.totalPages = Math.ceil(this.filteredAppointments.length / this.itemsPerPage);
    
    // S'assurer que currentPage est valide
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
  }

  getPaginatedAppointments(): AppointmentResponseDTO[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredAppointments.slice(startIndex, endIndex);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }
}
