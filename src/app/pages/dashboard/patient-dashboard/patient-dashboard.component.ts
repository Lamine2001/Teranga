import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { AppointmentService, AppointmentResponseDTO } from '../../../services/appointment.service';
import { User } from '../../../interfaces/user';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { NotificationComponent } from '../../../shared/components/notification/notification.component';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule, ConfirmDialogComponent, NotificationComponent],
  templateUrl: './patient-dashboard.component.html',
  styleUrls: ['./patient-dashboard.component.css']
})
export class PatientDashboardComponent implements OnInit {
  currentUser: User | null = null;
  upcomingAppointments: AppointmentResponseDTO[] = [];
  appointmentHistory: AppointmentResponseDTO[] = [];
  isLoading = false;
  error = '';
  showAllAppointments = false;

  // Propriétés pour le modal de confirmation
  showConfirmDialog = false;
  confirmDialogTitle = '';
  confirmDialogMessage = '';
  appointmentToCancel: AppointmentResponseDTO | null = null;

  // Propriétés pour les notifications
  showNotification = false;
  notificationMessage = '';
  notificationType: 'success' | 'error' | 'info' | 'warning' = 'info';
  private notificationTimeout: any;

  constructor(
    private authService: AuthService,
    private router: Router,
    private appointmentService: AppointmentService
  ) {}

  ngOnInit(): void {
    this.checkAccountStatus();
    this.loadUserProfile();
    this.loadUpcomingAppointments();
    this.loadAppointmentHistory();
  }

  private checkAccountStatus(): void {
    const user = this.authService.getCurrentUser();
    if (user && !user.isActive) {
      this.showNotificationMessage(
        'Votre compte est en attente d\'activation. Vous recevrez une notification par email une fois votre compte activé.',
        'warning'
      );
      // Optionnel: rediriger vers une page d'attente
      // this.router.navigate(['/account-pending']);
    }
  }

  loadUserProfile(): void {
    this.currentUser = this.authService.getCurrentUser();
  }

  loadUpcomingAppointments(): void {
    this.isLoading = true;
    this.error = '';

    this.appointmentService.getPatientUpcoming().subscribe({
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
    this.appointmentService.getPatientHistory().subscribe({
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
    // Afficher tous les rendez-vous (ne pas basculer, juste afficher tous)
    this.showAllAppointments = true;
  }

  // Nouvelle méthode pour revenir à la vue limitée
  onShowLimitedAppointments(): void {
    this.showAllAppointments = false;
  }

  // Modifier cette méthode pour avoir une logique plus claire
  getDisplayedAppointments(): AppointmentResponseDTO[] {
    if (this.showAllAppointments) {
      // Afficher tous les rendez-vous
      return this.upcomingAppointments;
    } else {
      // Afficher seulement les 3 premiers (vue par défaut)
      return this.upcomingAppointments.slice(0, 3);
    }
  }

  // Modifier pour ne plus basculer mais indiquer l'état
  getViewButtonText(): string {
    return this.showAllAppointments ? 'Voir moins' : 'Voir tous';
  }

  // Nouvelle méthode pour vérifier s'il y a plus de 3 rendez-vous
  hasMoreThanThreeAppointments(): boolean {
    return this.upcomingAppointments.length > 3;
  }

  // Méthode pour savoir si on peut afficher le bouton "Voir moins"
  canShowLess(): boolean {
    return this.showAllAppointments && this.upcomingAppointments.length > 3;
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

  viewAppointmentDetails(appointment: AppointmentResponseDTO): void {
    console.log('View appointment details:', appointment);
    // TODO: Implémenter la vue détaillée du rendez-vous
  }

  cancelAppointment(appointment: AppointmentResponseDTO): void {
    this.appointmentToCancel = appointment;
    this.confirmDialogTitle = 'Annuler le rendez-vous';
    this.confirmDialogMessage = `Êtes-vous sûr de vouloir annuler votre rendez-vous avec Dr. ${appointment.doctorFirstName} ${appointment.doctorLastName} prévu le ${this.getDateDisplay(appointment.appointmentTime)} à ${this.getTimeDisplay(appointment.appointmentTime)} ?`;
    this.showConfirmDialog = true;
  }

  onConfirmCancel(): void {
    if (this.appointmentToCancel) {
      this.appointmentService.cancelAppointment(this.appointmentToCancel.id).subscribe({
        next: (response) => {
          console.log('Appointment canceled:', response);
          this.loadUpcomingAppointments();
          this.loadAppointmentHistory();
          this.showNotificationMessage('Rendez-vous annulé avec succès', 'success');
          this.showConfirmDialog = false;
          this.appointmentToCancel = null;
        },
        error: (error) => {
          console.error('Error canceling appointment:', error);
          this.showNotificationMessage('Erreur lors de l\'annulation du rendez-vous. Veuillez réessayer.', 'error');
          this.showConfirmDialog = false;
        }
      });
    }
  }

  onCancelDialog(): void {
    this.showConfirmDialog = false;
    this.appointmentToCancel = null;
  }

  private showNotificationMessage(message: string, type: 'success' | 'error' | 'info' | 'warning'): void {
    this.notificationMessage = message;
    this.notificationType = type;
    this.showNotification = true;

    // Auto-hide après 5 secondes
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
}
