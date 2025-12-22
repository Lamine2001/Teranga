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
  currentStep = 1;
  
  // Propriétés pour le modal de succès
  showSuccessModal = false;
  registrationEmail = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[\+]?[0-9\s]{8,15}$/)]],
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
   // if (this.authService.isAuthenticated()) {
    //  this.redirectBasedOnRole();
   // }

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
        this.registerForm.get(field)?.updateValueAndValidity();
      });
      doctorFields.forEach(field => {
        this.registerForm.get(field)?.clearValidators();
        this.registerForm.get(field)?.updateValueAndValidity();
      });
    } else if (userType === 'doctor') {
      doctorFields.forEach(field => {
        this.registerForm.get(field)?.setValidators([Validators.required]);
        this.registerForm.get(field)?.updateValueAndValidity();
      });
      patientFields.forEach(field => {
        this.registerForm.get(field)?.clearValidators();
        this.registerForm.get(field)?.updateValueAndValidity();
      });
    } else {
      // If no user type selected, clear all conditional validators
      [...patientFields, ...doctorFields].forEach(field => {
        this.registerForm.get(field)?.clearValidators();
        this.registerForm.get(field)?.updateValueAndValidity();
      });
    }
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
          console.log('Registration response:', response);
          
          if (response.success) {
            // Store registration email for the success modal
            this.registrationEmail = formData.email;
            
            // Show success modal with the message and info from backend
            this.showSuccessModal = true;
            
            // Optionally log the messages
            if (response.message) {
              console.log('Success message:', response.message);
            }
            if (response.info) {
              console.log('Info message:', response.info);
            }
          } else {
            this.errorMessage = response.error || 'Erreur lors de l\'inscription';
          }
          
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Registration error:', error);
          this.errorMessage = 'Une erreur est survenue lors de l\'inscription. Veuillez réessayer.';
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

  onCloseSuccessModal(): void {
    this.showSuccessModal = false;
    // Rediriger vers la page de connexion
    this.router.navigate(['/auth']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
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
          return 'Téléphone invalide (8 à 15 chiffres, avec ou sans +)';
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
      department: 'Ville/Région d\'exercice'
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

  // Step navigation methods
  nextStep(): void {
    if (this.canProceedToNextStep() && this.currentStep < 4) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  canProceedToNextStep(): boolean {
    switch (this.currentStep) {
      case 1:
        return this.registerForm.get('userType')?.valid || false;
      case 2:
        return ['firstName', 'lastName', 'email', 'phone'].every(field => 
          this.registerForm.get(field)?.valid
        );
      case 3:
        const userType = this.registerForm.get('userType')?.value;
        if (userType === 'patient') {
          return ['dateOfBirth', 'address'].every(field => 
            this.registerForm.get(field)?.valid
          );
        } else if (userType === 'doctor') {
          return ['specialty', 'licenseNumber', 'department'].every(field => 
            this.registerForm.get(field)?.valid
          );
        }
        return false;
      case 4:
        return ['password', 'confirmPassword'].every(field => 
          this.registerForm.get(field)?.valid
        ) && !this.registerForm.errors?.['passwordMismatch'];
      default:
        return false;
    }
  }

  selectUserType(userType: string): void {
    this.registerForm.get('userType')?.setValue(userType);
  }

  getProgressPercentage(): number {
    return (this.currentStep / 4) * 100;
  }

  getPasswordStrengthClass(): string {
    if (this.passwordStrength < 40) return 'strength-weak';
    if (this.passwordStrength < 80) return 'strength-medium';
    return 'strength-strong';
  }

  getPasswordStrengthText(): string {
    if (this.passwordStrength === 0) return 'Très faible';
    if (this.passwordStrength <= 25) return 'Faible';
    if (this.passwordStrength <= 50) return 'Moyen';
    if (this.passwordStrength <= 75) return 'Bon';
    return 'Très bon';
  }

  isFormValidForSubmission(): boolean {
    const basicFields = ['firstName', 'lastName', 'email', 'phone', 'userType', 'password', 'confirmPassword'];
    const userType = this.registerForm.get('userType')?.value;
    
    // Check if all basic fields are valid
    const basicFieldsValid = basicFields.every(field => 
      this.registerForm.get(field)?.valid
    );
    
    // Check user-specific fields
    let specificFieldsValid = true;
    if (userType === 'patient') {
      specificFieldsValid = ['dateOfBirth', 'address'].every(field => 
        this.registerForm.get(field)?.valid
      );
    } else if (userType === 'doctor') {
      specificFieldsValid = ['specialty', 'licenseNumber', 'department'].every(field => 
        this.registerForm.get(field)?.valid
      );
    }
    
    // Check password match
    const passwordsMatch = !this.registerForm.errors?.['passwordMismatch'];
    
    return basicFieldsValid && specificFieldsValid && passwordsMatch;
  }
}
