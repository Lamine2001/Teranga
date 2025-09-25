import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-forgot-password-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forgot-password-modal.component.html',
  styleUrls: ['./forgot-password-modal.component.scss']
})
export class ForgotPasswordModalComponent {
  @Output() close = new EventEmitter<void>();
  
  step: 'email' | 'code' | 'reset' | 'success' = 'email';
  forgotPasswordForm: FormGroup;
  resetCodeForm: FormGroup;
  newPasswordForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  userEmail = '';

  showMockInfo = false; // Disabled since we're using the real API

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.resetCodeForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.newPasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  onSubmitEmail() {
    if (this.forgotPasswordForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.userEmail = this.forgotPasswordForm.value.email;
      
      this.authService.sendResetCode(this.userEmail).subscribe({
        next: (response) => {
          this.step = 'code';
          this.isLoading = false;
          // You might want to show a message from the response
          if (response?.message) {
            console.log(response.message);
          }
        },
        error: (error) => {
          this.errorMessage = error.message || error.error?.message || 'Erreur lors de l\'envoi du code. Veuillez réessayer.';
          this.isLoading = false;
          console.error('Password reset error:', error);
        }
      });
    }
  }

  onSubmitCode() {
    if (this.resetCodeForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      this.authService.verifyResetCode(this.userEmail, this.resetCodeForm.value.code).subscribe({
        next: () => {
          this.step = 'reset';
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = error.message || 'Code invalide ou expiré';
          this.isLoading = false;
        }
      });
    }
  }

  onSubmitNewPassword() {
    if (this.newPasswordForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      this.authService.resetPassword(
        this.userEmail, 
        this.resetCodeForm.value.code, 
        this.newPasswordForm.value.password
      ).subscribe({
        next: () => {
          this.step = 'success';
          this.isLoading = false;
          setTimeout(() => this.closeModal(), 3000);
        },
        error: (error) => {
          this.errorMessage = error.message || 'Erreur lors de la réinitialisation. Veuillez réessayer.';
          this.isLoading = false;
        }
      });
    }
  }

  resendCode() {
    this.onSubmitEmail();
  }

  goBack() {
    if (this.step === 'code') this.step = 'email';
    else if (this.step === 'reset') this.step = 'code';
  }

  closeModal() {
    this.close.emit();
  }
}
