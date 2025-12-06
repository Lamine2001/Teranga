import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientService } from '../../../services/patient.service';
import { AuthService } from '../../../services/auth.service';
import { Patient } from '../../../interfaces/patient.interface';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-list.component.html',
  styleUrls: ['./patient-list.component.css']
})
export class PatientListComponent implements OnInit {
  @Output() viewMedicalRecord = new EventEmitter<Patient>();
  
  patients: Patient[] = [];
  isLoading = false;
  error = '';
  totalPatients = 0;

  constructor(
    private patientService: PatientService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    this.isLoading = true;
    this.error = '';

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !currentUser.id) {
      this.error = 'Utilisateur non identifié';
      this.isLoading = false;
      return;
    }
    console.log('Loading patients for doctor ID:', currentUser);
    this.patientService.getDoctorPatients(currentUser.id.toString()).subscribe({
      next: (response) => {
        this.patients = response.patients;
        this.totalPatients = response.count;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading patients:', error);
        this.error = 'Erreur lors du chargement des patients';
        this.isLoading = false;
      }
    });
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
