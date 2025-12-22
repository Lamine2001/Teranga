import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { UserProfile, UpdateProfileRequest } from '../../../models/user.model';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.css']
})
export class EditProfileComponent implements OnInit {
  profileForm: FormGroup;
  loading = false;
  error: string | null = null;
  success = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      firstName: [''],
      lastName: [''],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.pattern(/^[0-9+\-\s()]+$/)]]
    });
  }

  ngOnInit(): void {
    this.loadCurrentProfile();
  }

  loadCurrentProfile(): void {
    this.userService.getCurrentUserProfile().subscribe({
      next: (profile) => {
        this.profileForm.patchValue({
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          email: profile.email,
          phoneNumber: profile.phoneNumber || ''
        });
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement du profil';
        console.error('Error loading profile:', err);
      }
    });
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      this.loading = true;
      this.error = null;
      
      const updateData: UpdateProfileRequest = this.profileForm.value;
      
      this.userService.updateCurrentUserProfile(updateData).subscribe({
        next: (updatedProfile) => {
          this.success = true;
          this.loading = false;
          setTimeout(() => {
            this.router.navigate(['/profile']);
          }, 1500);
        },
        error: (err) => {
          this.error = 'Erreur lors de la mise à jour du profil';
          this.loading = false;
          console.error('Update error:', err);
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/profile']);
  }
}
