import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BreadcrumbComponent, BreadcrumbItem } from '../../shared/breadcrumb/breadcrumb.component';

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
export class ConsultationModeSelectorComponent {
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

  constructor(private fb: FormBuilder) {
    this.consultationForm = this.fb.group({
      mode: ['', [Validators.required]]
    });
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
        this.modeSelected.emit(selectedMode);
      }
    }
  }
}
