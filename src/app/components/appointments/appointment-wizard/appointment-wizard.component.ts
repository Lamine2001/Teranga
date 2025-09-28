import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink, NavigationStart } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DoctorsListComponent } from '../doctors-list/doctors-list.component';
import { AppointmentContextService, AppointmentContext } from '../../../services/appointment-context.service';
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
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    // Initialiser le formulaire d'inscription
    this.initRegistrationForm();
    
    // Récupérer le contexte existant
    this.context = this.appointmentContextService.getContext();
    
    // Déterminer l'étape actuelle basée sur le contexte
    this.determineCurrentStep();
    
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
}