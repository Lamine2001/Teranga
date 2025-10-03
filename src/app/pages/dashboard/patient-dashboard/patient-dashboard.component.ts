import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { User } from '../../../interfaces/user';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-dashboard.component.html',
  styleUrls: ['./patient-dashboard.component.css']
})
export class PatientDashboardComponent implements OnInit {
  currentUser: User | null = null;
  upcomingAppointments: any[] = [];
  appointmentHistory: any[] = [];
  isLoading = false;
  error = '';

  private apiUrl = 'http://localhost:8080/api/appointments/patient';

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
    this.loadUpcomingAppointments();
    this.loadAppointmentHistory();
  }

  loadUserProfile(): void {
    this.currentUser = this.authService.getCurrentUser();
  }

  loadUpcomingAppointments(): void {
    this.isLoading = true;
    this.error = '';
    
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });

    this.http.get<any[]>(`${this.apiUrl}/upcoming`, { headers }).subscribe({
      next: (appointments) => {
        this.upcomingAppointments = appointments;
        this.isLoading = false;
        console.log('Upcoming appointments loaded:', appointments);
      },
      error: (error) => {
        console.error('Error loading upcoming appointments:', error);
        this.error = 'Erreur lors du chargement des rendez-vous';
        this.isLoading = false;
        // En cas d'erreur, utiliser des données de demo pour éviter un dashboard vide
        this.upcomingAppointments = [];
      }
    });
  }

  loadAppointmentHistory(): void {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });

    this.http.get<any[]>(`${this.apiUrl}/history`, { headers }).subscribe({
      next: (history) => {
        this.appointmentHistory = history;
        console.log('Appointment history loaded:', history);
      },
      error: (error) => {
        console.error('Error loading appointment history:', error);
        this.appointmentHistory = [];
      }
    });
  }

  onProfileClick(): void {
    // Navigate to profile view page
    this.router.navigate(['/profile']);
  }

  onLogoutClick(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/auth']);
      },
      error: (err) => {
        console.error('Logout error:', err);
        // Force navigation even on error
        this.router.navigate(['/auth']);
      }
    });
  }

  onRendezVousClick(): void {
    this.router.navigate(['/appointments/search']);
  }

  onViewAppointmentsClick(): void {
    this.router.navigate(['/appointments']);
  }

  getDateDisplay(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR');
  }

  getTimeDisplay(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  getUniqueDoctorsCount(): number {
    const allAppointments = [...this.upcomingAppointments, ...this.appointmentHistory];
    const uniqueDoctors = new Set(
      allAppointments.map(apt => `${apt.doctorId}`)
    );
    return uniqueDoctors.size;
  }

  getUniqueSpecialtiesCount(): number {
    const allAppointments = [...this.upcomingAppointments, ...this.appointmentHistory];
    const uniqueSpecialties = new Set(
      allAppointments
        .map(apt => apt.doctorSpecialty)
        .filter(specialty => specialty) // Filtrer les valeurs undefined/null
    );
    return uniqueSpecialties.size;
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

  isAppointmentToday(appointmentTime: string): boolean {
    const appointmentDate = new Date(appointmentTime);
    const today = new Date();
    return appointmentDate.toDateString() === today.toDateString();
  }

  canCancelAppointment(appointment: any): boolean {
    // Peut annuler si le statut est CONFIRMED ou PENDING et que c'est dans le futur
    const appointmentDate = new Date(appointment.appointmentTime);
    const now = new Date();
    return (appointment.status === 'CONFIRMED' || appointment.status === 'PENDING') && appointmentDate > now;
  }

  viewAppointmentDetails(appointment: any): void {
    console.log('View appointment details:', appointment);
    // TODO: Implémenter la vue détaillée du rendez-vous
  }

  cancelAppointment(appointment: any): void {
    if (confirm(`Êtes-vous sûr de vouloir annuler votre rendez-vous avec Dr. ${appointment.doctorFirstName} ${appointment.doctorLastName} ?`)) {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const headers = new HttpHeaders({
        'Authorization': token ? `Bearer ${token}` : ''
      });

      this.http.delete(`http://localhost:8080/api/appointments/${appointment.id}`, { headers }).subscribe({
        next: () => {
          // Recharger les rendez-vous après annulation
          this.loadUpcomingAppointments();
          alert('Rendez-vous annulé avec succès');
        },
        error: (error) => {
          console.error('Error canceling appointment:', error);
          alert('Erreur lors de l\'annulation du rendez-vous');
        }
      });
    }
  }
}
