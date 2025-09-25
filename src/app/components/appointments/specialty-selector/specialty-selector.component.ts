import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BreadcrumbComponent, BreadcrumbItem } from '../../shared/breadcrumb/breadcrumb.component';

export interface Specialty {
  value: string;
  label: string;
  description: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-specialty-selector',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BreadcrumbComponent],
  templateUrl: './specialty-selector.component.html',
  styleUrls: ['./specialty-selector.component.scss']
})
export class SpecialtySelectorComponent {
  @Input() consultationMode: 'cabinet' | 'video' = 'cabinet';
  @Input() patientType: 'nouveau' | 'existant' = 'nouveau';
  @Output() specialtySelected = new EventEmitter<string>();

  specialtyForm: FormGroup;
  
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Accueil', route: '/', icon: 'fas fa-home' },
    { label: 'Prendre rendez-vous', route: '/book-appointment', icon: 'fas fa-calendar-plus' },
    { label: 'Type de consultation', route: '/book-appointment/mode', icon: 'fas fa-stethoscope' },
    { label: 'Type de patient', route: '/book-appointment/patient-type', icon: 'fas fa-user-check' },
    { label: 'Spécialité', active: true, icon: 'fas fa-user-md' }
  ];

  specialties: Specialty[] = [
    {
      value: 'psychologie',
      label: 'Psychologie',
      description: 'Accompagnement psychologique et thérapie',
      icon: 'fas fa-brain',
      color: '#9b59b6'
    },
    {
      value: 'coaching-vie',
      label: 'Coaching de vie',
      description: 'Développement personnel et professionnel',
      icon: 'fas fa-lightbulb',
      color: '#f39c12'
    },
    {
      value: 'medecine-generale',
      label: 'Médecine générale',
      description: 'Consultation médicale générale',
      icon: 'fas fa-stethoscope',
      color: '#3498db'
    },
    {
      value: 'cardiologie',
      label: 'Cardiologie',
      description: 'Spécialiste du cœur et des vaisseaux',
      icon: 'fas fa-heartbeat',
      color: '#e74c3c'
    },
    {
      value: 'dermatologie',
      label: 'Dermatologie',
      description: 'Spécialiste de la peau et des muqueuses',
      icon: 'fas fa-hand-holding-medical',
      color: '#1abc9c'
    },
    {
      value: 'pediatrie',
      label: 'Pédiatrie',
      description: 'Médecine pour enfants et adolescents',
      icon: 'fas fa-baby',
      color: '#f1c40f'
    },
    {
      value: 'gynecologie',
      label: 'Gynécologie',
      description: 'Santé de la femme et reproduction',
      icon: 'fas fa-female',
      color: '#e91e63'
    },
    {
      value: 'neurologie',
      label: 'Neurologie',
      description: 'Spécialiste du système nerveux',
      icon: 'fas fa-head-side-brain',
      color: '#673ab7'
    },
    {
      value: 'orthopedie',
      label: 'Orthopédie',
      description: 'Spécialiste des os et articulations',
      icon: 'fas fa-bone',
      color: '#795548'
    }
  ];

  constructor(private fb: FormBuilder) {
    this.specialtyForm = this.fb.group({
      specialty: ['', [Validators.required]]
    });
  }

  selectSpecialty(specialty: string): void {
    this.specialtyForm.patchValue({ specialty });
    this.specialtySelected.emit(specialty);
  }

  getSelectedSpecialty(): string | null {
    return this.specialtyForm.get('specialty')?.value;
  }

  isSelected(specialty: string): boolean {
    return this.getSelectedSpecialty() === specialty;
  }

  onContinue(): void {
    if (this.specialtyForm.valid) {
      const selectedSpecialty = this.getSelectedSpecialty();
      if (selectedSpecialty) {
        this.specialtySelected.emit(selectedSpecialty);
      }
    }
  }

  getModeIcon(): string {
    return this.consultationMode === 'cabinet' ? 'fas fa-hospital' : 'fas fa-video';
  }

  getModeLabel(): string {
    return this.consultationMode === 'cabinet' ? 'Consultation en cabinet' : 'Consultation en vidéo';
  }

  getPatientTypeIcon(): string {
    return this.patientType === 'nouveau' ? 'fas fa-user-plus' : 'fas fa-user-check';
  }

  getPatientTypeLabel(): string {
    return this.patientType === 'nouveau' ? 'Nouveau patient' : 'Patient existant';
  }
}
