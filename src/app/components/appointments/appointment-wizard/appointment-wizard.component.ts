import { Component, OnInit, OnDestroy, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, ActivatedRoute, RouterLink, NavigationStart } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DoctorsListComponent } from '../doctors-list/doctors-list.component';
import { AppointmentContextService, AppointmentContext } from '../../../services/appointment-context.service';
import { AppointmentService } from '../../../services/appointment.service';
import { AuthService } from '../../../services/auth.service';
import { Subscription } from 'rxjs';

interface WizardStep {
  id: string;
  label: string;
  icon: string;
  component?: string;
}

@Component({
  selector: 'app-appointment-wizard',
  standalone: true,
  imports: [
    CommonModule,
    DoctorsListComponent,
    RouterLink,
    ReactiveFormsModule
  ],
  templateUrl: './appointment-wizard.component.html',
  styleUrls: ['./appointment-wizard.component.scss']
})
export class AppointmentWizardComponent implements OnInit, OnDestroy {
  steps: WizardStep[] = [
    { id: 'consultation-mode', label: 'Mode de consultation', icon: 'fas fa-video' },
    { id: 'patient-type', label: 'Type de patient', icon: 'fas fa-users' },
    { id: 'doctor-selection', label: 'Choix du médecin', icon: 'fas fa-user-md' },
    { id: 'slot-selection', label: 'Disponibilité', icon: 'fas fa-calendar' },
    { id: 'registration', label: 'Inscription', icon: 'fas fa-user-plus' },
    { id: 'confirmation', label: 'Confirmation', icon: 'fas fa-check-circle' }
  ];

  currentStep = 'consultation-mode';
  context: AppointmentContext = {};
  showDoctorAvailability = false;
  isLoading = false;
  registrationForm!: FormGroup;
  showPassword = false;

  private subscriptions = new Subscription();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private appointmentContextService: AppointmentContextService,
    private appointmentService: AppointmentService,
    private authService: AuthService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    console.log('=== WIZARD COMPONENT INIT ===');
    console.log('Current URL:', this.router.url);
    console.log('Initial step:', this.currentStep);
    
    // Initialiser le formulaire d'inscription
    this.initRegistrationForm();
    
    // Récupérer le contexte existant
    this.context = this.appointmentContextService.getContext();
    
    // Vérifier les query params AVANT de vérifier le contexte sauvegardé
    const queryParams = this.route.snapshot.queryParams;
    console.log('Query params on init:', queryParams);
    
    // Si on revient avec appointmentMode=true, restaurer immédiatement le contexte
    if (queryParams['appointmentMode'] === 'true' && isPlatformBrowser(this.platformId)) {
      console.log('=== DETECTED RETURN FROM AUTH ===');
      
      const savedContext = sessionStorage.getItem('appointmentContext');
      if (savedContext && this.authService.isAuthenticated()) {
        console.log('Found saved context and user is authenticated');
        
        try {
          const context = JSON.parse(savedContext);
          console.log('Restoring context:', context);
          console.log('Doctor details:', context.doctorDetails);
          console.log('Slot details:', context.slotDetails);
          
          // CORRECTION: Utiliser les bonnes propriétés depuis le contexte sauvegardé
          this.context = {
            consultationMode: context.consultationMode,
            selectedDoctor: context.doctorDetails, // Utiliser doctorDetails
            selectedSlot: context.slotDetails,     // Utiliser slotDetails
            patientType: context.patientType || 'existing'
          };
          
          console.log('Context after restoration:', this.context);
          
          // Vérifier que nous avons bien les données nécessaires
          if (!this.context.selectedDoctor || !this.context.selectedSlot) {
            console.error('Context restoration failed - missing data:', {
              doctor: !!this.context.selectedDoctor,
              slot: !!this.context.selectedSlot
            });
            this.showError('Données de réservation perdues. Veuillez recommencer.');
            sessionStorage.removeItem('appointmentContext');
            this.router.navigate(['/appointments/wizard']);
            return;
          }
          
          // Mettre à jour le service SANS déclencher la sauvegarde qui écrase les données
          this.appointmentContextService.updateContext(this.context);
          
          // Nettoyer le contexte sauvegardé immédiatement
          sessionStorage.removeItem('appointmentContext');
          
          // Nettoyer l'URL
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {},
            replaceUrl: true
          });
          
          // Faire la réservation pour le patient connecté
          this.createAppointmentAfterLogin();
          
          // IMPORTANT: Ne pas continuer avec les autres vérifications
          return;
        } catch (error) {
          console.error('Error restoring context:', error);
          sessionStorage.removeItem('appointmentContext');
          this.router.navigate(['/appointments/wizard']);
          return; // IMPORTANT: Ajouter return ici aussi
        }
      } else {
        if (!savedContext) {
          console.error('No saved context found in sessionStorage');
        }
        if (!this.authService.isAuthenticated()) {
          console.error('User not authenticated');
        }
      }
    }
    
    // SUPPRIMER TOUTE LA SECTION DUPLIQUÉE CI-DESSOUS
    // Si pas de retour depuis auth, déterminer l'étape normalement
    this.determineCurrentStep();
    
    // Récupérer le contexte existant (déjà fait au début)
    this.context = this.appointmentContextService.getContext();
    
    // S'abonner aux changements de contexte
    const contextSub = this.appointmentContextService.context$.subscribe(context => {
      this.context = context;
      
      // Gérer la navigation automatique lorsqu'un médecin ou un créneau est sélectionné
      if (context.selectedDoctor && !context.selectedSlot && this.currentStep === 'doctor-selection') {
        // Passer à l'étape suivante sans navigation
        setTimeout(() => {
          this.currentStep = 'slot-selection';
          this.showDoctorAvailability = true;
        }, 0);
      } else if (context.selectedSlot && (this.currentStep === 'slot-selection' || this.currentStep === 'doctor-selection')) {
        // Passer à l'étape d'inscription sans navigation
        setTimeout(() => {
          this.currentStep = 'registration';
        }, 0);
      }
    });
    this.subscriptions.add(contextSub);

    // Intercepter les tentatives de navigation
    const routerSub = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        // Si on essaie de naviguer vers /appointments/booking depuis le wizard
        if (event.url.includes('/appointments/booking') && this.router.url.includes('/appointments/wizard')) {
          // Annuler cette navigation en restant sur wizard
          setTimeout(() => {
            this.router.navigate(['/appointments/wizard'], { replaceUrl: true });
          }, 0);
        }
      }
    });
    this.subscriptions.add(routerSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  initRegistrationForm(): void {
    this.registrationForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{9,15}$/)]],
      dateOfBirth: ['', Validators.required],
      gender: ['', Validators.required],
      address: [''],
      city: [''],
      postalCode: [''],
      // Champs pour nouveau patient uniquement
      password: [''],
      confirmPassword: ['']
    });

    // Ajouter les validateurs de mot de passe si c'est un nouveau patient
    if (this.context.patientType === 'new') {
      this.registrationForm.get('password')?.setValidators([
        Validators.required,
        Validators.minLength(8)
      ]);
      this.registrationForm.get('confirmPassword')?.setValidators([
        Validators.required
      ]);
    }
  }

  determineCurrentStep(): void {
    if (this.context.selectedSlot && this.context.patientType) {
      this.currentStep = 'registration';
    } else if (this.context.selectedDoctor) {
      this.currentStep = 'slot-selection';
      this.showDoctorAvailability = true;
    } else if (this.context.patientType) {
      this.currentStep = 'doctor-selection';
    } else if (this.context.consultationMode) {
      this.currentStep = 'patient-type';
    }
  }

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
    this.appointmentContextService.updateContext({ consultationMode: mode });
    this.currentStep = 'patient-type';
  }

  onPatientTypeSelected(type: string): void {
    this.appointmentContextService.updateContext({ patientType: type });
    // Tous les types de patients continuent vers la sélection du médecin
    this.currentStep = 'doctor-selection';
  }

  onDoctorSelected(doctor: any): void {
    this.appointmentContextService.setSelectedDoctor(doctor);
    this.currentStep = 'slot-selection';
    this.showDoctorAvailability = true;
  }

  onSlotSelected(slot: any): void {
    this.appointmentContextService.setSelectedSlot(slot);
    
    // Toujours aller à l'étape registration (qui gère la connexion pour les patients existants)
    this.currentStep = 'registration';
  }

  onSubmitRegistration(): void {
    // Valider le formulaire
    if (!this.registrationForm.valid) {
      this.markFormGroupTouched(this.registrationForm);
      return;
    }

    // Pour les nouveaux patients, vérifier que les mots de passe correspondent
    if (this.context.patientType === 'new') {
      const password = this.registrationForm.get('password')?.value;
      const confirmPassword = this.registrationForm.get('confirmPassword')?.value;
      
      if (password !== confirmPassword) {
        this.showError('Les mots de passe ne correspondent pas');
        return;
      }
    }

    this.isLoading = true;
    this.errorMessage = '';

    const formData = this.registrationForm.value;

    if (this.context.patientType === 'new') {
      // SCÉNARIO 1: Nouveau patient - Inscription + Réservation
      const request = {
        patientData: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          address: formData.address || '',
          city: formData.city || '',
          postalCode: formData.postalCode || ''
        },
        availabilityId: this.context.selectedSlot?.id || '',
        appointmentType: this.context.consultationMode === 'video' ? 'virtual' : 'onsite',
        notes: ''
      };

      console.log('Sending registration and booking request:', request);

      // Appel API pour inscription + réservation
      this.appointmentService.registerAndBook(request).subscribe({
        next: (response) => {
          console.log('Registration and booking successful:', response);
          
          // Stocker le token si présent
          if (response.token) {
            if (isPlatformBrowser(this.platformId)) {
              localStorage.setItem('token', response.token);
              localStorage.setItem('authToken', response.token);
              sessionStorage.setItem('token', response.token);
            }
          }
          
          // Stocker les infos patient
          if (response.patient && isPlatformBrowser(this.platformId)) {
            localStorage.setItem('patientInfo', JSON.stringify(response.patient));
            localStorage.setItem('currentUser', JSON.stringify(response.patient));
          }
          
          // Mettre à jour le contexte avec les données du rendez-vous confirmé
          this.context = {
            ...this.context,
            confirmedAppointment: response.appointment,
            patientData: response.patient
          };
          
          this.isLoading = false;
          this.currentStep = 'confirmation';
          this.showSuccess('Compte créé et rendez-vous confirmé !');
          
          // Redirection après 3 secondes
          setTimeout(() => {
            this.appointmentContextService.clearContext();
            if (isPlatformBrowser(this.platformId)) {
              sessionStorage.removeItem('appointmentContext');
            }
            this.router.navigate(['/appointments']);
          }, 3000);
        },
        error: (error) => {
          console.error('Registration/Booking error:', error);
          this.isLoading = false;
          
          if (error?.status === 409) {
            this.showError('Cet email est déjà utilisé ou le créneau n\'est plus disponible');
          } else if (error?.status === 400) {
            this.showError(error?.error?.message || 'Données invalides. Veuillez vérifier le formulaire.');
          } else if (error?.status === 500) {
            this.showError('Erreur serveur. Veuillez réessayer plus tard.');
          } else {
            this.showError('Une erreur est survenue. Veuillez réessayer.');
          }
        }
      });
      
    } else if (this.context.patientType === 'guest') {
      // SCÉNARIO 2: Guest - Réservation sans compte
      const request = {
        guestInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone
        },
        availabilityId: this.context.selectedSlot?.id || '',
        appointmentType: this.context.consultationMode === 'video' ? 'virtual' : 'onsite',
        notes: ''
      };

      console.log('Sending guest booking request:', request);

      this.appointmentService.bookAsGuest(request).subscribe({
        next: (response) => {
          console.log('Guest booking successful:', response);
          
          this.context = {
            ...this.context,
            confirmedAppointment: response.appointment,
            confirmationCode: response.confirmationCode
          };
          
          // Pour les invités, stocker le code de confirmation
          if (response.confirmationCode && isPlatformBrowser(this.platformId)) {
            sessionStorage.setItem('guestConfirmationCode', response.confirmationCode);
          }
          
          this.isLoading = false;
          this.currentStep = 'confirmation';
          this.showSuccess('Rendez-vous confirmé !');
          
          setTimeout(() => {
            this.appointmentContextService.clearContext();
            this.router.navigate(['/']);
          }, 5000);
        },
        error: (error) => {
          console.error('Guest booking error:', error);
          this.isLoading = false;
          this.showError(error?.error?.message || 'Erreur lors de la réservation');
        }
      });
    }
  }

  // Ajouter ces méthodes utilitaires
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  private showError(message: string): void {
    this.errorMessage = message;
    console.error('Error:', message);
    // Peut ajouter une notification toast ici
  }

  private showSuccess(message: string): void {
    console.log('Success:', message);
    // Peut ajouter une notification toast ici
  }

  errorMessage = ''; // Ajouter cette propriété

  private bookAppointment(): void {
    // Logique pour réserver le rendez-vous pour un patient existant
    this.currentStep = 'confirmation';
  }

  private createAppointmentAfterLogin(): void {
    console.log('=== CREATING APPOINTMENT AFTER LOGIN ===');
    console.log('Current context:', this.context);
    console.log('Selected doctor:', this.context.selectedDoctor);
    console.log('Selected slot:', this.context.selectedSlot);
    
    if (!this.context.selectedSlot || !this.context.selectedDoctor) {
      console.error('Missing required context data after login');
      this.showError('Contexte de réservation perdu. Veuillez recommencer.');
      this.router.navigate(['/appointments/wizard']);
      return;
    }

    // IMPORTANT: Définir currentStep AVANT de lancer l'appel API
    this.currentStep = 'confirmation';
    
    // Afficher un état de chargement
    this.isLoading = true;
    this.errorMessage = '';
    
    // Forcer la mise à jour de la vue immédiatement pour afficher le loader
    this.cdr.detectChanges();
    
    // Préparer la requête avec les bonnes données
    const request = {
      availabilityId: this.context.selectedSlot.id || this.context.selectedSlot.availabilityId || '',
      appointmentType: this.context.consultationMode === 'video' ? 'virtual' : 'onsite',
      notes: ''
    };

    console.log('=== BOOKING REQUEST ===');
    console.log('Request object:', request);
    console.log('API URL will be:', 'http://localhost:8080/api/appointments/book');
    
    // Vérifier le token
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    console.log('Auth token available:', !!token);
    if (token) {
      console.log('Token preview:', token.substring(0, 20) + '...');
    }

    // Appel API pour réservation
    console.log('Making API call to book appointment...');
    this.appointmentService.bookAppointment(request).subscribe({
      next: (response) => {
        console.log('=== BOOKING SUCCESS ===');
        console.log('Appointment created successfully:', response);
        
        // Mettre à jour le contexte avec le rendez-vous confirmé
        this.context = {
          ...this.context,
          confirmedAppointment: response
        };
        
        this.isLoading = false;
        this.errorMessage = ''; // S'assurer que l'erreur est vide
        this.showSuccess('Rendez-vous confirmé !');
        
        // Forcer la mise à jour de la vue
        this.cdr.detectChanges();
        
        // Redirection après 5 secondes
        setTimeout(() => {
          console.log('Redirecting to appointments list...');
          this.appointmentContextService.clearContext();
          this.router.navigate(['/appointments']);
        }, 5000);
      },
      error: (error) => {
        console.error('=== BOOKING ERROR ===');
        console.error('Error creating appointment:', error);
        console.error('Error status:', error?.status);
        console.error('Error response:', error?.error);
        
        this.isLoading = false;
        
        if (error?.status === 401) {
          this.showError('Session expirée. Veuillez vous reconnecter.');
          // Ne pas naviguer automatiquement, laisser l'utilisateur voir le message
          setTimeout(() => {
            this.navigateToLogin();
          }, 2000);
        } else if (error?.status === 409) {
          this.showError('Ce créneau n\'est plus disponible.');
          // Retourner à la sélection du créneau après 2 secondes
          setTimeout(() => {
            this.currentStep = 'slot-selection';
            this.cdr.detectChanges();
          }, 2000);
        } else if (error?.status === 400) {
          this.showError(error?.error?.message || 'Données invalides');
        } else if (error?.status === 0) {
          this.showError('Impossible de contacter le serveur. Vérifiez votre connexion.');
        } else {
          this.showError('Erreur lors de la création du rendez-vous. Veuillez réessayer.');
        }
        
        // Forcer la mise à jour après erreur
        this.cdr.detectChanges();
      }
    });
  }

  // Supprimer ou déprécier l'ancienne méthode
  private bookAppointmentForExistingPatient(): void {
    // Rediriger vers la nouvelle méthode
    this.createAppointmentAfterLogin();
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  navigateToLogin(): void {
    console.log('=== NAVIGATION TO AUTH DEBUG ===');
    console.log('Current route:', this.router.url);
    console.log('Current context:', this.context);
    console.log('Selected doctor:', this.context.selectedDoctor);
    console.log('Selected slot:', this.context.selectedSlot);
    
    // Vérifier que nous avons les données nécessaires
    if (!this.context.selectedDoctor || !this.context.selectedSlot) {
      console.error('Missing required context data:', {
        doctor: !!this.context.selectedDoctor,
        slot: !!this.context.selectedSlot
      });
      this.showError('Veuillez sélectionner un médecin et un créneau avant de continuer');
      return;
    }
    
    // Sauvegarder seulement côté client
    if (isPlatformBrowser(this.platformId)) {
      // IMPORTANT: Sauvegarder avec une structure cohérente
      const appointmentContext = {
        consultationMode: this.context.consultationMode,
        patientType: 'existing',
        // Sauvegarder l'ID pour référence
        doctorId: this.context.selectedDoctor.id || this.context.selectedDoctor.userId,
        slotId: this.context.selectedSlot.id || this.context.selectedSlot.availabilityId,
        // Sauvegarder les objets complets avec les bons noms de propriété
        doctorDetails: this.context.selectedDoctor,
        slotDetails: this.context.selectedSlot,
        // Métadonnées
        step: 'confirmation',
        returnUrl: '/appointments/wizard',
        timestamp: Date.now()
      };
      
      console.log('Saving appointment context with structure:', appointmentContext);
      console.log('Doctor details being saved:', appointmentContext.doctorDetails);
      console.log('Slot details being saved:', appointmentContext.slotDetails);
      
      try {
        // Sauvegarder dans sessionStorage
        const contextString = JSON.stringify(appointmentContext);
        sessionStorage.setItem('appointmentContext', contextString);
        
        // Vérifier immédiatement que la sauvegarde a fonctionné
        const saved = sessionStorage.getItem('appointmentContext');
        if (saved) {
          const parsedSaved = JSON.parse(saved);
          console.log('✓ Context saved successfully');
          console.log('✓ Saved doctor:', parsedSaved.doctorDetails);
          console.log('✓ Saved slot:', parsedSaved.slotDetails);
        } else {
          console.error('✗ Failed to save context to sessionStorage');
        }
      } catch (error) {
        console.error('Error saving context:', error);
        this.showError('Erreur lors de la sauvegarde. Veuillez réessayer.');
        return;
      }
    }
    
    // Navigation avec les paramètres nécessaires
    const sessionId = Date.now().toString();
    const queryParams = {
      returnTo: '/appointments/wizard',
      appointmentMode: 'true',
      sessionId: sessionId
    };
    
    console.log('Navigating to auth with params:', queryParams);
    
    // Utiliser navigate avec queryParams
    this.router.navigate(['/auth'], { 
      queryParams: queryParams,
      queryParamsHandling: 'merge'
    }).then(
      (success) => {
        if (success) {
          console.log('✓ Navigation to auth successful');
        } else {
          console.error('✗ Navigation to auth returned false');
        }
      },
      (error) => {
        console.error('✗ Navigation to auth failed:', error);
        // Fallback avec navigateByUrl
        const url = `/auth?returnTo=${encodeURIComponent('/appointments/wizard')}&appointmentMode=true&sessionId=${sessionId}`;
        console.log('Trying fallback navigation to:', url);
        
        this.router.navigateByUrl(url).catch(() => {
          if (isPlatformBrowser(this.platformId)) {
            console.log('Using window.location as last resort');
            window.location.href = url;
          }
        });
      }
    );
  }

  onGoBack(): void {
    const currentIndex = this.steps.findIndex(s => s.id === this.currentStep);
    if (currentIndex > 0) {
      const previousStep = this.steps[currentIndex - 1].id;
      
      // Réinitialiser certains états selon l'étape
      if (this.currentStep === 'registration') {
        // Si on revient de l'inscription, effacer le créneau sélectionné
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

  getVisibleSteps(): WizardStep[] {
    // Filtrer et adapter les étapes en fonction du contexte
    let visibleSteps = [...this.steps];
    
    // Pour les patients existants, changer le label de l'étape registration
    if (this.context.patientType === 'existing') {
      visibleSteps = visibleSteps.map(step => {
        if (step.id === 'registration') {
          return { ...step, label: 'Connexion', icon: 'fas fa-sign-in-alt' };
        }
        return step;
      });
    }
    
    return visibleSteps;
  }

  getStepNumber(stepId: string): number {
    // Utiliser getVisibleSteps() pour obtenir le bon numéro d'étape
    const visibleSteps = this.getVisibleSteps();
    return visibleSteps.findIndex(s => s.id === stepId) + 1;
  }
}