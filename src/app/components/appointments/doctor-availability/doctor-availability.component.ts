import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Doctor, AvailabilityDTO } from '../../../services/doctor.service';

@Component({
  selector: 'app-doctor-availability',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './doctor-availability.component.html',
  styleUrls: ['./doctor-availability.component.scss']
})
export class DoctorAvailabilityComponent implements OnInit {
  @Input() doctor!: Doctor;
  @Input() consultationMode!: string;
  @Output() selectSlot = new EventEmitter<AvailabilityDTO>();

  availableSlots: AvailabilityDTO[] = [];
  nextAvailableSlot: AvailabilityDTO | null = null;
  showAllSlots = false;
  isLoading = false;

  ngOnInit(): void {
    this.loadAvailabilities();
  }

  loadAvailabilities(): void {
    // Utiliser directement les disponibilités du docteur
    if (this.doctor && this.doctor.availabilities) {
      this.availableSlots = this.doctor.availabilities
        .filter(slot => slot.status === 'AVAILABLE')
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      
      this.nextAvailableSlot = this.availableSlots[0] || null;
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

  onSelectSlot(slot: AvailabilityDTO): void {
    if (slot.status === 'AVAILABLE') {
      this.selectSlot.emit(slot);
    }
  }

  toggleShowAllSlots(): void {
    this.showAllSlots = !this.showAllSlots;
  }

  getVisibleSlots(): AvailabilityDTO[] {
    if (this.showAllSlots) {
      return this.availableSlots;
    }
    return this.availableSlots.slice(0, 6);
  }

  isSlotAvailable(slot: AvailabilityDTO): boolean {
    return slot.status === 'AVAILABLE' && new Date(slot.startTime) > new Date();
  }
}
 