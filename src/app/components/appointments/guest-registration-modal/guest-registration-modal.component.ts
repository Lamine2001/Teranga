import { Component, EventEmitter, Output, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-guest-registration-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './guest-registration-modal.component.html',
  styleUrls: ['./guest-registration-modal.component.scss']
})
export class GuestRegistrationModalComponent implements OnInit {
  @Output() registrationComplete = new EventEmitter<any>();
  @Output() registrationCancel = new EventEmitter<void>();
  @Input() defaultUserType: 'PATIENT' | 'DOCTOR' = 'PATIENT'; // Add input for user type

  registrationForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  passwordStrength = 0;

  // Form sections
  currentSection = 1;
  totalSections = 4;

  // Medical specialties for history
  medicalConditions = [
    'Hypertension', 'Diabète', 'Asthme', 'Allergies', 'Problèmes cardiaques',
    'Problèmes respiratoires', 'Arthrite', 'Migraines', 'Dépression', 'Anxiété',
    'Problèmes digestifs', 'Problèmes de peau', 'Autres'
  ];

  // Emergency contact relationships
  relationships = [
    'Époux/Épouse', 'Parent', 'Enfant', 'Frère/Sœur', 'Ami/Amie', 
    'Collègue', 'Voisin/Voisine', 'Autre'
  ];

  // Cities for address selection
  cities = [
    'Dakar', 'Thiès', 'Kaolack', 'Ziguinchor', 'Saint-Louis',
    'Touba', 'Diourbel', 'Louga', 'Fatick', 'Kolda', 'Tambacounda', 'Matam'
  ];

  // Insurance providers
  insuranceProviders = [
    'CNAS', 'IPM', 'Mutuelle de santé', 'Assurance privée', 'Autre', 'Aucune'
  ];

  // Notification preferences
  notificationOptions = [
    { value: 'email', label: 'Email', icon: 'fas fa-envelope' },
    { value: 'sms', label: 'SMS', icon: 'fas fa-sms' },
    { value: 'whatsapp', label: 'WhatsApp', icon: 'fab fa-whatsapp' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.registrationForm = this.fb.group({
      // Section 1: Personal Information
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\+221\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/)]],
      dateOfBirth: ['', [Validators.required]],
      gender: ['', [Validators.required]],
      userType: ['PATIENT', [Validators.required]], // Add userType form control

      // Section 2: Contact Information
      address: ['', [Validators.required]],
      city: ['Dakar', [Validators.required]],
      emergencyContactName: ['', [Validators.required]],
      emergencyContactPhone: ['', [Validators.required, Validators.pattern(/^\+221\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/)]],
      emergencyContactRelationship: ['', [Validators.required]],

      // Section 3: Account Security
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],

      // Section 4: Medical Information & Preferences
      medicalHistory: [[]],
      allergies: [[]],
      currentMedications: [''],
      insuranceProvider: [''],
      insuranceNumber: [''],
      preferredLanguage: ['fr'],
      notificationPreferences: this.fb.group({
        email: [true],
        sms: [true],
        whatsapp: [false]
      }),
      termsAccepted: [false, [Validators.requiredTrue]],
      privacyPolicyAccepted: [false, [Validators.requiredTrue]],
      marketingConsent: [false]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Set default user type
    this.registrationForm.patchValue({ userType: this.defaultUserType });

    // Watch password changes for strength indicator
    this.registrationForm.get('password')?.valueChanges.subscribe(password => {
      this.passwordStrength = this.calculatePasswordStrength(password);
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else {
      if (confirmPassword?.errors?.['passwordMismatch']) {
        delete confirmPassword.errors['passwordMismatch'];
        if (Object.keys(confirmPassword.errors).length === 0) {
          confirmPassword.setErrors(null);
        }
      }
    }
    return null;
  }

  calculatePasswordStrength(password: string): number {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  }

  getPasswordStrengthText(): string {
    switch (this.passwordStrength) {
      case 0:
      case 1: return 'Très faible';
      case 2: return 'Faible';
      case 3: return 'Moyen';
      case 4: return 'Fort';
      case 5: return 'Très fort';
      default: return '';
    }
  }

  getPasswordStrengthClass(): string {
    switch (this.passwordStrength) {
      case 0:
      case 1: return 'strength-very-weak';
      case 2: return 'strength-weak';
      case 3: return 'strength-medium';
      case 4: return 'strength-strong';
      case 5: return 'strength-very-strong';
      default: return '';
    }
  }

  nextSection(): void {
    if (this.isCurrentSectionValid()) {
      this.currentSection++;
    }
  }

  previousSection(): void {
    if (this.currentSection > 1) {
      this.currentSection--;
    }
  }

  isCurrentSectionValid(): boolean {
    const controls = this.getCurrentSectionControls();
    return controls.every(control => control?.valid);
  }

  getCurrentSectionControls() {
    switch (this.currentSection) {
      case 1:
        return [
          this.registrationForm.get('firstName'),
          this.registrationForm.get('lastName'),
          this.registrationForm.get('email'),
          this.registrationForm.get('phone'),
          this.registrationForm.get('dateOfBirth'),
          this.registrationForm.get('gender'),
          this.registrationForm.get('userType')
        ];
      case 2:
        return [
          this.registrationForm.get('address'),
          this.registrationForm.get('city'),
          this.registrationForm.get('emergencyContactName'),
          this.registrationForm.get('emergencyContactPhone'),
          this.registrationForm.get('emergencyContactRelationship')
        ];
      case 3:
        return [
          this.registrationForm.get('password'),
          this.registrationForm.get('confirmPassword')
        ];
      case 4:
        return [
          this.registrationForm.get('termsAccepted'),
          this.registrationForm.get('privacyPolicyAccepted')
        ];
      default:
        return [];
    }
  }

  onSubmit(): void {
    if (this.registrationForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const formData = this.registrationForm.value;
      
      // Prepare registration data
      const registrationData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        userType: formData.userType, // Use dynamic userType
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        address: formData.address,
        city: formData.city,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
        emergencyContactRelationship: formData.emergencyContactRelationship,
        medicalHistory: formData.medicalHistory,
        allergies: formData.allergies,
        currentMedications: formData.currentMedications,
        insuranceProvider: formData.insuranceProvider,
        insuranceNumber: formData.insuranceNumber,
        preferredLanguage: formData.preferredLanguage,
        notificationPreferences: formData.notificationPreferences,
        termsAccepted: formData.termsAccepted,
        privacyPolicyAccepted: formData.privacyPolicyAccepted,
        marketingConsent: formData.marketingConsent
      };

      this.authService.register(registrationData).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.successMessage = 'Compte créé avec succès!';
            this.registrationComplete.emit(response.user);
          } else {
            this.errorMessage = response.error || 'Erreur lors de la création du compte';
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = 'Erreur lors de la création du compte. Veuillez réessayer.';
          console.error('Registration error:', error);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registrationForm.controls).forEach(key => {
      const control = this.registrationForm.get(key);
      control?.markAsTouched();
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  cancelRegistration(): void {
    this.registrationCancel.emit();
  }

  getFieldError(fieldName: string): string {
    const field = this.registrationForm.get(fieldName);
    if (field?.invalid && field?.touched) {
      if (field.errors?.['required']) {
        return `${this.getFieldLabel(fieldName)} est requis`;
      }
      if (field.errors?.['email']) {
        return 'Adresse email invalide';
      }
      if (field.errors?.['minlength']) {
        return `${this.getFieldLabel(fieldName)} doit contenir au moins ${field.errors['minlength'].requiredLength} caractères`;
      }
      if (field.errors?.['pattern']) {
        if (fieldName.includes('phone')) {
          return 'Format de téléphone invalide (+221 XX XXX XX XX)';
        }
        return 'Format invalide';
      }
      if (field.errors?.['passwordMismatch']) {
        return 'Les mots de passe ne correspondent pas';
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
      dateOfBirth: 'Date de naissance',
      gender: 'Genre',
      userType: 'Type d\'utilisateur',
      address: 'Adresse',
      city: 'Ville',
      emergencyContactName: 'Nom du contact d\'urgence',
      emergencyContactPhone: 'Téléphone du contact d\'urgence',
      emergencyContactRelationship: 'Relation',
      password: 'Mot de passe',
      confirmPassword: 'Confirmation du mot de passe',
      termsAccepted: 'Conditions d\'utilisation',
      privacyPolicyAccepted: 'Politique de confidentialité'
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registrationForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  getProgressPercentage(): number {
    return (this.currentSection / this.totalSections) * 100;
  }

  onMedicalHistoryChange(event: any, condition: string): void {
    const currentHistory = this.registrationForm.get('medicalHistory')?.value || [];
    
    if (event.target.checked) {
      if (!currentHistory.includes(condition)) {
        currentHistory.push(condition);
      }
    } else {
      const index = currentHistory.indexOf(condition);
      if (index > -1) {
        currentHistory.splice(index, 1);
      }
    }
    
    this.registrationForm.patchValue({ medicalHistory: currentHistory });
  }

  getMaxDate(): string {
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() - 18); // Minimum 18 years old
    return maxDate.toISOString().split('T')[0];
  }
}
