import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UserProfileService } from '../../services/user-profile.service';
import { UserProfile } from '../../models/user-profile.model';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
  userProfile: UserProfile | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private userProfileService: UserProfileService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.loading = true;
    this.userProfileService.getCurrentUserProfile().subscribe({
      next: (profile) => {
        this.userProfile = profile;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement du profil';
        this.loading = false;
        console.error('Error loading profile:', err);
      }
    });
  }

  editProfile(): void {
    // Navigate to edit profile page
    this.router.navigate(['/profile/edit']);
  }

  changePassword(): void {
    // Navigate to change password page
    this.router.navigate(['/profile/change-password']);
  }

  goBack(): void {
    // Navigate back to the appropriate dashboard based on user role
    const role = this.userProfile?.userType?.toUpperCase();
    if (role === 'DOCTOR') {
      this.router.navigate(['/doctor-dashboard']);
    } else {
      this.router.navigate(['/patient-dashboard']);
    }
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'Non renseigné';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR');
  }
}
