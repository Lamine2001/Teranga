import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register-form.component.html',
  styleUrls: ['./register-form.component.scss']
})
export class RegisterFormComponent implements OnInit {
  @Output() switchToLogin = new EventEmitter<void>();
  
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;
  showConfirmPassword = false;
  passwordStrength = 0;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\+221\s?[0-9]{2}\s?[0-9]{3}\s?[0-9]{2}\s?[0-9]{2}$/)]],
      userType: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      // Patient-specific fields
      dateOfBirth: [''],
      address: [''],
      // Doctor-specific fields (Psychologue)
      specialty: [''],
      licenseNumber: [''],
      department: ['']
    }, { validators: this.passwordMatchValidator });

    // Listen to password changes for strength calculation
    this.registerForm.get('password')?.valueChanges.subscribe(password => {
      this.passwordStrength = this.calculatePasswordStrength(password);
    });
  }

  ngOnInit(): void {
    // Check if user is already authenticated
    if (this.authService.isAuthenticated()) {
      this.redirectBasedOnRole();
    }

    // Listen to user type changes to show/hide relevant fields
    this.registerForm.get('userType')?.valueChanges.subscribe(userType => {
      this.updateFormValidation(userType);
    });
  }

  private updateFormValidation(userType: string): void {
    const patientFields = ['dateOfBirth', 'address'];
    const doctorFields = ['specialty', 'licenseNumber', 'department'];

    if (userType === 'patient') {
      patientFields.forEach(field => {
        this.registerForm.get(field)?.setValidators([Validators.required]);
      });
      doctorFields.forEach(field => {
        this.registerForm.get(field)?.clearValidators();
      });
    } else if (userType === 'doctor') {
      doctorFields.forEach(field => {
        this.registerForm.get(field)?.setValidators([Validators.required]);
      });
      patientFields.forEach(field => {
        this.registerForm.get(field)?.clearValidators();
      });
    }

    // Revalidate form
    this.registerForm.updateValueAndValidity();
  }

  private passwordMatchValidator(form: FormGroup): { [key: string]: any } | null {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  private calculatePasswordStrength(password: string): number {
    if (!password) return 0;
    
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    
    return strength;
  }

  getPasswordStrengthText(): string {
    if (this.passwordStrength === 0) return 'Très faible';
    if (this.passwordStrength <= 25) return 'Faible';
    if (this.passwordStrength <= 50) return 'Moyen';
    if (this.passwordStrength <= 75) return 'Bon';
    return 'Très bon';
  }

  getPasswordStrengthColor(): string {
    if (this.passwordStrength <= 25) return '#e74c3c';
    if (this.passwordStrength <= 50) return '#f39c12';
    if (this.passwordStrength <= 75) return '#f1c40f';
    return '#27ae60';
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const formData = this.registerForm.value;
      
      // Prepare registration data based on user type
      const registrationData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        userType: formData.userType,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      };

      if (formData.userType === 'patient') {
        Object.assign(registrationData, {
          dateOfBirth: formData.dateOfBirth,
          address: formData.address
        });
      } else if (formData.userType === 'doctor') {
        Object.assign(registrationData, {
          specialty: formData.specialty,
          licenseNumber: formData.licenseNumber,
          department: formData.department
        });
      }

      this.authService.register(registrationData).subscribe({
        next: (response) => {
          if (response.success) {
            this.redirectBasedOnRole();
          } else {
            this.errorMessage = response.error || 'Registration failed';
          }
        },
        error: (error) => {
          this.errorMessage = 'An error occurred during registration. Please try again.';
          console.error('Registration error:', error);
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private redirectBasedOnRole(): void {
    const userType = this.registerForm.get('userType')?.value;
    if (userType === 'doctor') {
      this.router.navigate(['/doctor-dashboard']);
    } else {
      this.router.navigate(['/patient-dashboard']);
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  togglePasswordVisibility(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (field?.invalid && field?.touched) {
      if (field.errors?.['required']) {
        return `${this.getFieldLabel(fieldName)} est requis`;
      }
      if (field.errors?.['email']) {
        return 'Veuillez entrer une adresse email valide';
      }
      if (field.errors?.['minlength']) {
        return `${this.getFieldLabel(fieldName)} doit contenir au moins ${field.errors['minlength'].requiredLength} caractères`;
      }
      if (field.errors?.['maxlength']) {
        return `${this.getFieldLabel(fieldName)} ne peut pas dépasser ${field.errors['maxlength'].requiredLength} caractères`;
      }
      if (field.errors?.['pattern']) {
        if (fieldName === 'phone') {
          return 'Format de téléphone invalide. Utilisez le format: +221 XX XXX XX XX';
        }
        return `${this.getFieldLabel(fieldName)} a un format invalide`;
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      firstName: 'Prénom',
      lastName: 'Nom',
      email: 'Email',
      phone: 'Téléphone',
      userType: 'Type d\'utilisateur',
      password: 'Mot de passe',
      confirmPassword: 'Confirmation du mot de passe',
      dateOfBirth: 'Date de naissance',
      address: 'Adresse',
      specialty: 'Spécialité',
      licenseNumber: 'Numéro de licence',
      department: 'Département'
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  isFieldRequired(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!field?.hasValidator(Validators.required);
  }

  // Method to emit switch to login event
  onSwitchToLogin(): void {
    this.switchToLogin.emit();
  }
}
