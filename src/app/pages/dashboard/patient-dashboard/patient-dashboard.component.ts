import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { UserProfileService } from '../../../services/user-profile.service';
import { UserProfile } from '../../../models/user-profile.model';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-dashboard.component.html',
  styleUrls: ['./patient-dashboard.component.css']
})
export class PatientDashboardComponent implements OnInit {
  currentUser: UserProfile | null = null;
  upcomingAppointments: any[] = [];
  isLoading = false;

  constructor(
    private authService: AuthService,
    private userProfileService: UserProfileService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
    this.loadUpcomingAppointments();
  }

  loadUserProfile(): void {
    this.userProfileService.getCurrentUserProfile().subscribe({
      next: (profile) => {
        this.currentUser = profile;
      },
      error: (err) => {
        console.error('Error loading user profile:', err);
      }
    });
  }

  loadUpcomingAppointments(): void {
    this.isLoading = true;
    // TODO: Implement appointment loading from backend
    setTimeout(() => {
      this.upcomingAppointments = [];
      this.isLoading = false;
    }, 1000);
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
    const uniqueDoctors = new Set(this.upcomingAppointments.map(a => a.doctorId));
    return uniqueDoctors.size;
  }

  getUniqueSpecialtiesCount(): number {
    const uniqueSpecialties = new Set(this.upcomingAppointments.map(a => a.doctorSpecialty));
    return uniqueSpecialties.size;
  }
}
