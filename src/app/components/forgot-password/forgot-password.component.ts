import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm!: FormGroup;
  resetPasswordForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showResetForm = false;
  code: string | null = null;
  userEmail: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Vérifier si un code est présent dans l'URL
    this.route.queryParams.subscribe(params => {
      this.code = params['code'];
      this.userEmail = params['email'] || '';
      if (this.code) {
        this.showResetForm = true;
      }
    });

    this.initializeForms();
  }

  initializeForms(): void {
    // Formulaire pour demander la réinitialisation
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    // Formulaire pour réinitialiser le mot de passe
    this.resetPasswordForm = this.fb.group({
      email: [this.userEmail, [Validators.required, Validators.email]],
      code: [this.code || '', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup): any {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else {
      confirmPassword?.setErrors(null);
    }
    return null;
  }

  onSubmitForgotPassword(): void {
    if (this.forgotPasswordForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const email = this.forgotPasswordForm.get('email')?.value;
    this.userEmail = email; // Stocker l'email pour l'étape suivante

    this.authService.forgotPassword(email).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.successMessage = 'Un code de vérification a été envoyé à votre adresse email.';
        this.showResetForm = true;
        // Mettre à jour le formulaire de réinitialisation avec l'email
        this.resetPasswordForm.patchValue({ email: email });
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Une erreur est survenue. Veuillez réessayer.';
      }
    });
  }

  onSubmitResetPassword(): void {
    if (this.resetPasswordForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const email = this.resetPasswordForm.get('email')?.value;
    const code = this.resetPasswordForm.get('code')?.value;
    const newPassword = this.resetPasswordForm.get('newPassword')?.value;

    this.authService.resetPassword(email, code, newPassword).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.successMessage = 'Votre mot de passe a été réinitialisé avec succès.';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Code invalide ou expiré. Veuillez réessayer.';
      }
    });
  }
}
