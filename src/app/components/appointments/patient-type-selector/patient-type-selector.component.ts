import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';
import { AppointmentContextService } from '../../../services/appointment-context.service';

@Component({
  selector: 'app-patient-type-selector',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BreadcrumbComponent],
  templateUrl: './patient-type-selector.component.html',
  styleUrls: ['./patient-type-selector.component.scss']
})
export class PatientTypeSelectorComponent implements OnInit {
  patientTypeForm: FormGroup;
  consultationMode: string = '';
  
  breadcrumbItems = [
    { label: 'Accueil', url: '/' },
    { label: 'Rendez-vous', url: '/appointments' },
    { label: 'Mode de consultation', url: '/appointments/consultation-mode' },
    { label: 'Type de patient', active: true }
  ];

  patientTypes = [
    {
      value: 'new',
      label: 'Nouveau patient',
      icon: 'fas fa-user-plus',
      description: 'Je n\'ai jamais consulté dans cet établissement',
      action: 'Voir les médecins'
    },
    {
      value: 'existing',
      label: 'Patient existant',
      icon: 'fas fa-user-check',
      description: 'J\'ai déjà un dossier médical dans cet établissement',
      action: 'Se connecter'
    },
    {
      value: 'guest',
      label: 'Continuer sans compte',
      icon: 'fas fa-user-clock',
      description: 'Réserver rapidement sans créer de compte',
      action: 'Voir les médecins'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private appointmentContext: AppointmentContextService
  ) {
    this.patientTypeForm = this.fb.group({
      patientType: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Récupérer le mode de consultation depuis les query params ou le contexte
    this.route.queryParams.subscribe(params => {
      this.consultationMode = params['mode'] || this.appointmentContext.getConsultationMode() || '';
      
      // Mettre à jour le contexte
      if (this.consultationMode) {
        this.appointmentContext.updateContext({ consultationMode: this.consultationMode });
      }
    });
  }

  selectPatientType(type: string): void {
    this.patientTypeForm.patchValue({ patientType: type });
    this.onContinue(type);
  }

  isSelected(type: string): boolean {
    return this.patientTypeForm.get('patientType')?.value === type;
  }

  onContinue(type?: string): void {
    const patientType = type || this.patientTypeForm.get('patientType')?.value;
    
    if (patientType) {
      // Mettre à jour le contexte avec le type de patient
      this.appointmentContext.updateContext({ patientType });
      
      switch (patientType) {
        case 'new':
          // Rediriger vers la liste des médecins pour les nouveaux patients
          this.router.navigate(['/appointments/doctors'], {
            queryParams: { 
              mode: this.consultationMode,
              patientType: 'new'
            }
          });
          break;
          
        case 'existing':
          // Rediriger vers la page de connexion pour les patients existants
          this.router.navigate(['/login'], {
            queryParams: { 
              redirect: '/appointments/doctors',
              mode: this.consultationMode 
            }
          });
          break;
          
        case 'guest':
          // Rediriger vers la liste des médecins pour les invités
          this.router.navigate(['/appointments/doctors'], {
            queryParams: { 
              mode: this.consultationMode,
              patientType: 'guest'
            }
          });
          break;
      }
    }
  }
}
