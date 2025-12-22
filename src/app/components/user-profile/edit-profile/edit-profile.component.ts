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
  profileForm!: FormGroup; // Add definite assignment assertion
  loading = false;
  saving = false;
  error: string | null = null;
  success = false;
  isDoctor = false;
  currentUser: any; // Add missing currentUser property

  constructor(
    private fb: FormBuilder,
    private userProfileService: UserProfileService,
    private router: Router
  ) {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]], // Add email control
      phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9\s\-\(\)]+$/)]],
      dateOfBirth: [''],
      address: [''],
      specialty: [''], // For doctors
      licenseNumber: [''], // For doctors
      emergencyContactName: [''],
      emergencyContactPhone: ['', [Validators.pattern(/^\+?[0-9\s\-\(\)]+$/)]],
      emergencyContactRelationship: ['']
    });
  }

  ngOnInit(): void {
    this.loadCurrentProfile();
  }

  loadCurrentProfile(): void {
    this.loadUserProfile();
  }

  private loadUserProfile(): void {
    this.loading = true;
    this.userProfileService.getCurrentUserProfile().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.isDoctor = user.userType === 'DOCTOR';
        
        // Patch form with user data including email
        this.profileForm.patchValue({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '', // Add email to patch
          phone: user.phone || '',
          dateOfBirth: user.dateOfBirth || '',
          address: user.address || '',
          specialty: user.specialty || '',
          licenseNumber: user.licenseNumber || '',
          emergencyContactName: user.emergencyContactName || '',
          emergencyContactPhone: user.emergencyContactPhone || '',
          emergencyContactRelationship: user.emergencyContactRelationship || ''
        });
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
        this.error = 'Erreur lors du chargement du profil';
        this.loading = false;
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
      
      // Debug logs to check what data is being sent
      console.log('=== FORM SUBMISSION DEBUG ===');
      console.log('Original email from currentUser:', this.currentUser?.email);
      console.log('Form email control dirty:', this.profileForm.get('email')?.dirty);
      console.log('Form email control value:', this.profileForm.get('email')?.value);
      console.log('Complete form values:', this.profileForm.value);
      console.log('Update data being sent to backend:', updateData);
      console.log('Email specifically in updateData:', updateData.email);
      
      this.userProfileService.updateCurrentUserProfile(updateData).subscribe({
        next: (updatedProfile) => {
          console.log('=== BACKEND RESPONSE ===');
          console.log('Updated profile received:', updatedProfile);
          console.log('Updated email:', updatedProfile.email);
          console.log('Email changed:', updatedProfile.email !== this.currentUser?.email);
          
          this.success = true;
          this.saving = false;
          // Show success message and redirect after delay
          setTimeout(() => {
            this.router.navigate(['/profile']);
          }, 1500);
        },
        error: (err) => {
          console.error('=== ERROR DETAILS ===');
          console.error('Full error object:', err);
          console.error('Error response:', err.error);
          console.error('HTTP Status:', err.status);
          
          // Check if it's specifically an email update issue
          if (err.error?.message?.toLowerCase().includes('email')) {
            this.error = 'Erreur lors de la mise à jour de l\'email. Contactez l\'administrateur.';
          } else {
            this.error = err.error?.message || 'Erreur lors de la mise à jour du profil';
          }
          
          this.saving = false;
        }
      });
    } else {
      console.log('=== FORM VALIDATION ERROR ===');
      console.log('Form is invalid');
      console.log('Form errors:', this.getFormValidationErrors());
    }
  }

  // Helper method to debug form validation
  private getFormValidationErrors(): any {
    const formErrors: any = {};
    Object.keys(this.profileForm.controls).forEach(key => {
      const controlErrors = this.profileForm.get(key)?.errors;
      if (controlErrors) {
        formErrors[key] = controlErrors;
      }
    });
    return formErrors;
  }
}
