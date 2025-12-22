import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentService } from '../../../services/appointment.service';
import { AppointmentContextService } from '../../../services/appointment-context.service';

@Component({
  selector: 'app-doctor-availability',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './doctor-availability.component.html',
  styleUrls: ['./doctor-availability.component.scss']
})
export class DoctorAvailabilityComponent implements OnInit {
  @Input() doctorId: string = '';
  @Input() doctorAvailabilities: any[] = []; // Recevoir directement les disponibilités
  @Output() slotSelected = new EventEmitter<any>();
  @Output() showRegistration = new EventEmitter<any>();
  
  availableSlots: any[] = [];
  nextAvailableSlot: any | null = null;
  showAllSlots = false;
  isLoading = false;

  constructor(
    private appointmentService: AppointmentService,
    private appointmentContext: AppointmentContextService
  ) {}

  ngOnInit(): void {
    // Si on a déjà les disponibilités, les utiliser directement
    if (this.doctorAvailabilities && this.doctorAvailabilities.length > 0) {
      this.processAvailabilities(this.doctorAvailabilities);
    } else if (this.doctorId) {
      // Seulement si on n'a pas les disponibilités, faire la requête
      this.loadAvailabilities();
    }
  }

  ngOnChanges(): void {
    // Réagir aux changements des disponibilités passées en Input
    if (this.doctorAvailabilities && this.doctorAvailabilities.length > 0) {
      this.processAvailabilities(this.doctorAvailabilities);
    }
  }

  private processAvailabilities(availabilities: any[]): void {
    this.availableSlots = availabilities
      .filter(slot => slot.status === 'AVAILABLE' && new Date(slot.startTime) > new Date())
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    
    this.nextAvailableSlot = this.availableSlots[0] || null;
  }

  loadAvailabilities(): void {
    // Cette méthode n'est utilisée que si les disponibilités ne sont pas passées en Input
    if (this.doctorId) {
      this.isLoading = true;
      this.appointmentService.getDoctorAvailability(this.doctorId).subscribe({
        next: (response) => {
          const availabilities = Array.isArray(response) ? response : response.availabilities || [];
          this.processAvailabilities(availabilities);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading availabilities:', error);
          this.isLoading = false;
          this.availableSlots = [];
          this.nextAvailableSlot = null;
        }
      });
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    };
    return date.toLocaleDateString('fr-FR', options);
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatTimeRange(startTime: string, endTime: string): string {
    return `${this.formatTime(startTime)} - ${this.formatTime(endTime)}`;
  }

  onSelectSlot(slot: any): void {
    if (!this.isSlotAvailable(slot)) {
      return;
    }

    const enrichedSlot = {
      ...slot,
      doctorId: this.doctorId
    };

    // Mettre à jour le contexte
    this.appointmentContext.setSelectedSlot(enrichedSlot);

    const patientType = this.appointmentContext.getPatientType();
    const context = this.appointmentContext.getContext();
    
    console.log('Slot selected, patient type:', patientType); // Debug log
    console.log('Current context:', context); // Debug log

    // Vérifier si on est dans appointment-search (toujours 'existing')
    // ou si le contexte indique explicitement qu'on est en mode 'existing'
    if (patientType === 'existing' || context.consultationMode) {
      // Si on a un mode de consultation défini, on est dans appointment-search
      // donc toujours émettre slotSelected pour rester dans le composant
      console.log('Emitting slotSelected event (appointment-search context)'); // Debug log
      this.slotSelected.emit(enrichedSlot);
    } else if (patientType === 'new' || patientType === 'guest' || !patientType) {
      // Pour les nouveaux patients, invités ou si pas de type défini
      console.log('Emitting showRegistration event'); // Debug log
      this.showRegistration.emit(enrichedSlot);
    }
  }

  toggleShowAllSlots(): void {
    this.showAllSlots = !this.showAllSlots;
  }

  getVisibleSlots(): any[] {
    if (this.showAllSlots) {
      return this.availableSlots;
    }
    return this.availableSlots.slice(0, 6);
  }

  isSlotAvailable(slot: any): boolean {
    return slot.status === 'AVAILABLE' && new Date(slot.startTime) > new Date();
  }
}
