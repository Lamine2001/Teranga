import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';

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
  selector: 'app-doctor-appointments-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './doctor-appointments-table.component.html',
  styleUrls: ['./doctor-appointments-table.component.css']
})
export class DoctorAppointmentsTableComponent implements OnInit {
  @Input() type: 'today' | 'upcoming' | 'history' = 'today';
  
  appointments: Appointment[] = [];
  isLoading = false;
  error = '';
  
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

  startConsultation(appointment: Appointment) {
    this.router.navigate(['/consultations/create', appointment.id]);
  }

  startVideoConsultation(appointment: Appointment) {
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
