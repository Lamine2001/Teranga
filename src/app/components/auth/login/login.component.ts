import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      this.error = null;

      const credentials = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password
      };
      
      console.log('Sending login request with credentials:', { email: credentials.email });

      this.authService.login(credentials).subscribe({
        next: (response) => {
          console.log('Login response in component:', response);
          this.loading = false;
          
          if (response.success && response.user) {
            // Navigate based on user role from the user object
            const role = response.user.role?.toLowerCase() || response.user.userType?.toLowerCase();
            
            console.log('User role:', role);
            
            if (role === 'doctor' || role === 'medecin' || role === 'role_doctor') {
              this.router.navigate(['/doctor-dashboard']);
            } else if (role === 'patient' || role === 'role_patient') {
              this.router.navigate(['/patient-dashboard']);
            } else {
              // Default navigation
              this.router.navigate(['/patient-dashboard']);
            }
          } else {
            this.error = response.error || 'Erreur de connexion';
          }
        },
        error: (err) => {
          console.error('Login error in component:', err);
          this.loading = false;
          this.error = err.error?.message || err.message || 'Email ou mot de passe incorrect';
        }
      });
    }
  }
}
