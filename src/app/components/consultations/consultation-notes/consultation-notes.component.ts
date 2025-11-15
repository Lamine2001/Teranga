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
  @Input() consultationId?: number; // Add explicit ID input
  @Input() appointmentId?: number; // Add appointment ID input
  @Input() doctorSpecialty?: string; // Add doctor specialty input
  @Input() readOnly: boolean = false;
  @Input() showLimitedFields: boolean = false; // New input to control field visibility
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
      chiefComplaint: [''], // Remove initial validators
      symptoms: [''],       // Remove initial validators
      physicalExamination: [''],
      diagnosis: [''],      // Remove initial validators
      treatment: [''],      // Remove initial validators
      recommendations: [''],
      prescriptions: this.fb.array([]),
      labTests: this.fb.array([]),
      followUpDate: [''],
      followUpInstructions: [''],
      additionalNotes: ['']
    });
  }

  ngOnInit(): void {
    // Log for debugging
    console.log('ConsultationNotes component initialized');
    console.log('Doctor Specialty:', this.doctorSpecialty);
    console.log('Show Limited Fields:', this.showLimitedFields);
    console.log('Consultation:', this.consultation);
    console.log('Consultation ID from input:', this.consultationId);
    console.log('Consultation ID from object:', this.consultation?.id);
    
    // Use explicit consultationId if provided, otherwise use consultation.id
    const effectiveId = this.consultationId || this.consultation?.id;
    
    if (!effectiveId) {
      console.error('No consultation ID available!');
      this.errorMessage = 'Erreur: ID de consultation non disponible';
      return;
    }
    
    // Update the consultation object with the effective ID if needed
    if (this.consultation && !this.consultation.id && this.consultationId) {
      this.consultation = { ...this.consultation, id: this.consultationId };
    }
    
    this.initializeForm();

    // Set field validators based on doctor specialty
    this.updateFieldValidators();

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

  /**
   * Initialize form with consultation data if available
   */
  private initializeForm(): void {
    if (this.consultation) {
      // Set basic consultation data that exists
      this.notesForm.patchValue({
        chiefComplaint: this.consultation.chiefComplaint || '',
        symptoms: this.consultation.symptoms || '',
        diagnosis: this.consultation.diagnosis || '',
        treatment: this.consultation.treatment || this.consultation.treatmentPlan || '',
        recommendations: this.consultation.recommendations || '',
        followUpDate: this.consultation.followUpDate || '',
        followUpInstructions: this.consultation.followUpInstructions || '',
        additionalNotes: this.consultation.additionalNotes || this.consultation.notes || ''
      });
      
      // If consultation has notes object with additional fields
      const notes = (this.consultation as any).notes;
      if (notes && typeof notes === 'object') {
        this.notesForm.patchValue({
          physicalExamination: notes.physicalExamination || '',
          recommendations: notes.recommendations || this.consultation.recommendations || '',
          followUpDate: notes.followUpDate || this.consultation.followUpDate || '',
          followUpInstructions: notes.followUpInstructions || this.consultation.followUpInstructions || '',
          additionalNotes: notes.additionalNotes || this.consultation.additionalNotes || ''
        });
      }
      
      // Load prescriptions if they exist
      if (this.consultation.prescriptions && Array.isArray(this.consultation.prescriptions)) {
        this.consultation.prescriptions.forEach(prescription => {
          this.addPrescription(prescription);
        });
      }
      
      // Load lab tests if they exist
      if (this.consultation.labTests && Array.isArray(this.consultation.labTests)) {
        this.consultation.labTests.forEach(labTest => {
          this.addLabTest(labTest);
        });
      }
      
      // Log the form values for debugging
      console.log('Form initialized with values:', this.notesForm.value);
      console.log('Recommendations:', this.notesForm.get('recommendations')?.value);
      console.log('Additional Notes:', this.notesForm.get('additionalNotes')?.value);
    }
  }

  get prescriptions(): FormArray {
    return this.notesForm.get('prescriptions') as FormArray;
    
  }

  get labTests(): FormArray {
    return this.notesForm.get('labTests') as FormArray;
  }

  loadExistingNotes(): void {
    // This method is now redundant with initializeForm, but keep for backward compatibility
    // The initialization is handled in initializeForm()
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

    // Get the effective consultation ID
    const consultationId = this.consultationId || this.consultation?.id;
    
    if (!consultationId) {
      this.errorMessage = 'Erreur: ID de consultation non disponible pour la sauvegarde';
      console.error('Cannot save notes: No consultation ID');
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    const formValue = this.notesForm.value;
    const notes: Partial<ConsultationNotes> = {
      ...formValue,
      // Format followUpDate to yyyy-MM-dd'T'HH:mm:ss if it exists
      followUpDate: formValue.followUpDate ? 
        this.formatDateTimeForBackend(formValue.followUpDate) : 
        formValue.followUpDate
    };

    console.log('Saving notes for consultation ID:', consultationId); // Debug log

    this.consultationService.saveConsultationNotes(consultationId, notes).subscribe({
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

  /**
   * Format date to yyyy-MM-dd'T'HH:mm:ss format for backend
   */
  private formatDateTimeForBackend(dateInput: string): string {
    if (!dateInput) return dateInput;
    
    try {
      // If it's just a date (YYYY-MM-DD), add default time
      if (dateInput.length === 10) {
        return `${dateInput}T09:00:00`;
      }
      
      // If it's already a datetime, ensure proper format
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) {
        return dateInput; // Return original if invalid
      }
      
      // Format to yyyy-MM-dd'T'HH:mm:ss
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateInput; // Return original if formatting fails
    }
  }

  endConsultation(): void {
    // Use the custom validation method instead of notesForm.invalid
    if (!this.areRequiredFieldsValid()) {
      this.markFormGroupTouched();
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires avant de terminer';
      return;
    }

    if (confirm('Êtes-vous sûr de vouloir terminer cette consultation ?')) {
      this.isLoading = true;

      // Use appointmentId instead of consultationId for ending consultation
      const effectiveAppointmentId = this.appointmentId || this.consultation?.appointmentId;
      
      if (!effectiveAppointmentId) {
        this.errorMessage = 'Erreur: ID de rendez-vous non disponible';
        this.isLoading = false;
        return;
      }

      const endRequest = {
        appointmentId: effectiveAppointmentId,
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

  /**
   * Check if a field should be visible based on doctor specialty
   */
  isFieldVisible(fieldName: string): boolean {
    console.log(`Checking field visibility for: ${fieldName}`);
    console.log(`Doctor Specialty: "${this.doctorSpecialty}"`);
    console.log(`Show Limited Fields: ${this.showLimitedFields}`);
    
    // Use doctorSpecialty input if provided, otherwise fallback to showLimitedFields
    // Check for both 'other' (English) and 'Autre' (French) values
    const isOtherSpecialty = this.doctorSpecialty === 'other' || this.doctorSpecialty === 'Autre' || this.showLimitedFields;
    
    console.log(`Is Other Specialty: ${isOtherSpecialty}`);
    
    if (!isOtherSpecialty) {
      console.log(`Showing all fields for specialty: ${this.doctorSpecialty}`);
      return true; // Show all fields for regular specialties
    }
    
    // For "other"/"Autre" specialty, only show these fields
    const allowedFields = [
      'chiefComplaint',        // Motif de Consultation
      'symptoms',              // Symptômes
      'recommendations',       // Recommandations
      'followUp',              // Suivi
      'followUpInstructions',  // Instructions pour le suivi
      'additionalNotes'        // Notes supplémentaires
    ];
    
    const isAllowed = allowedFields.includes(fieldName);
    console.log(`Field "${fieldName}" is ${isAllowed ? 'ALLOWED' : 'HIDDEN'} for "other" specialty`);
    
    // Return true only if field is in allowed list, false otherwise
    return isAllowed;
  }

  /**
   * Check if required fields for "other" specialty are valid
   */
  areRequiredFieldsValid(): boolean {
    // Use doctorSpecialty input if provided, otherwise fallback to showLimitedFields
    const isOtherSpecialty = this.doctorSpecialty === 'other' || this.doctorSpecialty === 'Autre' || this.showLimitedFields;
    
    if (!isOtherSpecialty) {
      // For regular specialties, use the default form validation
      return this.notesForm.valid;
    }
    
    // For "other" specialty, only check these required fields
    const requiredFields = [
      'chiefComplaint',        // Motif de Consultation
      'symptoms',              // Symptômes
      'recommendations',       // Recommandations
      'followUpInstructions',  // Instructions pour le suivi
      'additionalNotes'        // Notes supplémentaires
    ];
    
    // Check if all required fields are filled
    return requiredFields.every(field => {
      const control = this.notesForm.get(field);
      return control && control.value && control.value.trim().length > 0;
    });
  }

  /**
   * Update field validators based on doctor specialty
   */
  private updateFieldValidators(): void {
    const isOtherSpecialty = this.doctorSpecialty === 'other' || this.doctorSpecialty === 'Autre' || this.showLimitedFields;
    
    if (isOtherSpecialty) {
      // For "other" specialty, only these fields are required
      const requiredFields = [
        'chiefComplaint',        // Motif de Consultation
        'symptoms',              // Symptômes
        'recommendations',       // Recommandations
        'followUpInstructions',  // Instructions pour le suivi
        'additionalNotes'        // Notes supplémentaires
      ];
      
      // Remove required validators from all fields first
      Object.keys(this.notesForm.controls).forEach(fieldName => {
        const control = this.notesForm.get(fieldName);
        if (control) {
          control.clearValidators();
          control.updateValueAndValidity();
        }
      });
      
      // Add required validators only to allowed fields
      requiredFields.forEach(fieldName => {
        const control = this.notesForm.get(fieldName);
        if (control) {
          control.setValidators([Validators.required]);
          control.updateValueAndValidity();
        }
      });
    } else {
      // For regular specialties, keep original required fields
      const regularRequiredFields = ['chiefComplaint', 'symptoms', 'diagnosis', 'treatment'];
      
      // Remove all validators first
      Object.keys(this.notesForm.controls).forEach(fieldName => {
        const control = this.notesForm.get(fieldName);
        if (control) {
          control.clearValidators();
          control.updateValueAndValidity();
        }
      });
      
      // Add required validators to regular required fields
      regularRequiredFields.forEach(fieldName => {
        const control = this.notesForm.get(fieldName);
        if (control) {
          control.setValidators([Validators.required]);
          control.updateValueAndValidity();
        }
      });
    }
  }
}

