import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { LoginCredentials } from '../../../interfaces/user';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  @Output() switchToRegister = new EventEmitter<void>();
  
  loginForm: FormGroup;
  showPassword = false;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      userType: ['patient', Validators.required],
      rememberMe: [false]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const credentials: LoginCredentials = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password,
        userType: this.loginForm.value.userType
      };

      this.authService.login(credentials).subscribe({
        next: (result) => {
          this.isLoading = false;
          if (result.success && result.user) {
            // Redirection selon le type d'utilisateur
            if (result.user.userType === 'doctor') {
              this.router.navigate(['/doctor-dashboard']);
            } else {
              this.router.navigate(['/patient-dashboard']);
            }
          } else {
            this.errorMessage = result.error || 'Erreur de connexion';
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = 'Erreur de connexion. Veuillez réessayer.';
          console.error('Login error:', error);
        }
      });
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSwitchToRegister(): void {
    this.switchToRegister.emit();
  }
}
