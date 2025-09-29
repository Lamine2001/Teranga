import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserProfileService } from '../../../services/user-profile.service';
import { UpdateProfileRequest } from '../../../models/user-profile.model';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.css']
})
export class EditProfileComponent implements OnInit {
  profileForm: FormGroup;
  loading = false;
  saving = false;
  error: string | null = null;
  success = false;
  isDoctor = false;

  constructor(
    private fb: FormBuilder,
    private userProfileService: UserProfileService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9\s\-\(\)]+$/)]],
      address: [''],
      dateOfBirth: [''],
      specialty: [''],
      licenseNumber: [''],
      emergencyContactName: [''],
      emergencyContactPhone: ['', Validators.pattern(/^\+?[0-9\s\-\(\)]+$/)],
      emergencyContactRelationship: ['']
    });
  }

  ngOnInit(): void {
    this.loadCurrentProfile();
  }

  loadCurrentProfile(): void {
    this.loading = true;
    this.userProfileService.getCurrentUserProfile().subscribe({
      next: (profile) => {
        this.isDoctor = profile.userType === 'DOCTOR';
        
        // Format date for input field
        let formattedDate = '';
        if (profile.dateOfBirth) {
          const date = new Date(profile.dateOfBirth);
          formattedDate = date.toISOString().split('T')[0];
        }

        this.profileForm.patchValue({
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          phone: profile.phone || '',
          address: profile.address || '',
          dateOfBirth: formattedDate,
          specialty: profile.specialty || '',
          licenseNumber: profile.licenseNumber || '',
          emergencyContactName: profile.emergencyContactName || '',
          emergencyContactPhone: profile.emergencyContactPhone || '',
          emergencyContactRelationship: profile.emergencyContactRelationship || ''
        });
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement du profil';
        this.loading = false;
        console.error('Error loading profile:', err);
      }
    });
  }

  cancel(): void {
    // Navigate back to profile view
    this.router.navigate(['/profile']);
  }

  goBack(): void {
    // Navigate back to profile view
    this.router.navigate(['/profile']);
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      this.saving = true;
      this.error = null;
      
      const updateData: UpdateProfileRequest = this.profileForm.value;
      
      this.userProfileService.updateCurrentUserProfile(updateData).subscribe({
        next: (updatedProfile) => {
          this.success = true;
          this.saving = false;
          // Show success message and redirect after delay
          setTimeout(() => {
            this.router.navigate(['/profile']);
          }, 1500);
        },
        error: (err) => {
          this.error = err.error?.message || 'Erreur lors de la mise à jour du profil';
          this.saving = false;
          console.error('Update error:', err);
        }
      });
    }
  }
}
