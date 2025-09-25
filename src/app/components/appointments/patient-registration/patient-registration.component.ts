import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { AppointmentService } from '../../../services/appointment.service';

export interface RegistrationData {
  appointmentFor: string;
  firstName: string;
  secondName?: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  healthCardNumber?: string;
  email: string;
  mobilePhone?: string;
  homePhone?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  termsAccepted: boolean;
}

@Component({
  selector: 'app-patient-registration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './patient-registration.component.html',
  styleUrls: ['./patient-registration.component.scss']
})
export class PatientRegistrationComponent implements OnInit {
  @Input() selectedSlot: any;
  @Output() registrationComplete = new EventEmitter<any>();
  @Output() goBack = new EventEmitter<void>();

  registrationForm: FormGroup;
  loginForm: FormGroup;
  showLoginForm = false;
  isLoading = false;
  errorMessage = '';
  provinces = [
    { value: 'AB', label: 'Alberta' },
    { value: 'BC', label: 'Colombie-Britannique' },
    { value: 'MB', label: 'Manitoba' },
    { value: 'NB', label: 'Nouveau-Brunswick' },
    { value: 'NL', label: 'Terre-Neuve-et-Labrador' },
    { value: 'NS', label: 'Nouvelle-Écosse' },
    { value: 'ON', label: 'Ontario' },
    { value: 'PE', label: 'Île-du-Prince-Édouard' },
    { value: 'QC', label: 'Québec' },
    { value: 'SK', label: 'Saskatchewan' },
    { value: 'NT', label: 'Territoires du Nord-Ouest' },
    { value: 'NU', label: 'Nunavut' },
    { value: 'YT', label: 'Yukon' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private appointmentService: AppointmentService
  ) {
    this.registrationForm = this.fb.group({
      appointmentFor: ['Moi-même', Validators.required],
      firstName: ['', Validators.required],
      secondName: [''],
      lastName: ['', Validators.required],
      gender: ['', Validators.required],
      dateOfBirth: this.fb.group({
        year: ['', [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear())]],
        month: ['', Validators.required],
        day: ['', [Validators.required, Validators.min(1), Validators.max(31)]]
      }),
      healthCardNumber: [''],
      email: ['', [Validators.required, Validators.email]],
      mobilePhone: [''],
      homePhone: [''],
      address: [''],
      city: [''],
      province: [''],
      postalCode: [''],
      termsAccepted: [false, Validators.requiredTrue],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {}

  toggleForm(): void {
    this.showLoginForm = !this.showLoginForm;
    this.errorMessage = '';
  }

  formatDateOfBirth(): string {
    const dob = this.registrationForm.get('dateOfBirth')?.value;
    if (dob.year && dob.month && dob.day) {
      return `${dob.year}-${String(dob.month).padStart(2, '0')}-${String(dob.day).padStart(2, '0')}`;
    }
    return '';
  }

  async onSubmitRegistration(): Promise<void> {
    if (this.registrationForm.invalid) {
      Object.keys(this.registrationForm.controls).forEach(key => {
        const control = this.registrationForm.get(key);
        if (control && control.invalid) {
          control.markAsTouched();
        }
      });
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const formData = this.registrationForm.value;
      const registrationData = {
        ...formData,
        dateOfBirth: this.formatDateOfBirth(),
        role: 'PATIENT'
      };

      // Register the user
      const response = await this.authService.register(registrationData).toPromise();
      
      // If registration successful, book the appointment
      if (response && response.success && response.user) {
        await this.bookAppointment(response.user);
      } else if (response && !response.success) {
        this.errorMessage = response.error || 'Une erreur est survenue lors de l\'inscription';
        this.isLoading = false;
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'Une erreur est survenue lors de l\'inscription';
      this.isLoading = false;
    }
  }

  async onSubmitLogin(): Promise<void> {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const response = await this.authService.login(this.loginForm.value).toPromise();
      
      if (response && response.success && response.user) {
        await this.bookAppointment(response.user);
      } else if (response && !response.success) {
        this.errorMessage = response.error || 'Email ou mot de passe incorrect';
        this.isLoading = false;
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'Email ou mot de passe incorrect';
      this.isLoading = false;
    }
  }

  private async bookAppointment(userData: any): Promise<void> {
    try {
      const appointmentData = {
        patientId: userData.id,
        doctorId: this.selectedSlot.doctorId,
        availabilityId: this.selectedSlot.id, // Changed from slotId to availabilityId
        startTime: this.selectedSlot.startTime,
        endTime: this.selectedSlot.endTime,
        reason: 'Consultation médicale'
      };

      const appointment = await this.appointmentService.bookAppointment(appointmentData).toPromise();
      
      this.registrationComplete.emit({
        user: userData,
        appointment: appointment
      });
    } catch (error: any) {
      this.errorMessage = 'Erreur lors de la réservation du rendez-vous';
    } finally {
      this.isLoading = false;
    }
  }

  onBack(): void {
    this.goBack.emit();
  }
}
