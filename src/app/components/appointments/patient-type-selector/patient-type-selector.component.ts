import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BreadcrumbComponent, BreadcrumbItem } from '../../shared/breadcrumb/breadcrumb.component';

export interface PatientType {
  value: 'nouveau' | 'existant';
  label: string;
  description: string;
  icon: string;
  features: string[];
}

@Component({
  selector: 'app-patient-type-selector',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BreadcrumbComponent],
  templateUrl: './patient-type-selector.component.html',
  styleUrls: ['./patient-type-selector.component.scss']
})
export class PatientTypeSelectorComponent {
  @Input() consultationMode: 'cabinet' | 'video' = 'cabinet';
  @Output() typeSelected = new EventEmitter<'nouveau' | 'existant'>();

  patientTypeForm: FormGroup;
  
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Accueil', route: '/', icon: 'fas fa-home' },
    { label: 'Prendre rendez-vous', route: '/book-appointment', icon: 'fas fa-calendar-plus' },
    { label: 'Type de patient', active: true, icon: 'fas fa-user-check' }
  ];

  patientTypes: PatientType[] = [
    {
      value: 'nouveau',
      label: 'Nouveau patient',
      description: 'Je n\'ai jamais consulté sur cette plateforme et je souhaite créer un compte',
      icon: 'fas fa-user-plus',
      features: [
        'Création de compte rapide et sécurisée',
        'Formulaire d\'inscription simplifié',
        'Sauvegarde de vos informations médicales',
        'Accès à votre historique de consultations',
        'Notifications personnalisées'
      ]
    },
    {
      value: 'existant',
      label: 'Patient existant',
      description: 'J\'ai déjà un compte et je souhaite me connecter pour prendre un rendez-vous',
      icon: 'fas fa-user-check',
      features: [
        'Connexion rapide avec vos identifiants',
        'Accès à votre profil médical complet',
        'Historique de vos consultations',
        'Préférences sauvegardées',
        'Rendez-vous récurrents facilités'
      ]
    }
  ];

  constructor(private fb: FormBuilder) {
    this.patientTypeForm = this.fb.group({
      patientType: ['', [Validators.required]]
    });
  }

  selectType(type: 'nouveau' | 'existant'): void {
    this.patientTypeForm.patchValue({ patientType: type });
    this.typeSelected.emit(type);
  }

  getSelectedType(): 'nouveau' | 'existant' | null {
    return this.patientTypeForm.get('patientType')?.value;
  }

  isSelected(type: 'nouveau' | 'existant'): boolean {
    return this.getSelectedType() === type;
  }

  onContinue(): void {
    if (this.patientTypeForm.valid) {
      const selectedType = this.getSelectedType();
      if (selectedType) {
        this.typeSelected.emit(selectedType);
      }
    }
  }

  getModeIcon(): string {
    return this.consultationMode === 'cabinet' ? 'fas fa-hospital' : 'fas fa-video';
  }

  getModeLabel(): string {
    return this.consultationMode === 'cabinet' ? 'Consultation en cabinet' : 'Consultation en vidéo';
  }
}
