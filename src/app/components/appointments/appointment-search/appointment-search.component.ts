import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AppointmentService, AppointmentResponseDTO } from '../../../services/appointment.service';

@Component({
  selector: 'app-appointment-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './appointment-search.component.html',
  styleUrls: ['./appointment-search.component.scss']
})
export class AppointmentSearchComponent implements OnInit {
  searchForm: FormGroup;
  availableSlots: AppointmentResponseDTO[] = [];
  isLoading = false;
  errorMessage = '';
  specialties = [
    'Cardiologie', 'Dermatologie', 'Endocrinologie', 'Gastro-entérologie',
    'Gynécologie', 'Neurologie', 'Oncologie', 'Ophtalmologie',
    'Orthopédie', 'Pédiatrie', 'Psychiatrie', 'Radiologie',
    'Rhumatologie', 'Urologie'
  ];

  constructor(
    private fb: FormBuilder,
    private appointmentService: AppointmentService
  ) {
    this.searchForm = this.fb.group({
      date: ['', [Validators.required]],
      specialty: [''],
      doctorId: [''],
      preferredTimes: [[]],
      maxDistance: [10]
    });
  }

  ngOnInit(): void {
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.searchForm.patchValue({
      date: tomorrow.toISOString().split('T')[0]
    });
  }

  onSearch(): void {
    if (this.searchForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      const searchData = this.searchForm.value;
      searchData.date = new Date(searchData.date);
      
      this.appointmentService.searchAvailableSlots(searchData).subscribe({
        next: (slots) => {
          this.availableSlots = slots;
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = 'Erreur lors de la recherche des créneaux disponibles';
          this.isLoading = false;
          console.error('Search error:', error);
        }
      });
    }
  }

  onBookAppointment(availabilityId: number): void {
    // Navigate to booking page or open booking modal
    console.log('Booking appointment for availability:', availabilityId);
  }

  getTimeRange(startTime: string, endTime: string): string {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return `${start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  }

  getDateDisplay(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getTomorrowDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  isPreferredTime(appointmentTime: string): boolean {
    const time = new Date(appointmentTime);
    const hour = time.getHours();
    const preferredHours = [9, 14, 16];
    return preferredHours.includes(hour);
  }
}
