import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { AppointmentService, AppointmentResponseDTO } from '../../../services/appointment.service';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './patient-dashboard.component.html',
  styleUrl: './patient-dashboard.component.scss'
})
export class PatientDashboardComponent implements OnInit {
  currentUser: any = null;
  upcomingAppointments: AppointmentResponseDTO[] = [];
  isLoading = false;

  constructor(
    private authService: AuthService,
    private appointmentService: AppointmentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadUpcomingAppointments();
  }

  loadUserData(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  loadUpcomingAppointments(): void {
    this.isLoading = true;
    this.appointmentService.getUpcomingAppointments().subscribe({
      next: (appointments) => {
        this.upcomingAppointments = appointments;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading appointments:', error);
        this.isLoading = false;
      }
    });
  }

  onRendezVousClick(): void {
    // Navigate to appointment search page
    this.router.navigate(['/appointments/search']);
  }

  onViewAppointmentsClick(): void {
    // Navigate to appointments list
    this.router.navigate(['/appointments/patient']);
  }

  onProfileClick(): void {
    // Navigate to profile page
    this.router.navigate(['/users/profile']);
  }

  onLogoutClick(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/auth']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        this.router.navigate(['/auth']);
      }
    });
  }

  getTimeDisplay(appointmentTime: string): string {
    return new Date(appointmentTime).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getDateDisplay(appointmentTime: string): string {
    return new Date(appointmentTime).toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  }

  getUniqueDoctorsCount(): number {
    const uniqueDoctors = new Set(
      this.upcomingAppointments.map(app => app.doctorId)
    );
    return uniqueDoctors.size;
  }

  getUniqueSpecialtiesCount(): number {
    const uniqueSpecialties = new Set(
      this.upcomingAppointments.map(app => app.doctorSpecialty)
    );
    return uniqueSpecialties.size;
  }
}
