import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { AppointmentDetailsModalComponent } from '../../../shared/components/appointment-details-modal/appointment-details-modal.component';

interface Appointment {
  id: number;
  patientId?: number; // Added for consultation creation
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
  selector: 'app-doctor-appointments',
  standalone: true,
  imports: [CommonModule, AppointmentDetailsModalComponent],
  template: `
    <div class="appointments-container">
      <div class="appointments-header">
        <h3>{{ getTitle() }}</h3>
        <button class="btn-refresh" (click)="loadAppointments()">
          <i class="fas fa-sync-alt"></i> Actualiser
        </button>
      </div>

      <div *ngIf="isLoading" class="loading">
        <i class="fas fa-spinner fa-spin"></i> Chargement des rendez-vous...
      </div>

      <div *ngIf="error" class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        {{ error }}
      </div>

      <div *ngIf="!isLoading && !error && appointments.length === 0" class="no-appointments">
        <i class="fas fa-calendar-times fa-3x"></i>
        <p>Aucun rendez-vous {{ getEmptyMessage() }}</p>
      </div>

      <div class="appointments-grid" *ngIf="!isLoading && appointments.length > 0">
        <div class="appointment-card" *ngFor="let appointment of appointments" 
             [class.virtual]="appointment.appointmentType === 'virtual'"
             [class.confirmed]="appointment.status === 'CONFIRMED'"
             [class.pending]="appointment.status === 'PENDING'">
          
          <div class="appointment-header">
            <div class="patient-info">
              <i class="fas fa-user"></i>
              <span class="patient-name">{{ appointment.patientFirstName }} {{ appointment.patientLastName }}</span>
            </div>
            <span class="appointment-status" [class]="'status-' + appointment.status.toLowerCase()">
              {{ appointment.status }}
            </span>
          </div>

          <div class="appointment-body">
            <div class="appointment-detail">
              <i class="fas fa-clock"></i>
              <span>{{ getTimeDisplay(appointment.appointmentTime) }} - {{ getTimeDisplay(appointment.endTime) }}</span>
            </div>
            
            <div class="appointment-detail">
              <i class="fas fa-calendar"></i>
              <span>{{ getDateDisplay(appointment.appointmentTime) }}</span>
            </div>

            <div class="appointment-detail">
              <i [class]="appointment.appointmentType === 'virtual' ? 'fas fa-video' : 'fas fa-hospital'"></i>
              <span>{{ appointment.appointmentType === 'virtual' ? 'Téléconsultation' : 'En cabinet' }}</span>
            </div>

            <div class="appointment-detail" *ngIf="appointment.patientPhone">
              <i class="fas fa-phone"></i>
              <span>{{ appointment.patientPhone }}</span>
            </div>

            <div class="appointment-detail" *ngIf="appointment.patientEmail">
              <i class="fas fa-envelope"></i>
              <span>{{ appointment.patientEmail }}</span>
            </div>

            <div class="appointment-notes" *ngIf="appointment.notes">
              <i class="fas fa-notes-medical"></i>
              <p>{{ appointment.notes }}</p>
            </div>
          </div>

          <div class="appointment-actions">
            <!-- Start Consultation Button (Primary action) -->
            <button class="btn-action btn-success" 
                    *ngIf="type === 'today' && appointment.status === 'CONFIRMED'"
                    (click)="startConsultation(appointment)">
              <i class="fas fa-play-circle"></i> Commencer Consultation
            </button>

            <!-- Start Video Button (for teleconsultations) -->
            <button class="btn-action btn-primary" 
                    *ngIf="appointment.appointmentType === 'virtual' && type === 'today' && appointment.status === 'CONFIRMED'"
                    (click)="startVideoConsultation(appointment)">
              <i class="fas fa-video"></i> Vidéo
            </button>

            <!-- View Details -->
            <button class="btn-action btn-secondary" (click)="viewDetails(appointment)">
              <i class="fas fa-eye"></i> Détails
            </button>

            <!-- Cancel -->
            <button class="btn-action btn-danger" *ngIf="appointment.status === 'CONFIRMED' && type !== 'history'"
                    (click)="cancelAppointment(appointment)">
              <i class="fas fa-times"></i> Annuler
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de détails -->
    <app-appointment-details-modal
      [isOpen]="showDetailsModal"
      [appointment]="selectedAppointment"
      (closed)="closeDetailsModal()">
    </app-appointment-details-modal>
  `,
  styles: [`
    .appointments-container {
      padding: 20px;
    }

    .appointments-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .appointments-header h3 {
      margin: 0;
      color: #333;
    }

    .btn-refresh {
      padding: 8px 16px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.3s;
    }

    .btn-refresh:hover {
      background: #0056b3;
    }

    .loading, .error-message, .no-appointments {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    .error-message {
      color: #dc3545;
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 4px;
    }

    .no-appointments {
      color: #6c757d;
    }

    .appointments-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }

    .appointment-card {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .appointment-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }

    .appointment-card.virtual {
      border-left: 4px solid #17a2b8;
    }

    .appointment-card.confirmed {
      border-left: 4px solid #28a745;
    }

    .appointment-card.pending {
      border-left: 4px solid #ffc107;
    }

    .appointment-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #f0f0f0;
    }

    .patient-info {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 600;
      color: #333;
    }

    .appointment-status {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-confirmed {
      background: #d4edda;
      color: #155724;
    }

    .status-pending {
      background: #fff3cd;
      color: #856404;
    }

    .status-cancelled {
      background: #f8d7da;
      color: #721c24;
    }

    .appointment-body {
      margin-bottom: 15px;
    }

    .appointment-detail {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
      color: #666;
      font-size: 14px;
    }

    .appointment-detail i {
      width: 20px;
      color: #007bff;
    }

    .appointment-notes {
      margin-top: 10px;
      padding: 10px;
      background: #f8f9fa;
      border-radius: 4px;
    }

    .appointment-notes i {
      color: #6c757d;
      margin-right: 8px;
    }

    .appointment-notes p {
      margin: 5px 0 0 0;
      color: #495057;
      font-size: 14px;
    }

    .appointment-actions {
      display: flex;
      gap: 10px;
      margin-top: 15px;
    }

    .btn-action {
      flex: 1;
      padding: 8px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      transition: opacity 0.2s;
    }

    .btn-action:hover {
      opacity: 0.9;
    }

    .btn-success {
      background: #28a745;
      color: white;
      font-weight: 600;
    }

    .btn-success:hover {
      background: #218838;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-danger {
      background: #dc3545;
      color: white;
    }

    @media (max-width: 768px) {
      .appointments-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DoctorAppointmentsComponent implements OnInit {
  @Input() type: 'today' | 'upcoming' | 'history' = 'today';
  
  appointments: Appointment[] = [];
  isLoading = false;
  error = '';
  
  // Propriétés pour le modal de détails
  showDetailsModal = false;
  selectedAppointment: Appointment | null = null;
  
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
    
    this.http.get<Appointment[]>(endpoint, { headers }).subscribe({
      next: (data) => {
        this.appointments = data;
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

  getEmptyMessage(): string {
    switch(this.type) {
      case 'today': return 'aujourd\'hui';
      case 'upcoming': return 'à venir';
      case 'history': return 'dans l\'historique';
      default: return '';
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

  /**
   * Start a consultation from an appointment
   * This navigates to the consultation creation page with appointment ID
   * The patient will be automatically associated with the consultation
   */
  startConsultation(appointment: Appointment) {
    // Navigate to consultation creation with appointmentId parameter
    // The CreateConsultationComponent will automatically:
    // 1. Load patient info from appointment
    // 2. Load patient history
    // 3. Start the consultation
    // 4. Associate patient with consultation
    this.router.navigate(['/consultations/create', appointment.id]);
  }

  viewDetails(appointment: Appointment) {
    this.selectedAppointment = appointment;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedAppointment = null;
  }

  startVideoConsultation(appointment: Appointment) {
    // Navigate to video consultation room
    this.router.navigate(['/consultations/video', appointment.id]);
  }

  cancelAppointment(appointment: Appointment) {
    if (confirm(`Êtes-vous sûr de vouloir annuler ce rendez-vous avec ${appointment.patientFirstName} ${appointment.patientLastName} ?`)) {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const headers = new HttpHeaders({
        'Authorization': token ? `Bearer ${token}` : ''
      });

      this.http.delete(`${environment.apiUrl}/appointments/${appointment.id}`, { headers }).subscribe({
        next: () => {
          this.loadAppointments();
        },
        error: (error) => {
          console.error('Error canceling appointment:', error);
          alert('Erreur lors de l\'annulation du rendez-vous');
        }
      });
    }
  }
}
