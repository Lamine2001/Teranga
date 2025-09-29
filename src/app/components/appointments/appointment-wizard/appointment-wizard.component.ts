import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
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
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('=== WIZARD COMPONENT INIT ===');
    console.log('Current URL:', this.router.url);
    console.log('Initial step:', this.currentStep);
    
    // Initialiser le formulaire d'inscription
    this.initRegistrationForm();
    
    // Récupérer le contexte existant
    this.context = this.appointmentContextService.getContext();
    
    // Vérifier d'abord si on a un contexte sauvegardé (retour de login)
    const savedContext = sessionStorage.getItem('appointmentContext');
    if (savedContext && this.authService.isAuthenticated()) {
      console.log('Found saved context after login, restoring...');
      const context = JSON.parse(savedContext);
      
      // Restaurer le contexte complet
      this.context = {
        consultationMode: context.consultationMode,
        selectedDoctor: context.doctorDetails,
        selectedSlot: context.slotDetails,
        patientType: context.patientType
      };
      
      // Appeler createAppointmentAfterLogin directement
      if (context.doctorId && context.slotId) {
        console.log('Calling createAppointmentAfterLogin from saved context');
        // Petit délai pour s'assurer que le composant est bien initialisé
        setTimeout(() => {
          this.createAppointmentAfterLogin(context.doctorId, context.slotId);
        }, 100);
      }
    } else {
      // Déterminer l'étape actuelle basée sur le contexte
      this.determineCurrentStep();
    }
    
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

    // Vérifier si on revient de la page de connexion avec des paramètres
    this.route.queryParams.subscribe(params => {
      console.log('Query params received:', params);
      
      if (params['step'] === 'confirmation' && params['doctorId'] && params['slotId']) {
        console.log('Returning from login with appointment params:', params);
        
        // Vérifier si l'utilisateur est connecté
        if (this.authService.isAuthenticated()) {
          console.log('User is authenticated, creating appointment...');
          // Petit délai pour s'assurer que tout est initialisé
          setTimeout(() => {
            this.createAppointmentAfterLogin(params['doctorId'], params['slotId']);
          }, 500);
        }
      }
    });
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
    if (this.registrationForm.valid) {
      this.isLoading = true;
      
      const formData = this.registrationForm.value;
      
      // Simuler l'enregistrement (remplacer par un appel API réel)
      setTimeout(() => {
        this.isLoading = false;
        
        // TODO: Stocker les données du patient dans le contexte
        // Pour l'instant, nous passons directement à la confirmation
        // Une fois que la propriété 'patient' ou 'patientInfo' sera ajoutée à AppointmentContext,
        // décommenter la ligne suivante:
        // this.appointmentContextService.updateContext({ patient: formData });
        
        // Pour l'instant, stocker les données localement
        this.context = {
          ...this.context,
          patientData: formData  // Stocker localement pour l'affichage dans la confirmation
        };
        
        this.currentStep = 'confirmation';
        
        // Redirection après confirmation
        setTimeout(() => {
          this.appointmentContextService.clearContext();
          this.router.navigate(['/appointments']);
        }, 3000);
      }, 1500);
    } else {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.registrationForm.controls).forEach(key => {
        this.registrationForm.get(key)?.markAsTouched();
      });
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  private bookAppointment(): void {
    // Logique pour réserver le rendez-vous pour un patient existant
    this.currentStep = 'confirmation';
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
    // Filtrer les étapes en fonction du contexte
    let visibleSteps = [...this.steps];
    
    // Masquer l'étape registration uniquement si on n'est pas encore arrivé à cette étape
    // et que le patient est existant
    if (this.context.patientType === 'existing' && this.currentStep !== 'registration') {
      visibleSteps = visibleSteps.filter(s => s.id !== 'registration');
    }
    
    return visibleSteps;
  }

  getStepNumber(stepId: string): number {
    // Utiliser getVisibleSteps() pour obtenir le bon numéro d'étape
    const visibleSteps = this.getVisibleSteps();
    return visibleSteps.findIndex(s => s.id === stepId) + 1;
  }

  navigateToLogin(): void {
    console.log('=== NAVIGATION TO AUTH DEBUG ===');
    console.log('Current route:', this.router.url);
    console.log('Navigating to auth with context:', this.context);
    
    // Sauvegarder le contexte complet dans sessionStorage
    if (this.context.selectedDoctor && this.context.selectedSlot) {
      const appointmentContext = {
        consultationMode: this.context.consultationMode,
        patientType: 'existing',
        doctorId: this.context.selectedDoctor.id,
        slotId: this.context.selectedSlot.id,
        doctorDetails: this.context.selectedDoctor,
        slotDetails: this.context.selectedSlot,
        step: 'confirmation',
        returnUrl: '/appointments/wizard'
      };
      
      console.log('Saving appointment context:', appointmentContext);
      sessionStorage.setItem('appointmentContext', JSON.stringify(appointmentContext));
      
      // Sauvegarder aussi dans le service de contexte
      this.appointmentContextService.saveContext();
    }
    
    // Navigation vers /auth avec les paramètres de requête
    try {
      console.log('Attempting navigation to /auth');
      this.router.navigate(['/auth'], {
        queryParams: {
          redirect: '/appointments/wizard',
          doctorId: this.context.selectedDoctor?.id,
          slotId: this.context.selectedSlot?.id,
          patientType: 'existing',
          step: 'confirmation'
        }
      }).then(
        (success) => {
          console.log('Navigation success:', success);
        },
        (error) => {
          console.error('Navigation error:', error);
          this.router.navigateByUrl('/auth');
        }
      );
    } catch (error) {
      console.error('Navigation exception:', error);
      window.location.href = '/auth';
    }
  }

  private createAppointmentAfterLogin(doctorId: string, slotId: string): void {
    console.log('=== CREATE APPOINTMENT AFTER LOGIN ===');
    console.log('Doctor ID:', doctorId);
    console.log('Slot ID:', slotId);
    console.log('Current step before:', this.currentStep);
    
    // Récupérer les détails depuis le contexte sauvegardé
    const savedContext = sessionStorage.getItem('appointmentContext');
    
    if (savedContext) {
      const context = JSON.parse(savedContext);
      console.log('Restored context:', context);
      
      // Restaurer le contexte complet IMMÉDIATEMENT
      this.context = {
        consultationMode: context.consultationMode,
        selectedDoctor: context.doctorDetails,
        selectedSlot: context.slotDetails,
        patientType: context.patientType
      };
      
      // Restaurer dans le service aussi
      if (context.doctorDetails) {
        this.appointmentContextService.setSelectedDoctor(context.doctorDetails);
      }
      if (context.slotDetails) {
        this.appointmentContextService.setSelectedSlot(context.slotDetails);
      }
    }
    
    // Passer directement à la confirmation sans délai
    console.log('Setting current step to confirmation');
    this.currentStep = 'confirmation';
    
    // Forcer la mise à jour de la vue
    this.cdr.detectChanges();
    
    // Nettoyer le sessionStorage
    sessionStorage.removeItem('appointmentContext');
    
    console.log('Current step after:', this.currentStep);
    console.log('Context for confirmation:', this.context);
    
    // Simuler que le rendez-vous a été créé avec succès
    this.isLoading = false;
    
    // Redirection après 5 secondes
    setTimeout(() => {
      console.log('Redirecting to appointments list...');
      this.appointmentContextService.clearContext();
      this.router.navigate(['/appointments']);
    }, 5000);
  }
}