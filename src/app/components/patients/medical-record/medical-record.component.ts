import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientService } from '../../../services/patient.service';
import { Patient, MedicalRecord } from '../../../interfaces/patient.interface';

@Component({
  selector: 'app-medical-record',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './medical-record.component.html',
  styleUrls: ['./medical-record.component.css']
})
export class MedicalRecordComponent implements OnChanges {
  @Input() patient: Patient | null = null;
  @Output() back = new EventEmitter<void>();
  
  medicalRecord: MedicalRecord | null = null;
  isLoading = false;
  error = '';

  constructor(private patientService: PatientService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['patient'] && this.patient) {
      this.loadMedicalRecord();
    }
  }

  loadMedicalRecord(): void {
    if (!this.patient) return;

    this.isLoading = true;
    this.error = '';

    this.patientService.getPatientMedicalRecord(this.patient.id).subscribe({
      next: (response) => {
        this.medicalRecord = response.medicalRecord;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading medical record:', error);
        this.error = 'Erreur lors du chargement du dossier médical';
        this.isLoading = false;
      }
    });
  }

  onBack(): void {
    this.back.emit();
  }

  getAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  getGenderLabel(gender: string): string {
    return gender === 'M' ? 'Masculin' : 'Féminin';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'COMPLETED': 'Terminé',
      'CONFIRMED': 'Confirmé',
      'PENDING': 'En attente',
      'CANCELLED': 'Annulé'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }
}
