import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ForgotPasswordModalComponent } from '../forgot-password-modal/forgot-password-modal.component';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ForgotPasswordModalComponent],
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.scss']
})
export class LoginFormComponent implements OnInit {
  @Output() switchToRegister = new EventEmitter<void>();
  
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;
  showForgotPasswordModal = false;
  
  // Nouvelles propriétés pour gérer le retour vers wizard
  redirectUrl: string | null = null;
  appointmentMode = false;
  queryParams: any = {};

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  ngOnInit(): void {
    // Capturer les paramètres de redirection
    this.route.queryParams.subscribe(params => {
      this.redirectUrl = params['redirect'] || params['returnTo'] || null;
      this.appointmentMode = params['appointmentMode'] === 'true';
      this.queryParams = params;
      
      console.log('=== LOGIN FORM INIT ===');
      console.log('Redirect URL:', this.redirectUrl);
      console.log('Appointment Mode:', this.appointmentMode);
      console.log('All Query params:', this.queryParams);
    });
    
    // Check if user is already authenticated
    if (this.authService.isAuthenticated()) {
      this.handleRedirection();
    }
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const credentials = {
        email: this.loginForm.get('email')?.value,
        password: this.loginForm.get('password')?.value
      };

      this.authService.login(credentials).subscribe({
        next: (response) => {
          console.log('=== LOGIN RESPONSE ===');
          console.log('Response:', response);
          
          if (response.success && response.user) {
            this.handleRedirection(response.user);
          } else {
            this.errorMessage = 'Email ou mot de passe incorrect. Veuillez réessayer.';
            this.isLoading = false;
          }
        },
        error: (error) => {
          console.error('=== LOGIN ERROR ===');
          console.error('Full error object:', error);
          console.error('Error.error:', error.error);
          
          // Le backend retourne la structure d'erreur dans error.error
          const backendError = error.error;
          const httpStatus = error.status;
          const backendStatus = backendError?.status;
          
          console.log('HTTP Status:', httpStatus);
          console.log('Backend Status:', backendStatus);
          console.log('Backend Error:', backendError?.error);
          console.log('Backend Message:', backendError?.message);
          
          // Utiliser le statut backend si disponible, sinon le statut HTTP
          const finalStatus = backendStatus || httpStatus;
          
          // Gérer les erreurs selon le code de statut
          switch (finalStatus) {
            case 400:
            case 401:
            case 404:
            case 500:
              // Pour toutes les erreurs d'authentification, afficher le même message
              this.errorMessage = 'Email ou mot de passe incorrect. Veuillez réessayer.';
              break;
            case 403:
              this.errorMessage = 'Accès refusé. Votre compte pourrait être désactivé.';
              break;
            case 503:
              this.errorMessage = 'Service temporairement indisponible. Veuillez réessayer dans quelques instants.';
              break;
            case 0:
              this.errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
              break;
            default:
              this.errorMessage = 'Email ou mot de passe incorrect. Veuillez réessayer.';
          }
          
          this.isLoading = false;
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private handleRedirection(user?: any): void {
    const currentUser = user || this.authService.getCurrentUser();
    
    console.log('=== HANDLING REDIRECTION ===');
    console.log('Current user:', currentUser);
    console.log('Appointment mode:', this.appointmentMode);
    console.log('Redirect URL:', this.redirectUrl);
    
    // PRIORITÉ 1: Mode appointment avec wizard
    if (this.appointmentMode && this.redirectUrl === '/appointments/wizard') {
      console.log('=== APPOINTMENT MODE REDIRECT ===');
      console.log('Redirecting back to wizard with appointment mode');
      
      // Utiliser setTimeout pour s'assurer que l'auth est propagée
      setTimeout(() => {
        const navigationUrl = '/appointments/wizard?appointmentMode=true&sessionId=' + 
                            (this.queryParams['sessionId'] || Date.now().toString());
        console.log('Navigating to:', navigationUrl);
        
        this.router.navigateByUrl(navigationUrl).then(
          (success) => {
            console.log('Navigation to wizard successful:', success);
            if (!success) {
              // Fallback avec window.location
              window.location.href = navigationUrl;
            }
          },
          (error) => {
            console.error('Navigation to wizard failed:', error);
            // Fallback direct
            window.location.href = navigationUrl;
          }
        );
      }, 200);
      
      return; // Important: sortir de la fonction
    }
    
    // Redirection standard basée sur le rôle
    if (currentUser?.userType) {
      const userType = currentUser.userType.toUpperCase();
      console.log('Standard navigation for user type:', userType);
      
      if (userType === 'DOCTOR') {
        this.router.navigate(['/doctor-dashboard']);
      } else if (userType === 'PATIENT') {
        this.router.navigate(['/patient-dashboard']);
      } else {
        this.router.navigate(['/']);
      }
    } else {
      console.log('No userType found, default navigation');
      this.router.navigate(['/']);
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.invalid && field?.touched) {
      if (field.errors?.['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (field.errors?.['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors?.['minlength']) {
        return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      email: 'Email',
      password: 'Password',
      userType: 'User Type'
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  // Method to emit switch to register event
  onSwitchToRegister(): void {
    this.switchToRegister.emit();
  }

  // Method to handle forgot password
  onForgotPassword(): void {
    this.showForgotPasswordModal = true;
  }

  closeForgotPasswordModal(): void {
    this.showForgotPasswordModal = false;
  }
}
