import { Component, OnInit, Output, EventEmitter, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BreadcrumbComponent, BreadcrumbItem } from '../../shared/breadcrumb/breadcrumb.component';
import { AppointmentContextService } from '../../../services/appointment-context.service';

export interface ConsultationMode {
  value: 'cabinet' | 'video';
  label: string;
  description: string;
  icon: string;
  features: string[];
}

@Component({
  selector: 'app-consultation-mode-selector',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BreadcrumbComponent],
  templateUrl: './consultation-mode-selector.component.html',
  styleUrls: ['./consultation-mode-selector.component.scss']
})
export class ConsultationModeSelectorComponent implements OnInit {
  @Output() modeSelected = new EventEmitter<'cabinet' | 'video'>();

  consultationForm: FormGroup;
  
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Accueil', route: '/', icon: 'fas fa-home' },
    { label: 'Prendre rendez-vous', active: true, icon: 'fas fa-calendar-plus' }
  ];

  consultationModes: ConsultationMode[] = [
    {
      value: 'cabinet',
      label: 'Consultation en cabinet',
      description: 'Rencontrez votre professionnel de santé en personne dans un environnement médical professionnel',
      icon: 'fas fa-hospital',
      features: [
        'Examen physique complet',
        'Équipements médicaux disponibles',
        'Interaction directe avec le professionnel',
        'Prise de tension, poids, etc.',
        'Environnement stérile et sécurisé'
      ]
    },
    {
      value: 'video',
      label: 'Consultation en vidéo',
      description: 'Consultez votre professionnel de santé à distance via une plateforme vidéo sécurisée',
      icon: 'fas fa-video',
      features: [
        'Consultation depuis chez vous',
        'Économie de temps de transport',
        'Plateforme vidéo sécurisée',
        'Partage de documents en ligne',
        'Flexibilité des horaires'
      ]
    }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private appointmentContext: AppointmentContextService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.consultationForm = this.fb.group({
      mode: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Load existing mode from context if available
    const context = this.appointmentContext.getContext();
    if (context.consultationMode) {
      this.consultationForm.patchValue({ mode: context.consultationMode });
    }
  }

  selectMode(mode: 'cabinet' | 'video'): void {
    this.consultationForm.patchValue({ mode });
    this.modeSelected.emit(mode);
  }

  getSelectedMode(): 'cabinet' | 'video' | null {
    return this.consultationForm.get('mode')?.value;
  }

  isSelected(mode: 'cabinet' | 'video'): boolean {
    return this.getSelectedMode() === mode;
  }

  onContinue(): void {
    if (this.consultationForm.valid) {
      const selectedMode = this.getSelectedMode();
      if (selectedMode) {
        // Save to appointmentContext
        this.appointmentContext.updateContext({ consultationMode: selectedMode });
        
        // Navigate to next step
        this.router.navigate(['/book-appointment/patient-type']);
        
        // Emit event for parent components
        this.modeSelected.emit(selectedMode);
      }
    }
  }
}
