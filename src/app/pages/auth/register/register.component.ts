import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { RegisterData } from '../../../interfaces/user';

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  @Output() switchToLogin = new EventEmitter<void>();
  
  registerForm: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      userType: ['patient', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      acceptTerms: [false, Validators.requiredTrue],
      // Champs conditionnels
      specialization: [''],
      licenseNumber: [''],
      dateOfBirth: [''],
      address: ['']
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    if (confirmPassword?.errors) {
      delete confirmPassword.errors['passwordMismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }
    
    return null;
  }

  onUserTypeChange(): void {
    const userType = this.registerForm.get('userType')?.value;
    
    // Reset conditional validators
    this.registerForm.get('specialization')?.clearValidators();
    this.registerForm.get('licenseNumber')?.clearValidators();
    this.registerForm.get('dateOfBirth')?.clearValidators();
    this.registerForm.get('address')?.clearValidators();
    
    if (userType === 'doctor') {
      this.registerForm.get('specialization')?.setValidators([Validators.required]);
      this.registerForm.get('licenseNumber')?.setValidators([Validators.required]);
    } else if (userType === 'patient') {
      this.registerForm.get('dateOfBirth')?.setValidators([Validators.required]);
      this.registerForm.get('address')?.setValidators([Validators.required]);
    }
    
    // Update form validation
    this.registerForm.get('specialization')?.updateValueAndValidity();
    this.registerForm.get('licenseNumber')?.updateValueAndValidity();
    this.registerForm.get('dateOfBirth')?.updateValueAndValidity();
    this.registerForm.get('address')?.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const formValue = this.registerForm.value;
      const registerData: RegisterData = {
        email: formValue.email,
        password: formValue.password,
        confirmPassword: formValue.confirmPassword,
        userType: formValue.userType,
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        phone: formValue.phone
      };

      // Ajouter les champs spécifiques selon le type d'utilisateur
      if (formValue.userType === 'doctor') {
        registerData.specialization = formValue.specialization;
        registerData.licenseNumber = formValue.licenseNumber;
      } else {
        registerData.dateOfBirth = formValue.dateOfBirth ? new Date(formValue.dateOfBirth) : undefined;
        registerData.address = formValue.address;
      }

      this.authService.register(registerData).subscribe({
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
            this.errorMessage = result.error || 'Erreur lors de la création du compte';
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = 'Erreur lors de la création du compte. Veuillez réessayer.';
          console.error('Registration error:', error);
        }
      });
    } else {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSwitchToLogin(): void {
    this.switchToLogin.emit();
  }
}
