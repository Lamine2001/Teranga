import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent {
  passwordForm: FormGroup;
  loading = false;
  error: string | null = null;
  success = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router
  ) {
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(formGroup: FormGroup) {
    const newPassword = formGroup.get('newPassword');
    const confirmPassword = formGroup.get('confirmPassword');
    
    if (newPassword && confirmPassword) {
      if (newPassword.value !== confirmPassword.value) {
        confirmPassword.setErrors({ passwordMismatch: true });
      } else {
        confirmPassword.setErrors(null);
      }
    }
    return null;
  }

  onSubmit(): void {
    if (this.passwordForm.valid) {
      this.loading = true;
      this.error = null;
      
      this.userService.changePassword(this.passwordForm.value).subscribe({
        next: (response) => {
          this.success = true;
          this.loading = false;
          this.passwordForm.reset();
          setTimeout(() => {
            this.router.navigate(['/profile']);
          }, 2000);
        },
        error: (err) => {
          this.error = err.error?.message || 'Erreur lors du changement de mot de passe';
          this.loading = false;
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/profile']);
  }
}
