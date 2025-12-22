import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { UserProfileService } from '../../../services/user-profile.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent {
  passwordForm: FormGroup;
  loading = false;
  error: string | null = null;
  success = false;
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private userProfileService: UserProfileService,
    private router: Router
  ) {
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(8), this.passwordStrengthValidator]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordStrengthValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const value = control.value;
    if (!value) return null;
    
    const hasNumber = /[0-9]/.test(value);
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    
    const passwordValid = hasNumber && hasUpper && hasLower;
    
    if (!passwordValid) {
      return { weakPassword: true };
    }
    return null;
  }

  passwordMatchValidator(formGroup: FormGroup) {
    const newPassword = formGroup.get('newPassword');
    const confirmPassword = formGroup.get('confirmPassword');
    
    if (newPassword && confirmPassword) {
      if (newPassword.value !== confirmPassword.value) {
        confirmPassword.setErrors({ passwordMismatch: true });
      } else if (confirmPassword.errors?.['passwordMismatch']) {
        delete confirmPassword.errors['passwordMismatch'];
        if (!Object.keys(confirmPassword.errors).length) {
          confirmPassword.setErrors(null);
        }
      }
    }
    return null;
  }

  togglePasswordVisibility(field: string): void {
    switch(field) {
      case 'current':
        this.showCurrentPassword = !this.showCurrentPassword;
        break;
      case 'new':
        this.showNewPassword = !this.showNewPassword;
        break;
      case 'confirm':
        this.showConfirmPassword = !this.showConfirmPassword;
        break;
    }
  }

  cancel(): void {
    // Navigate back to profile view
    this.router.navigate(['/profile']);
  }

  onSubmit(): void {
    if (this.passwordForm.valid) {
      this.loading = true;
      this.error = null;
      
      this.userProfileService.changePassword(this.passwordForm.value).subscribe({
        next: (response) => {
          console.log('Password change response:', response);
          this.success = true;
          this.loading = false;
          this.error = null; // Clear any error
          this.passwordForm.reset();
          // Redirect to profile after success
          setTimeout(() => {
            this.router.navigate(['/profile']);
          }, 2000);
        },
        error: (err) => {
          console.error('Password change error:', err);
          // Check if it's actually a success response with status 200-299
          if (err.status >= 200 && err.status < 300) {
            // It's actually a success, backend might be returning text instead of JSON
            this.success = true;
            this.loading = false;
            this.error = null;
            this.passwordForm.reset();
            setTimeout(() => {
              this.router.navigate(['/profile']);
            }, 2000);
          } else {
            this.error = err.error?.message || 'Erreur lors du changement de mot de passe';
            this.loading = false;
          }
        }
      });
    }
  }

  // Add these helper methods for template regex checks
  hasMinLength(): boolean {
    const value = this.passwordForm.get('newPassword')?.value;
    return value ? value.length >= 8 : false;
  }

  hasUpperCase(): boolean {
    const value = this.passwordForm.get('newPassword')?.value;
    return value ? /[A-Z]/.test(value) : false;
  }

  hasLowerCase(): boolean {
    const value = this.passwordForm.get('newPassword')?.value;
    return value ? /[a-z]/.test(value) : false;
  }

  hasNumber(): boolean {
    const value = this.passwordForm.get('newPassword')?.value;
    return value ? /[0-9]/.test(value) : false;
  }
}
