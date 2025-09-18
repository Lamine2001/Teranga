import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PatientRegistrationComponent } from '../patient-registration/patient-registration.component';
import { AppointmentContextService } from '../../../services/appointment-context.service';

@Component({
  selector: 'app-appointment-booking',
  standalone: true,
  imports: [CommonModule, PatientRegistrationComponent],
  templateUrl: './appointment-booking.component.html',
  styleUrls: ['./appointment-booking.component.scss']
})
export class AppointmentBookingComponent implements OnInit {
  selectedSlot: any;
  selectedDoctor: any;
  patientType: string | undefined;
  isLoading = false;

  constructor(
    private appointmentContextService: AppointmentContextService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const context = this.appointmentContextService.getContext();
    console.log('AppointmentBooking - Context loaded:', context); // Debug log

    this.selectedSlot = context.selectedSlot;
    this.selectedDoctor = context.selectedDoctor;
    this.patientType = context.patientType;

    // Si pas de slot sélectionné, rediriger vers la liste des médecins
    if (!this.selectedSlot || !this.selectedDoctor) {
      console.log('No slot or doctor selected, redirecting to doctors list');
      this.router.navigate(['/appointments/doctors']);
    }
  }

  onRegistrationComplete(event: any): void {
    console.log('Registration complete:', event);

    // Afficher un message de succès ou rediriger
    this.appointmentContextService.clearContext();

    if (event.appointment?.id) {
      this.router.navigate(['/appointments/confirmation'], {
        queryParams: { appointmentId: event.appointment.id }
      });
    } else {
      // Si pas d'ID de rendez-vous, rediriger vers la liste des rendez-vous
      this.router.navigate(['/appointments']);
    }
  }

  onGoBack(): void {
    this.router.navigate(['/appointments/doctors']);
  }
}
