import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientService } from '../../../services/patient.service';
import { Patient } from '../../../interfaces/patient.interface';

@Component({
  selector: 'app-patient-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-search.component.html',
  styleUrls: ['./patient-search.component.css']
})
export class PatientSearchComponent {
  @Output() viewMedicalRecord = new EventEmitter<Patient>();
  
  searchQuery = '';
  patients: Patient[] = [];
  isSearching = false;
  error = '';
  hasSearched = false;

  constructor(private patientService: PatientService) {}

  onSearch(): void {
    if (!this.searchQuery || this.searchQuery.trim().length < 2) {
      this.error = 'Veuillez saisir au moins 2 caractères';
      return;
    }

    this.isSearching = true;
    this.error = '';
    this.hasSearched = true;

    this.patientService.searchPatients(this.searchQuery.trim()).subscribe({
      next: (response) => {
        this.patients = response.patients;
        this.isSearching = false;
      },
      error: (error) => {
        console.error('Error searching patients:', error);
        this.error = 'Erreur lors de la recherche';
        this.isSearching = false;
      }
    });
  }

  onClearSearch(): void {
    this.searchQuery = '';
    this.patients = [];
    this.error = '';
    this.hasSearched = false;
  }

  onViewMedicalRecord(patient: Patient): void {
    this.viewMedicalRecord.emit(patient);
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
}
