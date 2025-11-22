import { Component, OnInit, OnDestroy, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute, NavigationStart } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AppointmentService, AppointmentResponseDTO } from '../../../services/appointment.service';
import { AuthService } from '../../../services/auth.service';
import { DoctorsListComponent } from '../doctors-list/doctors-list.component';
import { AppointmentContextService, AppointmentContext } from '../../../services/appointment-context.service';
import { Subscription } from 'rxjs';

interface WizardStep {
  id: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-appointment-search',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    FormsModule,
    RouterModule,
    DoctorsListComponent
  ],
  templateUrl: './appointment-search.component.html',
  styleUrls: ['./appointment-search.component.scss']
})
export class AppointmentSearchComponent implements OnInit, OnDestroy {
  searchForm: FormGroup;
  availableSlots: AppointmentResponseDTO[] = [];
  isLoading = false;
  errorMessage = '';
  isGuestUser = false;
  showRegistrationModal = false;
  showBookingConfirmation = false;
  selectedSlot: AppointmentResponseDTO | null = null;
  newUser: any = null;
  
  // Context declaration
  context: AppointmentContext = {
    patientType: 'existing' // Toujours définir comme 'existing'
  };
  
  // Wizard properties
  isLoggedIn = false;
  steps: WizardStep[] = [
    { id: 'consultation-mode', label: 'Type de consultation', icon: 'fas fa-video' },
    { id: 'doctor-selection', label: 'Médecin & Créneau', icon: 'fas fa-user-md' },
    { id: 'confirmation', label: 'Confirmation', icon: 'fas fa-check-circle' }
  ];
  
  currentStep = 'consultation-mode';
  consultationType: 'virtual' | 'onsite' = 'virtual';
  selectedSpecialty = '';
  selectedLocation = '';
  selectedDate = '';
  searchPerformed = false;
  appointmentNotes = '';
  appointmentConfirmed = false;
  confirmedAppointment: any = null;
  showDoctorAvailability = false;

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

  // Nouvelles propriétés pour l'affichage des médecins
  doctors: any[] = [];
  filteredDoctors: any[] = [];
  expandedDoctorId: string | null = null;
  searchText = '';
  loadingSlots = false;
  doctorSlots: Map<string, any[]> = new Map();

  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    public authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private appointmentContextService: AppointmentContextService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
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
    this.isLoggedIn = this.authService.isAuthenticated();
    
    // Récupérer le contexte existant et s'assurer que patientType est 'existing'
    this.context = this.appointmentContextService.getContext();
    this.context.patientType = 'existing'; // Forcer le type à 'existing'
    
    // Mettre à jour le contexte avec patientType
    this.appointmentContextService.updateContext({ patientType: 'existing' });
    
    // Intercepter TOUTES les navigations pour empêcher le retour à la page d'accueil
    const navigationInterceptor = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        // Si on a un slot sélectionné et qu'on tente de naviguer vers home
        if (this.selectedSlot && this.currentStep === 'confirmation' && 
            (event.url === '/' || event.url === '/home')) {
          console.log('Navigation vers home bloquée - rester sur confirmation');
          
          // Empêcher la navigation
          setTimeout(() => {
            this.currentStep = 'confirmation';
            this.cdr.detectChanges();
          }, 0);
        }
      }
    });
    
    this.subscriptions.add(navigationInterceptor);
    
    // Vérifier immédiatement si on a un slot sélectionné dans le contexte sauvegardé
    const savedContext = sessionStorage.getItem('appointmentContext');
    if (savedContext) {
      try {
        const context = JSON.parse(savedContext);
        if (context.selectedSlot && context.patientType === 'existing') {
          console.log('Contexte trouvé au chargement - restauration pour confirmation');
          
          // Restaurer le slot sélectionné
          this.selectedSlot = context.selectedSlot;
          this.context = context;
          
          // Passer directement à l'étape de confirmation
          this.currentStep = 'confirmation';
          
          // Nettoyer le contexte sauvegardé après l'avoir utilisé
          sessionStorage.removeItem('appointmentContext');
          
          // Forcer la mise à jour de la vue
          setTimeout(() => {
            this.cdr.detectChanges();
          }, 0);
        }
      } catch (e) {
        console.error('Erreur lors de la restauration du contexte:', e);
      }
    }
    
    // For development: Generate mock token if none exists
    this.ensureMockTokenForDevelopment();
    
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.searchForm.patchValue({
      date: tomorrow.toISOString().split('T')[0],
      location: 'Dakar'
    });
    
    // Set default date for wizard
    if (this.isLoggedIn) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      this.selectedDate = tomorrow.toISOString().split('T')[0]; 
   }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  determineCurrentStep(): void {
    if (this.context.selectedSlot) {
      this.currentStep = 'confirmation'; // Aller directement à la confirmation
    } else if (this.context.selectedDoctor) {
      this.currentStep = 'slot-selection';
      this.showDoctorAvailability = true;
    } else if (this.context.consultationMode) {
      this.currentStep = 'doctor-selection'; // Passer directement à la sélection du médecin
    } else {
      this.currentStep = 'consultation-mode';
    }
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

  // Wizard step handlers
  isStepActive(stepId: string): boolean {
    return this.currentStep === stepId;
  }

  isStepCompleted(stepId: string): boolean {
    const stepIndex = this.steps.findIndex(s => s.id === stepId);
    const currentIndex = this.steps.findIndex(s => s.id === this.currentStep);
    return stepIndex < currentIndex;
  }

  canNavigateToStep(stepId: string): boolean {
    // Logique pour déterminer si on peut naviguer vers une étape
    const stepIndex = this.steps.findIndex(s => s.id === stepId);
    const currentIndex = this.steps.findIndex(s => s.id === this.currentStep);
    
    // On peut aller aux étapes précédentes ou à l'étape actuelle
    return stepIndex <= currentIndex;
  }

  goToStep(stepId: string): void {
    if (this.canNavigateToStep(stepId)) {
      this.currentStep = stepId;
      
      // Réinitialiser certains états si on recule
      if (stepId === 'doctor-selection') {
        this.showDoctorAvailability = false;
      }
    }
  }

  // Handlers pour chaque étape
  onConsultationModeSelected(mode: string): void {
    this.consultationType = mode as 'virtual' | 'onsite'; // Mettre à jour consultationType
    this.appointmentContextService.updateContext({ 
      consultationMode: mode,
      patientType: 'existing' // S'assurer que patientType est défini
    });
    this.currentStep = 'doctor-selection';
    this.loadDoctors();
  }

  // Supprimer ou simplifier cette méthode puisqu'on n'a plus besoin de la sélection du type de patient
  onPatientTypeSelected(type: string): void {
    // Toujours définir comme 'existing'
    this.appointmentContextService.updateContext({ patientType: 'existing' });
    this.currentStep = 'doctor-selection';
  }

  onDoctorSelected(doctor: any): void {
    this.appointmentContextService.setSelectedDoctor(doctor);
    this.currentStep = 'slot-selection';
    this.showDoctorAvailability = true;
  }

  onSlotSelected(slot: any, doctor?: any): void {
    console.log('Slot selectionné:', slot);
    if (doctor) {
      // Créer un objet compatible avec AppointmentResponseDTO
      this.selectedSlot = {
        ...slot,
        doctorFirstName: doctor.firstName,
        doctorLastName: doctor.lastName,
        doctorSpecialty: doctor.specialty,
        appointmentTime: slot.startTime,
        endTime: slot.endTime
      };
    } else {
      this.selectedSlot = slot;
    }
    
    // S'assurer que le patientType est défini avant de sauvegarder le slot
    this.appointmentContextService.updateContext({ patientType: 'existing' });
    this.appointmentContextService.setSelectedSlot(this.selectedSlot);
    
    // Pour un patient 'existing', aller directement à la confirmation
    this.currentStep = 'confirmation';
  }

  // Nouvelle méthode pour gérer l'événement depuis DoctorsListComponent
  onSlotSelectedFromDoctorsList(event: any): void {
    console.log('=== APPOINTMENT SEARCH: Slot selected from doctors list ===', event);
    
    // Créer un flag pour bloquer la navigation immédiatement
    const originalNavigate = this.router.navigate;
    const originalNavigateByUrl = this.router.navigateByUrl;
    
    // Override temporaire des méthodes de navigation
    (this.router as any).navigate = (commands: any[], extras?: any) => {
      console.log('Navigation interceptée et bloquée:', commands);
      return Promise.resolve(true);
    };
    
    (this.router as any).navigateByUrl = (url: any, extras?: any) => {
      console.log('NavigateByUrl interceptée et bloquée:', url);
      return Promise.resolve(true);
    };
    
    // Vérifier si l'événement contient les propriétés slot et doctor
    if (event && event.slot && event.doctor) {
      console.log('Processing slot with doctor info:', event.slot, event.doctor);
      
      // Format avec slot et doctor séparés
      this.selectedSlot = {
        id: event.slot.id,
        doctorFirstName: event.doctor.firstName,
        doctorLastName: event.doctor.lastName,
        doctorSpecialty: event.doctor.specialty || event.slot.specialty,
        appointmentTime: event.slot.startTime,
        endTime: event.slot.endTime,
        doctorId: event.slot.doctorId || event.doctor.id
      } as AppointmentResponseDTO;
    } else if (event) {
      console.log('Processing slot directly:', event);
      
      // Format direct du slot (si l'événement est directement le slot)
      const slot: any = {
        id: event.id,
        doctorId: event.doctorId,
        appointmentTime: event.appointmentTime || event.startTime,
        endTime: event.endTime,
        doctorFirstName: event.doctorFirstName,
        doctorLastName: event.doctorLastName,
        doctorSpecialty: event.doctorSpecialty || event.specialty
      };
      
      // Si le slot contient déjà les informations du médecin
      if (!slot.doctorFirstName && event.doctorName) {
        const nameParts = event.doctorName.split(' ');
        if (nameParts.length >= 2) {
          slot.doctorFirstName = nameParts[0];
          slot.doctorLastName = nameParts.slice(1).join(' ');
        }
      }
      
      this.selectedSlot = slot as AppointmentResponseDTO;
    }
    
    console.log('Selected slot prepared:', this.selectedSlot);
    
    // Mettre à jour le contexte SANS déclencher de navigation
    this.appointmentContextService.updateContext({ patientType: 'existing' });
    this.appointmentContextService.setSelectedSlot(this.selectedSlot);
    
    // IMPORTANT: Nettoyer le contexte du sessionStorage pour éviter la confusion
    sessionStorage.removeItem('appointmentContext');
    
    // Changer l'étape à confirmation
    this.currentStep = 'confirmation';
    console.log('Current step changed to:', this.currentStep);
    
    // Forcer la mise à jour de la vue immédiatement
    this.cdr.detectChanges();
    
    // Restaurer les méthodes de navigation après un délai
    setTimeout(() => {
      (this.router as any).navigate = originalNavigate.bind(this.router);
      (this.router as any).navigateByUrl = originalNavigateByUrl.bind(this.router);
      
      // Vérification finale que nous sommes toujours sur confirmation
      if (this.currentStep !== 'confirmation') {
        console.error('L\'étape a été changée de manière inattendue!');
        this.currentStep = 'confirmation';
        this.cdr.detectChanges();
      }
    }, 1500);
  }

  // Méthode pour gérer l'inscription (si nécessaire)
  onShowRegistration(slot: any): void {
    console.log('Show registration requested for slot:', slot);
    // Pour l'instant, on ne fait rien car on considère tous les utilisateurs comme "existing"
    // Cette méthode peut être supprimée si non utilisée
  }

  getStepNumber(stepId: string): number {
    // Utiliser getVisibleSteps() pour obtenir le bon numéro d'étape
    const visibleSteps = this.getVisibleSteps();
    return visibleSteps.findIndex(s => s.id === stepId) + 1;
  }

  getVisibleSteps(): WizardStep[] {
    return this.steps;
  }

  private showError(message: string): void {
    this.errorMessage = message;
    console.error('Error:', message);
  }

  private createAppointmentAfterLogin(): void {
    console.log('Creating appointment after login...');
    this.currentStep = 'confirmation';
    this.confirmAppointment();
  }

  confirmAppointment(): void {
    if (!this.selectedSlot) {
      this.errorMessage = 'Veuillez sélectionner un créneau';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Récupérer le mode de consultation du contexte si non défini
    const context = this.appointmentContextService.getContext();
    const appointmentType = this.consultationType || context.consultationMode || 'virtual';

    const appointmentData = {
      availabilityId: this.selectedSlot.id || '',
      appointmentType: appointmentType,
      notes: this.appointmentNotes
    };

    console.log('Sending appointment data:', appointmentData); // Pour déboguer

    this.appointmentService.bookAppointment(appointmentData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.appointmentConfirmed = true;
        this.confirmedAppointment = response;
        console.log('Appointment confirmed:', response);
        
        // Vider le contexte après confirmation réussie
        this.appointmentContextService.clearContext();
        
        // Nettoyer aussi le sessionStorage au cas où
        sessionStorage.removeItem('appointmentContext');
        
        console.log('Contexte vidé après confirmation du rendez-vous');
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Erreur lors de la création du rendez-vous. Veuillez réessayer.';
        console.error('Booking error:', error);
      }
    });
  }

  resetWizard(): void {
    this.currentStep = 'consultation-mode';
    this.consultationType = 'virtual';
    this.selectedSlot = null;
    this.selectedSpecialty = '';
    this.selectedLocation = '';
    this.selectedDate = '';
    this.searchPerformed = false;
    this.appointmentNotes = '';
    this.appointmentConfirmed = false;
    this.confirmedAppointment = null;
    this.availableSlots = [];
    this.errorMessage = '';
    
    // Reset to default date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.selectedDate = tomorrow.toISOString().split('T')[0];
    
    // Vider complètement le contexte lors du reset
    this.appointmentContextService.clearContext();
    
    // Nettoyer aussi le sessionStorage
    sessionStorage.removeItem('appointmentContext');
    
    // Réinitialiser le contexte local avec juste patientType
    this.context = {
      patientType: 'existing'
    };
    
    console.log('Wizard et contexte réinitialisés');
  }

  loadDoctors(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    // Simuler le chargement des médecins avec des créneaux
    setTimeout(() => {
      this.doctors = [
        {
          id: '1',
          firstName: 'Jean',
          lastName: 'Dupont',
          specialty: 'Cardiologie',
          availabilities: []
        },
        {
          id: '2',
          firstName: 'Marie',
          lastName: 'Martin',
          specialty: 'Dermatologie',
          availabilities: []
        }
        // Ajouter d'autres médecins...
      ];
      
      this.filteredDoctors = [...this.doctors];
      this.isLoading = false;
    }, 1000);
  }

  onFilterDoctors(): void {
    this.filteredDoctors = this.doctors.filter(doctor => {
      const matchesSearch = !this.searchText || 
        this.getDoctorDisplayName(doctor).toLowerCase().includes(this.searchText.toLowerCase());
      
      const matchesSpecialty = !this.selectedSpecialty || 
        doctor.specialty === this.selectedSpecialty;
      
      return matchesSearch && matchesSpecialty;
    });
  }

 

 

  getDoctorSlots(doctorId: string): any[] {
    return this.doctorSlots.get(doctorId) || [];
  }

  getDoctorDisplayName(doctor: any): string {
    if (doctor.firstName && doctor.lastName) {
      return `${doctor.firstName} ${doctor.lastName}`;
    }
    return doctor.name || 'Médecin';
  }

  formatSpecialty(specialty: string): string {
    return specialty || 'Médecine générale';
  }

  hasAvailabilities(doctor: any): boolean {
    return this.getDoctorSlots(doctor.id).length > 0;
  }

 
  onGoBack(): void {
    const currentIndex = this.steps.findIndex(s => s.id === this.currentStep);
    if (currentIndex > 0) {
      const previousStep = this.steps[currentIndex - 1].id;
      
      // Réinitialiser certains états selon l'étape
      if (this.currentStep === 'confirmation') {
        // Si on revient de la confirmation, effacer le créneau sélectionné
        this.appointmentContextService.setSelectedSlot(null);
        this.currentStep = 'slot-selection';
      } else if (this.currentStep === 'slot-selection') {
        // Si on revient de la sélection du créneau, effacer le médecin sélectionné
        this.appointmentContextService.setSelectedDoctor(null);
        this.showDoctorAvailability = false;
        this.currentStep = 'doctor-selection';
      } else {
        this.currentStep = previousStep;
      }
    }
  }
}
