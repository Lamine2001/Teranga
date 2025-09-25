import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AppointmentService, AppointmentResponseDTO } from '../../../services/appointment.service';
import { AuthService } from '../../../services/auth.service';
import { GuestRegistrationModalComponent } from '../guest-registration-modal/guest-registration-modal.component';
import { BookingConfirmationComponent } from '../booking-confirmation/booking-confirmation.component';

@Component({
  selector: 'app-appointment-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, GuestRegistrationModalComponent, BookingConfirmationComponent],
  templateUrl: './appointment-search.component.html',
  styleUrls: ['./appointment-search.component.scss']
})
export class AppointmentSearchComponent implements OnInit {
  searchForm: FormGroup;
  availableSlots: AppointmentResponseDTO[] = [];
  isLoading = false;
  errorMessage = '';
  isGuestUser = false;
  showRegistrationModal = false;
  showBookingConfirmation = false;
  selectedSlot: AppointmentResponseDTO | null = null;
  newUser: any = null;
  
  specialties = [
    'Cardiologie', 'Dermatologie', 'Endocrinologie', 'Gastro-entérologie',
    'Gynécologie', 'Neurologie', 'Oncologie', 'Ophtalmologie',
    'Orthopédie', 'Pédiatrie', 'Psychiatrie', 'Radiologie',
    'Rhumatologie', 'Urologie', 'Médecine générale'
  ];

  appointmentTypes = [
    { value: 'virtual', label: 'Consultation en ligne', icon: 'fas fa-video' },
    { value: 'onsite', label: 'Consultation sur site', icon: 'fas fa-hospital' }
  ];

  timeSlots = [
    { value: 'morning', label: 'Matin (08:00-12:00)', icon: 'fas fa-sun' },
    { value: 'afternoon', label: 'Après-midi (12:00-17:00)', icon: 'fas fa-cloud-sun' },
    { value: 'evening', label: 'Soir (17:00-20:00)', icon: 'fas fa-moon' }
  ];

  cities = [
    'Dakar', 'Thiès', 'Kaolack', 'Ziguinchor', 'Saint-Louis', 
    'Touba', 'Diourbel', 'Louga', 'Fatick', 'Kolda', 'Tambacounda', 'Matam'
  ];

  constructor(
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    public authService: AuthService
  ) {
    this.searchForm = this.fb.group({
      date: ['', [Validators.required]],
      specialty: [''],
      doctorId: [''],
      appointmentType: ['virtual', [Validators.required]],
      preferredTimes: [[]],
      maxDistance: [10],
      location: [''],
      doctorName: ['']
    });
  }

  ngOnInit(): void {
    // Check if user is authenticated
    this.isGuestUser = !this.authService.isAuthenticated();
    
    // For development: Generate mock token if none exists
    this.ensureMockTokenForDevelopment();
    
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.searchForm.patchValue({
      date: tomorrow.toISOString().split('T')[0],
      location: 'Dakar'
    });
  }

  /**
   * Generate a mock token for development when backend is not available
   */
  private ensureMockTokenForDevelopment(): void {
    if (!this.authService.getToken()) {
      // Generate a simple mock token for development
      const mockToken = this.generateMockToken();
      localStorage.setItem('token', mockToken);
      console.log('🔧 Development: Mock token generated');
    }
  }

  /**
   * Generate a simple mock JWT token for development
   */
  private generateMockToken(): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: 'mock-user-id',
      email: 'mock@teranga.com',
      role: 'patient',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }));
    const signature = btoa('mock-signature-for-development');
    
    return `${header}.${payload}.${signature}`;
  }

  onSearch(): void {
    if (this.searchForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      const searchData = this.searchForm.value;
      searchData.date = new Date(searchData.date);
      
      // Use public search endpoint for guest users
      const searchEndpoint = this.isGuestUser ? 'search-public' : 'search';
      
      this.appointmentService.searchAvailableSlots(searchData).subscribe({
        next: (slots) => {
          this.availableSlots = slots;
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = 'Erreur lors de la recherche des créneaux disponibles';
          this.isLoading = false;
          console.error('Search error:', error);
        }
      });
    }
  }

  onBookAppointment(slot: AppointmentResponseDTO): void {
    this.selectedSlot = slot;
    
    if (this.isGuestUser) {
      // Show registration modal for guest users
      this.showRegistrationModal = true;
    } else {
      // Direct booking for authenticated users
      this.proceedToBooking();
    }
  }

  onRegistrationComplete(user: any): void {
    this.newUser = user;
    this.showRegistrationModal = false;
    this.showBookingConfirmation = true;
    this.isGuestUser = false; // User is now authenticated
  }

  onRegistrationCancel(): void {
    this.showRegistrationModal = false;
    this.selectedSlot = null;
  }

  proceedToBooking(): void {
    this.showBookingConfirmation = true;
  }

  onBookingComplete(result?: any): void {
    this.showBookingConfirmation = false;
    this.selectedSlot = null;
    // Optionally redirect to dashboard or show success message
  }

  onBookingCancel(): void {
    this.showBookingConfirmation = false;
    this.selectedSlot = null;
  }


  getTimeRange(startTime: string, endTime: string): string {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return `${start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  }

  getDateDisplay(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getTomorrowDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  onTimePreferenceChange(event: any, value: string): void {
    const currentTimes = this.searchForm.get('preferredTimes')?.value || [];
    
    if (event.target.checked) {
      if (!currentTimes.includes(value)) {
        currentTimes.push(value);
      }
    } else {
      const index = currentTimes.indexOf(value);
      if (index > -1) {
        currentTimes.splice(index, 1);
      }
    }
    
    this.searchForm.patchValue({ preferredTimes: currentTimes });
  }

  getMaxDate(): string {
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() - 18); // Minimum 18 years old
    return maxDate.toISOString().split('T')[0];
  }

  isPreferredTime(appointmentTime: string): boolean {
    const time = new Date(appointmentTime);
    const hour = time.getHours();
    const preferredHours = [9, 14, 16];
    return preferredHours.includes(hour);
  }
}
