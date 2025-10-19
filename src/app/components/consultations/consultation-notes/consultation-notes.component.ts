/**
 * Consultation Notes Component
 * Allows doctors to document consultations with patients
 */
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ConsultationService } from '../../../services/consultation.service';
import { Consultation, ConsultationNotes, Prescription, LabTest } from '../../../models/consultation.model';

@Component({
  selector: 'app-consultation-notes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './consultation-notes.component.html',
  styleUrls: ['./consultation-notes.component.scss']
})
export class ConsultationNotesComponent implements OnInit {
  @Input() consultation!: Consultation;
  @Input() readOnly = false;
  @Output() notesSaved = new EventEmitter<ConsultationNotes>();
  @Output() consultationEnded = new EventEmitter<void>();

  notesForm: FormGroup;
  isLoading = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';
  autoSaveEnabled = true;
  lastSaved?: Date;

  // Common medical conditions for quick selection
  commonConditions = [
    'Hypertension', 'Diabète', 'Asthme', 'Migraine', 'Grippe',
    'Allergie', 'Infection respiratoire', 'Douleur abdominale',
    'Anxiété', 'Dépression', 'Insomnie'
  ];

  // Common medications for quick prescription
  commonMedications = [
    'Paracétamol', 'Ibuprofène', 'Amoxicilline', 'Aspirine',
    'Oméprazole', 'Métformine', 'Loratadine', 'Prednisolone'
  ];

  constructor(
    private fb: FormBuilder,
    private consultationService: ConsultationService
  ) {
    this.notesForm = this.fb.group({
      chiefComplaint: ['', [Validators.required]],
      symptoms: ['', [Validators.required]],
      physicalExamination: [''],
      diagnosis: ['', [Validators.required]],
      treatment: ['', [Validators.required]],
      recommendations: [''],
      prescriptions: this.fb.array([]),
      labTests: this.fb.array([]),
      followUpDate: [''],
      followUpInstructions: [''],
      additionalNotes: ['']
    });
  }

  ngOnInit(): void {
    if (this.consultation) {
      this.loadExistingNotes();
    }

    // Auto-save every 30 seconds
    if (this.autoSaveEnabled && !this.readOnly) {
      setInterval(() => {
        if (this.notesForm.dirty) {
          this.autoSave();
        }
      }, 30000);
    }

    if (this.readOnly) {
      this.notesForm.disable();
    }
  }

  get prescriptions(): FormArray {
    return this.notesForm.get('prescriptions') as FormArray;
  }

  get labTests(): FormArray {
    return this.notesForm.get('labTests') as FormArray;
  }

  loadExistingNotes(): void {
    if (this.consultation.chiefComplaint) this.notesForm.patchValue({
      chiefComplaint: this.consultation.chiefComplaint,
      symptoms: this.consultation.symptoms,
      diagnosis: this.consultation.diagnosis,
      treatment: this.consultation.treatment,
      notes: this.consultation.notes
    });

    // Load existing prescriptions
    if (this.consultation.prescriptions) {
      this.consultation.prescriptions.forEach(prescription => {
        this.addPrescription(prescription);
      });
    }

    // Load existing lab tests
    if (this.consultation.labTests) {
      this.consultation.labTests.forEach(labTest => {
        this.addLabTest(labTest);
      });
    }
  }

  addPrescription(prescription?: Prescription): void {
    const prescriptionGroup = this.fb.group({
      medicationName: [prescription?.medicationName || '', [Validators.required]],
      dosage: [prescription?.dosage || '', [Validators.required]],
      frequency: [prescription?.frequency || 'Deux fois par jour', [Validators.required]],
      duration: [prescription?.duration || '7 jours', [Validators.required]],
      instructions: [prescription?.instructions || 'À prendre avec de l\'eau'],
      refillable: [prescription?.refillable || false],
      refillsAllowed: [prescription?.refillsAllowed || 0]
    });

    this.prescriptions.push(prescriptionGroup);
  }

  removePrescription(index: number): void {
    this.prescriptions.removeAt(index);
  }

  addLabTest(labTest?: LabTest): void {
    const labTestGroup = this.fb.group({
      testName: [labTest?.testName || '', [Validators.required]],
      testType: [labTest?.testType || 'blood', [Validators.required]],
      urgency: [labTest?.urgency || 'routine', [Validators.required]],
      instructions: [labTest?.instructions || ''],
      labName: [labTest?.labName || ''],
      estimatedCost: [labTest?.estimatedCost || 0]
    });

    this.labTests.push(labTestGroup);
  }

  removeLabTest(index: number): void {
    this.labTests.removeAt(index);
  }

  selectCommonCondition(condition: string): void {
    const currentDiagnosis = this.notesForm.get('diagnosis')?.value || '';
    const newDiagnosis = currentDiagnosis ? `${currentDiagnosis}, ${condition}` : condition;
    this.notesForm.patchValue({ diagnosis: newDiagnosis });
  }

  selectCommonMedication(medication: string): void {
    this.addPrescription({
      medicationName: medication,
      dosage: '',
      frequency: 'Deux fois par jour',
      duration: '7 jours',
      instructions: 'À prendre avec de l\'eau',
      refillable: false
    });
  }

  autoSave(): void {
    if (!this.readOnly && this.notesForm.valid) {
      this.saveNotes(true);
    }
  }

  saveNotes(isAutoSave = false): void {
    if (this.notesForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    const notes: Partial<ConsultationNotes> = this.notesForm.value;

    this.consultationService.saveConsultationNotes(this.consultation.id, notes).subscribe({
      next: () => {
        this.isSaving = false;
        this.lastSaved = new Date();
        if (!isAutoSave) {
          this.successMessage = 'Notes sauvegardées avec succès';
          setTimeout(() => this.successMessage = '', 3000);
        }
        this.notesSaved.emit(notes as ConsultationNotes);
        this.notesForm.markAsPristine();
      },
      error: (error) => {
        this.isSaving = false;
        this.errorMessage = 'Erreur lors de la sauvegarde des notes';
        console.error('Error saving notes:', error);
      }
    });
  }

  endConsultation(): void {
    if (this.notesForm.invalid) {
      this.markFormGroupTouched();
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires avant de terminer';
      return;
    }

    if (confirm('Êtes-vous sûr de vouloir terminer cette consultation ?')) {
      this.isLoading = true;

      const endRequest = {
        consultationId: this.consultation.id,
        notes: this.notesForm.value
      };

      this.consultationService.endConsultation(endRequest).subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = 'Consultation terminée avec succès';
          this.consultationEnded.emit();
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = 'Erreur lors de la fin de la consultation';
          console.error('Error ending consultation:', error);
        }
      });
    }
  }

  loadTemplate(templateName: string): void {
    // Predefined templates for common consultations
    const templates: { [key: string]: Partial<ConsultationNotes> } = {
      'routine-checkup': {
        chiefComplaint: 'Examen de routine',
        physicalExamination: 'Examen général normal',
        recommendations: 'Continuer le mode de vie sain, prochaine visite dans 6 mois'
      },
      'cold-flu': {
        chiefComplaint: 'Symptômes grippaux',
        symptoms: 'Fièvre, toux, congestion nasale',
        diagnosis: 'Infection virale des voies respiratoires supérieures',
        treatment: 'Repos, hydratation, antipyrétiques',
        recommendations: 'Repos pendant 3-5 jours, consulter si aggravation'
      }
    };

    if (templates[templateName]) {
      this.notesForm.patchValue(templates[templateName]);
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.notesForm.controls).forEach(key => {
      const control = this.notesForm.get(key);
      control?.markAsTouched();
      
      if (control instanceof FormArray) {
        control.controls.forEach(c => c.markAsTouched());
      }
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.notesForm.get(fieldName);
    if (field?.invalid && field?.touched) {
      if (field.errors?.['required']) {
        return 'Ce champ est requis';
      }
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.notesForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  getTomorrowDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
}

