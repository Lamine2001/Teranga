import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  error: string | null = null;
  redirectUrl: string | null = null;
  queryParams: any = {};

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Capture redirect URL and query parameters
    this.route.queryParams.subscribe(params => {
      this.redirectUrl = params['redirect'] || null;
      this.queryParams = params;
      
      console.log('Login component - Redirect URL:', this.redirectUrl);
      console.log('Login component - Query params:', this.queryParams);
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
      
      console.log('=== LOGIN SUBMIT ===');
      console.log('Redirect URL:', this.redirectUrl);
      console.log('Query params:', this.queryParams);

      this.authService.login(credentials).subscribe({
        next: (response) => {
          console.log('Login successful');
          this.loading = false;
          
          const user = response.user || response;
          
          if (user && user.userType) {
            // Check if there's a specific redirect URL
            if (this.redirectUrl && this.redirectUrl === '/appointments/wizard') {
              console.log('Redirecting to appointments wizard with params');
              
              // Navigate with query parameters preserved
              this.router.navigate([this.redirectUrl], {
                queryParams: {
                  step: this.queryParams['step'],
                  doctorId: this.queryParams['doctorId'],
                  slotId: this.queryParams['slotId'],
                  patientType: this.queryParams['patientType']
                }
              });
            } else {
              // Default navigation based on user type
              const userType = user.userType.toUpperCase();
              if (userType === 'DOCTOR') {
                this.router.navigate(['/doctor-dashboard']);
              } else if (userType === 'PATIENT') {
                this.router.navigate(['/patient-dashboard']);
              } else {
                this.router.navigate(['/']);
              }
            }
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
      });
    }
  }
}
          