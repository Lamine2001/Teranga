import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientListComponent } from '../patient-list/patient-list.component';
import { PatientSearchComponent } from '../patient-search/patient-search.component';
import { MedicalRecordComponent } from '../medical-record/medical-record.component';
import { Patient } from '../../../interfaces/patient.interface';

@Component({
  selector: 'app-patient-management',
  standalone: true,
  imports: [
    CommonModule,
    PatientListComponent,
    PatientSearchComponent,
    MedicalRecordComponent
  ],
  templateUrl: './patient-management.component.html',
  styleUrls: ['./patient-management.component.css']
})
export class PatientManagementComponent {
  activeView: 'list' | 'search' | 'medical-record' = 'list';
  selectedPatient: Patient | null = null;

  onViewMedicalRecord(patient: Patient): void {
    this.selectedPatient = patient;
    this.activeView = 'medical-record';
  }

  onBackFromMedicalRecord(): void {
    this.selectedPatient = null;
    this.activeView = 'list';
  }

  switchView(view: 'list' | 'search'): void {
    this.activeView = view;
    this.selectedPatient = null;
  }
}
