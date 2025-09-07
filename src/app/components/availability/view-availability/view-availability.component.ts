import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvailabilityService } from '../../../services/availability.service';
import { Availability } from '../../../interfaces/availability.interface';

@Component({
  selector: 'app-view-availability',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './view-availability.component.html',
  styleUrls: ['./view-availability.component.css']
})
export class ViewAvailabilityComponent implements OnInit {
  availabilities: Availability[] = [];
  loading = false;
  error = '';
  selectedAvailability: Availability | null = null;

  constructor(private availabilityService: AvailabilityService) {}

  ngOnInit() {
    this.loadAvailabilities();
  }

  loadAvailabilities() {
    this.loading = true;
    this.error = '';

    this.availabilityService.getDoctorAvailabilities().subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success && response.data) {
          this.availabilities = response.data;
        } else {
          this.error = response.error || 'Erreur lors du chargement';
        }
      },
      error: (error) => {
        this.loading = false;
        this.error = 'Erreur de connexion au serveur';
        console.error('Error:', error);
      }
    });
  }

  deleteAvailability(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette disponibilité ?')) {
      return;
    }

    this.availabilityService.deleteAvailability(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadAvailabilities();
        } else {
          alert(response.error || 'Erreur lors de la suppression');
        }
      },
      error: (error) => {
        alert('Erreur de connexion au serveur');
        console.error('Error:', error);
      }
    });
  }

  blockAvailability(id: string) {
    this.availabilityService.blockAvailability(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadAvailabilities();
        } else {
          alert(response.error || 'Erreur lors du blocage');
        }
      },
      error: (error) => {
        alert('Erreur de connexion au serveur');
        console.error('Error:', error);
      }
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
